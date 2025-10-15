// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Lấy token từ header
            token = req.headers.authorization.split(' ')[1];

            // 2. Giải mã token để lấy id người dùng
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Lấy thông tin người dùng từ DB (không bao gồm mật khẩu)
            // và gắn vào đối tượng request để các hàm sau có thể dùng
            const result = await db.query('SELECT id, full_name, email, role FROM users WHERE id = $1', [decoded.id]);
            if (result.rows.length > 0) {
                req.user = result.rows[0];
                next(); // Đi tiếp đến bước xử lý tiếp theo
            } else {
                res.status(401).json({ message: 'Không tìm thấy người dùng.' });
            }

        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Token không hợp lệ, truy cập bị từ chối.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Không có token, truy cập bị từ chối.' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // Nếu là admin, cho đi tiếp
    } else {
        res.status(403).json({ message: 'Truy cập bị từ chối. Cần quyền admin.' });
    }
};

module.exports = { protect, isAdmin };