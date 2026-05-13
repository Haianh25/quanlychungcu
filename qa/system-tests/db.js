require('dotenv').config({ path: '../../backend/.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'quan_ly_chung_cu',
  password: process.env.DB_PASSWORD || '12345678',
  port: process.env.DB_PORT || 5432,
});

async function setupTestData() {
  console.log('Setting up DB test data...');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Password123!', salt);
  await pool.query(`
    INSERT INTO users (full_name, email, password_hash, role, is_active, is_verified) 
    VALUES ('Test Admin', 'test_admin@test.com', $1, 'admin', true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_verified = true
  `, [hash]);
}

async function rollbackData() {
  console.log('Rolling back DB data...');
  // Bỏ comment để tránh race condition khi jest chạy đa luồng
  // await pool.query("DELETE FROM users WHERE email = 'test_admin@test.com'");
}

async function query(text, params) {
  return pool.query(text, params);
}

async function closePool() {
  await pool.end();
}

module.exports = { setupTestData, rollbackData, query, closePool };
