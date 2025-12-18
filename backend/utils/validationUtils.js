// File: backend/utils/validationUtils.js

/**
 * Kiểm tra định dạng Email
 * Trả về true nếu hợp lệ, false nếu sai
 */
const isValidEmail = (email) => {
    if (!email) return false;
    // Regex cơ bản: chudo@domain.com
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Kiểm tra độ mạnh mật khẩu
 * Quy tắc: Ít nhất 6 ký tự
 */
const isStrongPassword = (password) => {
    if (!password) return false;
    if (password.length < 6) return false;
    return true;
};

/**
 * Kiểm tra số điện thoại VN
 * Quy tắc: Phải là số, độ dài 10 ký tự, bắt đầu bằng số 0
 */
const isValidPhoneNumber = (phone) => {
    if (!phone) return false;
    // Regex: Bắt đầu bằng 0, theo sau là 9 chữ số
    const regex = /^0\d{9}$/;
    return regex.test(phone);
};

module.exports = {
    isValidEmail,
    isStrongPassword,
    isValidPhoneNumber
};