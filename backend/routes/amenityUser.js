const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

router.get('/rooms', protect, async (req, res) => {
    try {
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
        res.status(500).json({ message: 'Failed to load rooms.' });
    }
});

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
        res.status(500).json({ message: 'Failed to load bookings.' });
    }
});

router.post('/book', protect, async (req, res) => {
    const residentId = req.user.user ? req.user.user.id : req.user.id;
    const { roomId, date, startTime, endTime } = req.body;

    try {
        const userCheck = await db.query('SELECT apartment_number FROM users WHERE id = $1', [residentId]);
        if (!userCheck.rows[0]?.apartment_number) {
            return res.status(403).json({ message: 'You have not been assigned an apartment yet. Please contact Admin.' });
        }

        const bookingDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (bookingDate <= today) {
            return res.status(400).json({ message: 'Booking date must be in the future.' });
        }

        const activeBooking = await db.query(
            `SELECT id FROM room_bookings 
             WHERE resident_id = $1 AND booking_date >= CURRENT_DATE AND status = 'confirmed'`,
            [residentId]
        );
        if (activeBooking.rows.length > 0) {
            return res.status(400).json({ message: 'You already have an active booking.' });
        }

        const overlap = await db.query(
            `SELECT id FROM room_bookings 
             WHERE room_id = $1 AND booking_date = $2 AND status = 'confirmed'
             AND ($3::time < end_time AND $4::time > start_time)`,
            [roomId, date, startTime, endTime]
        );

        if (overlap.rows.length > 0) {
            return res.status(400).json({ message: 'Time slot occupied.' });
        }

        const priceQuery = `
            SELECT f.price, r.name AS room_name
            FROM community_rooms r 
            JOIN fees f ON r.fee_code = f.fee_code 
            WHERE r.id = $1
        `;
        const priceRes = await db.query(priceQuery, [roomId]);
        const pricePerHour = parseFloat(priceRes.rows[0]?.price || 0);
        const roomName = priceRes.rows[0]?.room_name || 'Amenity Room';

        const start = parseInt(startTime.split(':')[0]);
        const end = parseInt(endTime.split(':')[0]);
        const duration = end - start;
        if (duration <= 0) return res.status(400).json({ message: 'Invalid duration.' });
        
        const totalPrice = duration * pricePerHour;

        await db.query(
            `INSERT INTO room_bookings (resident_id, room_id, booking_date, start_time, end_time, total_price)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [residentId, roomId, date, startTime, endTime, totalPrice]
        );

        const dateStr = new Date(date).toLocaleDateString('en-GB');
        const timeStr = `${startTime.slice(0,5)} - ${endTime.slice(0,5)}`;
        const successMessage = `Booking Confirmed: You have successfully booked ${roomName} on ${dateStr} (${timeStr}).`;
        
        await db.query(
            "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
            [residentId, successMessage, '/services/amenity']
        );

        res.json({ message: 'Booking successful!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.post('/cancel/:id', protect, async (req, res) => {
    const residentId = req.user.user ? req.user.user.id : req.user.id;
    const residentName = req.user.user ? req.user.user.full_name : req.user.full_name;

    try {
        
        const checkRes = await db.query(
            `SELECT * FROM room_bookings 
             WHERE id = $1 AND resident_id = $2`,
            [req.params.id, residentId]
        );

        if (checkRes.rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        const bookingData = checkRes.rows[0];
        const bookingDate = new Date(bookingData.booking_date);
        const now = new Date();
        now.setHours(0, 0, 0, 0); 

        if (bookingDate < now) {
            return res.status(400).json({ message: 'Cannot cancel past bookings.' });
        }

       
        const result = await db.query(
            `UPDATE room_bookings 
             SET status = 'cancelled' 
             WHERE id = $1 
             RETURNING id, room_id, booking_date`,
            [req.params.id]
        );
        
        const booking = result.rows[0];
        const roomRes = await db.query("SELECT name FROM community_rooms WHERE id = $1", [booking.room_id]);
        const roomName = roomRes.rows[0]?.name || 'Amenity Room';

        try {
            const admins = await db.query("SELECT id FROM users WHERE role = 'admin'");
            const dateStr = new Date(booking.booking_date).toLocaleDateString('en-GB');
            const message = `Resident ${residentName} has CANCELLED their booking for ${roomName} on ${dateStr}.`;
            const linkTo = '/admin/amenity-management';

            for (const admin of admins.rows) {
                await db.query(
                    "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                    [admin.id, message, linkTo]
                );
            }
        } catch (notifyError) {
            console.error('Error notifying admin:', notifyError);
        }

        res.json({ message: 'Booking cancelled successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;