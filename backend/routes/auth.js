const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Dòng import mailer đã được gộp lại chính xác ở đây
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

const router = express.Router();

// Hàm kiểm tra độ mạnh mật khẩu
const isStrongPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

// API ĐĂNG KÝ
router.post('/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }
    if (!isStrongPassword(password)) {
        return res.status(400).json({
            message: 'Mật khẩu không đủ mạnh. Mật khẩu phải dài ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'
        });
    }
    try {
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'Email đã được sử dụng.' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const newUser = await db.query(
            'INSERT INTO users (full_name, email, password_hash, verification_token) VALUES ($1, $2, $3, $4) RETURNING id, email',
            [fullName, email, passwordHash, verificationToken]
        );
        await sendVerificationEmail(newUser.rows[0].email, verificationToken);
        res.status(201).json({ message: 'Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.' });
    } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra ở server.' });
    }
});

// API XÁC THỰC EMAIL
router.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const user = await db.query('SELECT * FROM users WHERE verification_token = $1', [token]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }
        await db.query('UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1', [user.rows[0].id]);
        res.status(200).json({ message: 'Xác thực tài khoản thành công!' });
    } catch (error) {
        console.error('Lỗi khi xác thực email:', error);
        res.status(500).json({ message: 'Lỗi server khi xác thực email.' });
    }
});

// API ĐĂNG NHẬP
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu.' });
    }
    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }
        const foundUser = user.rows[0];
        if (!foundUser.is_verified) {
            return res.status(403).json({ message: 'Vui lòng xác thực email trước khi đăng nhập.' });
        }
        const isPasswordCorrect = await bcrypt.compare(password, foundUser.password_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }
        const token = jwt.sign({ id: foundUser.id, email: foundUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Đăng nhập thành công!', token: token });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
    }
});

// API YÊU CẦU QUÊN MẬT KHẨU
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(200).json({ message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được một link đặt lại mật khẩu.' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 giờ sau
        await db.query('UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3', [resetToken, expires, email]);
        await sendPasswordResetEmail(email, resetToken);
        res.status(200).json({ message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được một link đặt lại mật khẩu.' });
    } catch (error) {
        console.error('Lỗi ở forgot-password:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// API XỬ LÝ ĐẶT LẠI MẬT KHẨU
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    if (!isStrongPassword(newPassword)) {
        return res.status(400).json({ message: 'Mật khẩu mới không đủ mạnh.' });
    }
    try {
        const user = await db.query('SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()', [token]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        await db.query('UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2', [passwordHash, user.rows[0].id]);
        res.status(200).json({ message: 'Mật khẩu đã được đặt lại thành công!' });
    } catch (error) {
        console.error('Lỗi ở reset-password:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
});
router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu.' });
    }

    try {
        // 1. Tìm người dùng bằng email
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }

        const foundUser = user.rows[0];

        // 2. KIỂM TRA QUYỀN ADMIN
        if (foundUser.role !== 'admin') {
            return res.status(403).json({ message: 'Truy cập bị từ chối. Tài khoản không có quyền quản trị.' });
        }

        // 3. So sánh mật khẩu
        const isPasswordCorrect = await bcrypt.compare(password, foundUser.password_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }

        // 4. Tạo JWT với thông tin vai trò (role)
        const token = jwt.sign(
            {
                id: foundUser.id,
                email: foundUser.email,
                role: foundUser.role // Thêm role vào token
            },
            process.env.JWT_SECRET,
            { expiresIn: '3h' }
        );

        res.status(200).json({
            message: 'Đăng nhập admin thành công!',
            token: token,
        });

    } catch (error) {
        console.error('Lỗi khi admin đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
    }
});
module.exports = router;