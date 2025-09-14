const db = require('./config/db');

async function addTestData() {
  try {
    // Add some test customers
    const customers = [
      { username: 'John Doe', email: 'john@example.com', contacts: 123456789, service: 'Web Development', details: 'Looking for a website redesign' },
      { username: 'Jane Smith', email: 'jane@example.com', contacts: 987654321, service: 'Mobile App', details: 'Need a mobile app for my business' },
      { username: 'Bob Johnson', email: 'bob@example.com', contacts: 555555, service: 'Web Development', details: 'E-commerce website needed' },
      { username: 'Alice Brown', email: 'alice@example.com', contacts: 1111, service: 'Consulting', details: 'Business process optimization' },
      { username: 'Charlie Wilson', email: 'charlie@example.com', contacts: 22222222, service: 'Mobile App', details: 'iOS app development' },
      { username: 'Diana Davis', email: 'diana@example.com', contacts: 3333333, service: 'Web Development', details: 'Corporate website design' },
      { username: 'Eve Miller', email: 'eve@example.com', contacts: 4444444, service: 'Consulting', details: 'Market research and analysis' }
    ];

    for (const customer of customers) {
      const sql = `INSERT INTO customers(username, user_id, email, contacts, service, details) VALUES (?, ?, ?, ?, ?, ?)`;
      const [result] = await db.execute(sql, [customer.username, 1, customer.email, customer.contacts, customer.service, customer.details]);
      console.log(`Added customer: ${customer.username}`);
    }

    console.log('Test data added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding test data:', error);
    process.exit(1);
  }
}

addTestData();