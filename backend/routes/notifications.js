// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

// Lấy tất cả thông báo (chưa đọc) của user (admin hoặc resident)
router.get('/', protect, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC",
            [req.user.id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Đánh dấu 1 thông báo là đã đọc
router.post('/mark-read', protect, async (req, res) => {
    const { notificationId } = req.body;
    
    // Đánh dấu tất cả là đã đọc (nếu không có ID cụ thể)
    if (!notificationId) {
        try {
            await db.query(
                "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false",
                [req.user.id]
            );
            return res.status(200).json({ message: "Tất cả thông báo đã được đánh dấu là đã đọc." });
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    // Đánh dấu 1 ID cụ thể
    try {
        await db.query(
            "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
            [notificationId, req.user.id]
        );
        res.status(200).json({ message: "Thông báo đã được đánh dấu là đã đọc." });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;