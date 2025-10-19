require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { query } = require('./src/db');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await query('SELECT COUNT(*) FROM stylists');
    console.log('Database connection successful!');
    console.log('Stylists count:', result.rows[0].count);

    const stylists = await query(`
      SELECT s.*, u.name, u.profile_picture_url, u.email
      FROM stylists s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_verified = true AND u.is_active = true
      LIMIT 3
    `);
    console.log('Sample stylists:', stylists.rows);

  } catch (error) {
    console.error('Database connection failed:', error);
  }
  process.exit(0);
}

testConnection();