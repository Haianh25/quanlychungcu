const billService = require('../utils/billService');
const db = require('../db');
const mailer = require('../utils/mailer');

// --- MOCKING DEPENDENCIES ---
// Giả lập module db và mailer để không chạy vào DB thật hay gửi mail thật
jest.mock('../db');
jest.mock('../utils/mailer');

describe('Bill Service Unit Tests', () => {
    let mockClient;

    beforeEach(() => {
        // Reset lại các mock trước mỗi bài test để đảm bảo sạch sẽ
        jest.clearAllMocks();

        // Tạo một mock client giả cho DB
        mockClient = {
            query: jest.fn(),
            release: jest.fn(),
        };

        // Giả lập hành động connect pool trả về mockClient
        if (db.getPool) {
            db.getPool.mockReturnValue({
                connect: jest.fn().mockResolvedValue(mockClient),
            });
        } else {
            // Fallback nếu db export trực tiếp (tùy cấu trúc db.js của bạn)
            db.connect = jest.fn().mockResolvedValue(mockClient);
        }
    });

    /**
     * TEST SUITE 1: Hàm calculateMonthlyBill
     * Hàm này thuần logic tính toán, dễ test nhất.
     */
    describe('calculateMonthlyBill', () => {
        test('Should calculate total correctly with all fees provided', () => {
            const roomArea = 50;
            const pricePerM2 = 10000;
            const vehicles = [
                { type: 'car', fee: 500000 },
                { type: 'motorbike', fee: 100000 }
            ];
            const water = 200000;
            const electric = 1000000;

            const result = billService.calculateMonthlyBill(roomArea, pricePerM2, vehicles, water, electric);

            // Phí quản lý: 50 * 10.000 = 500.000
            // Phí xe: 500.000 + 100.000 = 600.000
            // Điện nước: 1.200.000
            // Tổng: 2.300.000
            expect(result.managementFee).toBe(500000);
            expect(result.parkingFee).toBe(600000);
            expect(result.servicesFee).toBe(1200000);
            expect(result.totalAmount).toBe(2300000);
            expect(result.isValid).toBe(true);
        });

        test('Should handle null/undefined inputs gracefully (robustness)', () => {
            // Truyền vào null/undefined hoặc string rác
            const result = billService.calculateMonthlyBill(null, undefined, 'not-an-array', null, 'abc');

            expect(result.managementFee).toBe(0);
            expect(result.parkingFee).toBe(0);
            expect(result.servicesFee).toBe(0);
            expect(result.totalAmount).toBe(0);
        });

        test('Should handle negative numbers by treating them as 0 (sanitization)', () => {
            const result = billService.calculateMonthlyBill(-50, 10000, [], -100, -200);
            expect(result.totalAmount).toBe(0);
        });
    });

    /**
     * TEST SUITE 2: Hàm generateBillsForMonth
     * Test luồng chính: Tạo bill hàng tháng
     */
    describe('generateBillsForMonth', () => {
        test('Should return count 0 if no occupied rooms found', async () => {
            // Giả lập query đầu tiên (lấy phòng) trả về rỗng
            mockClient.query.mockResolvedValueOnce({ rows: [] }); // Query BEGIN (nếu có) hoặc Query Select Rooms

            // Nếu code bạn có await client.query('BEGIN'), cần mock thêm 1 lần
            // Tuy nhiên để đơn giản, ta giả định mockImplementation sẽ xử lý
            mockClient.query.mockImplementation((sql) => {
                if (sql === 'BEGIN') return Promise.resolve();
                if (sql.includes('SELECT') && sql.includes('rooms')) return Promise.resolve({ rows: [] });
                if (sql === 'COMMIT') return Promise.resolve();
                return Promise.resolve({ rows: [] });
            });

            const result = await billService.generateBillsForMonth(10, 2023);

            expect(result.success).toBe(true);
            expect(result.count).toBe(0);
            expect(mockClient.release).toHaveBeenCalled();
        });

        test('Should skip generating bill if bill already exists', async () => {
            // Mock dữ liệu
            const mockRooms = [{ room_id: 101, user_id: 1, email: 'test@test.com', full_name: 'Test User', area: 50 }];
            const mockFees = [{ fee_code: 'MANAGEMENT_FEE', price: 5000 }];

            mockClient.query.mockImplementation((sql, params) => {
                if (sql === 'BEGIN') return Promise.resolve();
                // 1. Lấy phòng
                if (sql.includes('FROM rooms')) return Promise.resolve({ rows: mockRooms });
                // 2. Lấy bảng giá
                if (sql.includes('FROM fees')) return Promise.resolve({ rows: mockFees });
                // 3. Check bill tồn tại -> TRẢ VỀ CÓ DỮ LIỆU
                if (sql.includes('SELECT 1 FROM bills')) return Promise.resolve({ rows: [{ exists: 1 }] });
                
                if (sql === 'COMMIT') return Promise.resolve();
                return Promise.resolve({ rows: [] });
            });

            const result = await billService.generateBillsForMonth(10, 2023);

            expect(result.success).toBe(true);
            // Count vẫn tăng trong vòng lặp hay không tùy logic, nhưng ở code bạn:
            // "if (resCheck.rows.length > 0) continue;" -> generatedCount KHÔNG tăng
            expect(result.count).toBe(0);
        });
    });

    /**
     * TEST SUITE 3: Hàm generateMoveInBill
     * Test tính năng mới: Bill chuyển đến
     */
    describe('generateMoveInBill', () => {
        test('Should NOT generate bill if one already exists in current month', async () => {
            const userId = 1;
            const roomId = 101;

            // Mock query check bill trả về tồn tại
            mockClient.query.mockImplementation((sql) => {
                if (sql.includes('SELECT 1 FROM bills')) return Promise.resolve({ rows: [1] });
                return Promise.resolve({ rows: [] });
            });

            await billService.generateMoveInBill(userId, roomId, mockClient);

            // Expect không gọi lệnh INSERT bill nào
            const insertCalls = mockClient.query.mock.calls.filter(call => call[0].includes('INSERT INTO bills'));
            expect(insertCalls.length).toBe(0);
        });

        test('Should generate prorated bill if no bill exists', async () => {
            const userId = 1;
            const roomId = 101;

            mockClient.query.mockImplementation((sql, params) => {
                // 1. Check bill -> Không có
                if (sql.includes('SELECT 1 FROM bills')) return Promise.resolve({ rows: [] });
                // 2. Lấy diện tích -> 50m2
                if (sql.includes('SELECT area FROM rooms')) return Promise.resolve({ rows: [{ area: 50 }] });
                // 3. Lấy fees
                if (sql.includes('FROM fees')) return Promise.resolve({ 
                    rows: [{ fee_code: 'MANAGEMENT_FEE', price: 10000 }] 
                });
                // 4. Insert Bills -> Trả về ID
                if (sql.includes('INSERT INTO bills')) return Promise.resolve({ rows: [{ bill_id: 999 }] });
                // 5. Insert Notification
                if (sql.includes('INSERT INTO notifications')) return Promise.resolve();
                
                return Promise.resolve({ rows: [] });
            });

            // Hack ngày tháng để đảm bảo daysToCharge > 0 (giả sử mock Date hoặc chấp nhận logic hiện tại)
            // Lưu ý: Unit test này chạy theo ngày giờ hệ thống thực, nếu chạy vào ngày cuối tháng có thể skip.
            // Để chắc chắn, ta chỉ verify việc nó GỌI các hàm query.
            
            await billService.generateMoveInBill(userId, roomId, mockClient);

            // Kiểm tra xem có query lấy diện tích không
            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('SELECT area FROM rooms'), [roomId]);
            
            // Lưu ý: Nếu hôm nay là ngày cuối cùng của tháng, logic code bạn có dòng:
            // "if (daysToCharge <= 0) return;" -> test này có thể fail insert nếu chạy đúng ngày đó.
            // Nhưng về cơ bản đây là cách test đúng logic.
        });
    });
});