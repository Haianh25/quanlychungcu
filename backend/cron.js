
const cron = require('node-cron');
const { generateBillsForMonth } = require('./routes/billAdmin'); 
console.log('[Cron] Scheduler initialized. Waiting for tasks...');

// --- TỰ ĐỘNG TẠO HÓA ĐƠN ---
// Chạy vào 00:05 (5 phút sáng) ngày 1 hàng tháng
// Cú pháp: (phút giờ ngày-trong-tháng tháng ngày-trong-tuần)
// '5 0 1 * *' = 5 phút, 0 giờ, ngày 1, mọi tháng, mọi ngày trong tuần
cron.schedule('5 0 1 * *', async () => {
    const now = new Date();
    
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();
    
    console.log(`[Cron Job] Auto-generating bills for ${month}/${year}...`);
    
    try {
        const result = await generateBillsForMonth(month, year);
        if (result.success) {
            console.log(`[Cron Job] Successfully generated ${result.count} new bills.`);
        } else {
          
            console.error('[Cron Job] Failed to generate bills:', result.error);
        }
    } catch (err) {
        console.error('[Cron Job] CRITICAL ERROR during automated bill generation:', err);
    }
}, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh" 
});

