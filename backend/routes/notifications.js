const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

// --- 1. LẤY DANH SÁCH THÔNG BÁO (Giữ nguyên logic cũ) ---
router.get('/', protect, async (req, res) => {
    try {
        // Xóa thông báo cũ quá 7 ngày để dọn dẹp DB
        await db.query(
            "DELETE FROM notifications WHERE user_id = $1 AND created_at < NOW() - INTERVAL '7 days'",
            [req.user.id]
        );

        // Lấy thông báo mới
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

// --- 2. ĐÁNH DẤU ĐÃ ĐỌC (Giữ nguyên logic cũ) ---
router.post('/mark-read', protect, async (req, res) => {
    const { notificationId } = req.body;
    
    // Nếu không gửi ID -> Đánh dấu tất cả là đã đọc
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

    // Nếu có ID -> Đánh dấu 1 cái
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

// --- 3. (MỚI) TẠO THÔNG BÁO & GỬI REAL-TIME ---
// Route này dùng để test hoặc để Admin gửi thông báo riêng lẻ
router.post('/send', protect, async (req, res) => {
    // Chỉ Admin mới được quyền gửi thông báo thủ công (tuỳ logic của bạn)
    // if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    const { userId, message, link_to } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ message: 'Missing userId or message' });
    }

    try {
        // B1: Lưu vào Database
        const result = await db.query(
            `INSERT INTO notifications (user_id, message, link_to, is_read, created_at) 
             VALUES ($1, $2, $3, false, NOW()) 
             RETURNING *`,
            [userId, message, link_to || null]
        );

        const newNotification = result.rows[0];

        // B2: Gửi Real-time qua Socket (MAGIC HAPPENS HERE)
        // Lấy Socket ID của người nhận từ biến global (đã khai báo bên index.js)
        const receiverSocketId = global.userSocketMap ? global.userSocketMap[userId] : null;

        if (receiverSocketId) {
            // Nếu người dùng đang online, bắn tin ngay lập tức
            global.io.to(receiverSocketId).emit('newNotification', newNotification);
            console.log(`Socket sent to user ${userId} at socket ${receiverSocketId}`);
        } else {
            console.log(`User ${userId} is offline, notification saved to DB only.`);
        }

        res.status(201).json(newNotification);

    } catch (err) {
        console.error('Error sending notification:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;