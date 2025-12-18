// File: backend/tests/billService.test.js
const { calculateBillTotal } = require('../utils/billService');

describe('Unit Test: Module Tính toán Hóa đơn (Bill Service)', () => {

    // --- CASE 1: HAPPY PATH (Trường hợp chạy đúng phổ biến nhất) ---
    // Kỹ thuật: Phân hoạch tương đương (Equivalence Partitioning)
    test('TC-01: Nên tính đúng tổng tiền cho trường hợp thông thường', () => {
        // Input giả lập: Phòng 50m2, 1 Ô tô, 1 Xe máy, Phí khác 30k
        const roomArea = 50; 
        const vehicles = [{ type: 'Car' }, { type: 'Motorbike' }];
        const serviceFees = 30000;

        // Tính toán mong đợi:
        // Phòng: 50 * 7.000 = 350.000
        // Xe: 200.000 + 50.000 = 250.000
        // Phí khác: 30.000
        // TỔNG = 630.000
        
        const result = calculateBillTotal(roomArea, vehicles, serviceFees);
        expect(result).toBe(630000); // Kỳ vọng kết quả phải là 630.000
    });

    // --- CASE 2: BOUNDARY VALUE (Giá trị biên) ---
    // Kỹ thuật: Phân tích giá trị biên (Boundary Value Analysis)
    test('TC-02: Nên trả về đúng tiền xe khi diện tích phòng = 0 (Chưa ở)', () => {
        const result = calculateBillTotal(0, [{ type: 'Motorbike' }], 0);
        // 0 + 50.000 + 0 = 50.000
        expect(result).toBe(50000);
    });

    // --- CASE 3: FAIL CASE (Trường hợp lỗi logic giả định) ---
    // Mục đích: Chứng minh test case có thể bắt được lỗi khi nhập số liệu sai (Số âm)
    test('TC-03: Hệ thống phải xử lý được khi nhập phí dịch vụ là số âm', () => {
        // Giả sử admin nhập nhầm phí dịch vụ là -1.000.000 (Trừ tiền)
        const roomArea = 50; // 350k
        const vehicles = [];
        const serviceFees = -1000000; 

        // 350.000 - 1.000.000 = -650.000
        // Logic mong đợi: Hàm tính toán không được trả về số âm, mà phải trả về 0 hoặc báo lỗi.
        
        const result = calculateBillTotal(roomArea, vehicles, serviceFees);
        
        // Đoạn này sẽ FAIL nếu code của bạn không chặn số âm (Trả về -650k)
        // Hoặc PASS nếu code của bạn đã có dòng "if (total < 0) return 0;"
        expect(result).toBeGreaterThanOrEqual(0); 
    });
});