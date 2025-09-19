const db = require('./config/db');

async function testDbUsers() {
  try {
    console.log('Testing database connection...');
    const [rows] = await db.execute('SELECT id, username, email, roles FROM users');
    console.log('Users found:', rows);
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

testDbUsers();