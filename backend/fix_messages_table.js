const { query } = require('./db');

const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

async function fix() {
    try {
        console.log("Creating messages table...");
        await query(createMessagesTable);
        console.log("Successfully created messages table.");
    } catch (error) {
        console.error("Error creating messages table:", error.message);
    }
    process.exit(0);
}

fix();
