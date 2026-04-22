const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// === ADMIN ROUTES ===

// Create a survey
router.post('/', protect, isAdmin, async (req, res) => {
    const { title, description, questions, is_active } = req.body;

    if (!title || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: 'Title and questions array are required.' });
    }

    try {
        const result = await db.query(
            'INSERT INTO surveys (title, description, questions, is_active, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, JSON.stringify(questions), is_active !== false, req.user.id] // Default active
        );
        const newSurvey = result.rows[0];

        // NOTIFY ALL RESIDENTS
        try {
            // 1. Get all resident IDs
            const residents = await db.query("SELECT id FROM users WHERE role = 'resident'");

            if (residents.rows.length > 0) {
                // 2. Prepare bulk insert for notifications
                const message = `New Survey: ${title}`;
                const link = `/surveys`; // Direct to surveys list (or specific id if we handled frontend routing better)

                // Construct values string manually for bulk insert: ($1, $2, $3, false, NOW()), ($4, $5, $6,...), ...
                // Actually, simple loop is safer for parameter binding size limits unless user count is huge.
                // For simplified approach: Loop and insert. For performance: use UNNEST or multi-row VALUES.
                // Let's use individual inserts for now to ensure reliability with small user base.

                for (const resident of residents.rows) {
                    // Save to DB
                    const notiRes = await db.query(
                        `INSERT INTO notifications (user_id, message, link_to, is_read, created_at) 
                         VALUES ($1, $2, $3, false, NOW()) 
                         RETURNING *`,
                        [resident.id, message, link]
                    );

                    // Send Real-time Socket
                    const receiverSocketId = global.userSocketMap ? global.userSocketMap[resident.id] : null;
                    if (receiverSocketId) {
                        global.io.to(receiverSocketId).emit('newNotification', notiRes.rows[0]);
                    }
                }
            }
        } catch (notiErr) {
            console.error('Failed to send survey notifications:', notiErr);
            // Don't fail the request just because notifications failed
        }

        res.status(201).json(newSurvey);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all surveys (Admin view - includes metrics maybe?)
router.get('/admin/all', protect, isAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT s.*, 
            (SELECT COUNT(*) FROM survey_responses sr WHERE sr.survey_id = s.id) as response_count
            FROM surveys s
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get survey results
router.get('/:id/results', protect, isAdmin, async (req, res) => {
    try {
        const surveyRes = await db.query('SELECT * FROM surveys WHERE id = $1', [req.params.id]);
        if (surveyRes.rows.length === 0) return res.status(404).json({ message: 'Survey not found' });

        const responsesRes = await db.query(`
            SELECT sr.*, u.full_name, u.email 
            FROM survey_responses sr
            LEFT JOIN users u ON sr.user_id = u.id
            WHERE sr.survey_id = $1
        `, [req.params.id]);

        res.json({
            survey: surveyRes.rows[0],
            responses: responsesRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete survey
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM surveys WHERE id = $1', [req.params.id]);
        res.json({ message: 'Survey deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle basic active status
router.patch('/:id/toggle', protect, isAdmin, async (req, res) => {
    try {
        const result = await db.query(
            'UPDATE surveys SET is_active = NOT is_active WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// === RESIDENT ROUTES ===

// List available surveys (Active only)
router.get('/', protect, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT s.*, 
            CASE WHEN sr.id IS NOT NULL THEN true ELSE false END as has_responded
            FROM surveys s
            LEFT JOIN survey_responses sr ON s.id = sr.survey_id AND sr.user_id = $1
            WHERE s.is_active = true
            ORDER BY s.created_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single survey details
router.get('/:id', protect, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM surveys WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Survey not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit response
router.post('/:id/respond', protect, async (req, res) => {
    const { answers } = req.body;
    if (!answers) return res.status(400).json({ message: 'Answers are required' });

    try {
        // Check if already responded
        const check = await db.query(
            'SELECT id FROM survey_responses WHERE survey_id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (check.rows.length > 0) {
            return res.status(400).json({ message: 'You have already responded to this survey.' });
        }

        await db.query(
            'INSERT INTO survey_responses (survey_id, user_id, answers) VALUES ($1, $2, $3)',
            [req.params.id, req.user.id, JSON.stringify(answers)]
        );
        res.json({ message: 'Response submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
