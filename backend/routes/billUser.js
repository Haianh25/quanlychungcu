// backend/routes/billUser.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware'); // Chỉ cần 'protect'

// --- API LẤY TẤT CẢ HÓA ĐƠN & CHI TIẾT CỦA USER ---
// GET /api/bills/my-bills-detailed
router.get('/my-bills-detailed', protect, async (req, res) => {
    const residentId = req.user.id;
    try {
        // 1. Lấy tất cả hóa đơn (sắp xếp cái mới nhất/chưa trả lên đầu)
        const billsRes = await db.query(
            `SELECT * FROM bills WHERE user_id = $1 
             ORDER BY 
                CASE status WHEN 'unpaid' THEN 1 WHEN 'overdue' THEN 2 WHEN 'paid' THEN 3 ELSE 4 END, 
                month_for DESC`,
            [residentId]
        );
        if (billsRes.rows.length === 0) {
            return res.json({ bills: [] }); // Trả về mảng rỗng nếu không có bill
        }

        const bills = billsRes.rows;
        const billIds = bills.map(b => b.id); // Lấy danh sách ID

        // 2. Lấy TẤT CẢ chi tiết (line items) của các hóa đơn đó trong 1 lần gọi
        const lineItemsRes = await db.query(
            'SELECT * FROM bill_line_items WHERE bill_id = ANY($1::int[])',
            [billIds]
        );

        // 3. Gộp chi tiết vào hóa đơn tương ứng
        const billsWithDetails = bills.map(bill => ({
            ...bill,
            // Tìm tất cả line_items có bill_id khớp
            line_items: lineItemsRes.rows.filter(item => item.bill_id === bill.id) 
        }));

        res.json({ bills: billsWithDetails });
    } catch (err) {
        console.error('Error fetching user bills with details:', err);
        res.status(500).json({ message: 'Lỗi server khi tải hóa đơn.' });
    }
});

// --- API LẤY LỊCH SỬ GIAO DỊCH CỦA USER ---
// GET /api/bills/my-transactions
router.get('/my-transactions', protect, async (req, res) => {
    const residentId = req.user.id;
    try {
        const transRes = await db.query(
            'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', // Lấy 50 giao dịch gần nhất
            [residentId]
        );
        res.json(transRes.rows);
    } catch (err) {
        console.error('Error fetching user transactions:', err);
        res.status(500).json({ message: 'Lỗi server khi tải lịch sử giao dịch.' });
    }
});

// --- API MOCK (GIẢ LẬP) THANH TOÁN ---
// POST /api/bills/create-payment
router.post('/create-payment', protect, async (req, res) => {
    const residentId = req.user.id;
    const { bill_id, payment_method } = req.body;

    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Lấy thông tin hóa đơn
        const billRes = await client.query(
            "SELECT * FROM bills WHERE id = $1 AND user_id = $2 AND status IN ('unpaid', 'overdue')",
            [bill_id, residentId]
        );
        if (billRes.rows.length === 0) {
            throw new Error('Hóa đơn không hợp lệ hoặc đã được thanh toán.');
        }
        const bill = billRes.rows[0];
        const amountToPay = bill.total_amount; // Lấy số tiền từ bill

        // 2. Tạo giao dịch (transaction) mới
        const transCode = `${payment_method.toUpperCase()}-${Date.now()}`;
        const transRes = await client.query(
            `INSERT INTO transactions (bill_id, user_id, transaction_code, amount, payment_method, status, created_at)
             VALUES ($1, $2, $3, $4, $5, 'pending', NOW()) RETURNING id`,
            [bill_id, residentId, transCode, amountToPay, payment_method]
        );
        const newTransactionId = transRes.rows[0].id;

        // 3. (GIẢ LẬP) Chờ 2 giây xử lý
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 4. (GIẢ LẬP) Quyết định thành công hay thất bại (90% thành công)
        const isSuccess = Math.random() < 0.9; 

        if (isSuccess) {
            // 5a. Thanh toán thành công
            await client.query(
                "UPDATE transactions SET status = 'success', processed_at = NOW() WHERE id = $1",
                [newTransactionId]
            );
            // 5b. Cập nhật hóa đơn
            await client.query(
                "UPDATE bills SET status = 'paid', paid_at = NOW() WHERE id = $1",
                [bill_id]
            );
            await client.query('COMMIT');
            res.json({ success: true, message: 'Thanh toán thành công!', transaction_code: transCode });
        } else {
            // 5a. Thanh toán thất bại
            await client.query(
                "UPDATE transactions SET status = 'failed', processed_at = NOW() WHERE id = $1",
                [newTransactionId]
            );
            await client.query('COMMIT'); // Vẫn commit để lưu lại giao dịch thất bại
            res.status(400).json({ success: false, message: 'Thanh toán thất bại. Ngân hàng từ chối.', transaction_code: transCode });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating payment:', err);
        res.status(500).json({ message: err.message || 'Lỗi server khi tạo thanh toán.' });
    } finally {
        client.release();
    }
});

module.exports = router;