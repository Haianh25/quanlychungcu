// --- 1. SETUP MOCK TRƯỚC KHI IMPORT ---
// Tạo một hàm giả (mock function) đại diện cho hành động sendMail
const mockSendMail = jest.fn();

// Giả lập module 'nodemailer'
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: mockSendMail // Trả về hàm giả khi code gọi createTransport
    })
}));

// --- 2. IMPORT MODULE CẦN TEST ---
// Import sau khi đã mock để nó nhận mock object
const mailer = require('../utils/mailer');

describe('Mailer Service Unit Tests', () => {
    
    beforeEach(() => {
        // Reset lại bộ đếm của hàm mock trước mỗi bài test
        jest.clearAllMocks();
    });

    /**
     * TEST SUITE 1: sendVerificationEmail
     * Test gửi email xác thực đăng ký
     */
    describe('sendVerificationEmail', () => {
        test('Should send email with correct verification link', async () => {
            const email = 'user@example.com';
            const token = 'sample-token-123';
            
            // Giả lập gửi thành công
            mockSendMail.mockResolvedValue('OK');

            await mailer.sendVerificationEmail(email, token);

            // Kiểm tra hàm sendMail có được gọi 1 lần không
            expect(mockSendMail).toHaveBeenCalledTimes(1);

            // Kiểm tra tham số truyền vào hàm sendMail
            const mailOptions = mockSendMail.mock.calls[0][0];
            
            expect(mailOptions.to).toBe(email);
            expect(mailOptions.subject).toContain('Verify your account');
            // Kiểm tra xem link có chứa token đúng không
            expect(mailOptions.html).toContain(`http://localhost:3000/verify-email/${token}`);
        });

        test('Should throw error when sending fails', async () => {
            // Giả lập lỗi SMTP
            mockSendMail.mockRejectedValue(new Error('SMTP Connection Failed'));

            // Kiểm tra xem hàm có ném ra đúng lỗi như code quy định không
            await expect(mailer.sendVerificationEmail('fail@test.com', 'token'))
                .rejects
                .toThrow('Could not send verification email.');
        });
    });

    /**
     * TEST SUITE 2: sendPasswordResetEmail
     * Test gửi email quên mật khẩu
     */
    describe('sendPasswordResetEmail', () => {
        test('Should send email with correct reset link', async () => {
            const email = 'forgot@example.com';
            const token = 'reset-token-456';

            mockSendMail.mockResolvedValue('OK');

            await mailer.sendPasswordResetEmail(email, token);

            expect(mockSendMail).toHaveBeenCalledTimes(1);
            const mailOptions = mockSendMail.mock.calls[0][0];

            expect(mailOptions.to).toBe(email);
            expect(mailOptions.subject).toContain('Password Reset Request');
            expect(mailOptions.html).toContain(`http://localhost:3000/reset-password/${token}`);
        });

        test('Should throw error when sending fails', async () => {
            mockSendMail.mockRejectedValue(new Error('Network Error'));

            await expect(mailer.sendPasswordResetEmail('fail@test.com', 'token'))
                .rejects
                .toThrow('Could not send password reset email.');
        });
    });

    /**
     * TEST SUITE 3: sendNewBillEmail
     * Test gửi email thông báo hóa đơn mới (Chức năng mới)
     */
    describe('sendNewBillEmail', () => {
        const mockBillData = {
            billId: 999,
            monthYear: '12/2025',
            totalAmount: 500000,
            dueDate: '10/12/2025'
        };

        test('Should send email with correct bill details', async () => {
            const email = 'resident@example.com';
            const fullName = 'Nguyen Van A';

            mockSendMail.mockResolvedValue('OK');

            await mailer.sendNewBillEmail(email, fullName, mockBillData);

            expect(mockSendMail).toHaveBeenCalledTimes(1);
            const mailOptions = mockSendMail.mock.calls[0][0];

            expect(mailOptions.to).toBe(email);
            expect(mailOptions.subject).toContain('Bill Notification for 12/2025');
            
            // Kiểm tra nội dung HTML có chứa các thông tin quan trọng
            expect(mailOptions.html).toContain('Nguyen Van A'); // Tên
            expect(mailOptions.html).toContain('#999'); // Bill ID
            expect(mailOptions.html).toContain('12/2025'); // Tháng
            expect(mailOptions.html).toContain('10/12/2025'); // Hạn chót
            
            // Kiểm tra format tiền (Lưu ý: toLocaleString phụ thuộc vào Node Env, 
            // nhưng ta check chuỗi con cơ bản để đảm bảo nó có xuất hiện)
            // 500.000 -> check '500.000' hoặc '500,000' tùy locale giả lập
            // Ở đây ta check tương đối
            const hasAmount = mailOptions.html.includes('500.000') || mailOptions.html.includes('500,000');
            expect(hasAmount).toBe(true);
        });

        test('Should throw error when sending fails', async () => {
            mockSendMail.mockRejectedValue(new Error('Auth Failed'));

            await expect(mailer.sendNewBillEmail('fail@test.com', 'Name', mockBillData))
                .rejects
                .toThrow('Could not send bill notification email.');
        });
    });

});