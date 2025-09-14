const express = require('express');
const router = express.Router();
const { getServiceStatistics } = require('../controllers/customercontroller');

// Service statistics routes
router.get('/', getServiceStatistics);  // Get service statistics

module.exports = router;
