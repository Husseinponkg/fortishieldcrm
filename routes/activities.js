const express = require('express');
const router = express.Router();
const {
    getAllActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivitiesByStatus,
    getActivitiesByAssignedUser
} = require('../controllers/activitiescontroller');

// Activity routes
router.get('/', getAllActivities);                    // Get all activities
router.get('/:id', getActivityById);                 // Get activity by ID
router.post('/', createActivity);                    // Create new activity
router.put('/:id', updateActivity);                  // Update activity by ID
router.delete('/:id', deleteActivity);               // Delete activity by ID
router.get('/status/:status', getActivitiesByStatus); // Get activities by status
router.get('/assigned/:assigned_to', getActivitiesByAssignedUser); // Get activities by assigned user

module.exports = router;