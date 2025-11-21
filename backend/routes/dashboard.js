// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/dashboard/stats
router.get('/stats', protect, isAdmin, async (req, res) => {
    try {
        const now = new Date();
        // Get start of current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        // Get start of 6 months ago for revenue chart
        const sixMonthsAgoDate = new Date();
        sixMonthsAgoDate.setMonth(sixMonthsAgoDate.getMonth() - 5);
        sixMonthsAgoDate.setDate(1);
        const startOfSixMonthsAgo = sixMonthsAgoDate.toISOString();

        // Use Promise.all to execute queries in parallel
        const [
            residentRes,
            vehicleRes,
            newsRes,
            billRes,
            revenueHistoryRes, 
            billStatusRes,
            // [MỚI] Queries for Pending Actions
            pendingVehicleRes,
            pendingUserRes
        ] = await Promise.all([
            // 1. Resident Statistics
            db.query(`
                SELECT 
                    COUNT(*) AS total,
                    COUNT(CASE WHEN created_at >= $1 THEN 1 END) AS new_this_month
                FROM users 
                WHERE role = 'resident'
            `, [startOfMonth]),

            // 2. Vehicle Statistics
            db.query(`
                SELECT COUNT(*) AS total 
                FROM vehicle_cards 
                WHERE status = 'active'
            `),

            // 3. News Statistics
            db.query(`
                SELECT COUNT(*) AS total 
                FROM news 
                WHERE created_at >= $1
            `, [startOfMonth]),

            // 4. Bill Statistics
            db.query(`
                SELECT 
                    COUNT(*) AS total_bills,
                    COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
                    COALESCE(SUM(total_amount), 0) AS total_expected,
                    COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) AS total_collected
                FROM bills 
                WHERE issue_date >= $1
            `, [startOfMonth]),

            // 5. Revenue History
            db.query(`
                SELECT 
                    TO_CHAR(issue_date, 'MM/YYYY') as month_year,
                    COALESCE(SUM(total_amount), 0) as expected,
                    COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as collected
                FROM bills 
                WHERE issue_date >= $1
                GROUP BY TO_CHAR(issue_date, 'MM/YYYY'), date_trunc('month', issue_date)
                ORDER BY date_trunc('month', issue_date) ASC
            `, [startOfSixMonthsAgo]),

            // 6. Bill Status Breakdown
            db.query(`
                SELECT status, COUNT(*) as count
                FROM bills
                WHERE issue_date >= $1
                GROUP BY status
            `, [startOfMonth]),

            // 7. [MỚI] Pending Vehicle Requests
            db.query(`SELECT COUNT(*) as count FROM vehicle_card_requests WHERE status = 'pending'`),

            // 8. [MỚI] Users waiting for room assignment (Verified but no apartment)
            db.query(`SELECT COUNT(*) as count FROM users WHERE role = 'user' AND is_verified = true AND (apartment_number IS NULL OR apartment_number = '')`)
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
            },
            // [MỚI] Pending Actions Data
            pending_actions: {
                vehicles: parseInt(pendingVehicleRes.rows[0].count),
                residents: parseInt(pendingUserRes.rows[0].count)
            },
            charts: {
                revenue_history: revenueHistoryRes.rows.map(row => ({
                    month: row.month_year,
                    expected: parseFloat(row.expected),
                    collected: parseFloat(row.collected)
                })),
                bill_status: billStatusRes.rows.map(row => ({
                    status: row.status,
                    count: parseInt(row.count)
                }))
            }
        };

        res.json(stats);

    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ message: 'Server error while fetching statistics.' });
    }
});

module.exports = router;