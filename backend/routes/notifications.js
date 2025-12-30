const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
    try {
        await db.query(
            "DELETE FROM notifications WHERE user_id = $1 AND created_at < NOW() - INTERVAL '7 days'",
            [req.user.id]
        );

       
        const result = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             AND created_at >= NOW() - INTERVAL '7 days' 
             ORDER BY created_at DESC`,
            [req.user.id]
        );
        
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/mark-read', protect, async (req, res) => {
    const { notificationId } = req.body;
    
    
    if (!notificationId) {
        try {
            await db.query(
                "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false",
                [req.user.id]
            );
            return res.status(200).json({ message: "All notifications have been marked as read." });
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    try {
        await db.query(
            "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
            [notificationId, req.user.id]
        );
        res.status(200).json({ message: "The notification has been marked as read." });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;