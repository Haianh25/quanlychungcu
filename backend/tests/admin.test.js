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

    describe('GET /api/admin/users', () => {
        test('Should return list of users', async () => {
            dbMock.query.mockResolvedValue({ rows: [{ id: 1, full_name: 'User A' }] });

            const res = await request(app).get('/api/admin/users');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe('DELETE /api/admin/users/:id', () => {
        test('Should fail if user has unpaid bills', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('FROM bills')) return { rows: [{ exists: 1 }] };
                if (sql === 'ROLLBACK') return;
                return { rows: [] };
            });

            const res = await request(app).delete('/api/admin/users/1');

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('invoices');
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });

        test('Should delete successfully', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('FROM bills')) return { rows: [] };
                if (sql.includes('FROM vehicle_cards')) return { rows: [] };
                if (sql.includes('DELETE FROM users')) return { rowCount: 1 };
                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app).delete('/api/admin/users/1');

            expect(res.statusCode).toBe(200);
            expect(clientMock.query).toHaveBeenCalledWith('COMMIT');
        });
    });

    describe('POST /api/admin/assign-room', () => {
        const assignData = { residentId: 10, roomId: 101 };

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

            if (res.statusCode === 500) console.log(res.body);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Room assigned successfully');
        });

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
    });

    describe('POST /api/admin/unassign-room', () => {
        test('Should unassign room successfully', async () => {
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


    describe('POST /api/admin/news', () => {
        test('Should create news', async () => {
            dbMock.query.mockImplementation(async (sql) => {
                if (sql.includes('INSERT INTO news')) return { rows: [{ id: 1, title: 'Title', status: 'active' }] };
                return { rows: [] };
            });

            const res = await request(app).post('/api/admin/news').send({ title: 'T', content: 'C' });
            expect(res.statusCode).toBe(201);
        });
    });
    describe('PATCH /api/admin/users/:id/status', () => {
        test('Should update user status successfully', async () => {
            dbMock.query.mockResolvedValueOnce({
                rows: [{ id: 1, is_active: true }]
            });

            const res = await request(app)
                .patch('/api/admin/users/1/status')
                .send({ isActive: true });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('enabled');
        });

        test('Should return 400 if isActive is missing', async () => {
            const res = await request(app)
                .patch('/api/admin/users/1/status')
                .send({}); // Missing isActive

            expect(res.statusCode).toBe(400);
        });
    });

    describe('PUT /api/admin/users/:id', () => {
        const updateData = { fullName: 'New Name', role: 'user' };

        test('Should update user details successfully', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                // 1. Get User
                if (sql.includes('SELECT * FROM users')) return {
                    rows: [{ id: 1, role: 'user', is_verified: true }]
                };
                // 2. Update User
                if (sql.includes('UPDATE users SET')) return {
                    rows: [{ id: 1, full_name: 'New Name', role: 'user' }]
                };
                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app).put('/api/admin/users/1').send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.user.full_name).toBe('New Name');
        });

        test('Should fail to promote to resident if not verified', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT * FROM users')) return {
                    rows: [{ id: 1, role: 'user', is_verified: false }] // Not verified
                };
                if (sql === 'ROLLBACK') return;
                return { rows: [] };
            });

            const res = await request(app).put('/api/admin/users/1').send({ role: 'resident' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('verified');
        });
    });

    describe('GET /api/admin/residents', () => {
        test('Should return list of residents', async () => {
            dbMock.query.mockResolvedValue({
                rows: [{ id: 1, full_name: 'Resident A', apartment_number: 'A-101' }]
            });

            const res = await request(app).get('/api/admin/residents');

            expect(res.statusCode).toBe(200);
            expect(res.body[0].full_name).toBe('Resident A');
        });
    });

    describe('GET /api/admin/blocks', () => {
        test('Should return list of blocks', async () => {
            dbMock.query.mockResolvedValue({ rows: [{ id: 1, name: 'Block A' }] });
            const res = await request(app).get('/api/admin/blocks');
            expect(res.statusCode).toBe(200);
        });
    });

    describe('GET /api/admin/blocks/:blockId/rooms', () => {
        test('Should return rooms with details', async () => {
            dbMock.query.mockResolvedValue({
                rows: [{
                    id: 1,
                    room_number: '101',
                    car_count: '1',
                    motorbike_count: '2',
                    unpaid_bills_count: '0'
                }]
            });

            const res = await request(app).get('/api/admin/blocks/1/rooms');

            expect(res.statusCode).toBe(200);
            // Verify formatting logic (parseInt)
            expect(res.body[0].car_count).toBe(1);
            expect(res.body[0].motorbike_count).toBe(2);
        });
    });
});