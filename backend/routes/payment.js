const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');
const paypal = require('@paypal/checkout-server-sdk');

// --- PayPal Configuration ---
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Use Sandbox environment for testing
const environment = new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
const client = new paypal.core.PayPalHttpClient(environment);

// --- API CREATE PAYPAL ORDER ---
// POST /api/payment/create-order
router.post('/create-order', protect, async (req, res) => {
    const { bill_id } = req.body;
    const userId = req.user.id; // Get from 'protect' middleware (UUID)
    const pool = db.getPool ? db.getPool() : db;
    const dbClient = await pool.connect();

    try {
        // 1. Get bill information
        // FIX: Ensure query with correct data types (bill_id is INT, user_id is UUID)
        const billRes = await dbClient.query(
            "SELECT total_amount FROM bills WHERE bill_id = $1 AND user_id = $2 AND status IN ('unpaid', 'overdue')",
            [bill_id, userId]
        );
        if (billRes.rows.length === 0) {
            return res.status(404).json({ message: 'No unpaid invoices found.' });
        }
        
        const totalVND = parseFloat(billRes.rows[0].total_amount);
        
        // (IMPORTANT) PayPal does not support VND, convert to USD
        // Assume exchange rate 1 USD = 25000 VND
        const exchangeRate = 25000;
        const totalUSD = (totalVND / exchangeRate).toFixed(2);

        if (totalUSD < 0.01) {
            return res.status(400).json({ message: 'The amount is too small to process the payment.' });
        }

        // 2. Create PayPal order request
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: totalUSD,
                },
                description: `Payment for invoice #${bill_id} - Apartment Management`,
                custom_id: bill_id.toString() // Send invoice ID
            }]
        });

        const order = await client.execute(request);
        const orderID = order.result.id;

        // 3. Create pending transaction
        // FIX: Ensure INSERT with correct data types
        await dbClient.query(
            `INSERT INTO transactions (bill_id, user_id, amount, payment_method, status, paypal_transaction_id)
             VALUES ($1, $2, $3, 'paypal', 'pending', $4)`,
            [bill_id, userId, totalVND, orderID]
        );

        res.status(200).json({ orderID });

    } catch (err) {
        console.error('Error creating PayPal order:', err);
        res.status(500).json({ message: 'Server error when creating PayPal order.' });
    } finally {
        dbClient.release();
    }
});

// --- API CAPTURE PAYPAL ORDER ---
// POST /api/payment/capture-order
router.post('/capture-order', protect, async (req, res) => {
    const { orderID } = req.body;
    const userId = req.user.id; // UUID
    const pool = db.getPool ? db.getPool() : db;
    const dbClient = await pool.connect();

    try {
        await dbClient.query('BEGIN');
        
        // 1. Get pending transaction info
        const transRes = await dbClient.query(
            "SELECT * FROM transactions WHERE paypal_transaction_id = $1 AND user_id = $2 AND status = 'pending'",
            [orderID, userId]
        );
        if (transRes.rows.length === 0) {
            throw new Error('No pending transaction found.');
        }
        const transaction = transRes.rows[0];
        const bill_id = transaction.bill_id; // INT

        // 2. Send capture request to PayPal
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});
        const capture = await client.execute(request);
        const captureStatus = capture.result.status;

        if (captureStatus === 'COMPLETED') {
            // 3a. Success: Update transaction
            await dbClient.query(
                "UPDATE transactions SET status = 'success', message = 'PayPal payment successful' WHERE transaction_id = $1",
                [transaction.transaction_id]
            );
            
            // 3b. Update bill
            await dbClient.query(
                "UPDATE bills SET status = 'paid', updated_at = NOW() WHERE bill_id = $1",
                [bill_id]
            );

            // --- [MỚI] 3c. Gửi thông báo cho User ---
            const message = `Payment Successful! Invoice #${bill_id} has been paid via PayPal.`;
            await dbClient.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [userId, message, '/bill']
            );
            // ----------------------------------------

            await dbClient.query('COMMIT');
            res.json({ success: true, message: 'Payment successful!' });
        } else {
            // 4. Failed
            throw new Error(`PayPal payment failed. Status: ${captureStatus}`);
        }
    } catch (err) {
        // 5. Error
        await dbClient.query('ROLLBACK');
        
        // Update transaction to 'failed'
        await dbClient.query(
            "UPDATE transactions SET status = 'failed', message = $1 WHERE paypal_transaction_id = $2 AND status = 'pending'",
            [err.message, orderID]
        );

        console.error('Error capturing PayPal order:', err);
        res.status(500).json({ message: err.message || 'Server error verifying payment.' });
    } finally {
        dbClient.release();
    }
});

module.exports = router;