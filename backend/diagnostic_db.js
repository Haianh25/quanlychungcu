const { query, getPool } = require('./db');

async function check() {
    try {
        const pool = getPool();
        console.log('DB Config:', {
            host: pool.options.host,
            database: pool.options.database,
            user: pool.options.user
        });

        const tableCheck = await query("SELECT to_regclass('public.users')");
        console.log('Users table exists:', tableCheck.rows[0].to_regclass);

        if (tableCheck.rows[0].to_regclass) {
            const columnCheck = await query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'id'
            `);
            console.log('Users ID column:', columnCheck.rows[0]);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
