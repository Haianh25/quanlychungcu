const cron = require('node-cron');
const { generateBillsForMonth } = require('./utils/billService');
// THÊM: Import dịch vụ phí phạt
const { applyLateFees, notifyAdminOverdueBills } = require('./utils/penaltyService');

console.log('[Cron] Scheduler initialized. Waiting for tasks...');

// Tác vụ này chạy vào 00:00 ngày 1 hàng tháng
cron.schedule('0 0 1 * *', async () => {
    console.log('[Cron] Running monthly bill generation task...');
    try {
        // Lấy ngày/tháng/năm của múi giờ Việt Nam (Asia/Ho_Chi_Minh)
        // Điều này đảm bảo nó chạy đúng ngày 1/Tháng theo giờ Việt Nam
        const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
        const month = localDate.getMonth() + 1; 
        const year = localDate.getFullYear(); 
        
        console.log(`[Cron] Generating bills for ${month}/${year}`);
        // Gọi hàm logic từ billService
        await generateBillsForMonth(month, year); 
        console.log('[Cron] Monthly bill generation task finished.');
    } catch (err) {
        console.error('[Cron] Error during monthly bill generation:', err);
    }
});

// THÊM: Tác vụ kiểm tra phí phạt & Báo cáo Admin
// Chạy vào 1:00 sáng mỗi ngày
cron.schedule('0 1 * * *', async () => {
    console.log('[Cron] Running daily scheduled tasks...');
    try {
        // 1. Tính phí phạt cho các hóa đơn vừa quá hạn
        await applyLateFees();
        
        // 2. [MỚI] Kiểm tra các hóa đơn đã quá hạn 3 ngày và báo Admin
        await notifyAdminOverdueBills();
        
    } catch (err) {
        console.error('[Cron] Error during daily scheduled tasks:', err);
    }
});