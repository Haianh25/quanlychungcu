// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware'); // Chỉ cần 'protect'

// === GET /api/profile/me ===
// Lấy thông tin hồ sơ của user đang đăng nhập
router.get('/me', protect, async (req, res) => {
    const residentId = req.user.id; // Lấy từ middleware protect
    try {
        // Lấy thông tin cơ bản, không lấy mật khẩu
        const result = await db.query(
            'SELECT id, full_name, email, phone FROM users WHERE id = $1',
            [residentId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ message: 'Lỗi server khi tải hồ sơ.' });
    }
});

// === PUT /api/profile/update-details ===
// Cập nhật thông tin cơ bản (tên, sđt, email)
router.put('/update-details', protect, async (req, res) => {
    const residentId = req.user.id;
    const { fullName, phone, email } = req.body;

    if (!fullName || !phone || !email) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }

    // *** CẢNH BÁO BẢO MẬT ***
    // Cập nhật email trực tiếp như thế này là KHÔNG an toàn.
    // Logic đúng: Cần gửi email xác thực đến địa chỉ email mới.
    // Tạm thời chúng ta chấp nhận rủi ro này để hoàn thành tính năng.
    
    try {
        // Kiểm tra xem email mới (nếu thay đổi) đã tồn tại chưa
        const currentEmailRes = await db.query('SELECT email FROM users WHERE id = $1', [residentId]);
        const currentEmail = currentEmailRes.rows[0].email;

        if (email !== currentEmail) {
            const emailExists = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, residentId]);
            if (emailExists.rows.length > 0) {
                return res.status(400).json({ message: 'Email này đã được sử dụng bởi tài khoản khác.' });
            }
        }
        
        // Cập nhật thông tin
        const result = await db.query(
            'UPDATE users SET full_name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, full_name, email, phone',
            [fullName, email, phone, residentId]
        );

        if (result.rows.length === 0) {
             return res.status(404).json({ message: 'Không tìm thấy người dùng để cập nhật.' });
        }
        
        res.json({
            message: 'Cập nhật thông tin thành công!',
            user: result.rows[0]
        });

    } catch (err) {
        console.error('Error updating user details:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật thông tin.' });
    }
});

// === PUT /api/profile/change-password ===
// Thay đổi mật khẩu
router.put('/change-password', protect, async (req, res) => {
    const residentId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ các trường.' });
    }
    if (newPassword !== confirmPassword) {
         return res.status(400).json({ message: 'Mật khẩu mới không khớp.' });
    }
    if (newPassword.length < 6) { // Nên đồng bộ với logic đăng ký
         return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    try {
        // 1. Lấy mật khẩu hash hiện tại từ DB
        const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [residentId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        const hashedPassword = userRes.rows[0].password_hash;

        // 2. So sánh mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
        }

        // 3. Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const newHashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Cập nhật mật khẩu mới vào DB
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHashedPassword, residentId]);

        res.json({ message: 'Đổi mật khẩu thành công!' });

    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu.' });
    }
});


module.exports = router;