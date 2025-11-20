const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/vehicle-requests?status=pending
router.get('/vehicle-requests', protect, isAdmin, async (req, res) => {
    const { status, sortBy } = req.query; 
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid or missing status query parameter' });
    }

    let orderByClause = 'ORDER BY vr.requested_at DESC'; 
    if (sortBy === 'oldest') {
        orderByClause = 'ORDER BY vr.requested_at ASC'; 
    }

    try {
        const query = `SELECT vr.*, u.full_name AS resident_name
            FROM vehicle_card_requests vr JOIN users u ON vr.resident_id = u.id
            WHERE vr.status = $1
            ${orderByClause}`; 
        const { rows } = await db.query(query, [status]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching vehicle requests:', err);
        res.status(500).json({ message: 'Server error fetching requests' });
    }
});

// GET /api/admin/vehicle-cards
router.get('/vehicle-cards', protect, isAdmin, async (req, res) => {
    try {
        const query = `SELECT vc.*, u.full_name AS resident_name
            FROM vehicle_cards vc JOIN users u ON vc.resident_id = u.id
            ORDER BY vc.issued_at DESC`;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching all vehicle cards:', err);
        res.status(500).json({ message: 'Server error fetching cards' });
    }
});

// POST /api/admin/vehicle-requests/:id/approve
router.post('/vehicle-requests/:id/approve', protect, isAdmin, async (req, res) => {
    const requestId = parseInt(req.params.id);
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User information missing in request.' });
    }
    const adminUserId = req.user.id;
    const pool = db.getPool ? db.getPool() : db; 
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const requestRes = await client.query('SELECT * FROM vehicle_card_requests WHERE id = $1 AND status = $2', [requestId, 'pending']);
        if (requestRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Request not found or already processed' });
        }
        const request = requestRes.rows[0];

        let oneTimeFeeAmount = 0;
        if (request.request_type === 'register' || request.request_type === 'reissue') {
            let feeCode = '';
            switch (request.vehicle_type) {
                case 'car': feeCode = 'CAR_CARD_FEE'; break;
                case 'motorbike': feeCode = 'MOTORBIKE_CARD_FEE'; break;
                case 'bicycle': feeCode = 'BICYCLE_CARD_FEE'; break;
            }

            if (feeCode) {
                const feeRes = await client.query('SELECT price FROM fees WHERE fee_code = $1', [feeCode]);
                if (feeRes.rows.length > 0) {
                    oneTimeFeeAmount = parseFloat(feeRes.rows[0].price);
                } else {
                    console.warn(`[Admin Approve] Fee code '${feeCode}' not found in 'fees'. Setting fee to 0.`);
                }
            }
        }

        await client.query(
            `UPDATE vehicle_card_requests 
             SET status = $1, reviewed_by = $2, reviewed_at = NOW(), one_time_fee_amount = $3 
             WHERE id = $4`,
            ['approved', adminUserId, oneTimeFeeAmount, requestId]
        );

        let notificationMessage = ''; 
        const linkTo = '/services'; 

        // --- SỬA TIẾNG ANH: Thông báo Duyệt ---
        if (request.request_type === 'register') {
            await client.query(
                `INSERT INTO vehicle_cards (resident_id, card_user_name, vehicle_type, license_plate, brand, color, status, created_from_request_id, issued_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                [request.resident_id, request.full_name, request.vehicle_type, request.license_plate, request.brand, request.color, 'active', requestId]
            );
            notificationMessage = `Your vehicle card registration request (Plate: ${request.license_plate || 'N/A'}) has been approved.`;
        
        } else if (request.request_type === 'reissue' && request.target_card_id) {
            await client.query('UPDATE vehicle_cards SET status = $1 WHERE id = $2', ['lost', request.target_card_id]);
            await client.query(
                `INSERT INTO vehicle_cards (resident_id, card_user_name, vehicle_type, license_plate, brand, color, status, created_from_request_id, issued_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                [request.resident_id, request.full_name, request.vehicle_type, request.license_plate, request.brand, request.color, 'active', requestId]
            );
            notificationMessage = `Your vehicle card reissue request (Plate: ${request.license_plate || 'N/A'}) has been approved.`;

        } else if (request.request_type === 'cancel' && request.target_card_id) {
            await client.query('UPDATE vehicle_cards SET status = $1 WHERE id = $2', ['canceled', request.target_card_id]);
            notificationMessage = `Your vehicle card cancellation request (Plate: ${request.license_plate || 'N/A'}) has been approved.`;
        }

        if (notificationMessage) {
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [request.resident_id, notificationMessage, linkTo]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Request approved successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[APPROVE] ERROR during transaction:', err);
        res.status(500).json({ message: err.message || 'Server error approving request' });
    } finally {
        client.release();
    }
});

