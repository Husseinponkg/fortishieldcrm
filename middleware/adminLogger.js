const db = require('../config/db');

// Middleware to log admin actions
const logAdminAction = async (req, res, next) => {
    try {
        // Only log actions for admin routes
        if (req.originalUrl.startsWith('/admin')) {
            const adminId = req.user ? req.user.id : null;
            const action = `${req.method} ${req.originalUrl}`;
            const ipAddress = req.ip || req.connection.remoteAddress;
            
            // Insert log entry
            const sql = "INSERT INTO system_logs (level, message, user_id, ip_address) VALUES (?, ?, ?, ?)";
            await db.execute(sql, ['info', `Admin action: ${action}`, adminId, ipAddress]);
        }
    } catch (error) {
        console.error('Error logging admin action:', error);
    }
    
    // Continue with the request
    next();
};

module.exports = logAdminAction;