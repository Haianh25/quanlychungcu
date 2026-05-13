const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: 'quanlychungcu_test',
});

async function initDB() {
  try {
    await client.connect();
    console.log("Connected to quanlychungcu_test");
    
    const sqlPath = path.join(__dirname, '../database.sql');
    let sql = fs.readFileSync(sqlPath, 'utf16le');
    if (sql.charCodeAt(0) === 0xFEFF) {
      sql = sql.slice(1);
    }
    
    console.log("Read SQL file, length:", sql.length);
    await client.query(sql);
    console.log("Database schema initialized successfully.");
  } catch (err) {
    console.error('Error initializing database', err);
  } finally {
    await client.end();
  }
}

initDB();
