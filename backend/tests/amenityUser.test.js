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
        query: jest.fn(), // Mock hàm db.query trực tiếp
        getPool: jest.fn().mockReturnValue(mockPool),
        _mockClient: mockClient,
        _mockPool: mockPool
    };
});

// --- 2. MOCK AUTH MIDDLEWARE ---
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

const db = require('../db');

describe('Amenity User Routes Unit Tests', () => {
    let app;
    let dbMock;

    beforeEach(() => {
        // Reset Module để tránh cache
        jest.resetModules();
        jest.clearAllMocks();

        // Lấy lại mock mới nhất
        dbMock = require('../db');

        // Mặc định trả về rỗng an toàn cho db.query
        // Lưu ý: File này dùng db.query trực tiếp chứ không qua pool.connect()
        dbMock.query.mockResolvedValue({ rows: [], rowCount: 0 });

        // Setup App
        const amenityRoutes = require('../routes/amenityUser');
        app = express();
        app.use(bodyParser.json());
        app.use('/api/amenities', amenityRoutes);
    });

    /**
     * TEST SUITE 1: GET ROOMS
     */
    describe('GET /api/amenities/rooms', () => {
        test('Should return active rooms', async () => {
            const mockRooms = [{ id: 1, name: 'Gym', current_price: 50000 }];
            dbMock.query.mockResolvedValueOnce({ rows: mockRooms });

            const res = await request(app).get('/api/amenities/rooms');

            expect(res.statusCode).toBe(200);
            expect(res.body[0].name).toBe('Gym');
            expect(res.body[0].current_price).toBe(50000);
        });
    });

    /**
     * TEST SUITE 2: BOOK ROOM (Logic Phức tạp)
     */
    describe('POST /api/amenities/book', () => {
        // Tạo ngày tương lai (Ngày mai)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const bookData = {
            roomId: 1,
            date: dateStr,
            startTime: '08:00',
            endTime: '10:00'
        };

        test('Should book successfully if all checks pass', async () => {
            dbMock.query.mockImplementation(async (sql) => {
                // 1. Check Apartment (Có phòng)
                if (sql.includes('SELECT apartment_number')) {
                    return { rows: [{ apartment_number: 'A101' }] };
                }
                // 2. Check Active Booking (Chưa có booking nào đang active)
                if (sql.includes('booking_date >= CURRENT_DATE')) {
                    return { rows: [] };
                }
                // 3. Check Overlap (Không trùng giờ)
                if (sql.includes('time < end_time AND')) {
                    return { rows: [] };
                }
                // 4. Get Price (Lấy giá phòng)
                if (sql.includes('SELECT f.price')) {
                    return { rows: [{ price: 50000, room_name: 'Gym' }] };
                }
                // 5. Insert Booking
                if (sql.includes('INSERT INTO room_bookings')) {
                    return { rows: [{ id: 100 }] };
                }
                // 6. Notification
                if (sql.includes('INSERT INTO notifications')) return;

                return { rows: [] };
            });

            const res = await request(app).post('/api/amenities/book').send(bookData);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Booking successful');
        });

        test('Should fail (403) if user has no apartment', async () => {
            dbMock.query.mockImplementation(async (sql) => {
                if (sql.includes('SELECT apartment_number')) {
                    // Trả về null hoặc rỗng
                    return { rows: [{ apartment_number: null }] }; 
                }
                return { rows: [] };
            });

            const res = await request(app).post('/api/amenities/book').send(bookData);

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toContain('assigned an apartment');
        });

        test('Should fail (400) if booking date is in past', async () => {
            const pastData = { ...bookData, date: '2000-01-01' };
            // Mock apartment check pass để nó chạy tới đoạn check ngày
            dbMock.query.mockResolvedValueOnce({ rows: [{ apartment_number: 'A101' }] });

            const res = await request(app).post('/api/amenities/book').send(pastData);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('future');
        });

        test('Should fail (400) if time slot occupied (Overlap)', async () => {
            dbMock.query.mockImplementation(async (sql) => {
                if (sql.includes('SELECT apartment_number')) return { rows: [{ apartment_number: 'A101' }] };
                if (sql.includes('booking_date >= CURRENT_DATE')) return { rows: [] };
                
                // Giả lập tìm thấy 1 booking trùng giờ
                if (sql.includes('time < end_time AND')) {
                    return { rows: [{ id: 99 }] };
                }
                return { rows: [] };
            });

            const res = await request(app).post('/api/amenities/book').send(bookData);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Time slot occupied');
        });
    });

    /**
     * TEST SUITE 3: CANCEL BOOKING
     */
    describe('POST /api/amenities/cancel/:id', () => {
        test('Should cancel successfully if booking is in future', async () => {
            // Ngày mai
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);

            dbMock.query.mockImplementation(async (sql) => {
                // 1. Tìm booking
                if (sql.includes('SELECT * FROM room_bookings')) {
                    return { 
                        rows: [{ id: 1, resident_id: 10, booking_date: futureDate }] 
                    };
                }
                // 2. Update Cancelled
                if (sql.includes('UPDATE room_bookings')) {
                    return { rows: [{ id: 1, room_id: 101, booking_date: futureDate }] };
                }
                // 3. Get Room Name
                if (sql.includes('SELECT name FROM community_rooms')) {
                    return { rows: [{ name: 'BBQ Area' }] };
                }
                // 4. Get Admins
                if (sql.includes('SELECT id FROM users')) {
                    return { rows: [{ id: 99 }] };
                }
                return { rows: [] };
            });

            const res = await request(app).post('/api/amenities/cancel/1');

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('cancelled successfully');
        });

        test('Should fail (400) if cancelling past booking', async () => {
            // Ngày quá khứ
            const pastDate = '2000-01-01';

            dbMock.query.mockImplementation(async (sql) => {
                if (sql.includes('SELECT * FROM room_bookings')) {
                    return { 
                        rows: [{ id: 1, resident_id: 10, booking_date: pastDate }] 
                    };
                }
                return { rows: [] };
            });

            const res = await request(app).post('/api/amenities/cancel/1');

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Cannot cancel past bookings');
        });

        test('Should fail (404) if booking not found', async () => {
            // Trả về rỗng
            dbMock.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app).post('/api/amenities/cancel/999');

            expect(res.statusCode).toBe(404);
        });
    });
});