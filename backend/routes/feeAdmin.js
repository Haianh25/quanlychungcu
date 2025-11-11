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

module.exports = router;