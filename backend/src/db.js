const { Pool } = require('pg');

// Database connection configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'beautycita',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false } // Enable SSL with self-signed certificate acceptance
};

// Only add password if it's set and not empty
if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
  dbConfig.password = process.env.DB_PASSWORD;
}

const pool = new Pool(dbConfig);

// Test the connection
pool.on('connect', () => {
  console.log('🗄️ Database connection established');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Database query helper function
const query = (text, params) => pool.query(text, params);

module.exports = {
  query,
  pool,
};