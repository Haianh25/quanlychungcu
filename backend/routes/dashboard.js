// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/stats', protect, isAdmin, async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const sixMonthsAgoDate = new Date();
        sixMonthsAgoDate.setMonth(sixMonthsAgoDate.getMonth() - 5);
        sixMonthsAgoDate.setDate(1);
        const startOfSixMonthsAgo = sixMonthsAgoDate.toISOString();

        const [
            residentRes,
            vehicleRes,
            newsRes,
            billRes,
            revenueHistoryRes,
            billStatusRes,
            pendingVehicleRes,
            pendingUserRes,
            vehicleTypeRes,
            occupancyRes,
            feedbackRes,
            activeSurveyRes
        ] = await Promise.all([
            db.query(`
                SELECT 
                    COUNT(*) AS total,
                    COUNT(CASE WHEN created_at >= $1 THEN 1 END) AS new_this_month
                FROM users 
                WHERE role = 'resident'
            `, [startOfMonth]),

            db.query(`
                SELECT COUNT(*) AS total 
                FROM vehicle_cards 
                WHERE status = 'active'
            `),

            db.query(`
                SELECT COUNT(*) AS total 
                FROM news 
                WHERE created_at >= $1
            `, [startOfMonth]),

            db.query(`
                SELECT 
                    COUNT(*) AS total_bills,
                    COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
                    COALESCE(SUM(total_amount), 0) AS total_expected,
                    COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) AS total_collected
                FROM bills 
                WHERE issue_date >= $1
            `, [startOfMonth]),

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

            db.query(`
                SELECT status, COUNT(*) as count
                FROM bills
                WHERE issue_date >= $1
                GROUP BY status
            `, [startOfMonth]),

            db.query(`SELECT COUNT(*) as count FROM vehicle_card_requests WHERE status = 'pending'`),

            db.query(`SELECT COUNT(*) as count FROM users WHERE role = 'user' AND is_verified = true AND (apartment_number IS NULL OR apartment_number = '')`),

            // New: Vehicle Types (Joined with requests to get the type)
            db.query(`
                SELECT vcr.vehicle_type as type, COUNT(*) as count 
                FROM vehicle_cards vc
                JOIN vehicle_card_requests vcr ON vc.created_from_request_id = vcr.id
                WHERE vc.status = 'active'
                GROUP BY vcr.vehicle_type
            `),

            db.query(`
                SELECT COUNT(DISTINCT apartment_number) as count
                FROM users
                WHERE role = 'resident' AND apartment_number IS NOT NULL AND apartment_number != ''
            `),

            // New: Pending Feedback
            db.query(`SELECT COUNT(*) as count FROM feedback WHERE status = 'pending'`),

            // New: Active Surveys
            db.query(`SELECT COUNT(*) as count FROM surveys WHERE is_active = true`)
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
            pending_actions: {
                vehicles: parseInt(pendingVehicleRes.rows[0].count),
                residents: parseInt(pendingUserRes.rows[0].count),
                feedback: parseInt(feedbackRes.rows[0].count)
            },
            community: {
                active_surveys: parseInt(activeSurveyRes.rows[0].count)
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
                })),
                vehicle_types: vehicleTypeRes.rows.map(row => ({
                    type: row.type,
                    count: parseInt(row.count)
                }))
            },
            occupancy: parseInt(occupancyRes.rows[0]?.count || 0)
        };

        res.json(stats);

    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ message: 'Server error while fetching statistics.' });
    }
});

module.exports = router;