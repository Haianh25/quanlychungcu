const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// --- 1. SETUP MOCK FACTORY ---
// Định nghĩa factory để Jest dùng mỗi khi require lại file db
jest.mock('../db', () => {
    // Tạo object mock mới mỗi khi factory chạy
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
        // Expose để test lấy ra dùng
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
    let dbMock;     // Biến giữ module db hiện tại
    let clientMock; // Biến giữ client mock hiện tại

    beforeEach(() => {
        // 1. Reset modules để tạo môi trường mới sạch sẽ
        jest.resetModules();
        jest.clearAllMocks();

        // 2. Require lại DB để lấy instance MỚI NHẤT (Quan trọng!)
        dbMock = require('../db');
        clientMock = dbMock._mockClient;

        // 3. Cài đặt mặc định an toàn cho clientMock để tránh crash
        // (Luôn trả về object có rows rỗng thay vì undefined)
        clientMock.query.mockResolvedValue({ rows: [], rowCount: 0 });

        // 4. Setup App với route mới
        const adminRoutes = require('../routes/admin');
        app = express();
        app.use(bodyParser.json());
        app.use('/api/admin', adminRoutes);
    });

    /**
     * TEST SUITE 1: USER MANAGEMENT
     */
    describe('GET /api/admin/users', () => {
        test('Should return list of users', async () => {
            // Mock hàm query lẻ (không qua pool)
            dbMock.query.mockResolvedValue({ rows: [{ id: 1, full_name: 'User A' }] });

            const res = await request(app).get('/api/admin/users');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe('DELETE /api/admin/users/:id', () => {
        test('Should fail if user has unpaid bills', async () => {
            // Sử dụng clientMock đã lấy ở beforeEach
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                if (sql.includes('FROM bills')) return { rows: [{ exists: 1 }] }; // Có bill
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
                if (sql.includes('FROM bills')) return { rows: [] }; // Không bill
                if (sql.includes('FROM vehicle_cards')) return { rows: [] }; // Không thẻ
                if (sql.includes('DELETE FROM users')) return { rowCount: 1 };
                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app).delete('/api/admin/users/1');

            expect(res.statusCode).toBe(200);
            expect(clientMock.query).toHaveBeenCalledWith('COMMIT');
        });
    });

    /**
     * TEST SUITE 2: ASSIGN ROOM
     */
    describe('POST /api/admin/assign-room', () => {
        const assignData = { residentId: 10, roomId: 101 };

        test('Should assign room successfully', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                // Check room available -> Trả về dữ liệu
                if (sql.includes('SELECT r.room_number')) return { 
                    rows: [{ room_number: '101', block_name: 'Block A' }] 
                };
                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/admin/assign-room').send(assignData);

            // Debug log nếu vẫn lỗi (sẽ không lỗi nữa đâu ^^)
            if (res.statusCode === 500) console.log(res.body);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Room assigned successfully');
        });

        test('Should fail if room not found or occupied', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                // Trả về rỗng -> Không tìm thấy
                if (sql.includes('SELECT r.room_number')) return { rows: [] };
                if (sql === 'ROLLBACK') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/admin/assign-room').send(assignData);

            expect(res.statusCode).toBe(400);
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });

    /**
     * TEST SUITE 3: UNASSIGN ROOM
     */
    describe('POST /api/admin/unassign-room', () => {
        test('Should unassign room successfully', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                // Check user -> Có phòng
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
                // User có nhưng apartment null
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

    /**
     * TEST SUITE 4: NEWS
     */
    describe('POST /api/admin/news', () => {
        test('Should create news', async () => {
            // Mock query lẻ
            dbMock.query.mockImplementation(async (sql) => {
                if (sql.includes('INSERT INTO news')) return { rows: [{ id: 1, title: 'Title', status: 'active' }] };
                return { rows: [] };
            });
            
            const res = await request(app).post('/api/admin/news').send({ title: 'T', content: 'C' });
            expect(res.statusCode).toBe(201);
        });
    });
});