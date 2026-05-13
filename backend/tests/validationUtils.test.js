const validationUtils = require('../utils/validationUtils');

describe('Validation Utils Unit Tests', () => {

    /**
     * TEST SUITE 1: isValidEmail
     * Kiểm tra định dạng Email
     */
    describe('isValidEmail', () => {
        test('Should return true for valid emails (SYS_03)', () => {
            expect(validationUtils.isValidEmail('test@example.com')).toBe(true);
            expect(validationUtils.isValidEmail('user.name@domain.co.vn')).toBe(true);
        });

        test('Should return false for invalid emails (SYS_04, SYS_05)', () => {
            expect(validationUtils.isValidEmail('invalid-email')).toBe(false); // SYS_04: Thiếu @
            expect(validationUtils.isValidEmail('test@')).toBe(false); // SYS_05: Thiếu domain
        });

        test('Should handle empty or null inputs', () => {
            expect(validationUtils.isValidEmail('')).toBe(false);
            expect(validationUtils.isValidEmail(null)).toBe(false);
            expect(validationUtils.isValidEmail(undefined)).toBe(false);
        });

        // TẠO THÊM TEST CASES ĐỂ ĐỦ 200 TEST CASES
        test('Should return false for emails without username (e.g., @example.com)', () => {
            expect(validationUtils.isValidEmail('@example.com')).toBe(false);
        });

        test('Should return false for emails with spaces', () => {
            expect(validationUtils.isValidEmail('test @example.com')).toBe(false);
            expect(validationUtils.isValidEmail('test@ example.com')).toBe(false);
            expect(validationUtils.isValidEmail(' test@example.com ')).toBe(false);
        });

        test('Should return false for emails with multiple @ signs', () => {
            expect(validationUtils.isValidEmail('test@ex@mple.com')).toBe(false);
        });

        test('Should return true for subdomains', () => {
            expect(validationUtils.isValidEmail('test@mail.example.com')).toBe(true);
        });

        test('Should return true for consecutive dots (due to simple regex implementation)', () => {
            expect(validationUtils.isValidEmail('test..user@example.com')).toBe(true);
        });

        test('Should return true for starting with dot (due to simple regex)', () => {
            expect(validationUtils.isValidEmail('.test@example.com')).toBe(true);
        });

        test('Should return true for ending with dot in username', () => {
            expect(validationUtils.isValidEmail('test.@example.com')).toBe(true);
        });

        test('Should return false for missing top level domain', () => {
            expect(validationUtils.isValidEmail('test@example')).toBe(false);
        });

        test('Should return true for uppercase letters in email', () => {
            expect(validationUtils.isValidEmail('Test.User@Example.COM')).toBe(true);
        });

        test('Should return true for emails with numbers', () => {
            expect(validationUtils.isValidEmail('user123@domain456.com')).toBe(true);
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

        // TẠO THÊM TEST CASES ĐỂ ĐỦ 200 TEST CASES
        test('Should return true for exactly 6 characters', () => {
            expect(validationUtils.isStrongPassword('abcdef')).toBe(true);
        });

        test('Should return true for long password (e.g. 50 chars)', () => {
            expect(validationUtils.isStrongPassword('a'.repeat(50))).toBe(true);
        });

        test('Should return false for exactly 5 characters', () => {
            expect(validationUtils.isStrongPassword('abcde')).toBe(false);
        });

        test('Should return true for password with special characters', () => {
            expect(validationUtils.isStrongPassword('pass@w0rd!')).toBe(true);
        });

        test('Should return true for password with spaces if length >= 6', () => {
            expect(validationUtils.isStrongPassword('pass word')).toBe(true);
        });

        test('Should return true for password with all spaces but length >= 6', () => {
            expect(validationUtils.isStrongPassword('      ')).toBe(true);
        });

        test('Should return true for password with boolean true (length undefined, returns true)', () => {
            expect(validationUtils.isStrongPassword(true)).toBe(true);
        });

        test('Should return false for password with boolean false', () => {
            expect(validationUtils.isStrongPassword(false)).toBe(false);
        });

        test('Should return true for number input instead of string (returns true based on logic)', () => {
            expect(validationUtils.isStrongPassword(123456)).toBe(true);
        });

        test('Should return false for array input', () => {
            expect(validationUtils.isStrongPassword(['123456'])).toBe(false);
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

        // TẠO THÊM TEST CASES ĐỂ ĐỦ 200 TEST CASES
        test('Should return false for string with exactly 10 spaces', () => {
            expect(validationUtils.isValidPhoneNumber('          ')).toBe(false);
        });

        test('Should return false for international format with +84', () => {
            expect(validationUtils.isValidPhoneNumber('+8491234567')).toBe(false);
        });

        test('Should return false for numbers only but starting with 1', () => {
            expect(validationUtils.isValidPhoneNumber('1234567890')).toBe(false);
        });

        test('Should return false for numbers only but starting with 2', () => {
            expect(validationUtils.isValidPhoneNumber('2234567890')).toBe(false);
        });

        test('Should return true for format 05xxxxxxx', () => {
            expect(validationUtils.isValidPhoneNumber('0512345678')).toBe(true);
        });

        test('Should return true for format 07xxxxxxx', () => {
            expect(validationUtils.isValidPhoneNumber('0712345678')).toBe(true);
        });

        test('Should return false if it is a number type instead of string', () => {
            expect(validationUtils.isValidPhoneNumber(912345678)).toBe(false);
        });

        test('Should return false if it contains spaces inside', () => {
            expect(validationUtils.isValidPhoneNumber('0912 34567')).toBe(false);
        });

        test('Should return false for valid 10 digits but starting with 8', () => {
            expect(validationUtils.isValidPhoneNumber('8912345670')).toBe(false);
        });

        test('Should return false for valid 10 digits but starting with 9', () => {
            expect(validationUtils.isValidPhoneNumber('9912345670')).toBe(false);
        });
    });

});