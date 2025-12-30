const cron = require('node-cron');
const { generateBillsForMonth } = require('./utils/billService');
const { applyLateFees, notifyAdminOverdueBills } = require('./utils/penaltyService');

console.log('[Cron] Scheduler initialized. Waiting for tasks...');
cron.schedule('0 0 1 * *', async () => {
    console.log('[Cron] Running monthly bill generation task...');
    try {
        
        const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
        const month = localDate.getMonth() + 1; 
        const year = localDate.getFullYear(); 
        
        console.log(`[Cron] Generating bills for ${month}/${year}`);
        
        await generateBillsForMonth(month, year); 
        console.log('[Cron] Monthly bill generation task finished.');
    } catch (err) {
        console.error('[Cron] Error during monthly bill generation:', err);
    }
});

cron.schedule('0 1 * * *', async () => {
    console.log('[Cron] Running daily scheduled tasks...');
    try {
        
        await applyLateFees();
        
        await notifyAdminOverdueBills();
        
    } catch (err) {
        console.error('[Cron] Error during daily scheduled tasks:', err);
    }
});