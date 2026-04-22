const db = require('./db');

const listTables = async () => {
    try {
        const res = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
    } catch (e) { console.error(e); }
    process.exit();
};
listTables();
