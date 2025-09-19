const db = require('../config/db');

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT id, username, email, roles, contacts FROM users WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json({ success: true, user: rows[0] });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, roles, contacts } = req.body;
        
        // Validate required fields
        if (!username || !email || !roles) {
            return res.status(400).json({ message: 'Username, email, and roles are required' });
        }
        
        const sql = 'UPDATE users SET username = ?, email = ?, roles = ?, contacts = ? WHERE id = ?';
        const [result] = await db.execute(sql, [username, email, roles, contacts || '', id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent deletion of users with associated records
        // Check if user has associated customers
        const [customerRows] = await db.execute('SELECT COUNT(*) as count FROM customers WHERE user_id = ?', [id]);
        if (customerRows[0].count > 0) {
            return res.status(400).json({ message: 'Cannot delete user with associated customers' });
        }
        
        // Check if user is an admin
        const [adminRows] = await db.execute('SELECT COUNT(*) as count FROM admin WHERE users_id = ?', [id]);
        if (adminRows[0].count > 0) {
            return res.status(400).json({ message: 'Cannot delete admin user' });
        }
        
        const sql = 'DELETE FROM users WHERE id = ?';
        const [result] = await db.execute(sql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

module.exports = { getUserById, updateUser, deleteUser };