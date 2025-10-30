// backend/routes/billAdmin.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// --- (HÀM LOGIC generateBillsForMonth GIỮ NGUYÊN) ---
async function generateBillsForMonth(month, year) {
    const pool = db.getPool();
    const client = await pool.connect();
    
    // Ngày 1 của tháng (UTC)
    const monthFor = new Date(Date.UTC(year, month - 1, 1)); 
    const dueDate = new Date(Date.UTC(year, month - 1, 10)); // Hạn ngày 10
    
    // Tìm các phí một lần (one-time) đã duyệt từ tháng TRƯỚC
    const prevMonth = (month === 1) ? 12 : month - 1;
    const prevYear = (month === 1) ? year - 1 : year;
    const oneTimeFeeStartDate = new Date(Date.UTC(prevYear, prevMonth - 1, 1));
    const oneTimeFeeEndDate = new Date(Date.UTC(year, month - 1, 1));

    let generatedCount = 0;
    
    try {
        await client.query('BEGIN');

        // 1. Lấy tất cả đơn giá
        const ratesRes = await client.query('SELECT service_name, rate FROM service_rates');
        const rates = ratesRes.rows.reduce((acc, row) => {
            acc[row.service_name] = parseFloat(row.rate);
            return acc;
        }, {});
        
        // 2. Lấy tất cả căn hộ có người ở
        const roomsRes = await client.query('SELECT id, resident_id FROM rooms WHERE resident_id IS NOT NULL');
        
        // 3. Lặp qua từng căn hộ
        for (const room of roomsRes.rows) {
            const residentId = room.resident_id;
            const roomId = room.id;
            
            // 3a. Kiểm tra bill đã tồn tại chưa
            const existingBill = await client.query(
                'SELECT id FROM bills WHERE room_id = $1 AND month_for = $2',
                [roomId, monthFor]
            );
            if (existingBill.rows.length > 0) {
                console.log(`[Bills] Skipping room ${roomId} for ${month}/${year}, bill already exists.`);
                continue;
            }

            let baseAmount = 0;
            const lineItems = [];

            // 3b. Phí cố định
            baseAmount += rates['management_fee'];
            lineItems.push({ desc: 'Phí quản lý căn hộ', amount: rates['management_fee'] });
            baseAmount += rates['bqt_fee'];
            lineItems.push({ desc: 'Phí Ban Quản Trị', amount: rates['bqt_fee'] });

            // 3c. Phí xe hàng tháng
            const vehicleRes = await client.query(
                'SELECT vehicle_type, COUNT(*) as count FROM vehicle_cards WHERE resident_id = $1 AND status = $2 GROUP BY vehicle_type',
                [residentId, 'active']
            );
            for (const vehicle of vehicleRes.rows) {
                let fee = 0; let desc = ''; const count = parseInt(vehicle.count, 10);
                if (vehicle.vehicle_type === 'car') { fee = rates['car_fee_monthly'] * count; desc = `Phí gửi xe Ô tô (x${count})`; }
                else if (vehicle.vehicle_type === 'motorbike') { fee = rates['motorbike_fee_monthly'] * count; desc = `Phí gửi xe Máy (x${count})`; }
                else if (vehicle.vehicle_type === 'bicycle') { fee = rates['bicycle_fee_monthly'] * count; desc = `Phí gửi xe Đạp (x${count})`; }
                if (fee > 0) { baseAmount += fee; lineItems.push({ desc, amount: fee }); }
            }

            // 3d. Lấy các phí một lần (đăng ký/cấp lại) đã duyệt tháng TRƯỚC
            const oneTimeFeeRes = await client.query(
                `SELECT id, request_type, vehicle_type, one_time_fee_amount 
                 FROM vehicle_card_requests 
                 WHERE resident_id = $1 AND status = 'approved' AND billed_in_bill_id IS NULL
                 AND reviewed_at >= $2 AND reviewed_at < $3`,
                [residentId, oneTimeFeeStartDate, oneTimeFeeEndDate]
            );
            const requestIdsToUpdate = [];
            for (const fee of oneTimeFeeRes.rows) {
                const amount = parseFloat(fee.one_time_fee_amount);
                if (amount > 0) {
                    baseAmount += amount;
                    const desc = fee.request_type === 'register' ? 'Phí đăng ký thẻ' : 'Phí cấp lại thẻ';
                    lineItems.push({ desc: `${desc} (${fee.vehicle_type})`, amount: amount });
                    requestIdsToUpdate.push(fee.id);
                }
            }

            // 3e. Tạo hóa đơn tổng
            const billInsertRes = await client.query(
                `INSERT INTO bills (user_id, room_id, month_for, due_date, status, base_amount, total_amount)
                 VALUES ($1, $2, $3, $4, 'unpaid', $5, $5) RETURNING id`,
                [residentId, roomId, monthFor, dueDate, baseAmount]
            );
            const newBillId = billInsertRes.rows[0].id;

            // 3f. Thêm chi tiết hóa đơn
            for (const item of lineItems) {
                await client.query('INSERT INTO bill_line_items (bill_id, description, amount) VALUES ($1, $2, $3)', [newBillId, item.desc, item.amount]);
            }
            
            // 3g. Đánh dấu các phí một lần là "đã lập hóa đơn"
            if (requestIdsToUpdate.length > 0) {
                await client.query('UPDATE vehicle_card_requests SET billed_in_bill_id = $1 WHERE id = ANY($2::int[])', [newBillId, requestIdsToUpdate]);
            }
            generatedCount++;
        } // Hết vòng lặp
        await client.query('COMMIT');
        return { success: true, count: generatedCount };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error generating bills:', err);
        return { success: false, error: err.message || 'Lỗi server khi tạo hóa đơn' };
    } finally {
        client.release();
    }
}

