const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: 'postgres', // Connect to default DB to create another
});

async function setup() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");
    
    // Check if database exists
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = 'quanlychungcu_test'`);
    if (res.rowCount === 0) {
      await client.query('CREATE DATABASE quanlychungcu_test');
      console.log('Database quanlychungcu_test created successfully');
    } else {
      console.log('Database quanlychungcu_test already exists');
    }
  } catch (err) {
    console.error('Error creating database', err);
  } finally {
    await client.end();
  }
}

setup();
