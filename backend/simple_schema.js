const db = require('./db');

const run = async () => {
    try {
        const res = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'vehicle_cards'
        `);
        res.rows.forEach(r => console.log(r.column_name));
    } catch (e) { console.error(e); }
    process.exit();
};
run();
