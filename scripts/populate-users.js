const db = require('../config/db');
const bcrypt = require('bcrypt');

async function populateUsers() {
    try {
        // Create some test users with different roles
        const testUsers = [
            {
                username: 'general_manager1',
                email: 'gm1@example.com',
                roles: 'general_manager',
                password: 'password123',
                contacts: '123-456-7890'
            },
            {
                username: 'project_manager1',
                email: 'pm1@example.com',
                roles: 'project_manager',
                password: 'password123',
                contacts: '098-765-4321'
            },
            {
                username: 'developer1',
                email: 'dev1@example.com',
                roles: 'developer',
                password: 'password123',
                contacts: '555-123-4567'
            },
            {
                username: 'customer_admin1',
                email: 'ca1@example.com',
                roles: 'customer_admin',
                password: 'password123',
                contacts: '444-987-6543'
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
            
            // If this is a developer, also add to developers table
            if (user.roles === 'developer') {
                const devSql = `INSERT INTO developers (id, name, email, password, contacts) VALUES (?, ?, ?, ?)`;
                await db.execute(devSql, [
                    result.insertId,
                    user.username,
                    user.email,
                    hashedPassword,
                    user.contacts
                ]);
                console.log(`Successfully added developer record for ${user.username}`);
            }
        }

        console.log('Test users populated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error populating test users:', err);
        process.exit(1);
    }
}

// Run the function
populateUsers();