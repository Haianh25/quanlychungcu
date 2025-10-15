// backend/utils/mailer.js
const nodemailer = require('nodemailer');

// Tạo một "transporter" - đối tượng chịu trách nhiệm gửi mail
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// Hàm để gửi email xác thực
const sendVerificationEmail = async (email, token) => {
    // Link mà người dùng sẽ nhấn vào trong email
    const verificationLink = `http://localhost:3000/verify-email/${token}`;

    const mailOptions = {
        from: '"Quản Lý Chung Cư" <no-reply@quanlychungcu.com>', // Địa chỉ người gửi
        to: email, // Địa chỉ người nhận
        subject: 'Xác thực tài khoản của bạn', // Tiêu đề email
        html: `
            <p>Chào bạn,</p>
            <p>Cảm ơn bạn đã đăng ký. Vui lòng nhấn vào link bên dưới để kích hoạt tài khoản:</p>
            <a href="${verificationLink}" target="_blank" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Kích hoạt tài khoản</a>
            <p>Nếu bạn không yêu cầu việc này, vui lòng bỏ qua email.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email xác thực đã được gửi đến:', email);
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        // Ném lỗi ra ngoài để hàm gọi nó có thể xử lý
        throw new Error('Không thể gửi email xác thực.');
    }
};

const sendPasswordResetEmail = async (email, token) => {
    const resetLink = `http://localhost:3000/reset-password/${token}`;

    const mailOptions = {
        from: '"Quản Lý Chung Cư" <no-reply@quanlychungcu.com>',
        to: email,
        subject: 'Yêu cầu đặt lại mật khẩu',
        html: `
            <p>Chào bạn,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào link bên dưới để tiếp tục. Link này sẽ hết hạn sau 1 giờ.</p>
            <a href="${resetLink}" target="_blank" style="padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a>
            <p>Nếu bạn không yêu cầu việc này, vui lòng bỏ qua email.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email đặt lại mật khẩu đã được gửi đến:', email);
    } catch (error) {
        console.error('Lỗi khi gửi email đặt lại mật khẩu:', error);
        throw new Error('Không thể gửi email đặt lại mật khẩu.');
    }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };