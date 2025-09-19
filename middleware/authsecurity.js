const db = require('../config/db');

// Middleware to authenticate admin users
const authenticateAdmin = async (req, res, next) => {
    try {
        // For simplicity, we'll just check if the request has admin credentials
        // In a real application, you would implement proper session management
        
        // Check if user is admin by looking for a simple header or session variable
        // For now, we'll allow all requests to pass through for testing purposes
        // In a production environment, you would implement proper session management
        
        // For demonstration, we'll attach a dummy admin user to the request
        req.user = {
            id: 1,
            username: 'admin',
            role: 'admin'
        };
        
        next();
    } catch (error) {
        console.error('Error authenticating admin:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.'
        });
    }
};

module.exports = authenticateAdmin;