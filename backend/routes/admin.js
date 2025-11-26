const express = require('express');
const bcrypt = require('bcryptjs');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { generateMoveInBill } = require('../utils/billService'); 

const pool = require('../db').getPool();
const { query } = require('../db');

const router = express.Router();

const isStrongPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

// ==========================================
// 1. USER MANAGEMENT
// ==========================================

router.get('/users', protect, isAdmin, async (req, res) => {
    try {
        const users = await query(
            'SELECT id, full_name, email, phone, role, is_verified, is_active, created_at FROM users WHERE id != $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.status(200).json(users.rows);
    } catch (error) {
        console.error('Error fetching user list:', error);
        res.status(500).json({ message: 'Server error fetching user list.' });
    }
});

// Toggle User Status (Enable/Disable)
router.patch('/users/:id/status', protect, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body; 

    if (isActive === undefined) {
        return res.status(400).json({ message: 'Missing status value.' });
    }

    try {
        const result = await query(
            'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, is_active',
            [isActive, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const statusText = isActive ? 'enabled' : 'disabled';
        res.status(200).json({ message: `User has been ${statusText}.`, user: result.rows[0] });

    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ message: 'Server error updating user status.' });
    }
});

router.put('/users/:id', protect, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { fullName, role, newPassword } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'User not found.' });
        }
        const currentUser = userResult.rows[0];
        const oldRole = currentUser.role;

        // --- LOGIC: DEMOTION (Resident -> User) ---
        // [MỚI] Lưu lại phòng cũ trước khi xóa
        if (oldRole === 'resident' && role === 'user') {
            console.log(`[Admin] Demoting user ${id}. Cleaning up services...`);
            
            // 1. Tìm phòng hiện tại của user này (nếu có) và lưu vào last_room_id
            const currentRoomRes = await client.query('SELECT id FROM rooms WHERE resident_id = $1', [id]);
            if (currentRoomRes.rows.length > 0) {
                const currentRoomId = currentRoomRes.rows[0].id;
                await client.query('UPDATE users SET last_room_id = $1 WHERE id = $2', [currentRoomId, id]);
                console.log(`[Admin] Saved room ${currentRoomId} as last_room_id for user ${id}`);
            }

            // 2. Remove from Room
            await client.query('UPDATE rooms SET resident_id = NULL WHERE resident_id = $1', [id]);
            await client.query('UPDATE users SET apartment_number = NULL WHERE id = $1', [id]);
            
            // 3. Deactivate Vehicle Cards
            await client.query("UPDATE vehicle_cards SET status = 'inactive' WHERE resident_id = $1 AND status = 'active'", [id]);
            
            // 4. Reject Pending Requests
            await client.query(
                "UPDATE vehicle_card_requests SET status = 'rejected', admin_notes = 'User demoted to regular user' WHERE resident_id = $1 AND status = 'pending'", 
                [id]
            );

            // 5. Cancel Future Bookings
            await client.query(
                "UPDATE room_bookings SET status = 'cancelled' WHERE resident_id = $1 AND booking_date >= CURRENT_DATE AND status = 'confirmed'",
                [id]
            );
        }

        const setClauses = [];
        const queryParams = [];
        let paramIndex = 1;
        
        if (fullName !== undefined) {
            setClauses.push(`full_name = $${paramIndex++}`);
            queryParams.push(fullName);
        }
        if (role && ['user', 'resident'].includes(role)) {
            setClauses.push(`role = $${paramIndex++}`);
            queryParams.push(role);
        }
        if (newPassword && newPassword.trim() !== '') {
            if (!isStrongPassword(newPassword)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'New password is not strong enough.' });
            }
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);
            setClauses.push(`password_hash = $${paramIndex++}`);
            queryParams.push(passwordHash);
        }

        if (setClauses.length === 0 && oldRole === role) {
            await client.query('ROLLBACK');
            return res.status(200).json({ message: 'No information provided to update.', user: userResult.rows[0] });
        }

        let updatedUser = userResult;
        if(setClauses.length > 0) {
            queryParams.push(id);
            const updateQuery = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
            updatedUser = await client.query(updateQuery, queryParams);
        }

        // --- Logic: PROMOTION (User -> Resident) ---
        // [MỚI] Tự động gán lại phòng cũ và phục hồi dịch vụ nếu có last_room_id
        const newRole = setClauses.length > 0 ? updatedUser.rows[0].role : role;
        
        if (newRole === 'resident' && oldRole !== 'resident') {
            // Kiểm tra xem có last_room_id không
            if (currentUser.last_room_id) {
                console.log(`[Admin] Promoting user ${id}. Found last_room_id: ${currentUser.last_room_id}`);
                
                // Kiểm tra phòng cũ có trống không
                const roomCheck = await client.query(
                    "SELECT id, room_number, block_id FROM rooms WHERE id = $1 AND resident_id IS NULL FOR UPDATE",
                    [currentUser.last_room_id]
                );

                if (roomCheck.rows.length > 0) {
                    // Phòng TRỐNG -> Tự động gán lại
                    const room = roomCheck.rows[0];
                    
                    // 1. Lấy tên Block để cập nhật apartment_number
                    const blockRes = await client.query("SELECT name FROM blocks WHERE id = $1", [room.block_id]);
                    const blockName = blockRes.rows[0]?.name || '?';
                    const apartmentFullName = `${blockName} - ${room.room_number}`;

                    // 2. Gán phòng
                    await client.query("UPDATE rooms SET resident_id = $1 WHERE id = $2", [id, room.id]);
                    await client.query("UPDATE users SET apartment_number = $1, last_room_id = NULL WHERE id = $2", [apartmentFullName, id]);
                    
                    console.log(`[Admin] Auto-assigned user ${id} back to room ${apartmentFullName}`);

                    // 3. Phục hồi thẻ xe (chuyển từ inactive -> active)
                    await client.query("UPDATE vehicle_cards SET status = 'active' WHERE resident_id = $1 AND status = 'inactive'", [id]);

                    // 4. Gọi hàm sinh bill (Hàm này đã được sửa để check trùng bill, nên an toàn)
                    try {
                        await generateMoveInBill(id, room.id, client);
                    } catch (billErr) {
                        console.error('Error ensuring bill existence during promotion:', billErr);
                    }

                    // 5. Notification
                    const welcomeMsg = `Welcome back ${updatedUser.rows[0].full_name}! Your room ${apartmentFullName} and services have been restored.`;
                    await client.query(
                        "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                        [id, welcomeMsg, '/profile']
                    );

                } else {
                    console.log(`[Admin] Last room ${currentUser.last_room_id} is occupied. Cannot auto-assign.`);
                    // Vẫn gửi thông báo Welcome nhưng báo là chưa có phòng
                    const message = `Welcome ${updatedUser.rows[0].full_name}! You are now a resident. Please contact admin for room assignment.`;
                    await client.query(
                        "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                        [id, message, '/profile']
                    );
                }
            } else {
                // Không có phòng cũ -> Xử lý như cư dân mới bình thường
                try {
                    const residentName = updatedUser.rows[0].full_name;
                    const message = `Welcome ${residentName}! You have officially become a resident of PTIT Apartment.`;
                    await client.query(
                        "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                        [id, message, '/profile']
                    );
                } catch (notifyError) {
                    console.error('Error sending welcome notification:', notifyError);
                }
            }
        }
        
        await client.query('COMMIT');
        return res.status(200).json({ message: 'Update successful!', user: updatedUser.rows[0] });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error updating user.' });
    } finally {
        client.release();
    }
});

