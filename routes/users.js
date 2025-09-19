const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { getUserById, updateUser, deleteUser } = require('../controllers/usercontroller');

// Get all users
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, username, email, roles, contacts FROM users');
        res.status(200).json({ success: true, users: rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Get user by ID
router.get('/:id', getUserById);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

// Add user
router.post('/', async (req, res) => {
    try {
        const { username, email, roles, contacts, password } = req.body;
        
        // Validate required fields
        if (!username || !email || !roles || !password) {
            return res.status(400).json({ message: 'Username, email, roles, and password are required' });
        }
        
        // Check if user already exists
        const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        // Hash the password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        const sql = `INSERT INTO users (username, email, roles, contacts, password) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [
            username,
            email,
            roles,
            contacts || '',
            hashedPassword
        ]);
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

module.exports = router;