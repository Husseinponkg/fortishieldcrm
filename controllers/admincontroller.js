const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Admin login
const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if admin exists
        const [admins] = await db.execute(
            'SELECT * FROM admin WHERE username = ?',
            [username]
        );
        
        if (admins.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Check password
        const admin = admins[0];
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Add log entry for successful login
        await addLog('info', `Admin user ${admin.username} logged in successfully`, admin.admin_id, req.ip);
        
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: admin.admin_id,
                username: admin.username
            }
        });
    } catch (err) {
        console.error('Error in admin login:', err);
        
        // Add log entry for failed login attempt
        await addLog('error', `Failed admin login attempt for username: ${req.body.username}`, null, req.ip);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Create first admin (only if no admin exists)
const createFirstAdmin = async (req, res) => {
    try {
        // Check if an admin already exists
        const [adminRows] = await db.execute("SELECT COUNT(*) as count FROM admin");
        if (adminRows[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Admin user already exists'
            });
        }
        
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert the admin user into the admin table
        const sql = "INSERT INTO admin (username, password, role) VALUES (?, ?, 'admin')";
        const [result] = await db.execute(sql, [username, hashedPassword]);
        
        // Add log entry for admin creation
        await addLog('info', `Admin user ${username} created successfully`, null, req.ip);
        
        return res.status(201).json({
            success: true,
            message: 'Admin user created successfully',
            adminId: result.insertId
        });
    } catch (err) {
        console.error('Error creating admin user:', err);
        
        // Add log entry for failed admin creation
        await addLog('error', `Failed to create admin user: ${err.message}`, null, req.ip);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Add another admin (special function - only one admin can exist at a time)
const addAnotherAdmin = async (req, res) => {
    try {
        // For security, we'll replace the existing admin rather than adding another
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Delete existing admin and insert new one
        await db.execute("DELETE FROM admin");
        const sql = "INSERT INTO admin (username, password, role) VALUES (?, ?, 'admin')";
        const [result] = await db.execute(sql, [username, hashedPassword]);
        
        // Add log entry for admin replacement
        await addLog('info', `Admin user ${username} replaced previous admin`, null, req.ip);
        
        return res.status(201).json({
            success: true,
            message: 'New admin user created successfully',
            adminId: result.insertId
        });
    } catch (err) {
        console.error('Error creating new admin user:', err);
        
        // Add log entry for failed admin replacement
        await addLog('error', `Failed to replace admin user: ${err.message}`, null, req.ip);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, username, email, roles FROM users');
        res.status(200).json({
            success: true,
            users: rows
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Add new user
const addUser = async (req, res) => {
    try {
        const { username, email, roles, password, contacts } = req.body;
        
        // Validate required fields
        if (!username || !email || !roles || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, roles, and password are required'
            });
        }
        
        // Check if user already exists
        const [existingUsers] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
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
            contacts || ''
        ]);
        
        // Add log entry for user creation
        await addLog('info', `User ${username} created successfully`, null, req.ip);
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Error creating user:', error);
        
        // Add log entry for failed user creation
        await addLog('error', `Failed to create user: ${error.message}`, null, req.ip);
        
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, roles, contacts } = req.body;
        
        // Validate required fields
        if (!username || !email || !roles) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and roles are required'
            });
        }
        
        const sql = 'UPDATE users SET username = ?, email = ?, roles = ?, contacts = ? WHERE id = ?';
        const [result] = await db.execute(sql, [username, email, roles, contacts || '', id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Add log entry for user update
        await addLog('info', `User ${id} updated successfully`, null, req.ip);
        
        res.status(200).json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Error updating user:', error);
        
        // Add log entry for failed user update
        await addLog('error', `Failed to update user ${id}: ${error.message}`, null, req.ip);
        
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
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
            return res.status(400).json({
                success: false,
                message: 'Cannot delete user with associated customers'
            });
        }
        
        // Check if user is an admin
        const [adminRows] = await db.execute('SELECT COUNT(*) as count FROM admin WHERE users_id = ?', [id]);
        if (adminRows[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin user through this endpoint'
            });
        }
        
        // Check if user is a developer
        const [developerRows] = await db.execute('SELECT COUNT(*) as count FROM developers WHERE id = ?', [id]);
        if (developerRows[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete developer user through this endpoint'
            });
        }
        
        const sql = 'DELETE FROM users WHERE id = ?';
        const [result] = await db.execute(sql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Add log entry for user deletion
        await addLog('info', `User ${id} deleted successfully`, null, req.ip);
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        
        // Add log entry for failed user deletion
        await addLog('error', `Failed to delete user ${id}: ${error.message}`, null, req.ip);
        
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT a.*, c.username as customer_name 
            FROM activities a 
            LEFT JOIN customers c ON a.customer_id = c.id 
            ORDER BY a.created_at DESC 
            LIMIT 50
        `);
        
        res.status(200).json({
            success: true,
            activities: rows
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching activities',
            error: error.message
        });
    }
};

// Get system logs from database
const getSystemLogs = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT id, level, message, timestamp
            FROM system_logs
            ORDER BY timestamp DESC
            LIMIT 100
        `);
        
        res.status(200).json({
            success: true,
            logs: rows
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching logs',
            error: error.message
        });
    }
};

