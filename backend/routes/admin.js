// backend/routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const pool = require('../db').getPool();
const { query } = require('../db');

const router = express.Router();

const isStrongPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

// === API QUẢN LÝ TÀI KHOẢN ===
router.get('/users', protect, isAdmin, async (req, res) => {
    try {
        const users = await query(
            'SELECT id, full_name, email, role, is_verified, created_at FROM users WHERE id != $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.status(200).json(users.rows);
    } catch (error) {
        console.error('Error fetching user list:', error);
        res.status(500).json({ message: 'Server error fetching user list.' });
    }
});

router.put('/users/:id', protect, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { fullName, role, newPassword } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Lấy thông tin cũ để kiểm tra
        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const oldRole = userResult.rows[0].role;

        // === LOGIC CAO CẤP: XỬ LÝ KHI GIÁNG CHỨC (Resident -> User) ===
        if (oldRole === 'resident' && role === 'user') {
            console.log(`[Admin] Demoting user ${id}. Cleaning up services...`);
            
            // 1. Gỡ khỏi phòng (Rooms & Users table)
            await client.query('UPDATE rooms SET resident_id = NULL WHERE resident_id = $1', [id]);
            await client.query('UPDATE users SET apartment_number = NULL WHERE id = $1', [id]);
            
            // 2. Vô hiệu hóa tất cả Thẻ xe (Chuyển sang inactive)
            await client.query("UPDATE vehicle_cards SET status = 'inactive' WHERE resident_id = $1 AND status = 'active'", [id]);
            
            // 3. Từ chối các yêu cầu thẻ xe đang chờ (Pending Requests)
            await client.query(
                "UPDATE vehicle_card_requests SET status = 'rejected', admin_notes = 'Tài khoản không còn là cư dân.' WHERE resident_id = $1 AND status = 'pending'", 
                [id]
            );

            // 4. Hủy các lịch đặt phòng trong TƯƠNG LAI (Amenities)
            await client.query(
                "UPDATE room_bookings SET status = 'cancelled' WHERE resident_id = $1 AND booking_date >= CURRENT_DATE AND status = 'confirmed'",
                [id]
            );

            // Lưu ý: Hóa đơn (Bills) vẫn giữ nguyên để lưu lịch sử công nợ.
        }
        // ==================================================================

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

        // Nếu chỉ đổi role mà không sửa field nào khác
        if (setClauses.length === 0 && oldRole === role) { 
            await client.query('ROLLBACK');
            return res.status(200).json({ message: 'Nothing to update.', user: userResult.rows[0] });
        }

        if(setClauses.length > 0) {
            queryParams.push(id);
            const updateQuery = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
            const updatedUser = await client.query(updateQuery, queryParams);
            
            // Logic gửi thông báo khi THĂNG CHỨC (User -> Resident)
            const newRole = updatedUser.rows[0].role;
            if (newRole === 'resident' && oldRole !== 'resident') {
                try {
                    const residentName = updatedUser.rows[0].full_name;
                    const residentId = updatedUser.rows[0].id;
                    const message = `Chào mừng ${residentName}! Bạn đã chính thức trở thành cư dân của PTIT Apartment.`;
                    await client.query(
                        "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                        [residentId, message, '/profile']
                    );
                } catch (notifyError) {
                    console.error('Lỗi khi gửi thông báo chào mừng cư dân:', notifyError);
                }
            }
            
            await client.query('COMMIT');
            return res.status(200).json({ message: 'Update successful!', user: updatedUser.rows[0] });

        } else {
             // Trường hợp chỉ chạy logic giáng chức ở trên mà không có setClauses (ví dụ chỉ đổi role)
             await client.query('COMMIT');
             return res.status(200).json({ message: 'Role updated and services cleaned up.', user: userResult.rows[0] });
        }

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

// === API QUẢN LÝ CƯ DÂN & PHÒNG ===
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

        await client.query("UPDATE rooms SET resident_id = NULL WHERE resident_id = $1", [residentId]);
        await client.query("UPDATE rooms SET resident_id = $1 WHERE id = $2", [residentId, roomId]);
        
        const apartmentFullName = `${roomInfo.rows[0].block_name} - ${roomInfo.rows[0].room_number}`;
        await client.query("UPDATE users SET apartment_number = $1 WHERE id = $2", [apartmentFullName, residentId]);

        try {
            const message = `Chào mừng chủ phòng! Bạn đã được gán vào căn hộ ${apartmentFullName}.`;
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [residentId, message, '/profile']
            );
        } catch (notifyError) {
            console.error('Lỗi khi gửi thông báo gán phòng:', notifyError);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Room assigned successfully!' });
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

module.exports = router;