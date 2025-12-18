// File: backend/tests/validation.test.js
const { isValidEmail, isStrongPassword, isValidPhoneNumber } = require('../utils/validationUtils');

describe('Unit Test: Module Kiểm tra dữ liệu (Validation Utils)', () => {

    // --- TEST 1: EMAIL ---
    test('VAL-01: Email hợp lệ phải trả về TRUE', () => {
        expect(isValidEmail('admin@gmail.com')).toBe(true);
    });

    test('VAL-02: Email thiếu @ phải trả về FALSE', () => {
        expect(isValidEmail('invalidemail.com')).toBe(false);
    });

    // --- TEST 2: PASSWORD ---
    test('VAL-03: Mật khẩu dài (>=6) phải trả về TRUE', () => {
        expect(isStrongPassword('123456')).toBe(true);
    });

    test('VAL-04: Mật khẩu ngắn (<6) phải trả về FALSE', () => {
        expect(isStrongPassword('12345')).toBe(false);
    });

    // --- TEST 3: PHONE NUMBER (Số điện thoại) ---
    test('VAL-05: SĐT chuẩn VN (10 số, đầu 0) phải trả về TRUE', () => {
        expect(isValidPhoneNumber('0912345678')).toBe(true);
    });

    test('VAL-06: SĐT chứa chữ cái phải trả về FALSE', () => {
        expect(isValidPhoneNumber('0912abc678')).toBe(false); // Nhập bậy bạ
    });

    // --- CASE FAIL GIẢ ĐỊNH (Để báo cáo) ---
    // Giả sử logic cũ của bạn quên check độ dài quá ngắn của SĐT
    test('VAL-07: SĐT quá ngắn (thiếu số) phải bị từ chối', () => {
        // Nhập có 5 số -> Kỳ vọng là False
        const result = isValidPhoneNumber('09123'); 
        expect(result).toBe(false);
    });
});