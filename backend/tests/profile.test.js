const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// --- 1. MOCK DB ---
jest.mock('../db', () => ({
    query: jest.fn()
}));

// --- 2. MOCK MIDDLEWARE ---
jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { id: 1, email: 'test@example.com' };
        next();
    }
}));

// --- 3. MOCK BCRYPT ---
jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    genSalt: jest.fn().mockResolvedValue('somesalt'),
    hash: jest.fn().mockResolvedValue('hashed_new_password')
}));

describe('Profile Routes Unit Tests', () => {
    let app;
    let dbMock;
    let bcryptMock; // [QUAN TRỌNG] Biến giữ instance bcrypt mới nhất

    beforeEach(() => {
        // 1. Reset modules để xóa cache
        jest.resetModules();
        jest.clearAllMocks();

        // 2. [QUAN TRỌNG] Require lại module để lấy instance mới khớp với Route
        dbMock = require('../db');
        bcryptMock = require('bcryptjs'); 

        // 3. Cài đặt mặc định an toàn cho DB
        dbMock.query.mockResolvedValue({ rows: [], rowCount: 0 });

        // 4. Setup App
        const profileRoutes = require('../routes/profile');
        app = express();
        app.use(bodyParser.json());
        app.use('/api/profile', profileRoutes);
    });

    /**
     * TEST SUITE 1: GET /me
     */
    describe('GET /api/profile/me', () => {
        test('Should return user profile with room details', async () => {
            const mockUser = {
                id: 1, full_name: 'Nguyen Van A', apartment_number: 'A101',
                area: 50, bedrooms: 2
            };
            dbMock.query.mockResolvedValueOnce({ rows: [mockUser] });

            const res = await request(app).get('/api/profile/me');

            expect(res.statusCode).toBe(200);
            expect(res.body.full_name).toBe('Nguyen Van A');
        });

        test('Should return 404 if user not found', async () => {
            dbMock.query.mockResolvedValueOnce({ rows: [] }); 

            const res = await request(app).get('/api/profile/me');

            expect(res.statusCode).toBe(404);
        });
    });

    /**
     * TEST SUITE 2: GET /status
     */
    describe('GET /api/profile/status', () => {
        test('Should return status info', async () => {
            dbMock.query.mockResolvedValueOnce({ rows: [{ role: 'resident', apartment_number: 'A101' }] });

            const res = await request(app).get('/api/profile/status');

            expect(res.statusCode).toBe(200);
            expect(res.body.apartment_number).toBe('A101');
        });
    });

    /**
     * TEST SUITE 3: PUT /update-details
     */
    describe('PUT /api/profile/update-details', () => {
        test('Should update phone successfully', async () => {
            dbMock.query.mockResolvedValueOnce({ 
                rows: [{ id: 1, phone: '0999888777' }] 
            });

            const res = await request(app)
                .put('/api/profile/update-details')
                .send({ phone: '0999888777' });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('updated successfully');
        });

        test('Should fail (400) if phone is missing', async () => {
            const res = await request(app).put('/api/profile/update-details').send({});
            expect(res.statusCode).toBe(400);
        });
    });

    /**
     * TEST SUITE 4: PUT /change-password
     */
    describe('PUT /api/profile/change-password', () => {
        const passwordData = {
            currentPassword: 'oldPass123',
            newPassword: 'newPass456',
            confirmPassword: 'newPass456'
        };

        test('Should change password successfully', async () => {
            // 1. Mock DB lấy password cũ
            dbMock.query.mockResolvedValueOnce({ rows: [{ password_hash: 'hashed_old_pass' }] });
            
            // 2. [QUAN TRỌNG] Dùng bcryptMock mới để mock return value
            bcryptMock.compare.mockResolvedValue(true);
            
            // 3. Mock DB update password mới
            dbMock.query.mockResolvedValueOnce({ rowCount: 1 });

            const res = await request(app)
                .put('/api/profile/change-password')
                .send(passwordData);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Password changed successfully');
            
            expect(bcryptMock.hash).toHaveBeenCalledWith('newPass456', expect.anything());
        });

        test('Should fail (400) if current password incorrect', async () => {
            // 1. Mock DB lấy pass cũ
            dbMock.query.mockResolvedValueOnce({ rows: [{ password_hash: 'hashed_old_pass' }] });
            
            // 2. Mock bcrypt compare (SAI)
            bcryptMock.compare.mockResolvedValue(false);

            const res = await request(app)
                .put('/api/profile/change-password')
                .send(passwordData);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Incorrect current password');
            
            // Không được gọi lệnh update DB (chỉ gọi 1 lần SELECT lúc đầu)
            expect(dbMock.query).toHaveBeenCalledTimes(1); 
        });

        test('Should fail (400) if new passwords do not match', async () => {
            const res = await request(app)
                .put('/api/profile/change-password')
                .send({ ...passwordData, confirmPassword: 'wrongMismatch' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('do not match');
        });

        test('Should fail (400) if new password too short', async () => {
            const res = await request(app)
                .put('/api/profile/change-password')
                .send({ ...passwordData, newPassword: '123', confirmPassword: '123' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('at least 6 characters');
        });
    });
});