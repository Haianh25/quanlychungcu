const db = require('../db');

async function applyLateFees() {
    console.log('[PENALTY_CRON] Running Staged Penalty check task...');
    const pool = db.getPool ? db.getPool() : db;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const feeRes = await client.query("SELECT price FROM fees WHERE fee_code = 'LATE_PAYMENT_FEE'");
        let lateFeeAmount = 0;
        if (feeRes.rows.length > 0) {
            lateFeeAmount = parseFloat(feeRes.rows[0].price);
        } else {
            console.warn('[PENALTY_CRON] LATE_PAYMENT_FEE not found. Using 0 VND.');
        }

        const stage1Bills = await client.query(
            `SELECT bill_id, total_amount, user_id, room_id 
             FROM bills 
             WHERE status IN ('unpaid', 'overdue') 
             AND penalty_stage = 0 
             AND due_date < (NOW() - INTERVAL '3 days')`
        );

        if (stage1Bills.rows.length > 0) {
            console.log(`[PENALTY_STAGE_1] Found ${stage1Bills.rows.length} bills.`);
            for (const bill of stage1Bills.rows) {
                const newTotal = parseFloat(bill.total_amount) + lateFeeAmount;
                
                await client.query(
                    `UPDATE bills 
                     SET total_amount = $1, status = 'overdue', penalty_stage = 1, updated_at = NOW() 
                     WHERE bill_id = $2`,
                    [newTotal, bill.bill_id]
                );

                if (lateFeeAmount > 0) {
                    await client.query(
                        `INSERT INTO bill_items (bill_id, item_name, unit_price, total_item_amount, quantity) 
                         VALUES ($1, $2, $3, $4, 1)`,
                        [bill.bill_id, 'Late Fee (Stage 1: >3 Days)', lateFeeAmount, lateFeeAmount]
                    );
                }

                const msg = `Overdue Alert (Level 1): Bill #${bill.bill_id} is 3 days overdue. A late fee has been applied. Please pay immediately.`;
                await client.query(
                    "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                    [bill.user_id, msg, '/bill']
                );
            }
        }

        const stage2Bills = await client.query(
            `SELECT bill_id, total_amount, user_id 
             FROM bills 
             WHERE penalty_stage = 1 
             AND due_date < (NOW() - INTERVAL '6 days')`
        );

        if (stage2Bills.rows.length > 0) {
            console.log(`[PENALTY_STAGE_2] Found ${stage2Bills.rows.length} bills.`);
            for (const bill of stage2Bills.rows) {
                const newTotal = parseFloat(bill.total_amount) + lateFeeAmount;

                await client.query(
                    `UPDATE bills 
                     SET total_amount = $1, penalty_stage = 2, updated_at = NOW() 
                     WHERE bill_id = $2`,
                    [newTotal, bill.bill_id]
                );

                if (lateFeeAmount > 0) {
                    await client.query(
                        `INSERT INTO bill_items (bill_id, item_name, unit_price, total_item_amount, quantity) 
                         VALUES ($1, $2, $3, $4, 1)`,
                        [bill.bill_id, 'Late Fee (Stage 2: >6 Days)', lateFeeAmount, lateFeeAmount]
                    );
                }

                const msg = `URGENT: Bill #${bill.bill_id} is now 6 days overdue. Additional fees applied. Your account risks suspension in 3 days!`;
                await client.query(
                    "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                    [bill.user_id, msg, '/bill']
                );
            }
        }

        const stage3Bills = await client.query(
            `SELECT b.bill_id, b.user_id, u.full_name, u.email, u.apartment_number 
             FROM bills b
             JOIN users u ON b.user_id = u.id
             WHERE b.penalty_stage = 2 
             AND b.due_date < (NOW() - INTERVAL '9 days')`
        );

        if (stage3Bills.rows.length > 0) {
            console.log(`[PENALTY_STAGE_3] Found ${stage3Bills.rows.length} bills. Locking accounts...`);
            
            const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");

            for (const bill of stage3Bills.rows) {
                await client.query(
                    "UPDATE bills SET penalty_stage = 3, updated_at = NOW() WHERE bill_id = $1",
                    [bill.bill_id]
                );

                await client.query(
                    "UPDATE users SET is_active = false WHERE id = $1",
                    [bill.user_id]
                );

                const lockMsg = `ACCOUNT LOCKED: Your account has been suspended due to unpaid bill #${bill.bill_id} (>9 days overdue). Please contact Admin directly.`;
                await client.query(
                    "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                    [bill.user_id, lockMsg, '#']
                );

                const adminMsg = `ACTION REQUIRED: User ${bill.full_name} (${bill.apartment_number}) has been LOCKED due to unpaid bill #${bill.bill_id}.`;
                for (const admin of admins.rows) {
                    await client.query(
                        "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                        [admin.id, adminMsg, '/admin/user-management']
                    );
                }
            }
        }

        await client.query('COMMIT');
        console.log('[PENALTY_CRON] Staged penalty check completed successfully.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[PENALTY_CRON] Error applying staged penalties:', err);
    } finally {
        client.release();
    }
}

async function notifyAdminOverdueBills() {
    console.log('[ADMIN_NOTIFY] Detailed checks are now handled in Staged Penalty logic.');
}

const calculateLateFee = (billAmount, daysLate) => {
    if (billAmount < 0 || daysLate < 0) {
        return 0;
    }

    let penaltyRate = 0;

    if (daysLate <= 3) {
        penaltyRate = 0;
    } else if (daysLate <= 30) {
        penaltyRate = 0.05;
    } else {
        penaltyRate = 0.1;
    }

    return Math.round(billAmount * penaltyRate);
};

module.exports = {
    applyLateFees,
    notifyAdminOverdueBills,
    calculateLateFee
};