const validationUtils = require('../utils/validationUtils');

describe('Validation Utils Unit Tests', () => {

    /**
     * TEST SUITE 1: isValidEmail (SYS_03 – SYS_06)
     */
    describe('isValidEmail', () => {
        // SYS_03
        test('Should return true for valid email (SYS_03)', () => {
            expect(validationUtils.isValidEmail('test@gmail.com')).toBe(true);
        });

        // SYS_04
        test('Should return false for email missing @ (SYS_04)', () => {
            expect(validationUtils.isValidEmail('testgmail.com')).toBe(false);
        });

        // SYS_05
        test('Should return false for email missing domain (SYS_05)', () => {
            expect(validationUtils.isValidEmail('test@')).toBe(false);
        });

        // SYS_06
        test('Should return false for email with invalid characters (SYS_06)', () => {
            expect(validationUtils.isValidEmail('test$@gmail.com')).toBe(false);
        });
    });

    /**
     * TEST SUITE 2: isValidPhoneNumber (SYS_07 – SYS_10)
     */
    describe('isValidPhoneNumber', () => {
        // SYS_07
        test('Should return true for valid VN phone number 10 digits (SYS_07)', () => {
            expect(validationUtils.isValidPhoneNumber('0912345678')).toBe(true);
        });

        // SYS_08
        test('Should return false for phone number with letters (SYS_08)', () => {
            expect(validationUtils.isValidPhoneNumber('091234abcd')).toBe(false);
        });

        // SYS_09
        test('Should return false for phone number too short (SYS_09)', () => {
            expect(validationUtils.isValidPhoneNumber('0912')).toBe(false);
        });

        // SYS_10
        test('Should return false for phone number too long (SYS_10)', () => {
            expect(validationUtils.isValidPhoneNumber('0912345678999')).toBe(false);
        });
    });

    /**
     * TEST SUITE 3: isValidDate (SYS_11 – SYS_12)
     */
    describe('isValidDate', () => {
        // SYS_11
        test('Should return true for correct date format YYYY-MM-DD (SYS_11)', () => {
            expect(validationUtils.isValidDate('2025-10-20')).toBe(true);
        });

        // SYS_12
        test('Should return false for wrong date format (SYS_12)', () => {
            expect(validationUtils.isValidDate('20/10/2025')).toBe(false);
        });
    });
});