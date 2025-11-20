// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/dashboard/stats
router.get('/stats', protect, isAdmin, async (req, res) => {
    try {
        const now = new Date();
        // Get the start date of the current month (in UTC for simplicity, adjust timezone if needed)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Use Promise.all to execute queries in parallel for better performance
        const [
            residentRes,
            vehicleRes,
            newsRes,
            billRes
        ] = await Promise.all([
            // 1. Resident Statistics: Total & New this month
            db.query(`
                SELECT 
                    COUNT(*) AS total,
                    COUNT(CASE WHEN created_at >= $1 THEN 1 END) AS new_this_month
                FROM users 
                WHERE role = 'resident'
            `, [startOfMonth]),

            // 2. Vehicle Statistics: Total active vehicles
            db.query(`
                SELECT COUNT(*) AS total 
                FROM vehicle_cards 
                WHERE status = 'active'
            `),

            // 3. News Statistics: Number of posts this month
            db.query(`
                SELECT COUNT(*) AS total 
                FROM news 
                WHERE created_at >= $1
            `, [startOfMonth]),

            // 4. Bill Statistics for this month: Paid count / Total expected revenue / Total collected revenue
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
        res.status(500).json({ message: 'Server error while fetching statistics.' });
    }
});

module.exports = router;