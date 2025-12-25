const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// --- 1. MOCK DB FACTORY ---
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

// --- 2. MOCK AUTH MIDDLEWARE ---
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

        // Default Mocks
        clientMock.query.mockResolvedValue({ rows: [], rowCount: 0 });
        dbMock.query.mockResolvedValue({ rows: [], rowCount: 0 });

        const vehicleAdminRoutes = require('../routes/vehicleAdmin');
        app = express();
        app.use(bodyParser.json());
        app.use('/api/admin', vehicleAdminRoutes);
    });

    /**
     * TEST SUITE 1: APPROVE REQUEST (Duyệt yêu cầu)
     */
    describe('POST /api/admin/vehicle-requests/:id/approve', () => {
        const requestId = 1;

        test('Should approve REGISTER request successfully', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                
                // 1. Get Request
                if (sql.includes('SELECT * FROM vehicle_card_requests')) {
                    return { 
                        rows: [{ 
                            id: requestId, 
                            status: 'pending', 
                            request_type: 'register', 
                            vehicle_type: 'car', 
                            resident_id: 10,
                            license_plate: '30A-9999'
                        }] 
                    };
                }
                // 2. Get Room Type
                if (sql.includes('SELECT r.room_type')) {
                    return { rows: [{ room_type: 'A' }] };
                }
                // 3. Get Policy
                if (sql.includes('FROM room_type_policies')) {
                    return { rows: [{ max_cars: 2 }] };
                }
                // 4. Count Active (0 cars)
                if (sql.includes('SELECT COUNT(*)')) {
                    return { rows: [{ count: '0' }] };
                }
                // 5. Get Fee
                if (sql.includes('FROM fees')) {
                    return { rows: [{ price: 50000 }] };
                }
                // 6. Update Request & Insert Card
                if (sql.includes('UPDATE vehicle_card_requests')) return;
                if (sql.includes('INSERT INTO vehicle_cards')) return;
                
                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app).post(`/api/admin/vehicle-requests/${requestId}/approve`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('approved successfully');
            expect(clientMock.query).toHaveBeenCalledWith('COMMIT');
        });

        test('Should fail (400) if QUOTA EXCEEDED', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                // Request Car
                if (sql.includes('SELECT * FROM vehicle_card_requests')) {
                    return { 
                        rows: [{ id: requestId, status: 'pending', request_type: 'register', vehicle_type: 'car', resident_id: 10 }] 
                    };
                }
                if (sql.includes('SELECT r.room_type')) return { rows: [{ room_type: 'A' }] };
                // Max 1 car
                if (sql.includes('FROM room_type_policies')) return { rows: [{ max_cars: 1 }] };
                // Đã có 1 car active
                if (sql.includes('SELECT COUNT(*)')) return { rows: [{ count: '1' }] };
                
                if (sql === 'ROLLBACK') return;
                return { rows: [] };
            });

            const res = await request(app).post(`/api/admin/vehicle-requests/${requestId}/approve`);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Limit reached');
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });

    /**
     * TEST SUITE 2: REJECT REQUEST (Từ chối)
     */
    describe('POST /api/admin/vehicle-requests/:id/reject', () => {
        const requestId = 1;
        const rejectData = { admin_notes: 'Invalid Document' };

        test('Should reject request successfully', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT * FROM vehicle_card_requests')) {
                    return { rows: [{ id: requestId, status: 'pending', resident_id: 10, request_type: 'register' }] };
                }
                if (sql.includes('UPDATE vehicle_card_requests')) return;
                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app).post(`/api/admin/vehicle-requests/${requestId}/reject`).send(rejectData);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('rejected');
        });

        test('Should fail if missing reason', async () => {
            const res = await request(app).post(`/api/admin/vehicle-requests/${requestId}/reject`).send({});
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('reason is required');
        });
    });

    /**
     * TEST SUITE 3: CHANGE STATUS (Kích hoạt lại thẻ)
     */
    describe('PATCH /api/admin/vehicle-cards/:id/status', () => {
        const cardId = 100;
        
        test('Should activate card successfully if quota valid', async () => {
            dbMock.query.mockImplementation(async (sql) => {
                // 1. Get Card
                if (sql.includes('SELECT status')) {
                    return { rows: [{ status: 'inactive', resident_id: 10, vehicle_type: 'car' }] };
                }
                // 2. Get Room
                if (sql.includes('SELECT r.room_type')) return { rows: [{ room_type: 'A' }] };
                // 3. Get Policy (Max 2)
                if (sql.includes('FROM room_type_policies')) return { rows: [{ max_cars: 2 }] };
                // 4. Count Active (0)
                if (sql.includes('SELECT COUNT(*)')) return { rows: [{ count: '0' }] };
                // 5. Update
                if (sql.includes('UPDATE vehicle_cards')) return { rows: [{ id: cardId }] };
                
                return { rows: [] };
            });

            const res = await request(app)
                .patch(`/api/admin/vehicle-cards/${cardId}/status`)
                .send({ status: 'active' });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('updated to "active"');
        });

        test('Should fail to activate if quota exceeded', async () => {
            dbMock.query.mockImplementation(async (sql) => {
                if (sql.includes('SELECT status')) {
                    return { rows: [{ status: 'inactive', resident_id: 10, vehicle_type: 'car' }] };
                }
                if (sql.includes('SELECT r.room_type')) return { rows: [{ room_type: 'A' }] };
                // Max 1
                if (sql.includes('FROM room_type_policies')) return { rows: [{ max_cars: 1 }] };
                // Active 1 -> Đầy
                if (sql.includes('SELECT COUNT(*)')) return { rows: [{ count: '1' }] };
                
                return { rows: [] };
            });

            const res = await request(app)
                .patch(`/api/admin/vehicle-cards/${cardId}/status`)
                .send({ status: 'active' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Limit reached');
        });
    });
});