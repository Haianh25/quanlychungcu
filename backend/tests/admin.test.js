const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

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

jest.mock('../utils/billService', () => ({
    generateMoveInBill: jest.fn().mockResolvedValue(true)
}));

jest.mock('bcryptjs', () => ({
    genSalt: jest.fn().mockResolvedValue('salt'),
    hash: jest.fn().mockResolvedValue('hashed_password')
}));

describe('Admin Routes Unit Tests', () => {
    let app;
    let dbMock;
    let clientMock;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        dbMock = require('../db');
        clientMock = dbMock._mockClient;
        clientMock.query.mockResolvedValue({ rows: [], rowCount: 0 });
        const adminRoutes = require('../routes/admin');
        app = express();
        app.use(bodyParser.json());
        app.use('/api/admin', adminRoutes);
    });

    /**
     * GET /api/admin/users (ADM_01 – ADM_02)
     */
    describe('GET /api/admin/users', () => {
        // ADM_01
        test('Should return list of users', async () => {
            dbMock.query.mockResolvedValue({ rows: [{ id: 1, full_name: 'User A' }] });

            const res = await request(app).get('/api/admin/users');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
        });

        // ADM_02
        test('Should return empty list if no residents found', async () => {
            dbMock.query.mockResolvedValue({ rows: [] });
            const res = await request(app).get('/api/admin/users');
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    /**
     * POST /api/admin/assign-room (ADM_03 – ADM_06, ADM_10)
     */
    describe('POST /api/admin/assign-room', () => {
        const assignData = { residentId: 10, roomId: 101 };

        // ADM_03
        test('Should assign room successfully', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT r.room_number')) return {
                    rows: [{ room_number: '101', block_name: 'Block A' }]
                };
                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/admin/assign-room').send(assignData);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Room assigned successfully');
        });

        // ADM_06 (room not found -> also covers ADM_04 occupied, ADM_05 user has room depending on route logic)
        test('Should fail if room not found or occupied', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT r.room_number')) return { rows: [] };
                if (sql === 'ROLLBACK') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/admin/assign-room').send(assignData);

            expect(res.statusCode).toBe(400);
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });

        // ADM_10
        test('Should rollback if DB error occurs during transaction', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT r.room_number')) {
                    throw new Error('Deadlock detected');
                }
                if (sql === 'ROLLBACK') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/admin/assign-room').send(assignData);
            expect(res.statusCode).toBe(500);
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });

    /**
     * POST /api/admin/unassign-room (ADM_07 – ADM_09)
     */
    describe('POST /api/admin/unassign-room', () => {
        // ADM_07
        test('Should unassign (remove) resident successfully', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT apartment_number')) return {
                    rows: [{ apartment_number: 'A-101', id: 1 }]
                };
                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/admin/unassign-room').send({ residentId: 1 });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Successfully unassigned');
        });

        // ADM_09
        test('Should fail if resident has no room', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT apartment_number')) return {
                    rows: [{ apartment_number: null }]
                };
                if (sql === 'ROLLBACK') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/admin/unassign-room').send({ residentId: 1 });

            expect(res.statusCode).toBe(400);
        });
    });
});