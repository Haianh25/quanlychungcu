// backend/routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Import đúng cách từ file db.js đã được cập nhật
const pool = require('../db').getPool();
const { query } = require('../db');

const router = express.Router();

// Hàm tiện ích
const isStrongPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

// API LẤY DANH SÁCH NGƯỜI DÙNG
router.get('/users', protect, isAdmin, async (req, res) => {
    try {
        const users = await query(
            'SELECT id, full_name, email, role, is_verified, created_at FROM users WHERE id != $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.status(200).json(users.rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// API CẬP NHẬT NGƯỜI DÙNG
router.put('/users/:id', protect, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { fullName, role, newPassword } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
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
                return res.status(400).json({ message: 'Mật khẩu mới không đủ mạnh.' });
            }
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);
            setClauses.push(`password_hash = $${paramIndex++}`);
            queryParams.push(passwordHash);
        }

        if (setClauses.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Không có thông tin nào để cập nhật.' });
        }

        queryParams.push(id);
        const updateQuery = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        
        const updatedUser = await client.query(updateQuery, queryParams);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Cập nhật thành công!', user: updatedUser.rows[0] });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Lỗi server.' });
    } finally {
        client.release();
    }
});

// API XÓA NGƯỜI DÙNG
router.delete('/users/:id', protect, isAdmin, async (req, res) => {
    try {
        await query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.status(200).json({ message: 'Người dùng đã được xóa thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

module.exports = router;