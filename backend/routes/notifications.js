// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/notifications
// Gets the latest notifications and unread count for the logged-in admin
router.get('/notifications', protect, isAdmin, async (req, res) => {
    const adminId = req.user.id;
    try {
        // Get latest 5 unread notifications
        const notifRes = await db.query(
            `SELECT * FROM notifications 
             WHERE recipient_id = $1 
             ORDER BY created_at DESC 
             LIMIT 5`,
            [adminId]
        );

        // Get the total unread count
        const countRes = await db.query(
            "SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND is_read = false",
            [adminId]
        );

        res.json({
            notifications: notifRes.rows,
            unread_count: parseInt(countRes.rows[0].count, 10)
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/notifications/mark-read
// Marks all notifications as read for the logged-in admin
router.post('/notifications/mark-read', protect, isAdmin, async (req, res) => {
    const adminId = req.user.id;
    try {
        await db.query(
            "UPDATE notifications SET is_read = true WHERE recipient_id = $1 AND is_read = false",
            [adminId]
        );
        res.status(200).json({ message: 'Notifications marked as read' });
    } catch (err) {
        console.error('Error marking notifications as read:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;