const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

// Lấy tất cả thông báo (cả đã đọc và chưa đọc) trong 7 ngày gần nhất
router.get('/', protect, async (req, res) => {
    try {
        // 1. (Tùy chọn) Dọn dẹp thông báo cũ hơn 7 ngày của user này để database nhẹ bớt
        // (Bạn có thể bỏ qua bước này nếu muốn giữ lịch sử lâu hơn trong DB nhưng chỉ hiển thị 7 ngày)
        await db.query(
            "DELETE FROM notifications WHERE user_id = $1 AND created_at < NOW() - INTERVAL '7 days'",
            [req.user.id]
        );

        // 2. Lấy danh sách thông báo
        // Logic mới: Lấy tất cả thông báo (bất kể is_read là true hay false)
        // NHƯNG chỉ lấy trong vòng 7 ngày trở lại đây.
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
            return res.status(200).json({ message: "All notifications have been marked as read." });
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
        res.status(200).json({ message: "The notification has been marked as read." });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;