// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');

// === GET /api/profile/me ===
// Lấy thông tin hồ sơ
router.get('/me', protect, async (req, res) => {
    const residentId = req.user.id;
    try {
        const result = await db.query(
            'SELECT id, full_name, email, phone FROM users WHERE id = $1',
            [residentId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// === PUT /api/profile/update-details ===
// SỬA ĐỔI: Chỉ cho phép cập nhật số điện thoại
router.put('/update-details', protect, async (req, res) => {
    const residentId = req.user.id;
    const { phone } = req.body; // Chỉ lấy phone từ request

    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required.' });
    }

    try {
        // Chỉ cập nhật cột phone, giữ nguyên full_name và email
        const result = await db.query(
            'UPDATE users SET phone = $1 WHERE id = $2 RETURNING id, full_name, email, phone',
            [phone, residentId]
        );

        if (result.rows.length === 0) {
             return res.status(404).json({ message: 'User not found.' });
        }
        
        res.json({
            message: 'Contact information updated successfully!',
            user: result.rows[0]
        });

    } catch (err) {
        console.error('Error updating user details:', err);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
});

// === PUT /api/profile/change-password ===
// (Giữ nguyên code cũ của bạn)
router.put('/change-password', protect, async (req, res) => {
    const residentId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Please fill in all fields.' });
    }
    if (newPassword !== confirmPassword) {
         return res.status(400).json({ message: 'New passwords do not match.' });
    }
    if (newPassword.length < 6) {
         return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    try {
        const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [residentId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const hashedPassword = userRes.rows[0].password_hash;
        const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password.' });
        }

        const salt = await bcrypt.genSalt(10);
        const newHashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHashedPassword, residentId]);
        res.json({ message: 'Password changed successfully!' });

    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;