const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/rooms', protect, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT r.*, f.price as current_price
            FROM community_rooms r
            LEFT JOIN fees f ON r.fee_code = f.fee_code
            ORDER BY r.id ASC
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load room list.' });
    }
});

router.put('/rooms/:id', protect, isAdmin, async (req, res) => {
    const { name, description, image_url, status } = req.body;
    const { id } = req.params;
    try {
        await db.query(
            `UPDATE community_rooms 
             SET name=$1, description=$2, image_url=$3, status=$4
             WHERE id=$5`,
            [name, description, image_url, status, id]
        );
        res.json({ message: 'Room updated successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update room.' });
    }
});

router.get('/bookings', protect, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT b.*, r.name as room_name, u.full_name as resident_name, u.email
            FROM room_bookings b
            JOIN community_rooms r ON b.room_id = r.id
            JOIN users u ON b.resident_id = u.id
            ORDER BY b.booking_date DESC, b.start_time DESC
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load bookings.' });
    }
});

router.post('/bookings/:id/cancel', protect, isAdmin, async (req, res) => {
    const { reason } = req.body; // Nhận lý do từ client

    if (!reason) {
        return res.status(400).json({ message: 'Cancellation reason is required.' });
    }

    try {
        const result = await db.query(
            "UPDATE room_bookings SET status = 'cancelled' WHERE id = $1 RETURNING resident_id, room_id, booking_date", 
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        const booking = result.rows[0];

        const roomRes = await db.query("SELECT name FROM community_rooms WHERE id = $1", [booking.room_id]);
        const roomName = roomRes.rows[0]?.name || 'Amenity Room';

        try {
            const dateStr = new Date(booking.booking_date).toLocaleDateString('en-GB');
            const message = `Your booking for ${roomName} on ${dateStr} has been CANCELLED by Admin. Reason: ${reason}`;
            const linkTo = '/services/amenity';

            await db.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [booking.resident_id, message, linkTo]
            );
        } catch (notifyError) {
            console.error('Error notifying user:', notifyError);
        }
        // ------------------------------

        res.json({ message: 'Booking cancelled and user notified.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to cancel booking.' });
    }
});

router.get('/init-database', async (req, res) => {
    res.send("DB Setup endpoint.");
});

module.exports = router;