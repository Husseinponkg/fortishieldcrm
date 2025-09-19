const express = require('express');
const router = express.Router();
const { customerdetails, updateDetails, deleteCustomer, getCustomers, getCustomerById, getCustomerTrends, getServiceStatistics, getNewCustomersThisMonth } = require('../controllers/customercontroller');

// Customer routes
router.post('/', customerdetails);          // Create new customer
router.get('/', getCustomers);             // Get all customers
router.get('/new-this-month', getNewCustomersThisMonth);  // Get count of new customers this month
router.get('/trends', getCustomerTrends);  // Get customer trends
router.get('/service-statistics', getServiceStatistics);  // Get service statistics
router.get('/service-stats', getServiceStatistics);  // Alternative route for service statistics
router.get('/:id', getCustomerById);       // Get customer by ID
router.put('/:id', updateDetails);         // Update customer by ID
router.delete('/:id', deleteCustomer);     // Delete customer by ID
router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Customer routes are working' });
});

module.exports = router;
