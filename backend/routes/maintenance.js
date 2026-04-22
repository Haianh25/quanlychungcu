const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { query } = require('../db');
const multer = require('multer');
const path = require('path');

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `maintenance-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer(storage);

// @desc    Get all maintenance requests for current user
// @route   GET /api/maintenance
// @access  Private (Resident)
router.get('/', protect, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM maintenance_requests WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching maintenance requests:', error);
        res.status(500).json({ message: 'Server error request maintenance data.' });
    }
});

// @desc    Create a new maintenance request
// @route   POST /api/maintenance
// @access  Private (Resident)
router.post('/', protect, upload.single('image'), async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required.' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const result = await query(
            'INSERT INTO maintenance_requests (user_id, title, description, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, title, description, imageUrl]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating maintenance request:', error);
        res.status(500).json({ message: 'Server error creating maintenance request.' });
    }
});

module.exports = router;
