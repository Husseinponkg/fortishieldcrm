const express = require('express');
const router = express.Router();
const { getTrendsData, getTrendsDataFromFile } = require('../controllers/customercontroller');

// Trends routes
router.get('/', getTrendsData);  // Get trends data from database
router.get('/file', getTrendsDataFromFile);  // Get trends data from file

module.exports = router;