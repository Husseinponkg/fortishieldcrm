const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        console.log('Testing database connection...');
        
        // Create a simple connection
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'A002#tz1',
            database: 'crm',
            port: 3306,
            connectTimeout: 10000, // 10 seconds
        });
        
        console.log('Connected successfully to the database');
        
        // Test a simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('Test query result:', rows);
        
        // Close the connection
        await connection.end();
        console.log('Connection closed successfully');
    } catch (error) {
        console.error('Error connecting to the database:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    }
}

testConnection();