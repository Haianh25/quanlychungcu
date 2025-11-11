// NỘI DUNG TỆP ĐÃ SỬA LỖI
const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');
const paypal = require('@paypal/checkout-server-sdk');

// --- Cấu hình PayPal ---
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Dùng môi trường Sandbox để test
const environment = new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
const client = new paypal.core.PayPalHttpClient(environment);

// --- API TẠO ĐƠN HÀNG PAYPAL ---
// POST /api/payment/create-order
router.post('/create-order', protect, async (req, res) => {
    const { bill_id } = req.body;
    const userId = req.user.id; // Lấy từ 'protect' middleware (đây là UUID)
    const pool = db.getPool ? db.getPool() : db;
    const dbClient = await pool.connect();

    try {
        // 1. Lấy thông tin hóa đơn
        // SỬA: Đảm bảo truy vấn với đúng kiểu dữ liệu (bill_id là INT, user_id là UUID)
        const billRes = await dbClient.query(
            "SELECT total_amount FROM bills WHERE bill_id = $1 AND user_id = $2 AND status IN ('unpaid', 'overdue')",
            [bill_id, userId]
        );
        if (billRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn chưa thanh toán.' });
        }
        
        const totalVND = parseFloat(billRes.rows[0].total_amount);
        
        // (QUAN TRỌNG) PayPal không hỗ trợ VND, bạn phải đổi sang USD
        // Giả sử tỷ giá 1 USD = 25000 VND (Bạn nên dùng API tỷ giá nếu cần)
        const exchangeRate = 25000; 
        const totalUSD = (totalVND / exchangeRate).toFixed(2);

        if (totalUSD < 0.01) {
            return res.status(400).json({ message: 'Số tiền quá nhỏ để thanh toán.' });
        }

        // 2. Tạo yêu cầu đơn hàng PayPal
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: totalUSD,
                },
                description: `Thanh toan hoa don #${bill_id} - Quan Ly Chung Cu`,
                custom_id: bill_id.toString() // Gửi ID hóa đơn của bạn
            }]
        });

        const order = await client.execute(request);
        const orderID = order.result.id;

        // 3. Tạo giao dịch (transaction) ở trạng thái 'pending'
        // SỬA: Đảm bảo INSERT với đúng kiểu dữ liệu (bill_id là INT, user_id là UUID)
        await dbClient.query(
            `INSERT INTO transactions (bill_id, user_id, amount, payment_method, status, paypal_transaction_id)
             VALUES ($1, $2, $3, 'paypal', 'pending', $4)`,
            [bill_id, userId, totalVND, orderID]
        );

        res.status(200).json({ orderID });

    } catch (err) {
        console.error('Error creating PayPal order:', err);
        res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng PayPal.' });
    } finally {
        dbClient.release();
    }
});

// --- API XÁC NHẬN (CAPTURE) ĐƠN HÀNG PAYPAL ---
// POST /api/payment/capture-order
router.post('/capture-order', protect, async (req, res) => {
    const { orderID } = req.body;
    const userId = req.user.id; // Đây là UUID
    const pool = db.getPool ? db.getPool() : db;
    const dbClient = await pool.connect();

    try {
        await dbClient.query('BEGIN');
        
        // 1. Lấy thông tin giao dịch 'pending' (SỬA: Dùng đúng kiểu UUID)
        const transRes = await dbClient.query(
            "SELECT * FROM transactions WHERE paypal_transaction_id = $1 AND user_id = $2 AND status = 'pending'",
            [orderID, userId]
        );
        if (transRes.rows.length === 0) {
            throw new Error('Không tìm thấy giao dịch đang chờ xử lý.');
        }
        const transaction = transRes.rows[0];
        const bill_id = transaction.bill_id; // Đây là INT

        // 2. Gửi yêu cầu capture tới PayPal
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});
        const capture = await client.execute(request);
        
        const captureStatus = capture.result.status;

        if (captureStatus === 'COMPLETED') {
            // 3a. Thành công: Cập nhật transaction (SỬA: Dùng transaction_id)
            await dbClient.query(
                "UPDATE transactions SET status = 'success', message = 'Thanh toán PayPal thành công' WHERE transaction_id = $1",
                [transaction.transaction_id]
            );
            // 3b. Cập nhật bill
            await dbClient.query(
                "UPDATE bills SET status = 'paid', updated_at = NOW() WHERE bill_id = $1",
                [bill_id]
            );
            await dbClient.query('COMMIT');
            res.json({ success: true, message: 'Thanh toán thành công!' });
        } else {
            // 4. Thất bại (ví dụ: bị từ chối)
            throw new Error(`Thanh toán PayPal không thành công. Trạng thái: ${captureStatus}`);
        }
    } catch (err) {
        // 5. Lỗi
        await dbClient.query('ROLLBACK');
        // Cập nhật giao dịch là 'failed'
        await dbClient.query(
            "UPDATE transactions SET status = 'failed', message = $1 WHERE paypal_transaction_id = $2 AND status = 'pending'",
            [err.message, orderID]
        );
        console.error('Error capturing PayPal order:', err);
        res.status(500).json({ message: err.message || 'Lỗi server khi xác nhận thanh toán.' });
    } finally {
        dbClient.release();
    }
});

module.exports = router;