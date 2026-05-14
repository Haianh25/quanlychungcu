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
    let bcryptMock;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        dbMock = require('../db');
        bcryptMock = require('bcryptjs'); 

        dbMock.query.mockResolvedValue({ rows: [], rowCount: 0 });

        const profileRoutes = require('../routes/profile');
        app = express();
        app.use(bodyParser.json());
        app.use('/api/profile', profileRoutes);
    });

    /**
     * TEST SUITE 1: GET /me (PROF_01 – PROF_02)
     */
    describe('GET /api/profile/me', () => {
        // PROF_01
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

        // PROF_02
        test('Should return 404 if user not found', async () => {
            dbMock.query.mockResolvedValueOnce({ rows: [] }); 

            const res = await request(app).get('/api/profile/me');

            expect(res.statusCode).toBe(404);
        });
    });

    /**
     * TEST SUITE 2: GET /status (PROF_03)
     */
    describe('GET /api/profile/status', () => {
        // PROF_03
        test('Should return status info', async () => {
            dbMock.query.mockResolvedValueOnce({ rows: [{ role: 'resident', apartment_number: 'A101' }] });

            const res = await request(app).get('/api/profile/status');

            expect(res.statusCode).toBe(200);
            expect(res.body.apartment_number).toBe('A101');
        });
    });

    /**
     * TEST SUITE 3: PUT /update-details (PROF_04 – PROF_06)
     */
    describe('PUT /api/profile/update-details', () => {
        // PROF_04
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

        // PROF_05
        test('Should fail (400) if phone is missing', async () => {
            const res = await request(app).put('/api/profile/update-details').send({});
            expect(res.statusCode).toBe(400);
        });

        // PROF_06
        test('Should return 500 if DB error on update', async () => {
            dbMock.query.mockRejectedValueOnce(new Error('DB failure'));
            const res = await request(app).put('/api/profile/update-details').send({ phone: '0123' });
            expect(res.statusCode).toBe(500);
        });
    });

    /**
     * TEST SUITE 4: PUT /change-password (PROF_07 – PROF_12)
     */
    describe('PUT /api/profile/change-password', () => {
        const passwordData = {
            currentPassword: 'oldPass123',
            newPassword: 'newPass456',
            confirmPassword: 'newPass456'
        };

        // PROF_07
        test('Should change password successfully', async () => {
            dbMock.query.mockResolvedValueOnce({ rows: [{ password_hash: 'hashed_old_pass' }] });
            bcryptMock.compare.mockResolvedValue(true);
            dbMock.query.mockResolvedValueOnce({ rowCount: 1 });

            const res = await request(app)
                .put('/api/profile/change-password')
                .send(passwordData);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Password changed successfully');
            expect(bcryptMock.hash).toHaveBeenCalledWith('newPass456', expect.anything());
        });

        // PROF_08
        test('Should fail (400) if current password incorrect', async () => {
            dbMock.query.mockResolvedValueOnce({ rows: [{ password_hash: 'hashed_old_pass' }] });
            bcryptMock.compare.mockResolvedValue(false);

            const res = await request(app)
                .put('/api/profile/change-password')
                .send(passwordData);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Incorrect current password');
            expect(dbMock.query).toHaveBeenCalledTimes(1); 
        });

        // PROF_09
        test('Should fail (400) if new passwords do not match', async () => {
            const res = await request(app)
                .put('/api/profile/change-password')
                .send({ ...passwordData, confirmPassword: 'wrongMismatch' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('do not match');
        });

        // PROF_10
        test('Should fail (400) if new password too short', async () => {
            const res = await request(app)
                .put('/api/profile/change-password')
                .send({ ...passwordData, newPassword: '123', confirmPassword: '123' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('at least 6 characters');
        });

        // PROF_11
        test('Should fail (400) if currentPassword is missing', async () => {
            const res = await request(app)
                .put('/api/profile/change-password')
                .send({ newPassword: 'ValidPass123', confirmPassword: 'ValidPass123' });
            expect(res.statusCode).toBe(400);
        });

        // PROF_12
        test('Should fail (404) if user not found (Edge case)', async () => {
            dbMock.query.mockResolvedValueOnce({ rows: [] });
            const res = await request(app).put('/api/profile/change-password').send(passwordData);
            expect(res.statusCode).toBe(404);
        });
    });
});