// File: backend/utils/penaltyService.js
const db = require('../db');

/**
 * Automatically checks and applies late fees to overdue bills.
 * Applies only ONCE for 'unpaid' bills that are past 'due_date'.
 */
async function applyLateFees() {
    console.log('[PENALTY_CRON] Running late fee check task...');
    const pool = db.getPool ? db.getPool() : db;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Get late fee info from fees table
        const feeRes = await client.query("SELECT price FROM fees WHERE fee_code = 'LATE_PAYMENT_FEE'");
        
        if (feeRes.rows.length === 0) {
            console.warn('[PENALTY_CRON] LATE_PAYMENT_FEE not found in fees table. Skipping.');
            await client.query('ROLLBACK');
            client.release();
            return;
        }
        
        const lateFeeAmount = parseFloat(feeRes.rows[0].price);
        if (lateFeeAmount <= 0) {
            console.log('[PENALTY_CRON] Late fee is set to 0. Not applying.');
            await client.query('COMMIT');
            client.release();
            return;
        }

        // 2. Find all 'unpaid' AND past 'due_date' bills
        const overdueBillsRes = await client.query(
            `SELECT bill_id, total_amount, user_id, room_id 
             FROM bills 
             WHERE status = 'unpaid' AND due_date < NOW()`
        );

        if (overdueBillsRes.rows.length === 0) {
            console.log('[PENALTY_CRON] No overdue bills found.');
            await client.query('COMMIT');
            client.release();
            return;
        }

        console.log(`[PENALTY_CRON] Found ${overdueBillsRes.rows.length} overdue bills. Applying fees...`);

        // 3. Update each bill
        for (const bill of overdueBillsRes.rows) {
            const newTotalAmount = parseFloat(bill.total_amount) + lateFeeAmount;

            // 3a. Update bills table
            await client.query(
                `UPDATE bills 
                 SET total_amount = $1, status = 'overdue', updated_at = NOW() 
                 WHERE bill_id = $2`,
                [newTotalAmount, bill.bill_id]
            );

            // 3b. Add late fee item
            // [FIXED] Thêm cột unit_price vào đây để tránh lỗi NOT NULL
            await client.query(
                `INSERT INTO bill_items (bill_id, item_name, unit_price, total_item_amount, quantity) 
                 VALUES ($1, $2, $3, $4, 1)`,
                [bill.bill_id, 'Late Payment Fee', lateFeeAmount, lateFeeAmount]
            );

            // 3c. (Optional) Send notification to resident
            const message = `Your invoice #${bill.bill_id} is overdue and a late fee of ${lateFeeAmount.toLocaleString('vi-VN')} VND has been applied.`;
            await client.query(
                `INSERT INTO notifications (user_id, message, link_to) 
                 VALUES ($1, $2, $3)`,
                [bill.user_id, message, '/bill']
            );
        }

        await client.query('COMMIT');
        console.log(`[PENALTY_CRON] Applied late fees to ${overdueBillsRes.rows.length} bills.`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[PENALTY_CRON] Error applying late fees:', err);
    } finally {
        client.release();
    }
}

/**
 * [MỚI] Hàm kiểm tra và báo cáo Admin các hóa đơn quá hạn nghiêm trọng (3 ngày)
 */
async function notifyAdminOverdueBills() {
    console.log('[ADMIN_NOTIFY_CRON] Checking for seriously overdue bills (3+ days)...');
    const pool = db.getPool ? db.getPool() : db;
    const client = await pool.connect();

    try {
        // Tìm các hóa đơn chưa trả (unpaid hoặc overdue)
        // và có ngày hết hạn (due_date) nhỏ hơn ngày hiện tại - 3 ngày
        // (Tức là đã quá hạn ít nhất 3 ngày)
        const seriousBills = await client.query(
            `SELECT b.bill_id, u.full_name, u.apartment_number, b.total_amount, b.due_date
             FROM bills b
             JOIN users u ON b.user_id = u.id
             WHERE b.status IN ('unpaid', 'overdue') 
             AND b.due_date < (NOW() - INTERVAL '3 days')`
        );

        if (seriousBills.rows.length === 0) {
            console.log('[ADMIN_NOTIFY_CRON] No seriously overdue bills found.');
            return;
        }

        console.log(`[ADMIN_NOTIFY_CRON] Found ${seriousBills.rows.length} seriously overdue bills.`);

        // Lấy danh sách Admin để gửi thông báo
        const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
        
        // Gửi 1 thông báo tổng hợp cho Admin (để đỡ spam nhiều noti)
        const count = seriousBills.rows.length;
        const message = `Alert: There are ${count} bills overdue by more than 3 days. Please review Bill Management for enforcement actions.`;
        const linkTo = '/admin/bill-management?status=overdue';

        for (const admin of admins.rows) {
            // Kiểm tra xem đã gửi thông báo này hôm nay chưa để tránh spam (tùy chọn)
            // Ở đây gửi luôn cho đơn giản
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [admin.id, message, linkTo]
            );
        }
        
        console.log('[ADMIN_NOTIFY_CRON] Notifications sent to Admins.');

    } catch (err) {
        console.error('[ADMIN_NOTIFY_CRON] Error notifying admins:', err);
    } finally {
        client.release();
    }
}

module.exports = {
    applyLateFees,
    notifyAdminOverdueBills // [MỚI] Export thêm hàm này
};