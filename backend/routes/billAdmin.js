const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { generateBillsForMonth } = require('../utils/billService');

// --- API Endpoints ---

// POST /api/admin/bills/generate-bills
router.post('/generate-bills', protect, isAdmin, async (req, res) => {
    const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const month = localDate.getMonth() + 1; 
    const year = localDate.getFullYear(); 
    
    console.log(`[Bills] Admin triggered generation for ${month}/${year}`);
    const result = await generateBillsForMonth(month, year);
    if (result.success) {
        res.json({ message: `Successfully generated ${result.count} new bills for ${month}/${year}.` });
    } else {
        res.status(500).json({ message: result.error });
    }
});

// GET /api/admin/bills (Lấy danh sách hóa đơn)
router.get('/', protect, isAdmin, async (req, res) => {
    try {
        // SỬA LỖI TẠI ĐÂY: Thêm JOIN với bảng blocks để lấy block_name
        const query = `
            SELECT b.bill_id, b.status, 
                   to_char(b.issue_date, 'YYYY-MM-DD') AS issue_date,
                   to_char(b.due_date, 'YYYY-MM-DD') AS due_date,
                   b.total_amount, 
                   to_char(b.updated_at, 'YYYY-MM-DD HH24:MI') AS paid_at,
                   u.full_name AS resident_name, 
                   r.room_number AS room_name,
                   bl.name AS block_name  -- <--- Lấy thêm tên Block
            FROM bills b
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN rooms r ON b.room_id = r.id 
            LEFT JOIN blocks bl ON r.block_id = bl.id -- <--- JOIN bảng blocks
            ORDER BY b.issue_date DESC, b.bill_id DESC
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error('[Bills GET] Error fetching bills:', err);
        res.status(500).json({ message: 'Server error while loading bills' });
    }
});

// GET /api/admin/bills/:id (Chi tiết hóa đơn)
router.get('/:id', protect, isAdmin, async (req, res) => {
    const billId = parseInt(req.params.id);
    try {
        const lineItemsRes = await db.query(
            'SELECT item_name, total_item_amount FROM bill_items WHERE bill_id = $1', 
            [billId]
        );
        res.json(lineItemsRes.rows);
    } catch (err) {
        console.error(`Error fetching bill details for ID ${billId}:`, err);
        res.status(500).json({ message: 'Server error while loading bill details' });
    }
});

// POST /api/admin/bills/:id/mark-paid
router.post('/:id/mark-paid', protect, isAdmin, async (req, res) => {
    const billId = parseInt(req.params.id);
    try {
        const result = await db.query(
            "UPDATE bills SET status = 'paid', updated_at = NOW() WHERE bill_id = $1 AND status != 'paid' RETURNING bill_id",
            [billId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Bill not found or already paid.' });
        }
        res.json({ message: `Bill #${billId} has been marked as paid.` });
    } catch (err) {
        console.error(`Error marking bill ${billId} as paid:`, err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;