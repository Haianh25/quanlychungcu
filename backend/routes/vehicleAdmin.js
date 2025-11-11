// backend/routes/vehicleAdmin.js
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
        const query = `
            SELECT vr.*, u.full_name AS resident_name
            FROM vehicle_card_requests vr JOIN users u ON vr.resident_id = u.id
            WHERE vr.status = $1
            ${orderByClause}
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
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User information missing in request.' });
    }
    const adminUserId = req.user.id;
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const requestRes = await client.query('SELECT * FROM vehicle_card_requests WHERE id = $1 AND status = $2', [requestId, 'pending']);
        if (requestRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Yêu cầu không tồn tại hoặc đã được xử lý' });
        }
        const request = requestRes.rows[0];

        await client.query(
            'UPDATE vehicle_card_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3',
            ['approved', adminUserId, requestId]
        );

        let notificationMessage = ''; // <-- (THÊM MỚI)
        const linkTo = '/services'; // Link cho Cư dân

        if (request.request_type === 'register') {
            await client.query(
                `INSERT INTO vehicle_cards (resident_id, card_user_name, vehicle_type, license_plate, brand, color, status, created_from_request_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [request.resident_id, request.full_name, request.vehicle_type, request.license_plate, request.brand, request.color, 'active', requestId]
            );
            notificationMessage = `Yêu cầu đăng ký thẻ xe (BS: ${request.license_plate || 'N/A'}) của bạn đã được duyệt.`;
        
        } else if (request.request_type === 'reissue' && request.target_card_id) {
            await client.query('UPDATE vehicle_cards SET status = $1 WHERE id = $2', ['lost', request.target_card_id]);
            notificationMessage = `Yêu cầu cấp lại thẻ xe (BS: ${request.license_plate || 'N/A'}) của bạn đã được duyệt.`;

        } else if (request.request_type === 'cancel' && request.target_card_id) {
            await client.query('UPDATE vehicle_cards SET status = $1 WHERE id = $2', ['canceled', request.target_card_id]);
            notificationMessage = `Yêu cầu hủy thẻ xe (BS: ${request.license_plate || 'N/A'}) của bạn đã được duyệt.`;
        }

        // --- (THÊM MỚI: TẠO THÔNG BÁO CHO CƯ DÂN) ---
        if (notificationMessage) {
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [request.resident_id, notificationMessage, linkTo] // Gửi cho Cư dân
            );
        }
        // --- (KẾT THÚC THÊM MỚI) ---

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

    const pool = db.getPool(); 
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Lấy thông tin request TRƯỚC KHI reject
        const requestRes = await client.query('SELECT * FROM vehicle_card_requests WHERE id = $1 AND status = $2', [requestId, 'pending']);
        if (requestRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Request not found or already processed' });
        }
        const request = requestRes.rows[0];

        // Cập nhật request
        await client.query(
            'UPDATE vehicle_card_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW(), admin_notes = $3 WHERE id = $4 AND status = $5 RETURNING id',
            ['rejected', adminUserId, admin_notes, requestId, 'pending']
        );

        // --- (THÊM MỚI: TẠO THÔNG BÁO CHO CƯ DÂN) ---
        const notificationMessage = `Yêu cầu (${request.request_type}) cho thẻ xe (BS: ${request.license_plate || 'N/A'}) của bạn đã bị từ chối. Lý do: ${admin_notes}`;
        const linkTo = '/services'; // Link cho Cư dân

        await client.query(
            "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
            [request.resident_id, notificationMessage, linkTo]
        );
        // --- (KẾT THÚC THÊM MỚI) ---
        
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

// PUT /api/admin/vehicle-cards/:id
router.put('/vehicle-cards/:id', protect, isAdmin, async (req, res) => {
    const cardId = parseInt(req.params.id);
    const { card_user_name, license_plate, brand, color } = req.body;

    if (!card_user_name || !brand || !color) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (tên người dùng, nhãn hiệu, màu).' });
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
            return res.status(404).json({ message: 'Không tìm thấy thẻ xe để cập nhật.' });
        }
        res.json({ message: `Đã cập nhật thành công thông tin thẻ #${cardId}` });
    } catch (err) {
        console.error(`Error updating vehicle card ${cardId}:`, err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật thẻ.' });
    }
});

// PATCH /api/admin/vehicle-cards/:id/status
router.patch('/vehicle-cards/:id/status', protect, isAdmin, async (req, res) => {
    const cardId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ. Chỉ chấp nhận "active" hoặc "inactive".' });
    }

    try {
        const currentCard = await db.query('SELECT status FROM vehicle_cards WHERE id = $1', [cardId]);
        if (currentCard.rows.length === 0) {
             return res.status(404).json({ message: 'Không tìm thấy thẻ xe.' });
        }
        if (currentCard.rows[0].status === 'canceled' || currentCard.rows[0].status === 'lost') {
            return res.status(400).json({ message: `Không thể thay đổi trạng thái của thẻ đã ${currentCard.rows[0].status}.` });
        }

        const result = await db.query(
            'UPDATE vehicle_cards SET status = $1 WHERE id = $2 RETURNING id',
            [status, cardId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thẻ xe để cập nhật trạng thái.' });
        }
        res.json({ message: `Đã cập nhật trạng thái thẻ #${cardId} thành "${status}"` });
    } catch (err) {
        console.error(`Error updating status for vehicle card ${cardId}:`, err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái thẻ.' });
    }
});

module.exports = router;