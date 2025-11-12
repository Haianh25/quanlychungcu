const express = require('express');
const router = express.Router();
const db = require('../db'); 
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/', protect, isAdmin, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM fees ORDER BY fee_id ASC');
        res.json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách phí:', err.message);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/', protect, isAdmin, async (req, res) => {
    const { fee_name, fee_code, price, description } = req.body;

    if (!fee_name || !fee_code || !price) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ Tên, Mã, và Giá Phí.' });
    }
    try {
        const check = await db.query('SELECT 1 FROM fees WHERE fee_code = $1', [fee_code.toUpperCase()]);
        if (check.rows.length > 0) {
            return res.status(409).json({ message: 'Mã Phí (Key) này đã tồn tại. Vui lòng chọn mã khác.' });
        }

        const { rows } = await db.query(
            'INSERT INTO fees (fee_name, fee_code, price, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [fee_name, fee_code.toUpperCase(), price, description]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Lỗi khi thêm phí mới:', err.message);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

router.put('/:id', protect, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { fee_name, price, description } = req.body;

    if (!fee_name || !price) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ Tên và Giá Phí.' });
    }

    try {
        const { rows } = await db.query(
            'UPDATE fees SET fee_name = $1, price = $2, description = $3, updated_at = NOW() WHERE fee_id = $4 RETURNING *',
            [fee_name, price, description, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phí này.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Lỗi khi cập nhật phí:', err.message);
        res.status(500).json({ message: 'Lỗi server' });
    }
});
router.delete('/:id', protect, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // (An toàn) Kiểm tra xem phí này có phải là phí cốt lõi không
        const feeCheck = await db.query('SELECT fee_code FROM fees WHERE fee_id = $1', [id]);
        if (feeCheck.rows.length > 0 && 
            (feeCheck.rows[0].fee_code === 'MANAGEMENT_FEE' || feeCheck.rows[0].fee_code === 'ADMIN_FEE')) {
            return res.status(400).json({ message: 'Không thể xóa các loại phí hệ thống cốt lõi.' });
        }

        // Tiến hành xóa
        const { rowCount } = await db.query('DELETE FROM fees WHERE fee_id = $1', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phí này để xóa.' });
        }
        res.json({ message: 'Đã xóa phí thành công.' });
    } catch (err) {
        console.error('Lỗi khi xóa phí:', err.message);
        // Kiểm tra lỗi khóa ngoại (nếu phí đã được dùng trong hóa đơn cũ)
        if (err.code === '23503') { 
            return res.status(400).json({ message: 'Xóa thất bại. Phí này đã được sử dụng trong các hóa đơn cũ và không thể xóa.' });
        }
        res.status(500).json({ message: 'Lỗi server' });
    }
});
module.exports = router;