// --- API Endpoints ---

// POST /api/admin/bills/generate (Giữ nguyên)
router.post('/bills/generate', protect, isAdmin, async (req, res) => {
    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();
    console.log(`[Bills] Admin triggered generation for ${month}/${year}`);
    const result = await generateBillsForMonth(month, year);
    if (result.success) {
        res.json({ message: `Tạo thành công ${result.count} hóa đơn mới cho tháng ${month}/${year}.` });
    } else {
        res.status(500).json({ message: result.error });
    }
});

// GET /api/admin/bills - Lấy danh sách hóa đơn
// highlight-start
// --- SỬA LỖI Ở ĐÂY ---
router.get('/bills', protect, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT b.id, b.status, b.month_for, b.due_date, b.total_amount, b.paid_at,
                   u.full_name AS resident_name, 
                   r.room_number AS room_name -- <<< GIẢ ĐỊNH TÊN CỘT LÀ 'room_number'
            FROM bills b
            JOIN users u ON b.user_id = u.id
            JOIN rooms r ON b.room_id = r.id -- Sửa 'r.name' thành 'r.room_number'
            ORDER BY b.month_for DESC, b.id DESC
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching bills:', err);
        res.status(500).json({ message: 'Lỗi server khi tải hóa đơn' });
    }
});
// highlight-end

// GET /api/admin/bills/:id (Giữ nguyên)
router.get('/bills/:id', protect, isAdmin, async (req, res) => {
    const billId = parseInt(req.params.id);
    try {
        const lineItemsRes = await db.query('SELECT description, amount FROM bill_line_items WHERE bill_id = $1', [billId]);
        res.json(lineItemsRes.rows);
    } catch (err) {
        console.error(`Error fetching bill details for ID ${billId}:`, err);
        res.status(500).json({ message: 'Lỗi server khi tải chi tiết hóa đơn' });
    }
});

// POST /api/admin/bills/:id/mark-paid (Giữ nguyên)
router.post('/bills/:id/mark-paid', protect, isAdmin, async (req, res) => {
    const billId = parseInt(req.params.id);
    try {
        const result = await db.query(
            "UPDATE bills SET status = 'paid', paid_at = NOW() WHERE id = $1 AND status != 'paid' RETURNING id",
            [billId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn hoặc hóa đơn đã được thanh toán.' });
        }
        res.json({ message: `Hóa đơn #${billId} đã được đánh dấu thanh toán.` });
    } catch (err) {
        console.error(`Error marking bill ${billId} as paid:`, err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;