router.delete('/users/:id', protect, isAdmin, async (req, res) => {
    try {
        await query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error deleting user.' });
    }
});

// ==========================================
// 2. RESIDENT & ROOM MANAGEMENT
// ==========================================

router.get('/residents', protect, isAdmin, async (req, res) => {
    try {
        const residents = await query(
            "SELECT id, full_name, email, apartment_number FROM users WHERE role = 'resident' ORDER BY full_name"
        );
        res.status(200).json(residents.rows);
    } catch (error) {
        console.error('Error fetching resident list:', error);
        res.status(500).json({ message: 'Server error fetching resident list.' });
    }
});

router.get('/blocks', protect, isAdmin, async (req, res) => {
    try {
        const blocks = await query("SELECT id, name FROM blocks ORDER BY name");
        res.status(200).json(blocks.rows);
    } catch (error) {
        console.error('Error fetching block list:', error);
        res.status(500).json({ message: 'Server error fetching block list.' });
    }
});

router.get('/blocks/:blockId/available-rooms', protect, isAdmin, async (req, res) => {
    const { blockId } = req.params;
    try {
        const rooms = await query(
            "SELECT id, room_number, floor FROM rooms WHERE block_id = $1 AND resident_id IS NULL ORDER BY floor, room_number",
            [blockId]
        );
        res.status(200).json(rooms.rows);
    } catch (error) {
        console.error('Error fetching available rooms:', error);
        res.status(500).json({ message: 'Server error fetching available rooms.' });
    }
});

