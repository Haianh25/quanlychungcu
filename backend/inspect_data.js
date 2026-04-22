const db = require('./db');

const inspectData = async () => {
    try {
        const res = await db.query('SELECT * FROM vehicle_cards LIMIT 1');
        console.log('Sample Row:', res.rows[0]);
    } catch (e) { console.error(e); }
    process.exit();
};
inspectData();
