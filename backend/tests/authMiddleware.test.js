const authMiddleware = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const db = require('../db');

// --- MOCKING DEPENDENCIES ---
jest.mock('jsonwebtoken');
jest.mock('../db');

describe('Auth Middleware Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'testsecret';

        req = {
            headers: {},
            user: null
        };
        
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });

    /**
     * TEST SUITE 1: protect Middleware (MID_01 – MID_03)
     */
    describe('protect', () => {
        // MID_01
        test('Should return 401 if no token provided', async () => {
            req.headers.authorization = undefined;

            await authMiddleware.protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('no token') }));
            expect(next).not.toHaveBeenCalled();
        });

        // MID_02
        test('Should return 401 if token is invalid (jwt verify fails)', async () => {
            req.headers.authorization = 'Bearer invalid_token';
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await authMiddleware.protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('token failed') }));
        });

        // MID_03
        test('Should return 401 if token is expired', async () => {
            req.headers.authorization = 'Bearer expired_token';
            
            jwt.verify.mockImplementation(() => {
                const err = new Error('jwt expired');
                err.name = 'TokenExpiredError';
                throw err;
            });

            await authMiddleware.protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    /**
     * TEST SUITE 2: isAdmin Middleware (MID_04 – MID_05)
     */
    describe('isAdmin', () => {
        // MID_05
        test('Should call next() if user is admin', () => {
            req.user = { role: 'admin' };

            authMiddleware.isAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        // MID_04
        test('Should return 403 if user is NOT admin', () => {
            req.user = { role: 'resident' };

            authMiddleware.isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Admin') }));
            expect(next).not.toHaveBeenCalled();
        });
    });
});