const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// --- 1. SETUP MOCK FACTORY ---
jest.mock('../db', () => {
    // Tạo mock object mới mỗi khi factory chạy
    const mockClient = {
        query: jest.fn(),
        release: jest.fn()
    };
    const mockPool = {
        connect: jest.fn().mockResolvedValue(mockClient),
        query: jest.fn()
    };
    
    return {
        query: jest.fn(),
        getPool: jest.fn().mockReturnValue(mockPool),
        // Expose để test case lấy ra điều khiển
        _mockClient: mockClient,
        _mockPool: mockPool
    };
});

jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { id: 100, role: 'resident' };
        next();
    }
}));

describe('Bill User Routes Unit Tests', () => {
    let app;
    let dbMock;
    let clientMock;

    beforeEach(() => {
        // 1. Reset modules để xóa cache, đảm bảo load lại file route mới tinh
        jest.resetModules();
        jest.clearAllMocks();

        // 2. Lấy instance mock mới nhất
        dbMock = require('../db');
        clientMock = dbMock._mockClient;

        // 3. Cài đặt mặc định an toàn (tránh lỗi crash "cannot read property rows of undefined")
        clientMock.query.mockResolvedValue({ rows: [], rowCount: 0 });
        dbMock.query.mockResolvedValue({ rows: [], rowCount: 0 });

        // 4. Setup App với route mới (đã bind với mock mới)
        const billUserRoutes = require('../routes/billUser');
        app = express();
        app.use(bodyParser.json());
        app.use('/api/bills', billUserRoutes);
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Khôi phục Math.random
    });

    /**
     * TEST SUITE 1: GET MY BILLS DETAILED
     */
    describe('GET /api/bills/my-bills-detailed', () => {
        test('Should return bills with line items correctly', async () => {
            const mockBills = [
                { bill_id: 1, total_amount: 100, status: 'unpaid' },
                { bill_id: 2, total_amount: 200, status: 'paid' }
            ];
            const mockItems = [
                { id: 1, bill_id: 1, item_name: 'Electric', price: 50 },
                { id: 2, bill_id: 1, item_name: 'Water', price: 50 },
                { id: 3, bill_id: 2, item_name: 'Internet', price: 200 }
            ];

            // Mock lần lượt: Query lấy Bills -> Query lấy Items
            dbMock.query
                .mockResolvedValueOnce({ rows: mockBills })
                .mockResolvedValueOnce({ rows: mockItems });

            const res = await request(app).get('/api/bills/my-bills-detailed');

            expect(res.statusCode).toBe(200);
            expect(res.body.bills).toHaveLength(2);
            
            // Kiểm tra ghép data
            const bill1 = res.body.bills.find(b => b.bill_id === 1);
            expect(bill1.line_items).toHaveLength(2);
        });

        test('Should return empty list if no bills found', async () => {
            dbMock.query.mockResolvedValueOnce({ rows: [] }); 

            const res = await request(app).get('/api/bills/my-bills-detailed');

            expect(res.statusCode).toBe(200);
            expect(res.body.bills).toEqual([]);
        });
    });

    /**
     * TEST SUITE 2: GET MY TRANSACTIONS
     */
    describe('GET /api/bills/my-transactions', () => {
        test('Should return transaction history', async () => {
            const mockTrans = [{ transaction_id: 1, amount: 500000, status: 'success' }];
            dbMock.query.mockResolvedValueOnce({ rows: mockTrans });

            const res = await request(app).get('/api/bills/my-transactions');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });

    /**
     * TEST SUITE 3: CREATE PAYMENT (SIMULATED)
     */
    describe('POST /api/bills/create-payment', () => {
        const paymentData = { bill_id: 10, payment_method: 'paypal' };

        test('Should process payment SUCCESSFULLY', async () => {
            // Mock Math.random để luôn vào nhánh thành công (< 0.9)
            jest.spyOn(Math, 'random').mockReturnValue(0.5);

            // Mock luồng Transaction
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                
                // 1. Check Bill
                if (sql.includes('SELECT * FROM bills')) {
                    return { rows: [{ bill_id: 10, total_amount: 100000 }] };
                }
                
                // 2. Insert Transaction
                if (sql.includes('INSERT INTO transactions')) {
                    return { rows: [{ transaction_id: 999 }] };
                }
                
                // 3. Update Success
                if (sql.includes("UPDATE transactions SET status = 'success'")) return;
                if (sql.includes("UPDATE bills SET status = 'paid'")) return;

                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/bills/create-payment').send(paymentData);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Payment successful');
            expect(clientMock.query).toHaveBeenCalledWith('COMMIT');
        });

        test('Should process payment FAILURE (Simulated)', async () => {
            // Mock Math.random để luôn vào nhánh thất bại (> 0.9)
            jest.spyOn(Math, 'random').mockReturnValue(0.95);

            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                
                if (sql.includes('SELECT * FROM bills')) {
                    return { rows: [{ bill_id: 10, total_amount: 100000 }] };
                }
                if (sql.includes('INSERT INTO transactions')) {
                    return { rows: [{ transaction_id: 999 }] };
                }
                
                // 3. Update Failed
                if (sql.includes("UPDATE transactions SET status = 'failed'")) return;

                if (sql === 'COMMIT') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/bills/create-payment').send(paymentData);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Payment failed');
        });

        test('Should fail if bill invalid or already paid', async () => {
            clientMock.query.mockImplementation(async (sql) => {
                if (sql === 'BEGIN') return;
                // Trả về rỗng -> Không tìm thấy bill unpaid
                if (sql.includes('SELECT * FROM bills')) return { rows: [] };
                if (sql === 'ROLLBACK') return;
                return { rows: [] };
            });

            const res = await request(app).post('/api/bills/create-payment').send(paymentData);

            // API throw Error -> catch -> return 500
            expect(res.statusCode).toBe(500);
            expect(res.body.message).toContain('Invalid bill or already paid');
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });
});