const db = require('./db');

const checkInfo = async () => {
    try {
        const res = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'vehicle_card_requests'
        `);
        console.log('Columns in vehicle_card_requests:', res.rows.map(r => r.column_name).join(', '));
    } catch (e) { console.error(e); }
    process.exit();
};
checkInfo();
