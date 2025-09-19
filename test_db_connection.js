const db = require('./config/db');

async function testDbConnection() {
  try {
    console.log('Testing database connection...');
    const [rows] = await db.execute('SELECT id, username, email, roles FROM users');
    console.log('Users found:', rows);
    console.log('Number of users:', rows.length);
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

testDbConnection();