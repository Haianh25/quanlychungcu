// backend/routes/services.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware'); 
const upload = require('../utils/upload'); 
const fs = require('fs'); 

// === GET /api/services/my-cards ===
// (Không thay đổi)
router.get('/my-cards', protect, async (req, res) => {
    const residentId = req.user.id; 
    try {
        const managedCardsRes = await db.query(
            'SELECT * FROM vehicle_cards WHERE resident_id = $1 AND status IN ($2, $3)',
            [residentId, 'active', 'inactive']
        );
        const pendingRequestsRes = await db.query(
            'SELECT target_card_id, request_type FROM vehicle_card_requests WHERE resident_id = $1 AND status = $2 AND request_type != $3',
            [residentId, 'pending', 'register']
        );
        const pendingCardIds = new Map(pendingRequestsRes.rows.map(r => [r.target_card_id, r.request_type]));
        const managedCards = managedCardsRes.rows.map(card => {
            if (pendingCardIds.has(card.id)) {
                return { ...card, status: `pending_${pendingCardIds.get(card.id)}` }; 
            }
            return card;
        });
        const pendingRegRes = await db.query(
            'SELECT id, vehicle_type, brand, license_plate FROM vehicle_card_requests WHERE resident_id = $1 AND status = $2 AND request_type = $3',
            [residentId, 'pending', 'register']
        );
        const pendingRegistrations = pendingRegRes.rows.map(req => ({
            id: `req-${req.id}`, 
            type: req.vehicle_type,
            brand: req.brand,
            license_plate: req.license_plate || 'N/A',
            status: 'pending_register'
        }));
        const historyCardsRes = await db.query(
            'SELECT * FROM vehicle_cards WHERE resident_id = $1 AND status IN ($2, $3)',
            [residentId, 'canceled', 'lost']
        );
        res.json({
            managedCards: [...managedCards, ...pendingRegistrations],
            historyCards: historyCardsRes.rows
        });
    } catch (err) {
        console.error('Error fetching user vehicle cards:', err);
        res.status(500).json({ message: 'Lỗi server khi tải danh sách thẻ.' });
    }
});


// === POST /api/services/register-card ===
// (Đã có logic thông báo)
router.post('/register-card', protect, upload.single('proofImage'), async (req, res) => {
    const residentId = req.user.id;
    const residentFullName = req.user.full_name; 
    const {
        vehicleType, fullName, dob, phone, relationship,
        licensePlate, brand, color
    } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Ảnh minh chứng là bắt buộc.' });
    }
    const proofImageUrl = `/uploads/proofs/${req.file.filename}`;

    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // --- (Logic kiểm tra giới hạn của bạn - giữ nguyên) ---
        const activeCardRes = await client.query(
            'SELECT vehicle_type, COUNT(*) as count FROM vehicle_cards WHERE resident_id = $1 AND status IN ($2, $3) GROUP BY vehicle_type',
            [residentId, 'active', 'inactive']
        );
        const activeCounts = activeCardRes.rows.reduce((acc, row) => {
            acc[row.vehicle_type] = parseInt(row.count, 10);
            return acc;
        }, { car: 0, motorbike: 0 });
        const pendingReqRes = await client.query(
            'SELECT vehicle_type, COUNT(*) as count FROM vehicle_card_requests WHERE resident_id = $1 AND status = $2 AND request_type = $3 GROUP BY vehicle_type',
            [residentId, 'pending', 'register']
        );
        const pendingCounts = pendingReqRes.rows.reduce((acc, row) => {
            acc[row.vehicle_type] = parseInt(row.count, 10);
            return acc;
        }, { car: 0, motorbike: 0 });
        const totalCarCount = (activeCounts.car || 0) + (pendingCounts.car || 0);
        const totalMotorbikeCount = (activeCounts.motorbike || 0) + (pendingCounts.motorbike || 0);
        if (vehicleType === 'car' && totalCarCount >= 2) {
            throw new Error('Bạn đã đạt giới hạn 2 thẻ ô tô (bao gồm cả thẻ đang chờ duyệt).');
        }
        if (vehicleType === 'motorbike' && totalMotorbikeCount >= 2) {
            throw new Error('Bạn đã đạt giới hạn 2 thẻ xe máy (bao gồm cả thẻ đang chờ duyệt).');
        }
        // --- (Kết thúc logic kiểm tra) ---

        // 1. Tạo yêu cầu mới
        await client.query(
            `INSERT INTO vehicle_card_requests (
                resident_id, request_type, vehicle_type, full_name, dob, phone, relationship,
                license_plate, brand, color, proof_image_url, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                residentId, 'register', vehicleType, fullName, dob || null, phone, relationship,
                licensePlate || null, brand, color, proofImageUrl, 'pending'
            ]
        );

        // 2. Lấy ID của tất cả Admin
        const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
        
        // 3. Tạo thông báo cho từng Admin
        const notificationMessage = `Cư dân ${residentFullName} vừa gửi yêu cầu đăng ký thẻ xe mới.`;
        const linkTo = '/admin/vehicle-management'; 

        for (const admin of admins.rows) {
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [admin.id, notificationMessage, linkTo]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Đã gửi yêu cầu đăng ký thành công! Vui lòng chờ BQL duyệt.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error registering vehicle card:', err);
        if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting uploaded file after DB error:", unlinkErr);
            });
        }
        res.status(500).json({ message: err.message || 'Lỗi server khi gửi yêu cầu.' });
    } finally {
        client.release();
    }
});


// === POST /api/services/reissue-card ===
// (SỬA ĐỂ THÊM THÔNG BÁO)
router.post('/reissue-card', protect, async (req, res) => {
    const residentId = req.user.id;
    const residentFullName = req.user.full_name; // Lấy tên user
    const { cardId, reason } = req.body;

    if (!cardId || !reason) {
        return res.status(400).json({ message: 'Thiếu thông tin thẻ hoặc lý do.' });
    }

    const pool = db.getPool(); // Dùng transaction
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Kiểm tra thẻ
        const cardRes = await client.query('SELECT id, vehicle_type, license_plate, brand FROM vehicle_cards WHERE id = $1 AND resident_id = $2 AND status IN ($3, $4)', [cardId, residentId, 'active', 'inactive']);
        if (cardRes.rows.length === 0) {
            throw new Error('Không tìm thấy thẻ hợp lệ (đang hoạt động hoặc bị khoá) để cấp lại.');
        }
        const card = cardRes.rows[0];

        // 2. Kiểm tra request đang pending
         const pendingReq = await client.query('SELECT id FROM vehicle_card_requests WHERE target_card_id = $1 AND status = $2', [cardId, 'pending']);
         if(pendingReq.rows.length > 0) {
            throw new Error('Đã có một yêu cầu khác đang chờ xử lý cho thẻ này.');
         }

        // 3. Tạo yêu cầu cấp lại
        await client.query(
            `INSERT INTO vehicle_card_requests (
                resident_id, request_type, target_card_id, vehicle_type, full_name,
                license_plate, brand, reason, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                residentId, 'reissue', cardId, card.vehicle_type, req.user.full_name, 
                card.license_plate, card.brand, reason, 'pending'
            ]
        );

        // --- (THÊM MỚI: TẠO THÔNG BÁO) ---
        const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
        const notificationMessage = `Cư dân ${residentFullName} vừa gửi yêu cầu cấp lại thẻ xe (BS: ${card.license_plate || 'N/A'}).`;
        const linkTo = '/admin/vehicle-management'; 

        for (const admin of admins.rows) {
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [admin.id, notificationMessage, linkTo]
            );
        }
        // --- (KẾT THÚC THÊM MỚI) ---

        await client.query('COMMIT');
        res.status(201).json({ message: 'Yêu cầu cấp lại thẻ đã được gửi! Vui lòng chờ BQL duyệt.' });
    
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error requesting card reissue:', err);
        res.status(500).json({ message: err.message || 'Lỗi server khi gửi yêu cầu.' });
    } finally {
        client.release();
    }
});


