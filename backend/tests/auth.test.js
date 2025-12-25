const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// --- 1. SETUP MOCKS ---
jest.mock('../db', () => ({
    query: jest.fn()
}));

jest.mock('bcryptjs', () => ({
    genSalt: jest.fn().mockResolvedValue('somesalt'),
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('fake_jwt_token'),
    verify: jest.fn()
}));

jest.mock('../utils/mailer', () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
}));

// --- 2. IMPORT MODULES ---
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const mailer = require('../utils/mailer');
const authRoutes = require('../routes/auth');

const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes Unit Tests', () => {

    // [FIX] Khai báo mockUserRow ở đây để dùng chung cho cả Login và Admin Login
    const mockUserRow = {
        id: 1,
        email: 'user@example.com',
        password_hash: 'hashed_password',
        role: 'resident',
        full_name: 'User One',
        is_active: true,
        is_verified: true,
        apartment_number: 'A101'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test_secret';
        jwt.sign.mockReturnValue('fake_jwt_token');
    });

    /**
     * TEST SUITE 1: REGISTER
     */
    describe('POST /api/auth/register', () => {
        const validUser = {
            fullName: 'Test User',
            email: 'test@example.com',
            password: 'Password@123',
            phone: '0987654321'
        };

        test('Should register successfully with valid data', async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] }) 
                .mockResolvedValueOnce({ rows: [{ email: 'test@example.com' }] });

            const res = await request(app).post('/api/auth/register').send(validUser);

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toContain('Registration successful');
            expect(mailer.sendVerificationEmail).toHaveBeenCalledTimes(1);
        });

        test('Should fail if email already exists', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'test@example.com' }] });

            const res = await request(app).post('/api/auth/register').send(validUser);

            expect(res.statusCode).toBe(409);
        });

        test('Should fail if password is weak', async () => {
            const weakUser = { ...validUser, password: '123' };
            const res = await request(app).post('/api/auth/register').send(weakUser);
            expect(res.statusCode).toBe(400);
        });

        test('Should fail if missing fields', async () => {
            const missingPhone = { ...validUser, phone: undefined };
            const res = await request(app).post('/api/auth/register').send(missingPhone);
            expect(res.statusCode).toBe(400);
        });
    });

    /**
     * TEST SUITE 2: LOGIN
     */
    describe('POST /api/auth/login', () => {
        const loginData = { email: 'user@example.com', password: 'Password@123' };

        test('Should login successfully with correct credentials', async () => {
            db.query.mockResolvedValueOnce({ rows: [mockUserRow] });
            bcrypt.compare.mockResolvedValueOnce(true);

            const res = await request(app).post('/api/auth/login').send(loginData);

            expect(res.statusCode).toBe(200);
            expect(res.body.token).toBe('fake_jwt_token');
            expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({ apartment_number: 'A101' }),
                expect.any(String),
                expect.any(Object)
            );
        });

        test('Should fail if account is disabled', async () => {
            const disabledUser = { ...mockUserRow, is_active: false };
            db.query.mockResolvedValueOnce({ rows: [disabledUser] });

            const res = await request(app).post('/api/auth/login').send(loginData);

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toContain('account has been disabled');
        });

        test('Should fail if password is incorrect', async () => {
            db.query.mockResolvedValueOnce({ rows: [mockUserRow] });
            bcrypt.compare.mockResolvedValueOnce(false);

            const res = await request(app).post('/api/auth/login').send(loginData);

            expect(res.statusCode).toBe(401);
        });
    });

    /**
     * TEST SUITE 3: ADMIN LOGIN
     */
    describe('POST /api/auth/admin/login', () => {
        const loginData = { email: 'admin@example.com', password: 'AdminPass@123' };

        test('Should login successfully if role is admin', async () => {
            // [FIXED] Bây giờ mockUserRow đã được định nghĩa
            const adminUser = { ...mockUserRow, id: 99, role: 'admin' };
            db.query.mockResolvedValueOnce({ rows: [adminUser] });
            bcrypt.compare.mockResolvedValueOnce(true);

            const res = await request(app).post('/api/auth/admin/login').send(loginData);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Admin login successful');
            expect(res.body.token).toBe('fake_jwt_token');
        });

        test('Should deny access if role is NOT admin', async () => {
            // [FIXED] mockUserRow đã được định nghĩa
            const regularUser = { ...mockUserRow, role: 'resident' };
            db.query.mockResolvedValueOnce({ rows: [regularUser] });

            const res = await request(app).post('/api/auth/admin/login').send(loginData);

            expect(res.statusCode).toBe(403);
        });
    });

    /**
     * TEST SUITE 4: VERIFY EMAIL
     */
    describe('GET /api/auth/verify-email/:token', () => {
        test('Should verify successfully', async () => {
            const mockUser = { id: 1, full_name: 'New User', email: 'new@test.com' };
            
            db.query
                .mockResolvedValueOnce({ rows: [mockUser] }) // 1. Select User
                .mockResolvedValueOnce({ rows: [] })         // 2. Update User
                .mockResolvedValueOnce({ rows: [{ id: 99 }] }) // 3. Select Admins
                .mockResolvedValueOnce({ rows: [] });        // 4. Insert Notification

            const res = await request(app).get('/api/auth/verify-email/valid-token');

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Account verification successful!');
        });
    });
});