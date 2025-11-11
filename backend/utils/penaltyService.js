// File mới: backend/utils/penaltyService.js
const db = require('../db');

/**
 * Tự động kiểm tra và áp dụng phí phạt cho các hóa đơn quá hạn.
 * Chỉ áp dụng 1 LẦN cho các hóa đơn 'unpaid' đã qua 'due_date'.
 */
async function applyLateFees() {
    console.log('[PENALTY_CRON] Đang chạy tác vụ kiểm tra phí phạt...');
    const pool = db.getPool ? db.getPool() : db;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Lấy thông tin phí phạt từ bảng fees
        const feeRes = await client.query("SELECT price FROM fees WHERE fee_code = 'LATE_PAYMENT_FEE'");
        
        if (feeRes.rows.length === 0) {
            console.warn('[PENALTY_CRON] Không tìm thấy LATE_PAYMENT_FEE trong bảng fees. Bỏ qua.');
            await client.query('ROLLBACK');
            client.release();
            return;
        }
        
        const lateFeeAmount = parseFloat(feeRes.rows[0].price);
        if (lateFeeAmount <= 0) {
            console.log('[PENALTY_CRON] Phí phạt được đặt là 0. Không áp dụng.');
            await client.query('COMMIT');
            client.release();
            return;
        }

        // 2. Tìm tất cả hóa đơn 'unpaid' VÀ 'due_date' đã qua
        // Chúng ta chỉ tìm 'unpaid' để tránh phạt nhiều lần (sau khi phạt, status sẽ đổi thành 'overdue')
        const overdueBillsRes = await client.query(
            `SELECT bill_id, total_amount, user_id, room_id 
             FROM bills 
             WHERE status = 'unpaid' AND due_date < NOW()`
        );

        if (overdueBillsRes.rows.length === 0) {
            console.log('[PENALTY_CRON] Không tìm thấy hóa đơn nào quá hạn.');
            await client.query('COMMIT');
            client.release();
            return;
        }

        console.log(`[PENALTY_CRON] Tìm thấy ${overdueBillsRes.rows.length} hóa đơn quá hạn. Đang áp dụng phí...`);

        // 3. Cập nhật từng hóa đơn
        for (const bill of overdueBillsRes.rows) {
            const newTotalAmount = parseFloat(bill.total_amount) + lateFeeAmount;

            // 3a. Cập nhật bảng bills: đổi status -> 'overdue' và tăng tổng tiền
            await client.query(
                `UPDATE bills 
                 SET total_amount = $1, status = 'overdue', updated_at = NOW() 
                 WHERE bill_id = $2`,
                [newTotalAmount, bill.bill_id]
            );

            // 3b. Thêm dòng phí phạt vào bill_items
            await client.query(
                `INSERT INTO bill_items (bill_id, item_name, total_item_amount, quantity) 
                 VALUES ($1, $2, $3, 1)`,
                [bill.bill_id, 'Phí thanh toán muộn', lateFeeAmount]
            );

            // 3c. (Tùy chọn) Gửi thông báo cho cư dân
            const message = `Hóa đơn #${bill.bill_id} của bạn đã quá hạn và bị áp dụng phí phạt ${lateFeeAmount.toLocaleString('vi-VN')} VND.`;
            await client.query(
                `INSERT INTO notifications (user_id, message, link_to) 
                 VALUES ($1, $2, $3)`,
                [bill.user_id, message, '/bills']
            );
        }

        await client.query('COMMIT');
        console.log(`[PENALTY_CRON] Đã áp dụng phí phạt cho ${overdueBillsRes.rows.length} hóa đơn.`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[PENALTY_CRON] Lỗi khi đang áp dụng phí phạt:', err);
    } finally {
        client.release();
    }
}

module.exports = {
    applyLateFees,
};