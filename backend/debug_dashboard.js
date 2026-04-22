const db = require('./db');

const testQueries = async () => {
    try {
        console.log('Testing "Occupancy" query...');
        const occupancy = await db.query(`
            SELECT COUNT(DISTINCT apartment_number) as count
            FROM users
            WHERE role = 'resident' AND apartment_number IS NOT NULL AND apartment_number != ''
        `);
        console.log('Occupancy result:', occupancy.rows);

        console.log('Testing "Vehicle Types" query...');
        const vehicles = await db.query(`
            SELECT type, COUNT(*) as count 
            FROM vehicle_cards 
            WHERE status = 'active' 
            GROUP BY type
        `);
        console.log('Vehicle Types result:', vehicles.rows);

    } catch (err) {
        console.error('QUERY FAILED:', err.message);
    } finally {
        process.exit();
    }
};

testQueries();
