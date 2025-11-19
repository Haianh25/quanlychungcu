// backend/routes/amenityUser.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

// 1. Lấy danh sách phòng (User xem) - Kèm giá từ bảng FEES
router.get('/rooms', protect, async (req, res) => {
    try {
        // Chỉ lấy phòng đang hoạt động (active)
        const query = `
            SELECT r.*, f.price as current_price
            FROM community_rooms r
            LEFT JOIN fees f ON r.fee_code = f.fee_code
            WHERE r.status = 'active'
            ORDER BY r.id ASC
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to load room list.' });
    }
});

// 2. Lấy lịch sử đặt của tôi
router.get('/my-bookings', protect, async (req, res) => {
    const residentId = req.user.user ? req.user.user.id : req.user.id;
    try {
        const query = `
            SELECT b.*, r.name as room_name, r.image_url 
            FROM room_bookings b
            JOIN community_rooms r ON b.room_id = r.id
            WHERE b.resident_id = $1
            ORDER BY b.booking_date DESC, b.start_time DESC
        `;
        const { rows } = await db.query(query, [residentId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to load booking history.' });
    }
});

// 3. BOOK ROOM
router.post('/book', protect, async (req, res) => {
    const residentId = req.user.user ? req.user.user.id : req.user.id;
    const { roomId, date, startTime, endTime } = req.body;

    try {
        // A. Validate ngày (Phải đặt trước ít nhất 1 ngày)
        const bookingDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (bookingDate <= today) {
            return res.status(400).json({ message: 'You have to book at least 1 day in advance.' });
        }

        // B. Validate giới hạn: Mỗi resident chỉ được giữ 1 lịch active (status = confirmed và ngày chưa qua)
        // (Cho phép đặt nhiều lịch nếu lịch cũ đã hoàn thành/hủy, nhưng ở đây logic đơn giản là 1 lịch confirmed trong tương lai)
        const activeBooking = await db.query(
            `SELECT id FROM room_bookings 
             WHERE resident_id = $1 AND booking_date >= CURRENT_DATE AND status = 'confirmed'`,
            [residentId]
        );
        if (activeBooking.rows.length > 0) {
            return res.status(400).json({ message: 'You already have an active booking. Each resident can only hold one booking.' });
        }

        // C. Check for overlapping bookings with others
        // Logic: (StartA < EndB) and (EndA > StartB)
        const overlap = await db.query(
            `SELECT id FROM room_bookings 
             WHERE room_id = $1 AND booking_date = $2 AND status = 'confirmed'
             AND ($3::time < end_time AND $4::time > start_time)`,
            [roomId, date, startTime, endTime]
        );

        if (overlap.rows.length > 0) {
            return res.status(400).json({ message: 'This time slot is already booked. Please choose a different time.' });
        }

        // D. Get price from Fees table through Rooms table
        const priceQuery = `
            SELECT f.price 
            FROM community_rooms r 
            JOIN fees f ON r.fee_code = f.fee_code 
            WHERE r.id = $1
        `;
        const priceRes = await db.query(priceQuery, [roomId]);
        const pricePerHour = parseFloat(priceRes.rows[0]?.price || 0);

        // E. Tính tổng tiền
        const start = parseInt(startTime.split(':')[0]);
        const end = parseInt(endTime.split(':')[0]);
        const duration = end - start;
        if (duration <= 0) return res.status(400).json({ message: 'Invalid time range.' });
        
        const totalPrice = duration * pricePerHour;

        // F. Save to DB
        await db.query(
            `INSERT INTO room_bookings (resident_id, room_id, booking_date, start_time, end_time, total_price)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [residentId, roomId, date, startTime, endTime, totalPrice]
        );

        res.json({ message: 'Booking successful! The fee has been recorded.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error when booking room.' });
    }
});

// 4. Cancel booking (User cancels)
router.post('/cancel/:id', protect, async (req, res) => {
    const residentId = req.user.user ? req.user.user.id : req.user.id;
    try {
        // Chỉ cho hủy lịch của chính mình
        const result = await db.query(
            "UPDATE room_bookings SET status = 'cancelled' WHERE id = $1 AND resident_id = $2 RETURNING id",
            [req.params.id, residentId]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Booking not found or you do not have permission to cancel.' });
        }

        res.json({ message: 'Booking has been cancelled.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;