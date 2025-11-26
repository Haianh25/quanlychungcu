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
        // We only look for 'unpaid' to avoid applying penalty multiple times (status changes to 'overdue' after applying)
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

            // 3a. Update bills table: change status -> 'overdue' and increase total amount
            await client.query(
                `UPDATE bills 
                 SET total_amount = $1, status = 'overdue', updated_at = NOW() 
                 WHERE bill_id = $2`,
                [newTotalAmount, bill.bill_id]
            );

            // 3b. Add late fee item to bill_items
            await client.query(
                `INSERT INTO bill_items (bill_id, item_name, total_item_amount, quantity) 
                 VALUES ($1, $2, $3, 1)`,
                [bill.bill_id, 'Late Payment Fee', lateFeeAmount]
            );

            // 3c. (Optional) Send notification to resident
            const message = `Your invoice #${bill.bill_id} is overdue and a late fee of ${lateFeeAmount.toLocaleString('vi-VN')} VND has been applied.`;
            await client.query(
                `INSERT INTO notifications (user_id, message, link_to) 
                 VALUES ($1, $2, $3)`,
                [bill.user_id, message, '/bills']
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

module.exports = {
    applyLateFees,
};