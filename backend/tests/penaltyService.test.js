const penaltyService = require('../utils/penaltyService');
const db = require('../db');

// --- MOCKING DEPENDENCIES ---
jest.mock('../db');

describe('Penalty Service Unit Tests', () => {
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();

        // Giả lập DB Client
        mockClient = {
            query: jest.fn(),
            release: jest.fn(),
        };

        // Giả lập pool.connect() trả về client
        if (db.getPool) {
            db.getPool.mockReturnValue({
                connect: jest.fn().mockResolvedValue(mockClient),
            });
        } else {
            db.connect = jest.fn().mockResolvedValue(mockClient);
        }
    });

    /**
     * TEST SUITE 1: Hàm calculateLateFee
     * Test các mốc thời gian: <=3 ngày, 4-30 ngày, >30 ngày
     */
    describe('calculateLateFee', () => {
        test('Should return 0 fee if daysLate <= 3 (Grace period)', () => {
            expect(penaltyService.calculateLateFee(100000, 0)).toBe(0);
            expect(penaltyService.calculateLateFee(100000, 2)).toBe(0);
            expect(penaltyService.calculateLateFee(100000, 3)).toBe(0);
        });

        test('Should return 5% fee if daysLate is between 4 and 30', () => {
            // 4 ngày trễ, 100.000 -> phạt 5.000
            expect(penaltyService.calculateLateFee(100000, 4)).toBe(5000); 
            // 30 ngày trễ, 100.000 -> phạt 5.000
            expect(penaltyService.calculateLateFee(100000, 30)).toBe(5000);
        });

        test('Should return 10% fee if daysLate > 30', () => {
            // 31 ngày trễ, 100.000 -> phạt 10.000
            expect(penaltyService.calculateLateFee(100000, 31)).toBe(10000);
            expect(penaltyService.calculateLateFee(500000, 45)).toBe(50000);
        });

        test('Should handle negative inputs (Sanitization)', () => {
            expect(penaltyService.calculateLateFee(-100, 5)).toBe(0);
            expect(penaltyService.calculateLateFee(100, -5)).toBe(0);
        });
    });

    /**
     * TEST SUITE 2: Hàm applyLateFees (Cron Job Logic)
     * Test logic 3 giai đoạn (Stage 1, 2, 3)
     */
    describe('applyLateFees', () => {
        // Helper để giả lập câu trả lời của DB
        const setupMockDbResponse = (scenario) => {
            mockClient.query.mockImplementation((sql, params) => {
                // 1. Transaction cmds
                if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return Promise.resolve();

                // 2. Lấy giá tiền phạt (Giả sử 50.000 VND)
                if (sql.includes("SELECT price FROM fees")) {
                    return Promise.resolve({ rows: [{ price: 50000 }] });
                }

                // 3. STAGE 1 Query (Tìm bill quá hạn > 3 ngày, chưa bị phạt)
                if (sql.includes("penalty_stage = 0") && sql.includes("INTERVAL '3 days'")) {
                    return Promise.resolve({ rows: scenario === 'STAGE_1' ? [{ bill_id: 101, total_amount: 100000, user_id: 1 }] : [] });
                }

                // 4. STAGE 2 Query (Tìm bill stage 1, quá hạn > 6 ngày)
                if (sql.includes("penalty_stage = 1") && sql.includes("INTERVAL '6 days'")) {
                    return Promise.resolve({ rows: scenario === 'STAGE_2' ? [{ bill_id: 102, total_amount: 150000, user_id: 2 }] : [] });
                }

                // 5. STAGE 3 Query (Tìm bill stage 2, quá hạn > 9 ngày -> KHÓA ACC)
                if (sql.includes("penalty_stage = 2") && sql.includes("INTERVAL '9 days'")) {
                    return Promise.resolve({ 
                        rows: scenario === 'STAGE_3' 
                        ? [{ bill_id: 103, user_id: 3, full_name: 'Bad User', email: 'bad@user.com', apartment_number: 'A101' }] 
                        : [] 
                    });
                }

                // 6. Lấy danh sách Admin (cho Stage 3)
                if (sql.includes("SELECT id FROM users WHERE role = 'admin'")) {
                    return Promise.resolve({ rows: [{ id: 999 }] }); // 1 Admin
                }

                // Default Update/Insert return
                return Promise.resolve({ rows: [] });
            });
        };

        test('STAGE 1: Should apply penalty fee and update status to overdue', async () => {
            setupMockDbResponse('STAGE_1');

            await penaltyService.applyLateFees();

            // Kiểm tra update tiền: Gốc 100k + Phạt 50k = 150k
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE bills'),
                expect.arrayContaining([150000, 101]) // [newTotal, bill_id]
            );
            // Kiểm tra update trạng thái stage 1
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining("penalty_stage = 1"),
                expect.anything()
            );
            // Kiểm tra insert bill item
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO bill_items'),
                expect.arrayContaining([101, 'Late Fee (Stage 1: >3 Days)', 50000])
            );
        });

        test('STAGE 2: Should apply second penalty fee', async () => {
            setupMockDbResponse('STAGE_2');

            await penaltyService.applyLateFees();

            // Gốc 150k + Phạt thêm 50k = 200k
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE bills'),
                expect.arrayContaining([200000, 102])
            );
            // Kiểm tra update stage 2
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining("penalty_stage = 2"),
                expect.anything()
            );
        });

        test('STAGE 3: Should LOCK USER ACCOUNT and notify Admin', async () => {
            setupMockDbResponse('STAGE_3');

            await penaltyService.applyLateFees();

            // 1. Kiểm tra khóa User (Quan trọng nhất)
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET is_active = false'),
                [3] // user_id của bill 103
            );

            // 2. Kiểm tra update stage 3
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE bills SET penalty_stage = 3'),
                [103]
            );

            // 3. Kiểm tra gửi thông báo cho Admin (id 999)
            // Tìm lệnh insert notify mà user_id là 999
            const adminNotifyCall = mockClient.query.mock.calls.find(
                call => call[0].includes('INSERT INTO notifications') && call[1][0] === 999
            );
            expect(adminNotifyCall).toBeDefined();
            expect(adminNotifyCall[1][1]).toContain('ACTION REQUIRED');
        });

        test('Should ROLLBACK transaction if an error occurs', async () => {
            // Giả lập lỗi khi query fee
            mockClient.query.mockImplementationOnce(() => Promise.resolve()) // BEGIN
                               .mockRejectedValueOnce(new Error('DB Connection Failed')); // Query Fee

            await penaltyService.applyLateFees();

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    /**
     * TEST SUITE 3: Hàm notifyAdminOverdueBills (Legacy)
     * Test đơn giản để đảm bảo không lỗi
     */
    describe('notifyAdminOverdueBills', () => {
        test('Should run without error', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            await penaltyService.notifyAdminOverdueBills();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Detailed checks are now handled'));
            consoleSpy.mockRestore();
        });
    });
});