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
     * TEST SUITE 1: REGISTER (AUTH_01 – AUTH_06)
     */
    describe('POST /api/auth/register', () => {
        const validUser = {
            fullName: 'Test User',
            email: 'test@example.com',
            password: 'Password@123',
            phone: '0987654321'
        };

        // AUTH_01
        test('Should register successfully with valid data', async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] }) 
                .mockResolvedValueOnce({ rows: [{ email: 'test@example.com' }] });

            const res = await request(app).post('/api/auth/register').send(validUser);

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toContain('Registration successful');
            expect(mailer.sendVerificationEmail).toHaveBeenCalledTimes(1);
        });

        // AUTH_02
        test('Should fail if email already exists', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'test@example.com' }] });

            const res = await request(app).post('/api/auth/register').send(validUser);

            expect(res.statusCode).toBe(409);
        });

        // AUTH_03
        test('Should fail if missing fields (Email)', async () => {
            const res = await request(app).post('/api/auth/register').send({ ...validUser, email: undefined });
            expect(res.statusCode).toBe(400);
        });

        // AUTH_04
        test('Should fail if missing fields (Password)', async () => {
            const res = await request(app).post('/api/auth/register').send({ ...validUser, password: undefined });
            expect(res.statusCode).toBe(400);
        });

        // AUTH_05
        test('Should fail if password is weak', async () => {
            const weakUser = { ...validUser, password: '123' };
            const res = await request(app).post('/api/auth/register').send(weakUser);
            expect(res.statusCode).toBe(400);
        });

        // AUTH_06
        test('Should fail if missing fields (FullName)', async () => {
            const res = await request(app).post('/api/auth/register').send({ ...validUser, fullName: undefined });
            expect(res.statusCode).toBe(400);
        });
    });

    /**
     * TEST SUITE 2: LOGIN (AUTH_07 – AUTH_10)
     */
    describe('POST /api/auth/login', () => {
        const loginData = { email: 'user@example.com', password: 'Password@123' };

        // AUTH_07
        test('Should login successfully with correct credentials', async () => {
            db.query.mockResolvedValueOnce({ rows: [mockUserRow] });
            bcrypt.compare.mockResolvedValueOnce(true);

            const res = await request(app).post('/api/auth/login').send(loginData);

            expect(res.statusCode).toBe(200);
            expect(res.body.token).toBe('fake_jwt_token');
        });

        // AUTH_08
        test('Should fail if password is incorrect', async () => {
            db.query.mockResolvedValueOnce({ rows: [mockUserRow] });
            bcrypt.compare.mockResolvedValueOnce(false);

            const res = await request(app).post('/api/auth/login').send(loginData);

            expect(res.statusCode).toBe(401);
        });

        // AUTH_09
        test('Should fail if user not found', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });
            const res = await request(app).post('/api/auth/login').send(loginData);
            expect(res.statusCode).toBe(401);
        });

        // AUTH_10
        test('Should fail if missing fields', async () => {
            const res = await request(app).post('/api/auth/login').send({});
            expect(res.statusCode).toBe(400);
        });
    });

    /**
     * TEST SUITE 3: FORGOT PASSWORD (AUTH_11 – AUTH_13)
     */
    describe('POST /api/auth/forgot-password', () => {
        // AUTH_11
        test('Should send reset email if user exists', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'test@example.com' }] });
            db.query.mockResolvedValueOnce({ rowCount: 1 });
            
            const res = await request(app).post('/api/auth/forgot-password').send({ email: 'test@example.com' });
            
            expect(res.statusCode).toBe(200);
            expect(mailer.sendPasswordResetEmail).toHaveBeenCalled();
        });

        // AUTH_12
        test('Should return 200/404 if email not found', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });
            const res = await request(app).post('/api/auth/forgot-password').send({ email: 'wrong@example.com' });
            expect([200, 404]).toContain(res.statusCode);
        });

        // AUTH_13
        test('Should return 500 if mailer fails', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'test@example.com' }] });
            mailer.sendPasswordResetEmail.mockRejectedValueOnce(new Error('SMTP error'));
            
            const res = await request(app).post('/api/auth/forgot-password').send({ email: 'test@example.com' });
            expect(res.statusCode).toBe(500);
        });
    });
});