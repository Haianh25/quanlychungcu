const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { generateBillsForMonth } = require('../utils/billService');
const { applyLateFees } = require('../utils/penaltyService'); 

// --- ROUTE TẠO HÓA ĐƠN HÀNG THÁNG & GỬI THÔNG BÁO ---
router.post('/generate-bills', protect, isAdmin, async (req, res) => {
    const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const month = localDate.getMonth() + 1; 
    const year = localDate.getFullYear(); 
    
    console.log(`[Bills] Admin triggered generation for ${month}/${year}`);
    
    try {
        // 1. Gọi hàm tạo hóa đơn (Hàm này đã lo việc gửi Email)
        const result = await generateBillsForMonth(month, year);

        if (result.success) {
            // --- PHẦN TÍCH HỢP REAL-TIME SOCKET ---
            // Sau khi tạo xong, chúng ta tìm danh sách hóa đơn vừa tạo của tháng này để bắn thông báo
            const newBillsQuery = `
                SELECT b.bill_id, b.user_id, b.total_amount 
                FROM bills b
                WHERE EXTRACT(MONTH FROM b.issue_date) = $1 
                AND EXTRACT(YEAR FROM b.issue_date) = $2
            `;
            const { rows: newBills } = await db.query(newBillsQuery, [month, year]);

            console.log(`[Socket] Sending notifications for ${newBills.length} bills...`);

            // Duyệt qua từng hóa đơn để gửi thông báo
            for (const bill of newBills) {
                const userId = bill.user_id;
                const message = `Hóa đơn tháng ${month}/${year} đã được tạo. Tổng tiền: ${parseFloat(bill.total_amount).toLocaleString()} VND.`;
                const linkTo = '/bill';

                // B1: Lưu thông báo vào Database (Để hiện trong danh sách lịch sử)
                const notiRes = await db.query(
                    `INSERT INTO notifications (user_id, message, link_to, is_read, created_at) 
                     VALUES ($1, $2, $3, false, NOW()) 
                     RETURNING *`,
                    [userId, message, linkTo]
                );
                const notificationData = notiRes.rows[0];

                // B2: Bắn Socket Real-time
                const socketId = global.userSocketMap ? global.userSocketMap[userId] : null;
                if (socketId) {
                    global.io.to(socketId).emit('newNotification', notificationData);
                }
            }
            // --- KẾT THÚC PHẦN SOCKET ---

            res.json({ message: `Successfully generated ${result.count} new bills for ${month}/${year} and sent real-time notifications.` });
        } else {
            res.status(500).json({ message: result.error });
        }
    } catch (err) {
        console.error('Error generating bills:', err);
        res.status(500).json({ message: 'Server error during bill generation' });
    }
});

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

// --- ROUTE TÍNH PHÍ PHẠT & GỬI THÔNG BÁO ---
router.post('/trigger-late-fees', protect, isAdmin, async (req, res) => {
    const pool = db.getPool ? db.getPool() : db;
    const client = await pool.connect();
    try {
        const feeCheck = await client.query("SELECT * FROM fees WHERE fee_code = 'LATE_PAYMENT_FEE'");
        if (feeCheck.rows.length === 0) {
             return res.json({ success: false, reason: "Lỗi: Chưa cấu hình 'LATE_PAYMENT_FEE' trong bảng fees." });
        }

        // Tìm những hóa đơn SẮP bị phạt (Quá hạn và chưa trả)
        const billsCheck = await client.query("SELECT bill_id, user_id, due_date FROM bills WHERE status = 'unpaid' AND due_date < NOW()");
        
        if (billsCheck.rows.length === 0) {
             return res.json({ 
                 success: false, 
                 reason: "Không tìm thấy hóa đơn nào quá hạn.",
                 debug_info: "Hãy chắc chắn bạn đã chạy lệnh SQL cập nhật due_date về quá khứ (ví dụ ngày hôm qua) cho bill status='unpaid'."
             });
        }

        // Chạy hàm tính phạt
        await applyLateFees();
        
        // --- PHẦN TÍCH HỢP REAL-TIME SOCKET CHO PHÍ PHẠT ---
        console.log(`[Socket] Sending penalty notifications for ${billsCheck.rows.length} users...`);
        
        for (const bill of billsCheck.rows) {
            const userId = bill.user_id;
            const message = `Hóa đơn #${bill.bill_id} đã quá hạn. Phí phạt trả chậm đã được áp dụng.`;
            const linkTo = '/bill';

            // B1: Lưu DB
            const notiRes = await client.query(
                `INSERT INTO notifications (user_id, message, link_to, is_read, created_at) 
                 VALUES ($1, $2, $3, false, NOW()) 
                 RETURNING *`,
                [userId, message, linkTo]
            );
            const notificationData = notiRes.rows[0];

            // B2: Bắn Socket
            const socketId = global.userSocketMap ? global.userSocketMap[userId] : null;
            if (socketId) {
                global.io.to(socketId).emit('newNotification', notificationData);
            }
        }
        // --- KẾT THÚC ---

        res.json({ 
            success: true, 
            message: 'Đã chạy tính phí phạt thành công và gửi thông báo.',
            bills_affected: billsCheck.rows.map(b => b.bill_id) 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi chạy debug phí phạt.', error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;