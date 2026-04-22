const { query } = require('./db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function runMigration() {
    try {
        console.log('Running final migration to create maintenance_requests table...');
        await query(createTableQuery);
        console.log('Successfully created maintenance_requests table.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
}

runMigration();