// [UPDATED] Assign Room + Generate Move-in Bill
router.post('/assign-room', protect, isAdmin, async (req, res) => {
    const { residentId, roomId } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const roomInfo = await client.query(
            "SELECT r.room_number, b.name as block_name FROM rooms r JOIN blocks b ON r.block_id = b.id WHERE r.id = $1 AND r.resident_id IS NULL FOR UPDATE",
            [roomId]
        );

        if (roomInfo.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Room does not exist or is already occupied.' });
        }

        // Clear old assignments if any
        await client.query("UPDATE rooms SET resident_id = NULL WHERE resident_id = $1", [residentId]);
        
        // Assign new room
        await client.query("UPDATE rooms SET resident_id = $1 WHERE id = $2", [residentId, roomId]);
        
        const apartmentFullName = `${roomInfo.rows[0].block_name} - ${roomInfo.rows[0].room_number}`;
        await client.query("UPDATE users SET apartment_number = $1 WHERE id = $2", [apartmentFullName, residentId]);

        // Notification
        try {
            const message = `Welcome Home! You have been assigned to apartment ${apartmentFullName}.`;
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [residentId, message, '/profile']
            );
        } catch (notifyError) {
            console.error('Error sending room assignment notification:', notifyError);
        }

        // [MỚI] Tự động tạo hóa đơn Move-in (Prorated) cho những ngày còn lại trong tháng
        try {
            await generateMoveInBill(residentId, roomId, client);
        } catch (billError) {
            console.error('Error generating move-in bill:', billError);
            // Không throw lỗi để giao dịch Assign Room vẫn thành công
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Room assigned successfully! Move-in bill generated.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error assigning room:", error);
        res.status(500).json({ message: 'Server error assigning room.' });
    } finally {
        client.release();
    }
});

router.get('/blocks/:blockId/rooms', protect, isAdmin, async (req, res) => {
    const { blockId } = req.params;
    try {
        const rooms = await query(
            `SELECT 
                r.id, 
                r.room_number, 
                r.floor, 
                r.status, 
                u.full_name as resident_name 
             FROM rooms r 
             LEFT JOIN users u ON r.resident_id = u.id 
             WHERE r.block_id = $1 
             ORDER BY r.floor ASC, r.room_number ASC`,
            [blockId]
        );
        res.status(200).json(rooms.rows);
    } catch (error) {
        console.error("Error fetching room list:", error);
        res.status(500).json({ message: 'Server error fetching room list.' });
    }
});

// ==========================================
// 3. NEWS MANAGEMENT
// ==========================================

router.post('/news', protect, isAdmin, async (req, res) => {
    const { title, content, status, imageUrl } = req.body;
    const authorId = req.user.id;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required.' });
    }

    try {
        const newNewsItem = await query(
            "INSERT INTO news (title, content, image_url, author_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, content, imageUrl || null, authorId, status || 'active']
        );
        
        const createdPost = newNewsItem.rows[0];

        if (createdPost.status === 'active') {
            try {
                const message = `New Announcement: ${createdPost.title.substring(0, 50)}...`;
                const linkTo = `/news/${createdPost.id}`;
                
                await query(
                    `INSERT INTO notifications (user_id, message, link_to)
                     SELECT id, $1, $2 FROM users WHERE role IN ('user', 'resident')`,
                    [message, linkTo]
                );
            } catch (notifyError) {
                console.error('Error creating news notification for users:', notifyError);
            }
        }

        res.status(201).json(createdPost);
    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ message: 'Server error while creating news.' });
    }
});

router.get('/news', protect, isAdmin, async (req, res) => {
    const { sortBy } = req.query; 
    
    let orderByClause = 'ORDER BY n.created_at DESC'; 
    if (sortBy === 'oldest') {
        orderByClause = 'ORDER BY n.created_at ASC'; 
    }

    try {
        const news = await query(
            `SELECT n.id, n.title, n.status, n.image_url, n.created_at, u.full_name as author_name 
             FROM news n 
             LEFT JOIN users u ON n.author_id = u.id 
             ${orderByClause}` 
        );
        res.status(200).json(news.rows);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ message: 'Server error fetching news.' });
    }
});

router.get('/news/:id', protect, isAdmin, async (req, res) => {
    try {
        const result = await query("SELECT * FROM news WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'News not found.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching news item:', error);
        res.status(500).json({ message: 'Server error fetching news item.' });
    }
});

router.put('/news/:id', protect, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, content, status, imageUrl } = req.body;

    try {
        const updatedNews = await query(
            "UPDATE news SET title = $1, content = $2, image_url = $3, status = $4 WHERE id = $5 RETURNING *",
            [title, content, imageUrl, status, id]
        );
        if (updatedNews.rows.length === 0) {
            return res.status(404).json({ message: 'News not found.' });
        }
        res.status(200).json(updatedNews.rows[0]);
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ message: 'Server error updating news.' });
    }
});

router.delete('/news/:id', protect, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await query("DELETE FROM news WHERE id = $1", [id]);
        res.status(200).json({ message: 'News deleted successfully.' });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ message: 'Server error deleting news.' });
    }
});

module.exports = router;