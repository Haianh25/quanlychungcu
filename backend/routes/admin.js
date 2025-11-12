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

// === API QUẢN LÝ TÀI KHOẢN (Đã có) ===
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
        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'User not found.' });
        }
        
        // Lấy role cũ để so sánh
        const oldRole = userResult.rows[0].role;

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
        if (setClauses.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No information provided to update.' });
        }
        queryParams.push(id);
        const updateQuery = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const updatedUser = await client.query(updateQuery, queryParams);

        // --- (Logic gửi thông báo chào mừng cư dân - ĐÃ CÓ) ---
        const newRole = updatedUser.rows[0].role;
        if (newRole === 'resident' && oldRole !== 'resident') {
            try {
                const residentName = updatedUser.rows[0].full_name;
                const residentId = updatedUser.rows[0].id;
                const message = `Chào mừng ${residentName}! Bạn đã chính thức trở thành cư dân của PTIT Apartment.`;
                
                await client.query(
                    "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                    [residentId, message, '/profile'] // Link tới trang profile
                );
            } catch (notifyError) {
                console.error('Lỗi khi gửi thông báo chào mừng cư dân:', notifyError);
            }
        }
        // --- (KẾT THÚC Logic) ---


        await client.query('COMMIT');
        res.status(200).json({ message: 'Update successful!', user: updatedUser.rows[0] });
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

// === API QUẢN LÝ CƯ DÂN & PHÒNG (Đã có) ===
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

        // --- (Logic gửi thông báo chào mừng chủ phòng - ĐÃ CÓ) ---
        try {
            const message = `Chào mừng chủ phòng! Bạn đã được gán vào căn hộ ${apartmentFullName}.`;
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [residentId, message, '/profile'] // Link tới trang profile (hoặc /bill)
            );
        } catch (notifyError) {
            console.error('Lỗi khi gửi thông báo gán phòng:', notifyError);
        }
        // --- (KẾT THÚC Logic) ---

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

// === API QUẢN LÝ TIN TỨC (NEWS) - CRUD HOÀN CHỈNH ===

// TẠO TIN TỨC
router.post('/news', protect, isAdmin, async (req, res) => {
    const { title, content, status, imageUrl } = req.body;
    const authorId = req.user.id;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required.' });
    }

    try {
        // 1. Tạo bài đăng
        const newNewsItem = await query(
            "INSERT INTO news (title, content, image_url, author_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, content, imageUrl || null, authorId, status || 'active']
        );
        
        const createdPost = newNewsItem.rows[0];

        // --- (THÊM MỚI 3) Gửi thông báo cho User/Resident nếu bài đăng active ---
        // Chỉ gửi nếu bài đăng được công khai (active)
        if (createdPost.status === 'active') {
            try {
                // Rút gọn tiêu đề để hiển thị thông báo
                const message = `Tin tức mới: ${createdPost.title.substring(0, 50)}...`; 
                const linkTo = `/news/${createdPost.id}`;
                
                // Tạo thông báo cho tất cả user và resident (hiệu quả cao)
                await query(
                    `INSERT INTO notifications (user_id, message, link_to)
                     SELECT id, $1, $2 FROM users WHERE role IN ('user', 'resident')`,
                    [message, linkTo]
                );
            } catch (notifyError) {
                console.error('Lỗi khi tạo thông báo tin tức cho người dùng:', notifyError);
                // Không dừng lại, vẫn trả về 201
            }
        }
        // --- (KẾT THÚC THÊM MỚI 3) ---

        // 2. Trả về thành công
        res.status(201).json(createdPost);

    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ message: 'Server error while creating news.' });
    }
});

// LẤY TẤT CẢ TIN TỨC (Cho trang quản lý)
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

// LẤY CHI TIẾT 1 TIN TỨC
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

// CẬP NHẬT 1 TIN TỨC
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

// XÓA 1 TIN TỨC
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