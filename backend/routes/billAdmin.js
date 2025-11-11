const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');
// SỬA: Import hàm logic từ file utils (chúng ta đã tạo ở bước trước)
const { generateBillsForMonth } = require('../utils/billService'); 

// --- API Endpoints ---

// SỬA: Xóa '/bills' khỏi route. Giờ đây là '/generate-bills'
// Route đầy đủ sẽ là: POST /api/admin/bills/generate-bills
router.post('/generate-bills', protect, isAdmin, async (req, res) => {
    const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const month = localDate.getMonth() + 1; 
    const year = localDate.getFullYear(); 
    
    console.log(`[Bills] Admin triggered generation for ${month}/${year}`);
    const result = await generateBillsForMonth(month, year);
    if (result.success) {
        res.json({ message: `Tạo thành công ${result.count} hóa đơn mới cho tháng ${month}/${year}.` });
    } else {
        res.status(500).json({ message: result.error });
    }
});

// SỬA: Xóa '/bills' khỏi route. Giờ đây là '/'
// Route đầy đủ sẽ là: GET /api/admin/bills
router.get('/', protect, isAdmin, async (req, res) => {
    console.log("[Bills GET] API /api/admin/bills called");
    try {
        // SỬA: Dùng schema mới (bills.bill_id, bills.issue_date)
        const query = `
            SELECT b.bill_id, b.status, 
                   to_char(b.issue_date, 'YYYY-MM-DD') AS issue_date,
                   to_char(b.due_date, 'YYYY-MM-DD') AS due_date,
                   b.total_amount, 
                   to_char(b.updated_at, 'YYYY-MM-DD HH24:MI') AS paid_at,
                   u.full_name AS resident_name, 
                   r.room_number AS room_name
            FROM bills b
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN rooms r ON b.room_id = r.id 
            ORDER BY b.issue_date DESC, b.bill_id DESC
        `;
        const { rows } = await db.query(query);
        console.log(`[Bills GET] Query returned ${rows.length} total bills.`);
        res.json(rows);
    } catch (err) {
        console.error('[Bills GET] Error fetching bills:', err);
        res.status(500).json({ message: 'Lỗi server khi tải hóa đơn' });
    }
});

// SỬA: Xóa '/bills' khỏi route. Giờ đây là '/:id'
// Route đầy đủ sẽ là: GET /api/admin/bills/:id
router.get('/:id', protect, isAdmin, async (req, res) => {
    const billId = parseInt(req.params.id);
    try {
        // SỬA: Đọc từ bảng 'bill_items' mới
        const lineItemsRes = await db.query(
            'SELECT item_name, total_item_amount FROM bill_items WHERE bill_id = $1', 
            [billId]
        );
        res.json(lineItemsRes.rows);
    } catch (err) {
        console.error(`Error fetching bill details for ID ${billId}:`, err);
        res.status(500).json({ message: 'Lỗi server khi tải chi tiết hóa đơn' });
    }
});

// SỬA: Xóa '/bills' khỏi route. Giờ đây là '/:id/mark-paid'
// Route đầy đủ sẽ là: POST /api/admin/bills/:id/mark-paid
router.post('/:id/mark-paid', protect, isAdmin, async (req, res) => {
    const billId = parseInt(req.params.id);
    try {
        // SỬA: Dùng 'bill_id' và 'updated_at'
        const result = await db.query(
            "UPDATE bills SET status = 'paid', updated_at = NOW() WHERE bill_id = $1 AND status != 'paid' RETURNING bill_id",
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

// SỬA: Chỉ export router. Hàm logic đã được chuyển đi.
module.exports = router;