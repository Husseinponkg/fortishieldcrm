const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admincontroller');
const authenticateAdmin = require('../middleware/authsecurity');

// Admin login route (no authentication required)
router.post('/login', adminController.loginAdmin);

// Create first admin (no authentication required)
router.post('/create-admin', adminController.createFirstAdmin);

// Add another admin (no authentication required for now)
router.post('/add-another-admin', adminController.addAnotherAdmin);

// Get all users (authentication required)
router.get('/get-all-users', authenticateAdmin, adminController.getAllUsers);

// Add new user (authentication required)
router.post('/add-user', authenticateAdmin, adminController.addUser);

// Update user (authentication required)
router.put('/update-user/:id', authenticateAdmin, adminController.updateUser);

// Delete user (authentication required)
router.delete('/delete-user/:id', authenticateAdmin, adminController.deleteUser);

// Get recent activities (authentication required)
router.get('/get-recent-activities', authenticateAdmin, adminController.getRecentActivities);

// Get system logs (authentication required)
router.get('/get-system-logs', authenticateAdmin, adminController.getSystemLogs);

// Clear logs (authentication required)
router.post('/clear-logs', authenticateAdmin, adminController.clearLogs);

// Troubleshoot system (authentication required)
router.get('/troubleshoot-system', authenticateAdmin, adminController.troubleshootSystem);

// Restart services (authentication required)
router.post('/restart-services', authenticateAdmin, adminController.restartServices);

// Reset system (authentication required)
router.post('/reset-system', authenticateAdmin, adminController.resetSystem);

// Backup system (authentication required)
router.post('/backup-system', authenticateAdmin, adminController.backupSystem);

module.exports = router;
