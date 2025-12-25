const validationUtils = require('../utils/validationUtils');

describe('Validation Utils Unit Tests', () => {

    /**
     * TEST SUITE 1: isValidEmail
     * Kiểm tra định dạng Email
     */
    describe('isValidEmail', () => {
        test('Should return true for valid emails', () => {
            expect(validationUtils.isValidEmail('test@example.com')).toBe(true);
            expect(validationUtils.isValidEmail('user.name@domain.co.vn')).toBe(true);
            expect(validationUtils.isValidEmail('user+tag@domain.org')).toBe(true);
        });

        test('Should return false for invalid emails', () => {
            expect(validationUtils.isValidEmail('invalid-email')).toBe(false); // Thiếu @
            expect(validationUtils.isValidEmail('test@')).toBe(false); // Thiếu domain
            expect(validationUtils.isValidEmail('@domain.com')).toBe(false); // Thiếu username
            expect(validationUtils.isValidEmail('test@domain')).toBe(false); // Thiếu top-level domain (.com)
            expect(validationUtils.isValidEmail('test@ domain.com')).toBe(false); // Chứa khoảng trắng
        });

        test('Should handle empty or null inputs', () => {
            expect(validationUtils.isValidEmail('')).toBe(false);
            expect(validationUtils.isValidEmail(null)).toBe(false);
            expect(validationUtils.isValidEmail(undefined)).toBe(false);
        });
    });

    /**
     * TEST SUITE 2: isStrongPassword
     * Kiểm tra độ mạnh mật khẩu (Quy tắc hiện tại: >= 6 ký tự)
     */
    describe('isStrongPassword', () => {
        test('Should return true for passwords with 6 or more characters', () => {
            expect(validationUtils.isStrongPassword('123456')).toBe(true);
            expect(validationUtils.isStrongPassword('password123')).toBe(true);
            expect(validationUtils.isStrongPassword('verylongpasswordissecure')).toBe(true);
        });

        test('Should return false for passwords shorter than 6 characters', () => {
            expect(validationUtils.isStrongPassword('12345')).toBe(false);
            expect(validationUtils.isStrongPassword('abc')).toBe(false);
            expect(validationUtils.isStrongPassword('1')).toBe(false);
        });

        test('Should handle empty or null inputs', () => {
            expect(validationUtils.isStrongPassword('')).toBe(false);
            expect(validationUtils.isStrongPassword(null)).toBe(false);
            expect(validationUtils.isStrongPassword(undefined)).toBe(false);
        });
    });

    /**
     * TEST SUITE 3: isValidPhoneNumber
     * Kiểm tra số điện thoại VN (Quy tắc: 10 số, bắt đầu bằng 0)
     */
    describe('isValidPhoneNumber', () => {
        test('Should return true for valid VN phone numbers', () => {
            expect(validationUtils.isValidPhoneNumber('0912345678')).toBe(true); // 0 + 9 số
            expect(validationUtils.isValidPhoneNumber('0381234567')).toBe(true);
            expect(validationUtils.isValidPhoneNumber('0861234567')).toBe(true);
        });

        test('Should return false if phone number does not start with 0', () => {
            expect(validationUtils.isValidPhoneNumber('1912345678')).toBe(false);
            expect(validationUtils.isValidPhoneNumber('9912345678')).toBe(false);
        });

        test('Should return false if length is not exactly 10 digits', () => {
            expect(validationUtils.isValidPhoneNumber('091234567')).toBe(false); // 9 số (thiếu)
            expect(validationUtils.isValidPhoneNumber('09123456789')).toBe(false); // 11 số (thừa)
        });

        test('Should return false if contains non-numeric characters', () => {
            expect(validationUtils.isValidPhoneNumber('091234567a')).toBe(false); // Có chữ
            expect(validationUtils.isValidPhoneNumber('0912-34567')).toBe(false); // Có ký tự đặc biệt
        });

        test('Should handle empty or null inputs', () => {
            expect(validationUtils.isValidPhoneNumber('')).toBe(false);
            expect(validationUtils.isValidPhoneNumber(null)).toBe(false);
            expect(validationUtils.isValidPhoneNumber(undefined)).toBe(false);
        });
    });

});