const db = require('../config/db');

// Test user registration with various contact values
async function testUserRegistration() {
  console.log('Testing user registration with various contact values...');
  
  const testUsers = [
    {
      username: 'testuser1',
      email: 'testuser1@example.com',
      roles: 'developer',
      password: 'password123',
      contacts: '1234567890' // Phone number
    },
    {
      username: 'testuser2',
      email: 'testuser2@example.com',
      roles: 'project_manager',
      password: 'password123',
      contacts: 'testuser2@example.com' // Email
    },
    {
      username: 'testuser3',
      email: 'testuser3@example.com',
      roles: 'general_manager',
      password: 'password123',
      contacts: '+1-234-567-8901' // International format
    }
  ];

  try {
    for (const user of testUsers) {
      console.log(`Testing registration for ${user.username} with contacts: ${user.contacts}`);
      
      // Check if user already exists
      const [existingUsers] = await db.execute(
        'SELECT * FROM users WHERE email = ?',
        [user.email]
      );

      if (existingUsers.length > 0) {
        // Delete existing user for clean test
        await db.execute('DELETE FROM users WHERE email = ?', [user.email]);
        console.log(`Deleted existing user ${user.username}`);
      }

      // Insert new user
      const sql = `INSERT INTO users (username, email, roles, password, contacts) VALUES (?, ?, ?, ?, ?)`;
      const [result] = await db.execute(sql, [
        user.username,
        user.email,
        user.roles,
        user.password,
        user.contacts
      ]);

      console.log(`Successfully registered user ${user.username} with ID: ${result.insertId}`);
    }
    
    console.log('All tests passed!');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    // Clean up test users
    try {
      await db.execute("DELETE FROM users WHERE email LIKE 'testuser%@example.com'");
      console.log('Cleaned up test users');
    } catch (cleanupErr) {
      console.error('Error cleaning up test users:', cleanupErr);
    }
  }
}

// Run the test
testUserRegistration().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});