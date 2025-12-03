const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { generateBillsForMonth } = require('../utils/billService');
const { applyLateFees } = require('../utils/penaltyService'); // Import hàm phạt

// --- API Endpoints ---

// POST /api/admin/bills/generate-bills
router.post('/generate-bills', protect, isAdmin, async (req, res) => {
    const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const month = localDate.getMonth() + 1; 
    const year = localDate.getFullYear(); 
    
    console.log(`[Bills] Admin triggered generation for ${month}/${year}`);
    const result = await generateBillsForMonth(month, year);
    if (result.success) {
        res.json({ message: `Successfully generated ${result.count} new bills for ${month}/${year}.` });
    } else {
        res.status(500).json({ message: result.error });
    }
});

// GET /api/admin/bills (Lấy danh sách hóa đơn)
router.get('/', protect, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT b.bill_id, b.status, 
                   to_char(b.issue_date, 'YYYY-MM-DD') AS issue_date,
                   to_char(b.due_date, 'YYYY-MM-DD') AS due_date,
                   b.total_amount, 
                   to_char(b.updated_at, 'YYYY-MM-DD HH24:MI') AS paid_at,
                   u.full_name AS resident_name, 
                   r.room_number AS room_name,
                   bl.name AS block_name
            FROM bills b
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN rooms r ON b.room_id = r.id 
            LEFT JOIN blocks bl ON r.block_id = bl.id
            ORDER BY b.issue_date DESC, b.bill_id DESC
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error('[Bills GET] Error fetching bills:', err);
        res.status(500).json({ message: 'Server error while loading bills' });
    }
});

// GET /api/admin/bills/:id (Chi tiết hóa đơn)
router.get('/:id', protect, isAdmin, async (req, res) => {
    const billId = parseInt(req.params.id);
    try {
        const lineItemsRes = await db.query(
            'SELECT item_name, total_item_amount FROM bill_items WHERE bill_id = $1', 
            [billId]
        );
        res.json(lineItemsRes.rows);
    } 
    catch (err) {
        console.error(`Error fetching bill details for ID ${billId}:`, err);
        res.status(500).json({ message: 'Server error while loading bill details' });
    }
});

// --- API DEBUG ONLY: KIỂM TRA VÀ CHẠY PHẠT THỦ CÔNG ---
router.post('/trigger-late-fees', protect, isAdmin, async (req, res) => {
    const pool = db.getPool ? db.getPool() : db;
    const client = await pool.connect();
    try {
        // 1. Kiểm tra xem có loại phí phạt chưa
        const feeCheck = await client.query("SELECT * FROM fees WHERE fee_code = 'LATE_PAYMENT_FEE'");
        if (feeCheck.rows.length === 0) {
             return res.json({ success: false, reason: "Lỗi: Chưa cấu hình 'LATE_PAYMENT_FEE' trong bảng fees." });
        }

        // 2. Đếm xem có bao nhiêu hóa đơn thỏa mãn điều kiện phạt
        const billsCheck = await client.query("SELECT bill_id, due_date FROM bills WHERE status = 'unpaid' AND due_date < NOW()");
        
        if (billsCheck.rows.length === 0) {
             return res.json({ 
                 success: false, 
                 reason: "Không tìm thấy hóa đơn nào quá hạn.",
                 debug_info: "Hãy chắc chắn bạn đã chạy lệnh SQL cập nhật due_date về quá khứ (ví dụ ngày hôm qua) cho bill status='unpaid'."
             });
        }

        // 3. Nếu thỏa mãn hết, chạy hàm phạt thật
        await applyLateFees();
        
        res.json({ 
            success: true, 
            message: 'Đã chạy tính phí phạt thành công.',
            bills_affected: billsCheck.rows.map(b => b.bill_id) // Trả về danh sách ID bị phạt
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi chạy debug phí phạt.', error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;