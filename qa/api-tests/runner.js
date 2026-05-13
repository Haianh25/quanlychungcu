require('dotenv').config({ path: '../../backend/.env' });
const newman = require('newman');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'quan_ly_chung_cu',
  password: process.env.DB_PASSWORD || '12345678',
  port: process.env.DB_PORT || 5432,
});

async function setupData() {
  console.log('Setting up DB data...');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Password123!', salt);
  await pool.query(`
    INSERT INTO users (full_name, email, password_hash, role, apartment_number, is_active, is_verified) 
    VALUES ('Test Admin', 'test_admin@test.com', $1, 'admin', null, true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_verified = true
  `, [hash]);
}

async function rollbackData() {
  console.log('Rolling back DB data...');
  await pool.query("DELETE FROM users WHERE email = 'test_admin@test.com'");
  await pool.end();
}

async function runTests() {
  await setupData();

  newman.run({
    collection: require('./collections/QuanLyChungCu.postman_collection.json'),
    reporters: ['cli', 'html'],
    reporter: {
      html: {
        export: './newman/report.html'
      }
    }
  }, async function (err) {
    if (err) { throw err; }
    console.log('Newman tests complete!');
    await rollbackData();
  });
}

runTests();
