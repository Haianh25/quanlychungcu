const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// --- MOCK DB ---
jest.mock('../db', () => ({
    query: jest.fn()
}));

// --- MOCK AUTH MIDDLEWARE ---
jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { id: 1, role: 'admin' };
        next();
    },
    isAdmin: (req, res, next) => next()
}));

const db = require('../db');
const dashboardRoutes = require('../routes/dashboard');

describe('Dashboard Routes Unit Tests', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(bodyParser.json());
        app.use('/api/dashboard', dashboardRoutes);
    });

    describe('GET /api/dashboard/stats', () => {
        test('Should return all statistics correctly', async () => {
            // Mock 8 DB queries in order
            db.query
                // 1. users
                .mockResolvedValueOnce({ rows: [{ total: 100, new_this_month: 5 }] })
                // 2. vehicle_cards
                .mockResolvedValueOnce({ rows: [{ total: 50 }] })
                // 3. news
                .mockResolvedValueOnce({ rows: [{ total: 10 }] })
                // 4. bills summary
                .mockResolvedValueOnce({ rows: [{ total_bills: 200, paid_count: 150, total_expected: 5000000, total_collected: 4000000 }] })
                // 5. revenue history
                .mockResolvedValueOnce({ rows: [{ month_year: '01/2026', expected: 1000, collected: 800 }] })
                // 6. bill status
                .mockResolvedValueOnce({ rows: [{ status: 'paid', count: 150 }, { status: 'unpaid', count: 50 }] })
                // 7. pending vehicle requests
                .mockResolvedValueOnce({ rows: [{ count: 2 }] })
                // 8. pending user verification
                .mockResolvedValueOnce({ rows: [{ count: 3 }] });

            const res = await request(app).get('/api/dashboard/stats');

            expect(res.statusCode).toBe(200);

            // Verify structure
            expect(res.body.residents).toEqual({ total: 100, new: 5 });
            expect(res.body.vehicles).toBe(50);
            expect(res.body.news).toBe(10);
            expect(res.body.bills.count).toBe(200);
            expect(res.body.bills.collected).toBe(4000000);

            expect(res.body.pending_actions.vehicles).toBe(2);
            expect(res.body.pending_actions.residents).toBe(3);

            expect(res.body.charts.revenue_history).toHaveLength(1);
            expect(db.query).toHaveBeenCalledTimes(8);
        });

        test('Should handle database errors gracefully', async () => {
            // Mock first query failing
            db.query.mockRejectedValueOnce(new Error('DB Connection Failed'));

            const res = await request(app).get('/api/dashboard/stats');

            expect(res.statusCode).toBe(500);
            expect(res.body.message).toContain('Server error');
        });
    });
});
