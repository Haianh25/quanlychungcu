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
        req.user = { id: 999, role: 'admin' };
        next();
    },
    isAdmin: (req, res, next) => next()
}));

describe('Amenity Admin Routes Unit Tests', () => {
    let app;
    let dbMock; // Biến giữ instance DB mới nhất

    beforeEach(() => {
        // 1. Reset modules để xóa cache
        jest.resetModules();
        jest.clearAllMocks();

        // 2. [QUAN TRỌNG] Require lại DB để lấy instance mới khớp với Route
        dbMock = require('../db');

        // 3. Cài đặt mặc định an toàn
        dbMock.query.mockResolvedValue({ rows: [], rowCount: 0 });

        // 4. Require Route và Setup App
        const amenityAdminRoutes = require('../routes/amenityAdmin');
        app = express();
        app.use(bodyParser.json());
        app.use('/api/admin/amenities', amenityAdminRoutes);
    });

    /**
     * TEST SUITE 1: GET ROOMS
     */
    describe('GET /api/admin/amenities/rooms', () => {
        test('Should return all rooms', async () => {
            const mockRooms = [{ id: 1, name: 'Gym', current_price: 100000 }];
            dbMock.query.mockResolvedValueOnce({ rows: mockRooms });

            const res = await request(app).get('/api/admin/amenities/rooms');

            expect(res.statusCode).toBe(200);
            expect(res.body[0].name).toBe('Gym');
        });

        test('Should handle error', async () => {
            dbMock.query.mockRejectedValueOnce(new Error('DB Error'));
            const res = await request(app).get('/api/admin/amenities/rooms');
            expect(res.statusCode).toBe(500);
        });
    });

    /**
     * TEST SUITE 2: UPDATE ROOM
     */
    describe('PUT /api/admin/amenities/rooms/:id', () => {
        const updateData = {
            name: 'New Gym',
            description: 'Updated',
            image_url: 'img.jpg',
            status: 'maintenance'
        };

        test('Should update room successfully', async () => {
            dbMock.query.mockResolvedValueOnce({ rowCount: 1 });

            const res = await request(app).put('/api/admin/amenities/rooms/1').send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('updated successfully');
            expect(dbMock.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE community_rooms'), expect.any(Array));
        });
    });

    /**
     * TEST SUITE 3: GET BOOKINGS
     */
    describe('GET /api/admin/amenities/bookings', () => {
        test('Should return all bookings', async () => {
            const mockBookings = [{ id: 1, room_name: 'Gym', resident_name: 'User A' }];
            dbMock.query.mockResolvedValueOnce({ rows: mockBookings });

            const res = await request(app).get('/api/admin/amenities/bookings');

            expect(res.statusCode).toBe(200);
            expect(res.body[0].resident_name).toBe('User A');
        });
    });

    /**
     * TEST SUITE 4: CANCEL BOOKING (Admin Action)
     */
    describe('POST /api/admin/amenities/bookings/:id/cancel', () => {
        const cancelData = { reason: 'Room under maintenance' };

        test('Should cancel booking and notify user', async () => {
            dbMock.query.mockImplementation(async (sql) => {
                // 1. Update Booking & Return Info
                if (sql.includes('UPDATE room_bookings')) {
                    return { 
                        rows: [{ resident_id: 10, room_id: 1, booking_date: '2025-12-25' }] 
                    };
                }
                // 2. Get Room Name
                if (sql.includes('SELECT name FROM community_rooms')) {
                    return { rows: [{ name: 'Gym' }] };
                }
                // 3. Insert Notification
                if (sql.includes('INSERT INTO notifications')) return { rows: [] };
                
                return { rows: [] };
            });

            const res = await request(app)
                .post('/api/admin/amenities/bookings/1/cancel')
                .send(cancelData);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('cancelled and user notified');
            
            // Kiểm tra thông báo
            const notifyCall = dbMock.query.mock.calls.find(call => call[0].includes('INSERT INTO notifications'));
            expect(notifyCall[1][1]).toContain('Reason: Room under maintenance');
        });

        test('Should fail (400) if reason is missing', async () => {
            const res = await request(app).post('/api/admin/amenities/bookings/1/cancel').send({});
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('reason is required');
        });

        test('Should fail (404) if booking not found', async () => {
            dbMock.query.mockResolvedValueOnce({ rows: [] }); // Update trả về rỗng

            const res = await request(app)
                .post('/api/admin/amenities/bookings/1/cancel')
                .send(cancelData);

            expect(res.statusCode).toBe(404);
        });
    });
});