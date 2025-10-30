// backend/cron.js
const cron = require('node-cron');
// Import hàm logic từ file billAdmin.js
const { generateBillsForMonth } = require('./routes/billAdmin'); 

console.log('[Cron] Scheduler initialized. Waiting for tasks...');

// --- TỰ ĐỘNG TẠO HÓA ĐƠN ---
// Chạy vào 00:05 (5 phút sáng) ngày 1 hàng tháng
// Cú pháp: (phút giờ ngày-trong-tháng tháng ngày-trong-tuần)
// '5 0 1 * *' = 5 phút, 0 giờ, ngày 1, mọi tháng, mọi ngày trong tuần
cron.schedule('5 0 1 * *', async () => {
    const now = new Date();
    // Lấy tháng/năm theo múi giờ UTC để đảm bảo tính đúng đắn
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();
    
    console.log(`[Cron Job] Auto-generating bills for ${month}/${year}...`);
    
    try {
        const result = await generateBillsForMonth(month, year);
        if (result.success) {
            console.log(`[Cron Job] Successfully generated ${result.count} new bills.`);
        } else {
            // Ghi log lỗi nếu hàm generate báo lỗi
            console.error('[Cron Job] Failed to generate bills:', result.error);
        }
    } catch (err) {
        // Ghi log lỗi nếu cron job bị crash
        console.error('[Cron Job] CRITICAL ERROR during automated bill generation:', err);
    }
}, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh" // Đặt múi giờ Việt Nam
});

// Bạn có thể thêm các cron job khác ở đây trong tương lai
// Ví dụ: Tự động kiểm tra và phạt nợ (chạy vào 00:10 ngày 15 hàng tháng)
/*
cron.schedule('10 0 15 * *', async () => {
    console.log('[Cron Job] Checking for overdue bills to apply penalties...');
    // ... (Logic cập nhật phí phạt cho các bill 'overdue')
}, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
});
*/