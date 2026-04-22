const db = require('./db');
const inspect = async () => {
    try {
        const res = await db.query('SELECT * FROM vehicle_card_requests LIMIT 1');
        console.log(res.rows[0]);
    } catch (e) { console.error(e); }
    process.exit();
}
inspect();
