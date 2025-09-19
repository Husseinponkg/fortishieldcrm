const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ----------------- REGISTER USER -----------------
const registerUser = async (req, res) => {
  const { username, email, roles, password, contacts } = req.body;

  try {
    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const sql = `INSERT INTO users (username, email, roles, password, contacts) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [
      username,
      email,
      roles,
      hashedPassword,
      contacts
    ]);

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'User registered successfully'
    });
  } catch (err) {
    console.error('Error in creating user:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ----------------- LOGIN USER -----------------
const loginUser = async (req, res) => {
  const { username, password, roles } = req.body;

  try {
    // If role is admin, check admin table only
    if (roles === 'admin') {
      const [admins] = await db.execute(
        'SELECT * FROM admin WHERE username = ?',
        [username]
      );

      if (admins.length > 0) {
        // Admin found, check password
        const admin = admins[0];
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (isPasswordValid) {
          // Generate JWT token for admin
          const token = jwt.sign(
            {
              id: admin.admin_id,
              username: admin.username,
              role: 'admin'
            },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '24h' }
          );
          
          return res.status(200).json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
              id: admin.admin_id,
              username: admin.username,
              roles: admin.role || 'admin'
            }
          });
        }
      }
    } else {
      // Check regular users table
      const [users] = await db.execute(
        'SELECT * FROM users WHERE username = ? AND roles = ?',
        [username, roles]
      );

      if (users.length > 0) {
        // User found, check password
        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
          return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
              id: user.id,
              username: user.username,
              roles: user.roles
            }
          });
        }
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ----------------- EXPORT -----------------
module.exports = { registerUser, loginUser };
