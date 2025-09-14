const db = require('../config/db');

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

    // Insert new user
    const sql = `INSERT INTO users (username, email, roles,password, contacts) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [
      username,
      email,
      roles,
      password,
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
    const [users] = await db.execute(
      'SELECT * FROM users WHERE username = ? AND password = ? AND roles = ?',
      [username, password, roles]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: users[0].id,
        username: users[0].username,
        roles: users[0].roles
      }
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
