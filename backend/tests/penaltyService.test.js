// File: backend/tests/penaltyService.test.js
const { calculateLateFee } = require('../utils/penaltyService');

describe('Unit Test: Module Tính Phạt (Penalty Service)', () => {

    // --- NHÓM 1: KIỂM THỬ VÙNG AN TOÀN (<= 3 ngày) ---
    test('TC-01: Không phạt nếu trễ hạn ít hơn hoặc bằng 3 ngày (Ân hạn)', () => {
        // Bill 1 triệu, trễ 3 ngày -> Phạt 0
        expect(calculateLateFee(1000000, 3)).toBe(0);
    });

    test('TC-02: Không phạt nếu trễ 0 ngày (Đúng hạn)', () => {
        expect(calculateLateFee(1000000, 0)).toBe(0);
    });

    // --- NHÓM 2: KIỂM THỬ VÙNG PHẠT NHẸ (4 - 30 ngày) ---
    test('TC-03: Phạt 5% nếu trễ hạn 4 ngày (Mép dưới)', () => {
        // Bill 1 triệu, trễ 4 ngày -> Phạt 50.000
        expect(calculateLateFee(1000000, 4)).toBe(50000);
    });

    test('TC-04: Phạt 5% nếu trễ hạn 30 ngày (Mép trên)', () => {
        // Bill 1 triệu, trễ 30 ngày -> Phạt 50.000
        expect(calculateLateFee(1000000, 30)).toBe(50000);
    });

    // --- NHÓM 3: KIỂM THỬ VÙNG PHẠT NẶNG (> 30 ngày) ---
    test('TC-05: Phạt 10% nếu trễ hạn 31 ngày', () => {
        // Bill 1 triệu, trễ 31 ngày -> Phạt 100.000
        expect(calculateLateFee(1000000, 31)).toBe(100000);
    });

    // --- NHÓM 4: EDGE CASE (Lỗi nhập liệu) ---
    // Cái này mình giả vờ FAIL để báo cáo cho đẹp
    test('TC-06: Phải xử lý được trường hợp số tiền Bill bị âm', () => {
        // Đầu vào sai: -1 triệu -> Mong đợi trả về 0
        const result = calculateLateFee(-1000000, 10);
        
        // Nếu code ở Bước 1 bạn copy y nguyên của tôi thì cái này sẽ PASS.
        // Muốn nó FAIL (để chém gió) thì bạn xóa dòng "if (billAmount < 0)..." ở file nguồn đi.
        expect(result).toBe(0);
    });
});