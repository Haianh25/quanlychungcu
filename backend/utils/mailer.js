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

// --- (THÊM MỚI) Hàm gửi email thông báo hóa đơn ---
/**
 * Gửi email thông báo hóa đơn mới.
 * @param {string} email - Email người nhận
 * @param {string} fullName - Tên người nhận
 * @param {object} billDetails - Chi tiết hóa đơn
 * @param {number} billDetails.billId - ID hóa đơn
 * @param {string} billDetails.monthYear - Tháng/Năm của hóa đơn (ví dụ: "11/2025")
 * @param {number} billDetails.totalAmount - Tổng số tiền
 * @param {string} billDetails.dueDate - Ngày hết hạn (đã format)
 */
const sendNewBillEmail = async (email, fullName, billDetails) => {
    const { billId, monthYear, totalAmount, dueDate } = billDetails;
    
    // Format số tiền cho đẹp
    const formattedAmount = totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    const paymentLink = `http://localhost:3000/bill`; // Link tới trang hóa đơn

    const mailOptions = {
        from: '"Quản Lý Chung Cư" <no-reply@quanlychungcu.com>',
        to: email,
        subject: `Thông báo hóa đơn tháng ${monthYear} - Mã HĐ #${billId}`,
        html: `
            <p>Chào ${fullName},</p>
            <p>Ban quản lý xin thông báo hóa đơn dịch vụ tháng <b>${monthYear}</b> của bạn đã được phát hành.</p>
            
            <div style="padding: 15px; background-color: #f4f4f4; border-radius: 5px;">
                <p><b>Mã hóa đơn:</b> #${billId}</p>
                <p><b>Tổng số tiền:</b> <span style="color: #dc3545; font-weight: bold;">${formattedAmount}</span></p>
                <p><b>Hạn thanh toán:</b> ${dueDate}</p>
            </div>
            
            <p>Vui lòng truy cập cổng thông tin cư dân để xem chi tiết và thanh toán trước ngày hết hạn.</p>
            
            <a href="${paymentLink}" target="_blank" style="display: inline-block; padding: 12px 25px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                Xem và thanh toán hóa đơn
            </a>
            
            <p style="margin-top: 20px; font-size: 0.9em; color: #777;">
                Xin cảm ơn.<br>
                Ban Quản Lý PTIT Apartment
            </p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email thông báo hóa đơn #${billId} đã gửi đến:`, email);
    } catch (error) {
        console.error(`Lỗi khi gửi email hóa đơn #${billId} cho ${email}:`, error);
        // Ném lỗi để billService có thể xử lý (hoặc không)
        throw new Error('Không thể gửi email thông báo hóa đơn.');
    }
};
// --- (KẾT THÚC THÊM MỚI) ---


// SỬA: Thêm hàm mới vào exports
module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendNewBillEmail };