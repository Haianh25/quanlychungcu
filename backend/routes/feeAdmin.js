const express = require('express');
const router = express.Router();
const db = require('../db'); 
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/', protect, isAdmin, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM fees ORDER BY fee_id ASC');
        res.json(rows);
    } catch (err) {
        console.error('Error while fetching the fee list.:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', protect, isAdmin, async (req, res) => {
    const { fee_name, fee_code, price, description } = req.body;

    if (!fee_name || !fee_code || !price) {
        return res.status(400).json({ message: 'Please fill in all required fields: Name, Code, and Price.' });
    }
    try {
        const check = await db.query('SELECT 1 FROM fees WHERE fee_code = $1', [fee_code.toUpperCase()]);
        if (check.rows.length > 0) {
            return res.status(409).json({ message: 'This fee code already exists. Please choose a different code.' });
        }

        const { rows } = await db.query(
            'INSERT INTO fees (fee_name, fee_code, price, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [fee_name, fee_code.toUpperCase(), price, description]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error while adding new fee:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', protect, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { fee_name, price, description } = req.body;

    if (!fee_name || !price) {
        return res.status(400).json({ message: 'Please fill in all required fields: Name and Price.' });
    }

    try {
        const { rows } = await db.query(
            'UPDATE fees SET fee_name = $1, price = $2, description = $3, updated_at = NOW() WHERE fee_id = $4 RETURNING *',
            [fee_name, price, description, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Fee not found.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error while updating fee:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});
router.delete('/:id', protect, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // (An toàn) Kiểm tra xem phí này có phải là phí cốt lõi không
        const feeCheck = await db.query('SELECT fee_code FROM fees WHERE fee_id = $1', [id]);
        if (feeCheck.rows.length > 0 && 
            (feeCheck.rows[0].fee_code === 'MANAGEMENT_FEE' || feeCheck.rows[0].fee_code === 'ADMIN_FEE')) {
            return res.status(400).json({ message: 'Cannot delete core system fees.' });
        }

        // Proceed to delete
        const { rowCount } = await db.query('DELETE FROM fees WHERE fee_id = $1', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Fee not found.' });
        }
        res.json({ message: 'Fee deleted successfully.' });
    } catch (err) {
        console.error('Error while deleting fee:', err.message);
        // Check for foreign key constraint error (if the fee has been used in old invoices)
        if (err.code === '23503') { 
            return res.status(400).json({ message: 'Deletion failed. This fee has been used in old invoices and cannot be deleted.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});
module.exports = router;