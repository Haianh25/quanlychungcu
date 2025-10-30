// backend/routes/services.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware'); // Chỉ cần protect, user nào cũng gửi được
const upload = require('../utils/upload'); // Import cấu hình multer

// === GET /api/services/my-cards ===
// Lấy danh sách thẻ xe đang hoạt động ('active') hoặc đang chờ ('pending' request) của user
router.get('/my-cards', protect, async (req, res) => {
    const residentId = req.user.id; // Lấy từ middleware protect (UUID)
    try {
        // Lấy thẻ đang active
        const activeCardsRes = await db.query('SELECT * FROM vehicle_cards WHERE resident_id = $1 AND status = $2', [residentId, 'active']);

        // Lấy các request đang chờ duyệt liên quan đến thẻ (để hiển thị trạng thái pending)
        const pendingRequestsRes = await db.query(
            'SELECT target_card_id, request_type FROM vehicle_card_requests WHERE resident_id = $1 AND status = $2 AND request_type != $3',
            [residentId, 'pending', 'register'] // Lấy pending reissue/cancel
        );
        const pendingCardIds = new Map(pendingRequestsRes.rows.map(r => [r.target_card_id, r.request_type])); // Map<card_id, request_type>

        // Kết hợp dữ liệu: Thêm trạng thái 'pending_reissue' hoặc 'pending_cancel'
        const cards = activeCardsRes.rows.map(card => {
            if (pendingCardIds.has(card.id)) {
                return { ...card, status: `pending_${pendingCardIds.get(card.id)}` }; // VD: pending_reissue
            }
            return card;
        });

        // Lấy cả các request đăng ký mới đang chờ duyệt (để user biết)
        const pendingRegRes = await db.query(
            'SELECT id, vehicle_type, brand, license_plate FROM vehicle_card_requests WHERE resident_id = $1 AND status = $2 AND request_type = $3',
            [residentId, 'pending', 'register']
        );
        const pendingRegistrations = pendingRegRes.rows.map(req => ({
             id: `req-${req.id}`, // Tạo ID tạm
             type: req.vehicle_type,
             brand: req.brand,
             license_plate: req.license_plate || 'N/A',
             status: 'pending_register'
        }));


        res.json([...cards, ...pendingRegistrations]); // Gộp thẻ active và request pending

    } catch (err) {
        console.error('Error fetching user vehicle cards:', err);
        res.status(500).json({ message: 'Lỗi server khi tải danh sách thẻ.' });
    }
});


