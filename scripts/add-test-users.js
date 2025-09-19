const db = require('../config/db');
const bcrypt = require('bcrypt');

async function addTestUsers() {
    try {
        // Create some test users with different roles
        const testUsers = [
            {
                username: 'john_doe',
                email: 'john.doe@example.com',
                roles: 'general_manager',
                password: 'password123',
                contacts: '123-456-7890'
            },
            {
                username: 'jane_smith',
                email: 'jane.smith@example.com',
                roles: 'project_manager',
                password: 'password123',
                contacts: '098-765-4321'
            },
            {
                username: 'bob_johnson',
                email: 'bob.johnson@example.com',
                roles: 'developer',
                password: 'password123',
                contacts: '55-123-4567'
            },
            {
                username: 'alice_brown',
                email: 'alice.brown@example.com',
                roles: 'customer_admin',
                password: 'password123',
                contacts: '44-987-6543'
            }
        ];

        for (const user of testUsers) {
            // Check if user already exists
            const [existingUsers] = await db.execute(
                'SELECT * FROM users WHERE email = ?',
                [user.email]
            );

            if (existingUsers.length > 0) {
                console.log(`User ${user.username} already exists. Skipping.`);
                continue;
            }

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
        process.exit(0);
    } catch (err) {
        console.error('Error adding test users:', err);
        process.exit(1);
    }
}

// Run the function
addTestUsers();