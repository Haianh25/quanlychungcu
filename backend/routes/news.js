// backend/routes/news.js
const express = require('express');
const db = require('../db');
const router = express.Router();
const upload = require('../utils/upload'); 
const { protect, isAdmin } = require('../middleware/authMiddleware');


router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT n.id, n.title, n.content, n.image_url, n.created_at, u.full_name AS author_name
             FROM news n
             LEFT JOIN users u ON n.author_id = u.id
             WHERE n.status = 'active'
             ORDER BY n.created_at DESC`
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching public news:', error);
        res.status(500).json({ message: 'Server error fetching news.' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT n.*, u.full_name AS author_name FROM news n LEFT JOIN users u ON n.author_id = u.id WHERE n.id = $1 AND n.status = $2', [id, 'active']);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'News not found.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching public news item:', error);
        res.status(500).json({ message: 'Server error fetching news item.' });
    }
});


router.post('/upload-image', protect, isAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = `/uploads/proofs/${req.file.filename}`; 
    res.json({ imageUrl });
});

module.exports = router;