// === POST /api/services/register-card ===
// Gửi yêu cầu đăng ký thẻ mới (có upload ảnh)
// Sử dụng upload.single('proofImage') để xử lý file gửi lên với field name là 'proofImage'
router.post('/register-card', protect, upload.single('proofImage'), async (req, res) => {
    const residentId = req.user.id;
    const {
        vehicleType, fullName, dob, phone, relationship,
        licensePlate, brand, color
    } = req.body;

    // Kiểm tra file đã được upload chưa
    if (!req.file) {
        return res.status(400).json({ message: 'Ảnh minh chứng là bắt buộc.' });
    }
    // Lấy đường dẫn tương đối của file đã lưu để lưu vào DB
    // Ví dụ: /uploads/proofs/proofImage-1678886400000-123456789.jpg
    const proofImageUrl = `/uploads/proofs/${req.file.filename}`;

    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Đếm số thẻ đang active của user
        const cardCountRes = await client.query(
            'SELECT vehicle_type, COUNT(*) as count FROM vehicle_cards WHERE resident_id = $1 AND status = $2 GROUP BY vehicle_type',
            [residentId, 'active']
        );
        const counts = cardCountRes.rows.reduce((acc, row) => {
            acc[row.vehicle_type] = parseInt(row.count, 10);
            return acc;
        }, { car: 0, motorbike: 0 }); // Khởi tạo nếu chưa có loại xe nào

        // Kiểm tra giới hạn
        if (vehicleType === 'car' && counts.car >= 1) {
            throw new Error('Bạn chỉ được đăng ký tối đa 1 thẻ ô tô.');
        }
        if (vehicleType === 'motorbike' && counts.motorbike >= 2) {
            throw new Error('Bạn chỉ được đăng ký tối đa 2 thẻ xe máy.');
        }

        // Tạo yêu cầu mới
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

        await client.query('COMMIT');
        res.status(201).json({ message: 'Đã gửi yêu cầu đăng ký thành công! Vui lòng chờ BQL duyệt.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error registering vehicle card:', err);
        // Xóa file ảnh đã upload nếu có lỗi DB
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
// Gửi yêu cầu cấp lại thẻ
router.post('/reissue-card', protect, async (req, res) => {
    const residentId = req.user.id;
    const { cardId, reason } = req.body;

    if (!cardId || !reason) {
        return res.status(400).json({ message: 'Thiếu thông tin thẻ hoặc lý do.' });
    }

    try {
        // 1. Kiểm tra thẻ thuộc về user và đang active
        const cardRes = await db.query('SELECT id, vehicle_type, license_plate, brand FROM vehicle_cards WHERE id = $1 AND resident_id = $2 AND status = $3', [cardId, residentId, 'active']);
        if (cardRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thẻ hợp lệ hoặc thẻ không thuộc về bạn.' });
        }
        const card = cardRes.rows[0];

        // 2. Kiểm tra xem có request reissue/cancel nào đang pending cho thẻ này không
         const pendingReq = await db.query('SELECT id FROM vehicle_card_requests WHERE target_card_id = $1 AND status = $2', [cardId, 'pending']);
         if(pendingReq.rows.length > 0) {
              return res.status(400).json({ message: 'Đã có một yêu cầu khác đang chờ xử lý cho thẻ này.' });
         }


        // 3. Tạo yêu cầu cấp lại
        await db.query(
            `INSERT INTO vehicle_card_requests (
                resident_id, request_type, target_card_id, vehicle_type, full_name,
                license_plate, brand, reason, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                residentId, 'reissue', cardId, card.vehicle_type, req.user.full_name, // Lấy tên chủ hộ
                card.license_plate, card.brand, reason, 'pending'
            ]
        );

        res.status(201).json({ message: 'Yêu cầu cấp lại thẻ đã được gửi! Vui lòng chờ BQL duyệt.' });
    } catch (err) {
        console.error('Error requesting card reissue:', err);
        res.status(500).json({ message: 'Lỗi server khi gửi yêu cầu.' });
    }
});


// === POST /api/services/cancel-card ===
// Gửi yêu cầu hủy thẻ
router.post('/cancel-card', protect, async (req, res) => {
    const residentId = req.user.id;
    const { cardId, reason } = req.body;

     if (!cardId || !reason) {
        return res.status(400).json({ message: 'Thiếu thông tin thẻ hoặc lý do.' });
    }

    try {
        // 1. Kiểm tra thẻ thuộc về user và đang active
        const cardRes = await db.query('SELECT id, vehicle_type, license_plate, brand FROM vehicle_cards WHERE id = $1 AND resident_id = $2 AND status = $3', [cardId, residentId, 'active']);
        if (cardRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thẻ hợp lệ hoặc thẻ không thuộc về bạn.' });
        }
         const card = cardRes.rows[0];

        // 2. Kiểm tra xem có request reissue/cancel nào đang pending cho thẻ này không
         const pendingReq = await db.query('SELECT id FROM vehicle_card_requests WHERE target_card_id = $1 AND status = $2', [cardId, 'pending']);
         if(pendingReq.rows.length > 0) {
              return res.status(400).json({ message: 'Đã có một yêu cầu khác đang chờ xử lý cho thẻ này.' });
         }

        // 3. Tạo yêu cầu hủy
         await db.query(
            `INSERT INTO vehicle_card_requests (
                resident_id, request_type, target_card_id, vehicle_type, full_name,
                license_plate, brand, reason, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                residentId, 'cancel', cardId, card.vehicle_type, req.user.full_name,
                card.license_plate, card.brand, reason, 'pending'
            ]
        );

        res.status(201).json({ message: 'Yêu cầu hủy thẻ đã được gửi! Vui lòng chờ BQL duyệt.' });
    } catch (err) {
        console.error('Error requesting card cancellation:', err);
        res.status(500).json({ message: 'Lỗi server khi gửi yêu cầu.' });
    }
});


module.exports = router;