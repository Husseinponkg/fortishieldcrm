const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config(); // Ensure env variables are loaded

// Debug environment variables (remove in production)
console.log('🔹 DB_HOST:', process.env.DB_HOST);
console.log('🔹 DB_USER:', process.env.DB_USER);
console.log('🔹 DB_PASSWORD:', process.env.DB_PASSWORD ? 'Present' : 'Missing');
console.log('🔹 DB_NAME:', process.env.DB_NAME);
console.log('🔹 DB_PORT:', process.env.DB_PORT);

// Determine SSL config for Aiven
let sslOptions = null;
if (process.env.DB_HOST && process.env.AIVEN_CA_PATH) {
  // Use Aiven CA certificate (production)
  sslOptions = {
    ca: fs.readFileSync(process.env.AIVEN_CA_PATH)
  };
} else if (process.env.DB_HOST) {
  // For testing / self-signed
  sslOptions = { rejectUnauthorized: false };
}

// Create MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  connectTimeout: 60000,
  ssl: sslOptions
});

// Test connection immediately
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected successfully to Aiven MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error connecting to Aiven MySQL:');
    console.error('  Code:', err.code);
    console.error('  Message:', err.message);
    console.error('  Stack:', err.stack);
  });

module.exports = pool;
