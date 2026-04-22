const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// 1. SETUP MOCK DB
jest.mock('../db', () => {
    const mockClient = {
        query: jest.fn(),
        release: jest.fn()
    };
    const mockPool = {
        connect: jest.fn().mockResolvedValue(mockClient),
        query: jest.fn()
    };
    return {
        query: jest.fn(),
        getPool: jest.fn().mockReturnValue(mockPool),
        _mockClient: mockClient,
        _mockPool: mockPool
    };
});

// 2. MOCK MIDDLEWARE
jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { id: 999, role: 'admin' };
        next();
    },
    isAdmin: (req, res, next) => next()
}));

// 3. MOCK UTILS
jest.mock('../utils/billService', () => ({
    generateBillsForMonth: jest.fn()
}));
jest.mock('../utils/penaltyService', () => ({
    applyLateFees: jest.fn()
}));

describe('Bill Admin Routes Unit Tests', () => {
    let app;
    let dbMock;
    let clientMock;
    let billServiceMock;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        dbMock = require('../db');
        clientMock = dbMock._mockClient;
        billServiceMock = require('../utils/billService');

        const billAdminRoutes = require('../routes/billAdmin');
        app = express();
        app.use(bodyParser.json());
        app.use('/api/admin/bills', billAdminRoutes);
    });

    describe('GET /api/admin/bills', () => {
        test('Should return all bills (BILL_07)', async () => {
            dbMock.query.mockResolvedValueOnce({
                rows: [{ bill_id: 1, resident_name: 'Test', total_amount: 1000 }]
            });

            const res = await request(app).get('/api/admin/bills');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe('GET /api/admin/bills/:id', () => {
        test('Should return bill line items (BILL_08)', async () => {
            dbMock.query.mockResolvedValueOnce({
                rows: [{ item_name: 'Electricity', total_item_amount: 500 }]
            });

            const res = await request(app).get('/api/admin/bills/1');

            expect(res.statusCode).toBe(200);
            expect(res.body[0].item_name).toBe('Electricity');
        });

        test('Should return 500 if DB error on details (BILL_12)', async () => {
            dbMock.query.mockRejectedValueOnce(new Error('DB Fail'));
            const res = await request(app).get('/api/admin/bills/1');
            expect(res.statusCode).toBe(500);
        });
    });

    describe('POST /api/admin/bills/generate-bills', () => {
        test('Should generate bills successfully (BILL_09)', async () => {
            billServiceMock.generateBillsForMonth.mockResolvedValueOnce({ success: true, count: 5 });
            dbMock.query.mockResolvedValueOnce({ rows: [] }); // No new bills for socket in this mock
            
            const res = await request(app).post('/api/admin/bills/generate-bills');

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Successfully generated 5');
        });

        test('Should return 500 if service returns error (BILL_11)', async () => {
            billServiceMock.generateBillsForMonth.mockResolvedValueOnce({ success: false, error: 'Service error' });
            
            const res = await request(app).post('/api/admin/bills/generate-bills');
            expect(res.statusCode).toBe(500);
            expect(res.body.message).toBe('Service error');
        });
    });

    describe('POST /api/admin/bills/trigger-late-fees', () => {
        test('Should trigger late fees successfully (BILL_10)', async () => {
            // 1. Fee check
            clientMock.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            // 2. Overdue bills check
            clientMock.query.mockResolvedValueOnce({ rows: [{ bill_id: 10, user_id: 1 }] });
            // 3. Notification insert
            clientMock.query.mockResolvedValueOnce({ rows: [{ id: 100 }] });

            const res = await request(app).post('/api/admin/bills/trigger-late-fees');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(require('../utils/penaltyService').applyLateFees).toHaveBeenCalled();
        });

        test('Should return message if no overdue bills found', async () => {
             clientMock.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Fee check
             clientMock.query.mockResolvedValueOnce({ rows: [] }); // No overdue bills

             const res = await request(app).post('/api/admin/bills/trigger-late-fees');

             expect(res.statusCode).toBe(200);
             expect(res.body.success).toBe(false);
             expect(res.body.reason).toContain('Không tìm thấy');
        });
    });
});
