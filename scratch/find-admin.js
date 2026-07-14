const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query("SELECT id, email, role FROM users WHERE email = 'admin@sewaki.com';");
    console.log('Admin users in database:', res.rows);
  } catch (err) {
    console.error('Error querying:', err);
  } finally {
    await pool.end();
  }
}

check();