// POST /api/admin/vehicle-requests/:id/reject
router.post('/vehicle-requests/:id/reject', protect, isAdmin, async (req, res) => {
    const requestId = parseInt(req.params.id);
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User information missing in request.' });
    }
    const adminUserId = req.user.id;
    const { admin_notes } = req.body; 

    if (!admin_notes || admin_notes.trim() === '') {
        return res.status(400).json({ message: 'Reject reason is required' });
    }

    const pool = db.getPool ? db.getPool() : db; 
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const requestRes = await client.query('SELECT * FROM vehicle_card_requests WHERE id = $1 AND status = $2', [requestId, 'pending']);
        if (requestRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Request not found or already processed' });
        }
        const request = requestRes.rows[0];

        await client.query(
            'UPDATE vehicle_card_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW(), admin_notes = $3 WHERE id = $4 AND status = $5 RETURNING id',
            ['rejected', adminUserId, admin_notes, requestId, 'pending']
        );

        // --- SỬA TIẾNG ANH: Thông báo Từ chối ---
        const notificationMessage = `Your ${request.request_type} request for vehicle card (Plate: ${request.license_plate || 'N/A'}) has been rejected. Reason: ${admin_notes}`;
        const linkTo = '/services'; 

        await client.query(
            "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
            [request.resident_id, notificationMessage, linkTo]
        );
        
        await client.query('COMMIT');
        res.json({ message: 'Request rejected' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[REJECT] ERROR rejecting request ID: ${requestId}:`, err);
        res.status(500).json({ message: err.message || 'Server error rejecting request' });
    } finally {
        client.release();
    }
});

// GET /api/admin/vehicle-cards/:id
router.get('/vehicle-cards/:id', protect, isAdmin, async (req, res) => {
    const cardId = parseInt(req.params.id);
    try {
        const query = `SELECT vc.*, u.full_name AS resident_name
            FROM vehicle_cards vc JOIN users u ON vc.resident_id = u.id
            WHERE vc.id = $1`;
        const { rows } = await db.query(query, [cardId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Vehicle card not found.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`Error fetching vehicle card ${cardId}:`, err);
        res.status(500).json({ message: 'Server error fetching card details.' });
    }
});

// PUT /api/admin/vehicle-cards/:id
router.put('/vehicle-cards/:id', protect, isAdmin, async (req, res) => {
    const cardId = parseInt(req.params.id);
    const { card_user_name, license_plate, brand, color } = req.body;

    if (!card_user_name || !brand || !color) {
        return res.status(400).json({ message: 'Missing required fields (user name, brand, color).' });
    }

    try {
        const result = await db.query(
            `UPDATE vehicle_cards
             SET card_user_name = $1, license_plate = $2, brand = $3, color = $4
             WHERE id = $5
             RETURNING id`,
            [card_user_name, license_plate || null, brand, color, cardId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Card not found.' });
        }
        res.json({ message: `Card #${cardId} updated successfully.` });
    } catch (err) {
        console.error(`Error updating vehicle card ${cardId}:`, err);
        res.status(500).json({ message: 'Server error updating card.' });
    }
});

// PATCH /api/admin/vehicle-cards/:id/status
router.patch('/vehicle-cards/:id/status', protect, isAdmin, async (req, res) => {
    const cardId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Only "active" or "inactive" allowed.' });
    }

    try {
        const currentCard = await db.query('SELECT status FROM vehicle_cards WHERE id = $1', [cardId]);
        if (currentCard.rows.length === 0) {
            return res.status(404).json({ message: 'Card not found.' });
        }
        if (currentCard.rows[0].status === 'canceled' || currentCard.rows[0].status === 'lost') {
            return res.status(400).json({ message: `Cannot change status of a ${currentCard.rows[0].status} card.` });
        }

        const result = await db.query(
            'UPDATE vehicle_cards SET status = $1 WHERE id = $2 RETURNING id',
            [status, cardId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Card not found.' });
        }
        res.json({ message: `Card #${cardId} status updated to "${status}".` });
    } catch (err) {
        console.error(`Error updating status for vehicle card ${cardId}:`, err);
        res.status(500).json({ message: 'Server error updating card status.' });
    }
});

module.exports = router;