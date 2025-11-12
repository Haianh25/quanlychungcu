const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware'); 
const upload = require('../utils/upload'); 
const fs = require('fs'); 

// === (THÊM MỚI) GET /api/services/fees-table ===
// API công khai để lấy bảng giá động
router.get('/fees-table', async (req, res) => {
    try {
        const feeCodes = [
            'CAR_FEE', 'MOTORBIKE_FEE', 'BICYCLE_FEE',
            'CAR_CARD_FEE', 'MOTORBIKE_CARD_FEE', 'BICYCLE_CARD_FEE'
        ];
        
        const query = "SELECT fee_code, price FROM fees WHERE fee_code = ANY($1::text[])";
        const { rows } = await db.query(query, [feeCodes]);

        // Chuyển đổi mảng [ {fee_code: 'CAR_FEE', price: '...'} ]
        // thành object { CAR_FEE: '...', ... }
        const prices = rows.reduce((acc, fee) => {
            acc[fee.fee_code] = fee.price;
            return acc;
        }, {});

        // Đảm bảo tất cả các key đều tồn tại, ngay cả khi là null
        feeCodes.forEach(code => {
            if (!prices[code]) {
                prices[code] = null; 
            }
        });

        res.json(prices);
    } catch (err) {
        console.error('Error fetching fees table:', err);
        res.status(500).json({ message: 'Server error fetching fees table' });
    }
});


// === (SỬA ĐỔI) GET /api/services/my-cards ===
// Logic được viết lại cho rõ ràng hơn
router.get('/my-cards', protect, async (req, res) => {
    const residentId = req.user.id; 
    try {
        // 1. Lấy các thẻ đang hoạt động (active, inactive)
        const managedCardsRes = await db.query(
            `SELECT 
                id, vehicle_type, license_plate, brand, color, status, issued_at
             FROM vehicle_cards 
             WHERE resident_id = $1 AND status IN ('active', 'inactive')`,
            [residentId]
        );

        // 2. Lấy các yêu cầu đang chờ xử lý (pending_register, pending_reissue, pending_cancel)
        const pendingRequestsRes = await db.query(
            `SELECT 
                id AS request_id, vehicle_type, license_plate, brand, color, status, request_type, target_card_id
             FROM vehicle_card_requests 
             WHERE resident_id = $1 AND status = 'pending'`,
            [residentId]
        );

        // 3. Lấy các thẻ đã hủy/mất (history)
        const historyCardsRes = await db.query(
            `SELECT id, vehicle_type, license_plate, brand, color, status, issued_at
             FROM vehicle_cards
             WHERE resident_id = $1 AND status IN ('canceled', 'lost')
             ORDER BY issued_at DESC`,
            [residentId]
        );

        // Xử lý logic gộp thẻ và yêu cầu
        const managedCards = [...managedCardsRes.rows];
        const pendingRegistrations = [];
        const pendingCardIds = new Map(); // Map(card_id -> 'pending_reissue'/'pending_cancel')

        pendingRequestsRes.rows.forEach(req => {
            if (req.request_type === 'register') {
                // Đây là yêu cầu đăng ký MỚI
                pendingRegistrations.push({
                    id: `req-${req.request_id}`, 
                    type: req.vehicle_type, // Sửa 'type'
                    brand: req.brand,
                    license_plate: req.license_plate || 'N/A',
                    status: 'pending_register'
                });
            } else if (req.target_card_id) {
                // Đây là yêu cầu Cấp lại/Hủy cho một thẻ CŨ
                pendingCardIds.set(req.target_card_id, `pending_${req.request_type}`);
            }
        });

        // Gắn trạng thái pending vào các thẻ đang quản lý
        const finalManagedCards = managedCards.map(card => {
            if (pendingCardIds.has(card.id)) {
                return { ...card, status: pendingCardIds.get(card.id) }; 
            }
            return card;
        }).concat(pendingRegistrations); // Thêm các yêu cầu đăng ký mới vào danh sách

        res.json({
            managedCards: finalManagedCards,
            historyCards: historyCardsRes.rows
        });
    } catch (err) {
        console.error('Error fetching user vehicle cards:', err);
        res.status(500).json({ message: 'Lỗi server khi tải danh sách thẻ.' });
    }
});


// === POST /api/services/register-card ===
// (Giữ nguyên logic của bạn)
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

    const pool = db.getPool ? db.getPool() : db;
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
// (Giữ nguyên logic của bạn)
router.post('/reissue-card', protect, async (req, res) => {
    const residentId = req.user.id;
    const residentFullName = req.user.full_name; 
    const { cardId, reason } = req.body;

    if (!cardId || !reason) {
        return res.status(400).json({ message: 'Thiếu thông tin thẻ hoặc lý do.' });
    }

    const pool = db.getPool ? db.getPool() : db; 
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

        // 4. Tạo thông báo cho Admin
        const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
        const notificationMessage = `Cư dân ${residentFullName} vừa gửi yêu cầu cấp lại thẻ xe (BS: ${card.license_plate || 'N/A'}).`;
        const linkTo = '/admin/vehicle-management'; 

        for (const admin of admins.rows) {
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [admin.id, notificationMessage, linkTo]
            );
        }

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
// (Giữ nguyên logic của bạn)
router.post('/cancel-card', protect, async (req, res) => {
    const residentId = req.user.id;
    const residentFullName = req.user.full_name; 
    const { cardId, reason } = req.body;

     if (!cardId || !reason) {
        return res.status(400).json({ message: 'Thiếu thông tin thẻ hoặc lý do.' });
    }

    const pool = db.getPool ? db.getPool() : db; 
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

        // 4. Tạo thông báo cho Admin
        const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
        const notificationMessage = `Cư dân ${residentFullName} vừa gửi yêu cầu hủy thẻ xe (BS: ${card.license_plate || 'N/A'}).`;
        const linkTo = '/admin/vehicle-management'; 

        for (const admin of admins.rows) {
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [admin.id, notificationMessage, linkTo]
            );
        }

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