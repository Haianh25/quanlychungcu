// backend/routes/billAdmin.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// --- HÀM LOGIC CỐT LÕI: TẠO HÓA ĐƠN (ĐÃ CẬP NHẬT) ---
async function generateBillsForMonth(month, year) {
    const pool = db.getPool();
    const client = await pool.connect();
    
    // Ngày 1 của tháng TẠO BILL (Vd: 1/11/2025)
    const monthFor = `${year}-${String(month).padStart(2, '0')}-01`; 
    const dueDate = `${year}-${String(month).padStart(2, '0')}-10`;
    
    // Tính toán tháng TRƯỚC (Vd: 10/2025)
    const prevMonth = (month === 1) ? 12 : month - 1;
    const prevYear = (month === 1) ? year - 1 : year;
    const prevMonthStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`; // Vd: 1/10/2025
    const currentMonthStartDate = monthFor; // Vd: 1/11/2025

    // Lấy số ngày trong tháng TRƯỚC (Vd: 31 ngày của tháng 10)
    // new Date(year, month-1, 0) -> Lấy ngày cuối cùng của tháng trước
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

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
            const existingBill = await client.query('SELECT id FROM bills WHERE room_id = $1 AND month_for = $2', [roomId, monthFor]);
            if (existingBill.rows.length > 0) {
                console.log(`[Bills] Skipping room ${roomId} for ${month}/${year}, bill already exists.`);
                continue;
            }

            let baseAmount = 0;
            const lineItems = [];

            // 3b. Phí cố định hàng tháng (Cho tháng 11)
            baseAmount += rates['management_fee'];
            lineItems.push({ desc: 'Phí quản lý căn hộ', amount: rates['management_fee'] });
            baseAmount += rates['bqt_fee'];
            lineItems.push({ desc: 'Phí Ban Quản Trị', amount: rates['bqt_fee'] });

            // 3c. Phí xe hàng tháng (Cho tháng 11)
            const vehicleRes = await client.query('SELECT vehicle_type, COUNT(*) as count FROM vehicle_cards WHERE resident_id = $1 AND status = $2 GROUP BY vehicle_type', [residentId, 'active']);
            for (const vehicle of vehicleRes.rows) {
                let fee = 0; let desc = ''; const count = parseInt(vehicle.count, 10);
                if (vehicle.vehicle_type === 'car') { fee = rates['car_fee_monthly'] * count; desc = `Phí gửi xe Ô tô (x${count})`; }
                else if (vehicle.vehicle_type === 'motorbike') { fee = rates['motorbike_fee_monthly'] * count; desc = `Phí gửi xe Máy (x${count})`; }
                else if (vehicle.vehicle_type === 'bicycle') { fee = rates['bicycle_fee_monthly'] * count; desc = `Phí gửi xe Đạp (x${count})`; }
                if (fee > 0) { baseAmount += fee; lineItems.push({ desc, amount: fee }); }
            }

            // 3d. Lấy các phí MỘT LẦN (đăng ký/cấp lại) đã duyệt tháng TRƯỚC (Tháng 10)
            const oneTimeFeeRes = await client.query(
                `SELECT id, request_type, vehicle_type, one_time_fee_amount 
                 FROM vehicle_card_requests 
                 WHERE resident_id = $1 AND status = 'approved' AND billed_in_bill_id IS NULL
                 AND reviewed_at >= $2 AND reviewed_at < $3`,
                [residentId, prevMonthStartDate, currentMonthStartDate]
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
            
            // highlight-start
            // 3d-2. (LOGIC B) Lấy phí xe TÍNH TỶ LỆ cho các thẻ mới đăng ký tháng TRƯỚC (Tháng 10)
            const proratedCardsRes = await client.query(
                `SELECT vehicle_type, issued_at 
                 FROM vehicle_cards 
                 WHERE resident_id = $1 
                 AND created_from_request_id IS NOT NULL -- Đảm bảo đây là thẻ mới tạo (từ request)
                 AND issued_at >= $2 AND issued_at < $3`, // 'issued_at' là ngày admin duyệt (Trong tháng 10)
                [residentId, prevMonthStartDate, currentMonthStartDate]
            );

            for (const card of proratedCardsRes.rows) {
                // Lấy ngày kích hoạt (Vd: 15/10)
                const issuedDate = new Date(card.issued_at).getUTCDate(); // Lấy ngày (15)
                // Số ngày tính phí = (Tổng ngày T10 - Ngày kích hoạt) + 1
                const daysToCharge = (daysInPrevMonth - issuedDate) + 1; // Vd: (31 - 15) + 1 = 17 ngày

                if (daysToCharge <= 0 || daysToCharge > daysInPrevMonth) continue; // Bỏ qua nếu ngày không hợp lệ

                let monthlyRate = 0; let vehicleName = '';
                if (card.vehicle_type === 'car') { monthlyRate = rates['car_fee_monthly']; vehicleName = 'Ô tô'; }
                else if (card.vehicle_type === 'motorbike') { monthlyRate = rates['motorbike_fee_monthly']; vehicleName = 'Xe máy'; }
                else if (card.vehicle_type === 'bicycle') { monthlyRate = rates['bicycle_fee_monthly']; vehicleName = 'Xe đạp'; }

                if (monthlyRate > 0) {
                    // Tính phí theo tỷ lệ và làm tròn
                    const proratedFee = Math.round((monthlyRate / daysInPrevMonth) * daysToCharge);
                    
                    baseAmount += proratedFee;
                    lineItems.push({ 
                        desc: `Phí gửi xe ${vehicleName} (Tỷ lệ T${prevMonth}: ${daysToCharge}/${daysInPrevMonth} ngày)`, 
                        amount: proratedFee 
                    });
                }
            }
            // highlight-end

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
        }
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

// POST /api/admin/bills/generate (Sửa lại logic lấy tháng/năm)
router.post('/bills/generate', protect, isAdmin, async (req, res) => {
    // Lấy tháng/năm theo múi giờ VN
    const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const month = localDate.getMonth() + 1; // Lấy tháng (1-12) của VN
    const year = localDate.getFullYear(); // Lấy năm của VN
    
    console.log(`[Bills] Admin triggered generation for ${month}/${year}`);
    const result = await generateBillsForMonth(month, year);
    if (result.success) {
        res.json({ message: `Tạo thành công ${result.count} hóa đơn mới cho tháng ${month}/${year}.` });
    } else {
        res.status(500).json({ message: result.error });
    }
});

// GET /api/admin/bills (Đã sửa LEFT JOIN và TO_CHAR)
router.get('/bills', protect, isAdmin, async (req, res) => {
    console.log("[Bills GET] API /api/admin/bills called");
    try {
        const query = `
            SELECT b.id, b.status, 
                   to_char(b.month_for, 'YYYY-MM-DD') AS month_for,
                   to_char(b.due_date, 'YYYY-MM-DD') AS due_date,
                   b.total_amount, b.paid_at,
                   u.full_name AS resident_name, 
                   r.room_number AS room_name
            FROM bills b
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN rooms r ON b.room_id = r.id 
            ORDER BY b.month_for DESC, b.id DESC
        `;
        const { rows } = await db.query(query);
        console.log(`[Bills GET] Query returned ${rows.length} total bills.`);
        res.json(rows);
    } catch (err) {
        console.error('[Bills GET] Error fetching bills:', err);
        res.status(500).json({ message: 'Lỗi server khi tải hóa đơn' });
    }
});

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

// (Phần export cho Cron Job)
module.exports = {
    router, // Export router
    generateBillsForMonth // Export hàm logic
};