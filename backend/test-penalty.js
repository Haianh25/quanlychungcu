// backend/test-penalty.js
require('dotenv').config();
const { applyLateFees } = require('./utils/penaltyService');
const db = require('./db');

async function runTest() {
    console.log('--- BẮT ĐẦU TEST TÍNH PHẠT ---');
    try {
        await applyLateFees();
        console.log('--- KẾT THÚC TEST ---');
    } catch (error) {
        console.error('Lỗi khi test:', error);
    } finally {
        
        process.exit(0);
    }
}

runTest();