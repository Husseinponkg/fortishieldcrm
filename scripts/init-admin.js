const db = require('../config/db');
const bcrypt = require('bcrypt');

async function initAdmin() {
    try {
        // Check if an admin already exists
        const [adminRows] = await db.execute("SELECT COUNT(*) as count FROM admin");
        if (adminRows[0].count > 0) {
            console.log('Admin user already exists. Skipping initialization.');
            process.exit(0);
        }

        // Create the admin user
        const username = 'superadmin';
        const password = 'superadmin123';

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the admin user into the admin table
        const sql = "INSERT INTO admin (username, password, role) VALUES (?, ?, 'admin')";
        const [result] = await db.execute(sql, [username, hashedPassword]);

        console.log(`Admin user created successfully with ID: ${result.insertId}`);
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        console.log('Please change the password after logging in for the first time.');

        process.exit(0);
    } catch (err) {
        console.error('Error initializing admin user:', err);
        process.exit(1);
    }
}

// Run the initialization
initAdmin();