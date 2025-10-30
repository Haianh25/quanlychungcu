// backend/routes/services.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware'); // Chỉ cần protect, user nào cũng gửi được
const upload = require('../utils/upload'); // Import cấu hình multer
const fs = require('fs'); // <-- 1. ĐÃ THÊM IMPORT FS

// === GET /api/services/my-cards ===
// Sửa lại logic để trả về 2 danh sách: managedCards và historyCards
// highlight-start
router.get('/my-cards', protect, async (req, res) => {
    const residentId = req.user.id; // Lấy từ middleware protect (UUID)
    try {
        // 1. Lấy các thẻ đang quản lý (active và inactive)
        const managedCardsRes = await db.query(
            'SELECT * FROM vehicle_cards WHERE resident_id = $1 AND status IN ($2, $3)',
            [residentId, 'active', 'inactive'] // <-- LẤY CẢ THẺ INACTIVE (BỊ KHÓA)
        );

        // 2. Lấy các request đang chờ duyệt (reissue/cancel) để cập nhật trạng thái
        const pendingRequestsRes = await db.query(
            'SELECT target_card_id, request_type FROM vehicle_card_requests WHERE resident_id = $1 AND status = $2 AND request_type != $3',
            [residentId, 'pending', 'register']
        );
        const pendingCardIds = new Map(pendingRequestsRes.rows.map(r => [r.target_card_id, r.request_type]));

        // 3. Merge trạng thái pending vào các thẻ đang quản lý
        const managedCards = managedCardsRes.rows.map(card => {
            if (pendingCardIds.has(card.id)) {
                return { ...card, status: `pending_${pendingCardIds.get(card.id)}` }; // VD: pending_reissue
            }
            return card;
        });

        // 4. Lấy các request đăng ký mới đang chờ duyệt
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

        // 5. (MỚI) Lấy các thẻ lịch sử (đã hủy hoặc báo mất)
        const historyCardsRes = await db.query(
            'SELECT * FROM vehicle_cards WHERE resident_id = $1 AND status IN ($2, $3)',
            [residentId, 'canceled', 'lost']
        );

        // 6. Trả về 2 danh sách
        res.json({
            managedCards: [...managedCards, ...pendingRegistrations],
            historyCards: historyCardsRes.rows
        });

    } catch (err) {
        console.error('Error fetching user vehicle cards:', err);
        res.status(500).json({ message: 'Lỗi server khi tải danh sách thẻ.' });
    }
});
// highlight-end


// === POST /api/services/register-card ===
// (Giữ nguyên như file gốc của bạn, giờ 'fs.unlink' sẽ hoạt động)
router.post('/register-card', protect, upload.single('proofImage'), async (req, res) => {
    const residentId = req.user.id;
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

        // Đếm số thẻ đang active
        const cardCountRes = await client.query(
            'SELECT vehicle_type, COUNT(*) as count FROM vehicle_cards WHERE resident_id = $1 AND status = $2 GROUP BY vehicle_type',
            [residentId, 'active']
        );
        const counts = cardCountRes.rows.reduce((acc, row) => {
            acc[row.vehicle_type] = parseInt(row.count, 10);
            return acc;
        }, { car: 0, motorbike: 0 });

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
            fs.unlink(req.file.path, (unlinkErr) => { // Dòng này giờ sẽ chạy đúng
                if (unlinkErr) console.error("Error deleting uploaded file after DB error:", unlinkErr);
            });
        }
        res.status(500).json({ message: err.message || 'Lỗi server khi gửi yêu cầu.' });
    } finally {
        client.release();
    }
});


// === POST /api/services/reissue-card ===
// (Giữ nguyên như file gốc của bạn)
router.post('/reissue-card', protect, async (req, res) => {
    const residentId = req.user.id;
    const { cardId, reason } = req.body;

    if (!cardId || !reason) {
        return res.status(400).json({ message: 'Thiếu thông tin thẻ hoặc lý do.' });
    }

    try {
        // 1. Kiểm tra thẻ thuộc về user và đang active (HOẶC INACTIVE)
        // Sửa logic: Cho phép cấp lại cả thẻ active và inactive (bị khoá)
        // highlight-start
        const cardRes = await db.query('SELECT id, vehicle_type, license_plate, brand FROM vehicle_cards WHERE id = $1 AND resident_id = $2 AND status IN ($3, $4)', [cardId, residentId, 'active', 'inactive']);
        if (cardRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thẻ hợp lệ (đang hoạt động hoặc bị khoá) để cấp lại.' });
        }
        // highlight-end
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
// (Giữ nguyên như file gốc của bạn)
router.post('/cancel-card', protect, async (req, res) => {
    const residentId = req.user.id;
    const { cardId, reason } = req.body;

     if (!cardId || !reason) {
        return res.status(400).json({ message: 'Thiếu thông tin thẻ hoặc lý do.' });
    }

    try {
        // 1. Kiểm tra thẻ thuộc về user và đang active (HOẶC INACTIVE)
        // Sửa logic: Cho phép hủy cả thẻ active và inactive (bị khoá)
        // highlight-start
        const cardRes = await db.query('SELECT id, vehicle_type, license_plate, brand FROM vehicle_cards WHERE id = $1 AND resident_id = $2 AND status IN ($3, $4)', [cardId, residentId, 'active', 'inactive']);
        if (cardRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thẻ hợp lệ (đang hoạt động hoặc bị khoá) để hủy.' });
        }
        // highlight-end
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