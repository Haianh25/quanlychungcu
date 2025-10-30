// backend/routes/vehicleAdmin.js
const express = require('express');
const router = express.Router();
const db = require('../db');
// Import both middlewares
const { protect, isAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/vehicle-requests?status=pending
router.get('/vehicle-requests', protect, isAdmin, async (req, res) => {
    const { status } = req.query;
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid or missing status query parameter' });
    }
    try {
        const query = `
            SELECT vr.*, u.full_name AS resident_name
            FROM vehicle_card_requests vr JOIN users u ON vr.resident_id = u.id
            WHERE vr.status = $1 ORDER BY vr.requested_at ASC
        `;
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
        const query = `
            SELECT vc.*, u.full_name AS resident_name
            FROM vehicle_cards vc JOIN users u ON vc.resident_id = u.id
            ORDER BY vc.issued_at DESC
        `;
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
    // Ensure req.user exists and has an id before proceeding
    if (!req.user || !req.user.id) {
        console.error('[APPROVE] Error: req.user or req.user.id is missing. Check protect middleware.');
        return res.status(401).json({ message: 'User information missing in request.' });
    }
    const adminUserId = req.user.id; // UUID from protect middleware

    console.log(`[APPROVE] Received request for ID: ${requestId} by Admin ID: ${adminUserId}`); // Log entry
    const pool = db.getPool();
    const client = await pool.connect();
    console.log('[APPROVE] DB client connected.');

    try {
        console.log('[APPROVE] Starting transaction...');
        await client.query('BEGIN');
        console.log('[APPROVE] Transaction started.');

        // 1. Fetch request
        console.log(`[APPROVE] Fetching request ID: ${requestId}`);
        const requestRes = await client.query('SELECT * FROM vehicle_card_requests WHERE id = $1 AND status = $2', [requestId, 'pending']);
        if (requestRes.rows.length === 0) {
            console.log(`[APPROVE] Request ID: ${requestId} not found or not pending. Rolling back.`);
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Yêu cầu không tồn tại hoặc đã được xử lý' });
        }
        const request = requestRes.rows[0];
        console.log(`[APPROVE] Found request:`, request);

        // 2. Update request status
        console.log(`[APPROVE] Updating request status to 'approved' for ID: ${requestId}`);
        await client.query(
            'UPDATE vehicle_card_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3',
            ['approved', adminUserId, requestId] // adminUserId is UUID
        );
        console.log(`[APPROVE] Request status updated.`);

        // 3. Perform corresponding action
        console.log(`[APPROVE] Processing action for type: ${request.request_type}`);
        if (request.request_type === 'register') {
            console.log('[APPROVE] Inserting new card into vehicle_cards...');
            await client.query(
                `INSERT INTO vehicle_cards (resident_id, card_user_name, vehicle_type, license_plate, brand, color, status, created_from_request_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [request.resident_id, request.full_name, request.vehicle_type, request.license_plate, request.brand, request.color, 'active', requestId]
            );
            console.log('[APPROVE] New card inserted.');
        } else if (request.request_type === 'reissue' && request.target_card_id) {
            console.log(`[APPROVE] Updating old card status to 'lost' for ID: ${request.target_card_id}`);
            await client.query('UPDATE vehicle_cards SET status = $1 WHERE id = $2', ['lost', request.target_card_id]);
            console.log(`[APPROVE] Old card status updated.`);
            // Potentially insert a new card here based on request details if needed
        } else if (request.request_type === 'cancel' && request.target_card_id) {
            console.log(`[APPROVE] Updating old card status to 'canceled' for ID: ${request.target_card_id}`);
            await client.query('UPDATE vehicle_cards SET status = $1 WHERE id = $2', ['canceled', request.target_card_id]);
            console.log(`[APPROVE] Old card status updated.`);
        }
        console.log('[APPROVE] Action processed.');

        console.log('[APPROVE] Committing transaction...');
        await client.query('COMMIT');
        console.log('[APPROVE] Transaction committed.');
        res.json({ message: 'Request approved successfully' }); // Send success only after COMMIT

    } catch (err) {
        console.error('[APPROVE] ERROR during transaction:', err); // Log the specific error
        console.log('[APPROVE] Rolling back transaction...');
        // Ensure rollback happens even if the connection is lost mid-transaction
        try {
            await client.query('ROLLBACK');
            console.log('[APPROVE] Transaction rolled back due to error.');
        } catch (rollbackErr) {
            console.error('[APPROVE] Error during ROLLBACK:', rollbackErr);
        }
        res.status(500).json({ message: err.message || 'Server error approving request' });
    } finally {
        console.log('[APPROVE] Releasing DB client.');
        client.release();
        console.log('[APPROVE] DB client released.');
    }
});

// POST /api/admin/vehicle-requests/:id/reject
router.post('/vehicle-requests/:id/reject', protect, isAdmin, async (req, res) => {
    const requestId = parseInt(req.params.id);
     // Ensure req.user exists and has an id before proceeding
    if (!req.user || !req.user.id) {
        console.error('[REJECT] Error: req.user or req.user.id is missing. Check protect middleware.');
        return res.status(401).json({ message: 'User information missing in request.' });
    }
    const adminUserId = req.user.id; // UUID
    const { admin_notes } = req.body;
    console.log(`[REJECT] Received request for ID: ${requestId} by Admin ID: ${adminUserId} with reason: ${admin_notes}`); // Log entry

    if (!admin_notes || admin_notes.trim() === '') {
        console.log(`[REJECT] Reject reason missing for ID: ${requestId}`);
        return res.status(400).json({ message: 'Reject reason is required' });
    }

    try {
        console.log(`[REJECT] Updating request status to 'rejected' for ID: ${requestId}`);
        const result = await db.query(
            'UPDATE vehicle_card_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW(), admin_notes = $3 WHERE id = $4 AND status = $5 RETURNING id',
            ['rejected', adminUserId, admin_notes, requestId, 'pending']
        );
        if (result.rowCount === 0) {
             console.log(`[REJECT] Request ID: ${requestId} not found or not pending.`);
             return res.status(404).json({ message: 'Request not found or already processed' });
        }
        console.log(`[REJECT] Request ID: ${requestId} rejected successfully.`);
        res.json({ message: 'Request rejected' });
    } catch (err) {
        console.error(`[REJECT] ERROR rejecting request ID: ${requestId}:`, err);
        res.status(500).json({ message: err.message || 'Server error rejecting request' });
    }
});
router.get('/vehicle-cards/:id', protect, isAdmin, async (req, res) => {
    const cardId = parseInt(req.params.id);
    try {
        const query = `
            SELECT vc.*, u.full_name AS resident_name
            FROM vehicle_cards vc JOIN users u ON vc.resident_id = u.id
            WHERE vc.id = $1
        `;
        const { rows } = await db.query(query, [cardId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thẻ xe.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`Error fetching vehicle card ${cardId}:`, err);
        res.status(500).json({ message: 'Lỗi server khi tải chi tiết thẻ.' });
    }
});

// === PUT /api/admin/vehicle-cards/:id ===
// Cập nhật thông tin chi tiết của thẻ xe (Edit)
router.put('/vehicle-cards/:id', protect, isAdmin, async (req, res) => {
    const cardId = parseInt(req.params.id);
    // Lấy các trường có thể sửa đổi từ body
    const { card_user_name, license_plate, brand, color } = req.body;

    // Validate dữ liệu (ví dụ đơn giản)
    if (!card_user_name || !brand || !color) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (tên người dùng, nhãn hiệu, màu).' });
    }
    // Cần kiểm tra license_plate nếu không phải xe đạp (logic tương tự khi tạo request)

    try {
        const result = await db.query(
            `UPDATE vehicle_cards
             SET card_user_name = $1, license_plate = $2, brand = $3, color = $4
             WHERE id = $5
             RETURNING id`,
            [card_user_name, license_plate || null, brand, color, cardId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thẻ xe để cập nhật.' });
        }
        res.json({ message: `Đã cập nhật thành công thông tin thẻ #${cardId}` });
    } catch (err) {
        console.error(`Error updating vehicle card ${cardId}:`, err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật thẻ.' });
    }
});

// === PATCH /api/admin/vehicle-cards/:id/status ===
// Cập nhật trạng thái thẻ (Activate/Deactivate/...)
router.patch('/vehicle-cards/:id/status', protect, isAdmin, async (req, res) => {
    const cardId = parseInt(req.params.id);
    const { status } = req.body; // Trạng thái mới: 'active', 'inactive'

    // Validate trạng thái mới
    if (!status || !['active', 'inactive'].includes(status)) { // Chỉ cho phép active/inactive ở đây
        return res.status(400).json({ message: 'Trạng thái không hợp lệ. Chỉ chấp nhận "active" hoặc "inactive".' });
    }

    try {
        // Lấy trạng thái hiện tại để tránh cập nhật dư thừa hoặc sai logic
        const currentCard = await db.query('SELECT status FROM vehicle_cards WHERE id = $1', [cardId]);
        if (currentCard.rows.length === 0) {
             return res.status(404).json({ message: 'Không tìm thấy thẻ xe.' });
        }
        // Có thể thêm kiểm tra logic, ví dụ: không cho activate thẻ đã bị canceled
        if (currentCard.rows[0].status === 'canceled' || currentCard.rows[0].status === 'lost') {
            return res.status(400).json({ message: `Không thể thay đổi trạng thái của thẻ đã ${currentCard.rows[0].status}.` });
        }

        const result = await db.query(
            'UPDATE vehicle_cards SET status = $1 WHERE id = $2 RETURNING id',
            [status, cardId]
        );

        if (result.rowCount === 0) {
            // Trường hợp này ít xảy ra do đã kiểm tra ở trên
            return res.status(404).json({ message: 'Không tìm thấy thẻ xe để cập nhật trạng thái.' });
        }
        res.json({ message: `Đã cập nhật trạng thái thẻ #${cardId} thành "${status}"` });
    } catch (err) {
        console.error(`Error updating status for vehicle card ${cardId}:`, err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái thẻ.' });
    }
});
module.exports = router;