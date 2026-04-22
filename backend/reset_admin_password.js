const db = require('./db');
const bcrypt = require('bcryptjs');

const resetAdminPassword = async () => {
    const newPassword = 'Mitle2502%';
    try {
        console.log('Generating salt...');
        const salt = await bcrypt.genSalt(10);
        console.log('Hashing password...');
        const passwordHash = await bcrypt.hash(newPassword, salt);

        console.log('Updating admin password in database...');
        const res = await db.query(
            "UPDATE users SET password_hash = $1 WHERE role = 'admin' RETURNING email",
            [passwordHash]
        );

        if (res.rowCount > 0) {
            console.log(`Successfully reset password for ${res.rowCount} admin(s):`);
            res.rows.forEach(row => console.log(`- ${row.email}`));
        } else {
            console.log('No admin user found to update.');
        }
    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        // We need to exit the process, but db.pool might keep it open.
        // db.js exports { query, pool }.
        // If we access the pool directly we can end it.
        // But db.js might not export pool directly as a property of default export if it exports { query, pool }.
        // Let's force exit.
        process.exit(0);
    }
};

resetAdminPassword();
