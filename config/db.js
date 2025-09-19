const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'A002#tz1',
    database: process.env.DB_DATABASE || 'crm',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    queueLimit: 10,
    connectionLimit: 10,
    acquireTimeout: 60000, // 60 seconds
    timeout: 60000, // 60 seconds
    connectTimeout: 60000, // 60 seconds
    idleTimeout: 60000, // 60 seconds
    keepAliveInitialDelay: 0,
    enableKeepAlive: true
});

// Test the connection when the module is loaded
pool.getConnection()
.then(connection => {
    console.log('Connected successfully to the database');
    connection.release();
}).catch(err => {
    console.error('Error connecting to the database:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    // Log environment variables (without password)
    console.log('Database configuration:');
    console.log('  Host:', process.env.DB_HOST || 'localhost');
    console.log('  User:', process.env.DB_USER || 'root');
    console.log('  Database:', process.env.DB_DATABASE || 'crm');
    console.log('  Port:', process.env.DB_PORT || 3306);
});

module.exports = pool;