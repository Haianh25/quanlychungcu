const db = require('./db');
const findType = async () => {
    try {
        const res = await db.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE column_name LIKE '%type%' AND table_schema = 'public'
        `);
        console.log(res.rows);
    } catch (e) { console.error(e); }
    process.exit();
}
findType();
