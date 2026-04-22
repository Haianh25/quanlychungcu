const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { query } = require('../db');

// @desc    Get all maintenance requests (Admin view)
// @route   GET /api/admin/maintenance
// @access  Private (Admin)
router.get('/', protect, isAdmin, async (req, res) => {
    try {
        const result = await query(
            `SELECT m.*, u.full_name, u.email, u.apartment_number, u.phone
             FROM maintenance_requests m
             JOIN users u ON m.user_id = u.id
             ORDER BY 
                CASE WHEN m.status = 'pending' THEN 1
                     WHEN m.status = 'in_progress' THEN 2
                     ELSE 3
                END,
                m.created_at DESC`
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching all maintenance requests:', error);
        res.status(500).json({ message: 'Server error fetching maintenance data.' });
    }
});

// @desc    Update maintenance request status
// @route   PUT /api/admin/maintenance/:id/status
// @access  Private (Admin)
router.put('/:id/status', protect, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value.' });
    }

    try {
        const result = await query(
            'UPDATE maintenance_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Maintenance request not found.' });
        }

        // Optional: Notify user about status change (could use socket.io or notifications table)
        // For now, we'll just return the updated record.

        try {
            const request = result.rows[0];
            const message = `Your maintenance request '${request.title}' status has been updated to '${status}'.`;
            await query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [request.user_id, message, '/maintenance']
            );
        } catch (notifyError) {
            console.error('Error sending notification:', notifyError);
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating maintenance status:', error);
        res.status(500).json({ message: 'Server error updating maintenance status.' });
    }
});

module.exports = router;
