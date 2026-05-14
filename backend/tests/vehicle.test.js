const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// 1. SETUP MOCK DB FACTORY
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
        req.user = { 
            id: 10, 
            full_name: 'Resident Test',
            user: { id: 10, full_name: 'Resident Test' } 
        };
        next();
    }
}));

// 3. MOCK UPLOAD (Multer)
jest.mock('../utils/upload', () => ({
    single: (fieldName) => (req, res, next) => {
        req.file = { 
            filename: 'fake-proof.jpg', 
            path: 'uploads/proofs/fake-proof.jpg' 
        };
        next();
    }
}));

// 4. MOCK FS (File System)
jest.mock('fs', () => ({
    unlink: jest.fn((path, cb) => cb(null)),
}));

describe('Vehicle Services Unit Tests', () => {
    let app;
    let dbMock;
    let clientMock;
    let fsMock;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        dbMock = require('../db');
        clientMock = dbMock._mockClient;
        fsMock = require('fs');

        clientMock.query.mockResolvedValue({ rows: [], rowCount: 0 });
        dbMock.query.mockResolvedValue({ rows: [], rowCount: 0 });

        const vehicleRoutes = require('../routes/services'); 
        
        app = express();
        app.use(bodyParser.json());
        app.use('/api/services', vehicleRoutes);
    });

    /**
     * VEH_01: GET FEES TABLE
     */
    describe('GET /api/services/fees-table', () => {
        test('Should return fees object', async () => {
            dbMock.query.mockResolvedValueOnce({ 
                rows: [
                    { fee_code: 'CAR_FEE', price: 1000000 },
                    { fee_code: 'MOTORBIKE_FEE', price: 100000 }
                ] 
            });

            const res = await request(app).get('/api/services/fees-table');

            expect(res.statusCode).toBe(200);
            expect(res.body.CAR_FEE).toBe(1000000);
        });
    });

    /**
     * VEH_02: MY POLICY
     */
    describe('GET /api/services/my-policy', () => {
        test('Should return room policy', async () => {
            dbMock.query.mockResolvedValueOnce({ rows: [{ room_type: 'VIP' }] });
            dbMock.query.mockResolvedValueOnce({ 
                rows: [{ max_cars: 2, max_motorbikes: 3, max_bicycles: 2 }] 
            });

            const res = await request(app).get('/api/services/my-policy');

            expect(res.statusCode).toBe(200);
            expect(res.body.roomType).toBe('VIP');
            expect(res.body.max_cars).toBe(2);
        });
    });

    /**
     * VEH_03 – VEH_06: REGISTER CARD
     */
    describe('POST /api/services/register-card', () => {
        const regData = {
            vehicleType: 'car',
            fullName: 'Test User',
            licensePlate: '30A-12345',
            brand: 'Toyota',
            color: 'Black'
        };

        // VEH_03
        test('Should register successfully if quota available', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT u.apartment_number')) return { rows: [{ apartment_number: 'A101', room_type: 'A' }] };
                if (sql.includes('FROM room_type_policies')) return { rows: [{ max_cars: 1 }] };
                if (sql.includes('FROM vehicle_cards WHERE resident_id')) return { rows: [] }; 
                if (sql.includes('FROM vehicle_card_requests WHERE resident_id')) return { rows: [] }; 
                if (sql.includes('INSERT INTO vehicle_card_requests')) return;
                if (sql.includes('SELECT id FROM users')) return { rows: [{ id: 99 }] };
                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/services/register-card').send(regData);

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toContain('submitted successfully');
        });

        // VEH_04
        test('Should fail (403) if limit reached', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT u.apartment_number')) return { rows: [{ apartment_number: 'A101', room_type: 'A' }] };
                if (sql.includes('FROM room_type_policies')) return { rows: [{ max_cars: 1 }] };
                if (sql.includes('FROM vehicle_cards WHERE resident_id')) return { rows: [{ vehicle_type: 'car', count: '1' }] }; 
                if (sql === 'ROLLBACK') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/services/register-card').send(regData);

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toContain('Limit reached');
            expect(fsMock.unlink).toHaveBeenCalled();
        });

        // VEH_05: No image - override upload mock to return no file
        test('Should fail (400) if no image uploaded', async () => {
            // Re-mock upload to simulate no file
            jest.resetModules();
            jest.mock('../utils/upload', () => ({
                single: (fieldName) => (req, res, next) => {
                    req.file = undefined;
                    next();
                }
            }));
            const vehicleRoutes2 = require('../routes/services');
            const app2 = express();
            app2.use(bodyParser.json());
            app2.use('/api/services', vehicleRoutes2);

            const res = await request(app2).post('/api/services/register-card').send(regData);
            expect(res.statusCode).toBe(400);
        });

        // VEH_06
        test('Should fail (400) if invalid vehicle type', async () => {
            const invalidData = { ...regData, vehicleType: 'tank' };
            const res = await request(app).post('/api/services/register-card').send(invalidData);
            expect(res.statusCode).toBe(400);
        });
    });

    /**
     * VEH_07 – VEH_09: CANCEL CARD
     */
    describe('POST /api/services/cancel-card', () => {
        const cancelData = { cardId: 100, reason: 'Lost' };

        // VEH_07
        test('Should submit cancellation request', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT apartment_number')) return { rows: [{ apartment_number: 'A101' }] };
                if (sql.includes('SELECT id, vehicle_type')) return { 
                    rows: [{ id: 100, vehicle_type: 'motorbike', license_plate: '29X-1' }] 
                };
                if (sql.includes('SELECT id FROM vehicle_card_requests')) return { rows: [] };
                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/services/cancel-card').send(cancelData);

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toContain('Cancellation request submitted');
        });

        // VEH_08
        test('Should fail (404) if card not found', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT apartment_number')) return { rows: [{ apartment_number: 'A101' }] };
                if (sql.includes('SELECT id, vehicle_type')) return { rows: [] };
                if (sql === 'ROLLBACK') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/services/cancel-card').send(cancelData);
            expect(res.statusCode).toBe(404);
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });
        
        // VEH_09
        test('Should fail (400) if request already pending', async () => {
             clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT apartment_number')) return { rows: [{ apartment_number: 'A101' }] };
                if (sql.includes('SELECT id, vehicle_type')) return { rows: [{ id: 100 }] };
                if (sql.includes('SELECT id FROM vehicle_card_requests')) return { rows: [{ id: 50 }] };
                if (sql === 'ROLLBACK') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/services/cancel-card').send(cancelData);

            expect(res.statusCode).toBe(400);
        });
    });

    /**
     * VEH_10: CANCEL PENDING REQUEST
     */
    describe('POST /api/services/cancel-pending-request', () => {
        test('Should cancel pending request and delete file', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('SELECT id, proof_image_url')) return { 
                    rows: [{ id: 1, proof_image_url: '/uploads/proofs/test.jpg', vehicle_type: 'car' }] 
                };
                if (sql.includes('SELECT id FROM users')) return { rows: [] };
                if (sql.includes('DELETE FROM vehicle_card_requests')) return;
                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app)
                .post('/api/services/cancel-pending-request')
                .send({ requestId: 1 });

            expect(res.statusCode).toBe(200);
            expect(fsMock.unlink).toHaveBeenCalled();
        });
    });
});
