const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportcontroller');

// Create report
router.post('/create', reportController.createReport);

// View all reports
	router.get('/', reportController.viewreports)

// Download specific report
router.get('/download/:id', reportController.downloadReport);

// Get customers list
router.get('/customers', reportController.getCustomers);

// Get projects list
router.get('/projects', reportController.getProjects);

// Delete a report
router.delete('/:id', reportController.deleteReport);

module.exports = router;
