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

        // Giả lập process.env.JWT_SECRET
        process.env.JWT_SECRET = 'testsecret';

        // Reset req, res, next trước mỗi bài test
        req = {
            headers: {},
            user: null
        };
        
        // Mock res.status().json() để có thể chain được
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });

    /**
     * TEST SUITE 1: protect Middleware
     * Kiểm tra logic xác thực token và user
     */
    describe('protect', () => {
        test('Should return 401 if no token provided', async () => {
            req.headers.authorization = undefined; // Không có header

            await authMiddleware.protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token.' });
            expect(next).not.toHaveBeenCalled();
        });

        test('Should return 401 if token is invalid (jwt verify fails)', async () => {
            req.headers.authorization = 'Bearer invalid_token';
            // Mock jwt verify ném lỗi
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await authMiddleware.protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed.' });
        });

        test('Should return 401 if user not found in DB', async () => {
            req.headers.authorization = 'Bearer valid_token';
            // Mock verify thành công
            jwt.verify.mockReturnValue({ id: 1, role: 'resident' });
            // Mock DB trả về rỗng
            db.query.mockResolvedValue({ rows: [] });

            await authMiddleware.protect(req, res, next);

            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), [1]);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
        });

        test('Should return 403 if user account is disabled (is_active = false)', async () => {
            req.headers.authorization = 'Bearer valid_token';
            jwt.verify.mockReturnValue({ id: 1, role: 'resident' });
            
            // Mock DB trả về user bị khóa
            db.query.mockResolvedValue({ 
                rows: [{ id: 1, role: 'resident', is_active: false }] 
            });

            await authMiddleware.protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: expect.stringContaining('account has been disabled') 
            }));
            expect(next).not.toHaveBeenCalled();
        });

        test('Should return 401 if role has changed (Token role !== DB role)', async () => {
            req.headers.authorization = 'Bearer valid_token';
            // Token cũ lưu role là 'resident'
            jwt.verify.mockReturnValue({ id: 1, role: 'resident' });
            
            // Nhưng trong DB admin đã sửa thành 'admin' (hoặc ngược lại)
            db.query.mockResolvedValue({ 
                rows: [{ id: 1, role: 'admin', is_active: true }] 
            });

            await authMiddleware.protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: expect.stringContaining('Role updated') 
            }));
        });

        test('Should call next() and set req.user if everything is valid', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const mockUser = { id: 1, full_name: 'Test User', email: 'test@test.com', role: 'resident', is_active: true };
            
            jwt.verify.mockReturnValue({ id: 1, role: 'resident' });
            db.query.mockResolvedValue({ rows: [mockUser] });

            await authMiddleware.protect(req, res, next);

            expect(req.user).toEqual(mockUser); // Kiểm tra req.user đã được gán
            expect(next).toHaveBeenCalled(); // Kiểm tra next() đã được gọi
            expect(res.status).not.toHaveBeenCalled(); // Không được trả lỗi
        });
    });

    /**
     * TEST SUITE 2: isAdmin Middleware
     * Kiểm tra phân quyền Admin
     */
    describe('isAdmin', () => {
        test('Should call next() if user is admin', () => {
            req.user = { role: 'admin' };

            authMiddleware.isAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        test('Should return 403 if user is NOT admin', () => {
            req.user = { role: 'resident' };

            authMiddleware.isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Admin privileges required.' });
            expect(next).not.toHaveBeenCalled();
        });

        test('Should return 403 if req.user is missing (Not logged in logic leak check)', () => {
            req.user = undefined;

            authMiddleware.isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });
});