// Clear logs (in a real system, this would clear actual log files or log table)
const clearLogs = async (req, res) => {
    try {
        await db.execute('DELETE FROM system_logs');
        
        // Add log entry for logs cleared
        await addLog('info', 'System logs cleared by admin', null, req.ip);
        
        res.status(200).json({
            success: true,
            message: 'Logs cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing logs:', error);
        
        // Add log entry for failed log clearing
        await addLog('error', `Failed to clear logs: ${error.message}`, null, req.ip);
        
        res.status(500).json({
            success: false,
            message: 'Error clearing logs',
            error: error.message
        });
    }
};

// Troubleshoot system by checking various system stats
const troubleshootSystem = async (req, res) => {
    try {
        // Get counts of various entities in the system
        const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
        const [customerCount] = await db.execute('SELECT COUNT(*) as count FROM customers');
        const [activityCount] = await db.execute('SELECT COUNT(*) as count FROM activities');
        const [projectCount] = await db.execute('SELECT COUNT(*) as count FROM projects');
        const [dealCount] = await db.execute('SELECT COUNT(*) as count FROM deals');
        const [logCount] = await db.execute('SELECT COUNT(*) as count FROM system_logs');
        
        // Perform system diagnostics
        const diagnostics = {
            database: 'connected',
            server: 'running',
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            userCount: userCount[0].count,
            customerCount: customerCount[0].count,
            activityCount: activityCount[0].count,
            projectCount: projectCount[0].count,
            dealCount: dealCount[0].count,
            logCount: logCount[0].count
        };
        
        res.status(200).json({
            success: true,
            diagnostics: diagnostics
        });
    } catch (error) {
        console.error('Error during troubleshooting:', error);
        res.status(500).json({
            success: false,
            message: 'Error during troubleshooting',
            error: error.message
        });
    }
};

// Restart services
const restartServices = async (req, res) => {
    try {
        // In a real system, this would restart actual services
        // For now, we'll just simulate the process
        
        // Add log entry for service restart
        await addLog('info', 'Services restart initiated by admin', null, req.ip);
        
        // Simulate service restart delay
        setTimeout(async () => {
            await addLog('info', 'Services restarted successfully', null, req.ip);
        }, 3000);
        
        res.status(200).json({
            success: true,
            message: 'Services restart initiated successfully'
        });
    } catch (error) {
        console.error('Error restarting services:', error);
        
        // Add log entry for failed service restart
        await addLog('error', `Failed to restart services: ${error.message}`, null, req.ip);
        
        res.status(500).json({
            success: false,
            message: 'Error restarting services',
            error: error.message
        });
    }
};

// Reset system
const resetSystem = async (req, res) => {
    try {
        // In a real system, this would reset the system
        // For now, we'll just simulate the process
        
        // Add log entry for system reset
        await addLog('info', 'System reset initiated by admin', null, req.ip);
        
        // Simulate system reset delay
        setTimeout(async () => {
            await addLog('info', 'System reset completed successfully', null, req.ip);
        }, 5000);
        
        res.status(200).json({
            success: true,
            message: 'System reset initiated successfully'
        });
    } catch (error) {
        console.error('Error resetting system:', error);
        
        // Add log entry for failed system reset
        await addLog('error', `Failed to reset system: ${error.message}`, null, req.ip);
        
        res.status(500).json({
            success: false,
            message: 'Error resetting system',
            error: error.message
        });
    }
};

// Backup system
const backupSystem = async (req, res) => {
    try {
        // In a real system, this would create a backup
        // For now, we'll just simulate the process
        
        // Add log entry for system backup
        await addLog('info', 'System backup initiated by admin', null, req.ip);
        
        // Simulate backup process delay
        setTimeout(async () => {
            await addLog('info', 'System backup completed successfully', null, req.ip);
        }, 4000);
        
        res.status(200).json({
            success: true,
            message: 'System backup initiated successfully'
        });
    } catch (error) {
        console.error('Error backing up system:', error);
        
        // Add log entry for failed system backup
        await addLog('error', `Failed to backup system: ${error.message}`, null, req.ip);
        
        res.status(500).json({
            success: false,
            message: 'Error backing up system',
            error: error.message
        });
    }
};

// Add a log entry to the system_logs table
const addLog = async (level, message, userId = null, ipAddress = null) => {
    try {
        // Check if userId belongs to a user in the users table or an admin
        // For now, we'll just pass null for admin actions to avoid foreign key constraint issues
        const sql = "INSERT INTO system_logs (level, message, user_id, ip_address) VALUES (?, ?, ?, ?)";
        await db.execute(sql, [level, message, userId, ipAddress]);
    } catch (error) {
        console.error('Error adding log entry:', error);
        // If there's a foreign key constraint error, try again with userId set to null
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            try {
                const sql = "INSERT INTO system_logs (level, message, user_id, ip_address) VALUES (?, ?, ?, ?)";
                await db.execute(sql, [level, message, null, ipAddress]);
            } catch (retryError) {
                console.error('Error adding log entry after retry:', retryError);
            }
        }
    }
};

module.exports = {
    loginAdmin,
    createFirstAdmin,
    addAnotherAdmin,
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    getRecentActivities,
    getSystemLogs,
    clearLogs,
    troubleshootSystem,
    restartServices,
    resetSystem,
    backupSystem,
    addLog
};