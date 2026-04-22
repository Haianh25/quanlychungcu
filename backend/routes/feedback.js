const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Get all feedback (Admin only)
router.get('/admin/all', protect, isAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT f.*, u.full_name, u.email, u.apartment_number 
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            ORDER BY f.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update feedback status (Admin only)
router.patch('/admin/:id', protect, isAdmin, async (req, res) => {
    const { status } = req.body;
    try {
        const result = await db.query(
            'UPDATE feedback SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get my feedback (Resident)
router.get('/my', protect, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM feedback WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit feedback (Resident)
router.post('/', protect, async (req, res) => {
    const { title, description, category } = req.body;
    if (!title || !description || !category) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO feedback (user_id, title, description, category) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, title, description, category]
        );

        // Notify admins (optional - simplified for now)

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
