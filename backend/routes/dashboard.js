// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/dashboard/stats
router.get('/stats', protect, isAdmin, async (req, res) => {
    try {
        const now = new Date();
        // Lấy ngày đầu tháng hiện tại (theo giờ UTC để đơn giản, hoặc chỉnh theo múi giờ nếu cần chính xác tuyệt đối)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Sử dụng Promise.all để chạy song song các truy vấn cho nhanh
        const [
            residentRes,
            vehicleRes,
            newsRes,
            billRes
        ] = await Promise.all([
            // 1. Thống kê Cư dân: Tổng số & Mới trong tháng
            db.query(`
                SELECT 
                    COUNT(*) AS total,
                    COUNT(CASE WHEN created_at >= $1 THEN 1 END) AS new_this_month
                FROM users 
                WHERE role = 'resident'
            `, [startOfMonth]),

            // 2. Thống kê Xe: Tổng số xe đang active
            db.query(`
                SELECT COUNT(*) AS total 
                FROM vehicle_cards 
                WHERE status = 'active'
            `),

            // 3. Thống kê Tin tức: Số bài đăng trong tháng
            db.query(`
                SELECT COUNT(*) AS total 
                FROM news 
                WHERE created_at >= $1
            `, [startOfMonth]),

            // 4. Thống kê Hóa đơn tháng này: Đã thanh toán / Tổng phải thu
            db.query(`
                SELECT 
                    COUNT(*) AS total_bills,
                    COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
                    COALESCE(SUM(total_amount), 0) AS total_expected,
                    COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) AS total_collected
                FROM bills 
                WHERE issue_date >= $1
            `, [startOfMonth])
        ]);

        const stats = {
            residents: {
                total: parseInt(residentRes.rows[0].total),
                new: parseInt(residentRes.rows[0].new_this_month)
            },
            vehicles: parseInt(vehicleRes.rows[0].total),
            news: parseInt(newsRes.rows[0].total),
            bills: {
                count: parseInt(billRes.rows[0].total_bills),
                paid: parseInt(billRes.rows[0].paid_count),
                expected: parseFloat(billRes.rows[0].total_expected),
                collected: parseFloat(billRes.rows[0].total_collected)
            }
        };

        res.json(stats);

    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê.' });
    }
});

module.exports = router;