// === POST /api/services/cancel-card ===
// (SỬA ĐỂ THÊM THÔNG BÁO)
router.post('/cancel-card', protect, async (req, res) => {
    const residentId = req.user.id;
    const residentFullName = req.user.full_name; // Lấy tên user
    const { cardId, reason } = req.body;

     if (!cardId || !reason) {
        return res.status(400).json({ message: 'Thiếu thông tin thẻ hoặc lý do.' });
    }

    const pool = db.getPool(); // Dùng transaction
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Kiểm tra thẻ
        const cardRes = await client.query('SELECT id, vehicle_type, license_plate, brand FROM vehicle_cards WHERE id = $1 AND resident_id = $2 AND status IN ($3, $4)', [cardId, residentId, 'active', 'inactive']);
        if (cardRes.rows.length === 0) {
            throw new Error('Không tìm thấy thẻ hợp lệ (đang hoạt động hoặc bị khoá) để hủy.');
        }
         const card = cardRes.rows[0];

        // 2. Kiểm tra request đang pending
         const pendingReq = await client.query('SELECT id FROM vehicle_card_requests WHERE target_card_id = $1 AND status = $2', [cardId, 'pending']);
         if(pendingReq.rows.length > 0) {
            throw new Error('Đã có một yêu cầu khác đang chờ xử lý cho thẻ này.');
         }

        // 3. Tạo yêu cầu hủy
         await client.query(
            `INSERT INTO vehicle_card_requests (
                resident_id, request_type, target_card_id, vehicle_type, full_name,
                license_plate, brand, reason, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                residentId, 'cancel', cardId, card.vehicle_type, req.user.full_name,
                card.license_plate, card.brand, reason, 'pending'
            ]
        );

        // --- (THÊM MỚI: TẠO THÔNG BÁO) ---
        const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
        const notificationMessage = `Cư dân ${residentFullName} vừa gửi yêu cầu hủy thẻ xe (BS: ${card.license_plate || 'N/A'}).`;
        const linkTo = '/admin/vehicle-management'; 

        for (const admin of admins.rows) {
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [admin.id, notificationMessage, linkTo]
            );
        }
        // --- (KẾT THÚC THÊM MỚI) ---

        await client.query('COMMIT');
        res.status(201).json({ message: 'Yêu cầu hủy thẻ đã được gửi! Vui lòng chờ BQL duyệt.' });
    
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error requesting card cancellation:', err);
        res.status(500).json({ message: err.message || 'Lỗi server khi gửi yêu cầu.' });
    } finally {
        client.release();
    }
});


module.exports = router;