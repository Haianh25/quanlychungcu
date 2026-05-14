const request = require('supertest');
const express = require('express');

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

jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { id: 999, role: 'admin' };
        next();
    },
    isAdmin: (req, res, next) => next()
}));

const db = require('../db');

describe('Vehicle Admin Routes Unit Tests', () => {
    let app;
    let clientMock;
    let dbMock;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        dbMock = require('../db');
        clientMock = dbMock._mockClient;

        clientMock.query.mockResolvedValue({ rows: [], rowCount: 0 });
        dbMock.query.mockResolvedValue({ rows: [], rowCount: 0 });

        const vehicleAdminRoutes = require('../routes/vehicleAdmin');
        app = express();
        app.use(express.json());
        app.use('/api/admin', vehicleAdminRoutes);
    });

    /**
     * VEH_11: GET list of vehicle requests
     */
    describe('GET /api/admin/vehicle-requests', () => {
        test('Should return list of pending requests (VEH_11)', async () => {
            dbMock.query.mockResolvedValueOnce({
                rows: [{ id: 1, resident_id: 1, status: 'pending' }]
            });

            const res = await request(app).get('/api/admin/vehicle-requests?status=pending');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].status).toBe('pending');
        });
    });
});