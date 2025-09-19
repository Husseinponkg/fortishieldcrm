const db = require('../config/db');
const bcrypt = require('bcrypt');

async function populateTestUsers() {
  try {
    console.log('Checking if users table is empty...');
    
    // Check if there are any users in the database
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM users');
    const userCount = rows[0].count;
    
    console.log('Number of users in database:', userCount);
    
    if (userCount === 0) {
      console.log('Users table is empty. Adding test users...');
      
      // Create some test users with different roles
      const testUsers = [
        {
          username: 'admin_user',
          email: 'admin@example.com',
          roles: 'general_manager',
          password: 'admin123',
          contacts: '123-456-7890'
        },
        {
          username: 'project_manager1',
          email: 'pm1@example.com',
          roles: 'project_manager',
          password: 'pm123',
          contacts: '098-765-4321'
        },
        {
          username: 'developer1',
          email: 'dev1@example.com',
          roles: 'developer',
          password: 'dev123',
          contacts: '55-123-4567'
        },
        {
          username: 'customer_admin1',
          email: 'ca1@example.com',
          roles: 'customer_admin',
          password: 'ca123',
          contacts: '444-987-6543'
        }
      ];

      for (const user of testUsers) {
        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Insert new user
        const sql = `INSERT INTO users (username, email, roles, password, contacts) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [
          user.username,
          user.email,
          user.roles,
          hashedPassword,
          user.contacts
        ]);

        console.log(`Successfully added user ${user.username} with ID: ${result.insertId}`);
      }
      
      console.log('Test users added successfully!');
    } else {
      console.log('Users table already has data. Skipping population.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error populating test users:', err);
    process.exit(1);
  }
}

// Run the function
populateTestUsers();