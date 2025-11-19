const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware'); // Chỉ cần 'protect'

// --- API LẤY TẤT CẢ HÓA ĐƠN & CHI TIẾT CỦA USER ---
// GET /api/bills/my-bills-detailed
router.get('/my-bills-detailed', protect, async (req, res) => {
    const residentId = req.user.id; // Đã đúng (UUID)
    try {
        // 1. Lấy tất cả hóa đơn (sắp xếp cái mới nhất/chưa trả lên đầu)
        const billsRes = await db.query(
            `SELECT * FROM bills WHERE user_id = $1 
             ORDER BY 
                 CASE status WHEN 'unpaid' THEN 1 WHEN 'overdue' THEN 2 WHEN 'paid' THEN 3 ELSE 4 END, 
                 issue_date DESC`,
            [residentId]
        );
        if (billsRes.rows.length === 0) {
            return res.json({ bills: [] }); 
        }

        const bills = billsRes.rows;
        const billIds = bills.map(b => b.bill_id); // SỬA: dùng bill_id

        // 2. Lấy TẤT CẢ chi tiết (line items)
        // ==========================================================
        // SỬA LỖI 500 Ở ĐÂY: Phải truy vấn bảng 'bill_items' (bảng mới)
        // ==========================================================
        const lineItemsRes = await db.query(
            'SELECT * FROM bill_items WHERE bill_id = ANY($1::int[])',
            [billIds]
        );

        // 3. Gộp chi tiết vào hóa đơn tương ứng
        const billsWithDetails = bills.map(bill => ({
            ...bill,
            // SỬA: đổi tên thuộc tính để khớp với frontend
            line_items: lineItemsRes.rows.filter(item => item.bill_id === bill.bill_id) 
        }));

        res.json({ bills: billsWithDetails });
    } catch (err) {
        console.error('Error fetching user bills with details:', err);
        res.status(500).json({ message: 'Server error when loading bills.' });
    }
});

// --- API LẤY LỊCH SỬ GIAO DỊCH CỦA USER ---
// GET /api/bills/my-transactions
router.get('/my-transactions', protect, async (req, res) => {
    const residentId = req.user.id;
    try {
        // SỬA: Đọc từ bảng 'transactions' mới
        const transRes = await db.query(
            'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', 
            [residentId]
        );
        res.json(transRes.rows);
    } catch (err) {
        console.error('Error fetching user transactions:', err);
        res.status(500).json({ message: 'Server error when loading transaction history.' });
    }
});

// --- API MOCK (GIẢ LẬP) THANH TOÁN ---
// (API này sẽ được thay thế bằng PayPal, nhưng chúng ta giữ lại để đảm bảo không lỗi)
// POST /api/bills/create-payment
router.post('/create-payment', protect, async (req, res) => {
    const residentId = req.user.id;
    const { bill_id, payment_method } = req.body;

    const pool = db.getPool ? db.getPool() : db;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Lấy thông tin hóa đơn (SỬA: dùng bill_id)
        const billRes = await client.query(
            "SELECT * FROM bills WHERE bill_id = $1 AND user_id = $2 AND status IN ('unpaid', 'overdue')",
            [bill_id, residentId]
        );
        if (billRes.rows.length === 0) {
            throw new Error('Invalid bill or already paid.');
        }
        const bill = billRes.rows[0];
        const amountToPay = bill.total_amount; 

        // 2. Tạo giao dịch (transaction) mới (SỬA: dùng bảng transactions)
        const transCode = `${payment_method.toUpperCase()}-${Date.now()}`;
        const transRes = await client.query(
            `INSERT INTO transactions (bill_id, user_id, paypal_transaction_id, amount, payment_method, status, created_at)
             VALUES ($1, $2, $3, $4, $5, 'pending', NOW()) RETURNING transaction_id`, // SỬA: dùng paypal_transaction_id
            [bill_id, residentId, transCode, amountToPay, payment_method]
        );
        const newTransactionId = transRes.rows[0].transaction_id; // SỬA: dùng transaction_id

        // 3. (GIẢ LẬP) Chờ 2 giây xử lý
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 4. (GIẢ LẬP) Quyết định thành công hay thất bại (90% thành công)
        const isSuccess = Math.random() < 0.9; 

        if (isSuccess) {
            // 5a. Thanh toán thành công (SỬA: dùng transaction_id)
            await client.query(
                "UPDATE transactions SET status = 'success', message = 'Simulated payment successful' WHERE transaction_id = $1",
                [newTransactionId]
            );
            // 5b. Cập nhật hóa đơn (SỬA: dùng bill_id)
            await client.query(
                "UPDATE bills SET status = 'paid', updated_at = NOW() WHERE bill_id = $1",
                [bill_id]
            );
            await client.query('COMMIT');
            res.json({ success: true, message: 'Payment successful!', transaction_code: transCode });
        } else {
            // 5a. Thanh toán thất bại (SỬA: dùng transaction_id)
            await client.query(
                "UPDATE transactions SET status = 'failed', message = 'Simulated payment failed' WHERE transaction_id = $1",
                [newTransactionId]
            );
            await client.query('COMMIT'); 
            res.status(400).json({ success: false, message: 'Payment failed. Bank declined.', transaction_code: transCode });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating payment:', err);
        res.status(500).json({ message: err.message || 'Server error when creating payment.' });
    } finally {
        client.release();
    }
});

module.exports = router;