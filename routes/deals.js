const express = require('express');
const router = express.Router();
const {
    getAllDeals,
    getDealById,
    createDeal,
    updateDeal,
    deleteDeal,
    getDealsByStage,
    getDealsSummary,
    progressDealStage,
    getDealsNearingDeadline,
    updateDealsSummary
} = require('../controllers/dealscontroller');

// Deals routes
router.get('/', getAllDeals);                           // Get all deals
router.get('/stage', getDealsByStage);                  // Get deals by stage
router.get('/summary', getDealsSummary);                // Get deals summary
router.get('/deadline/reminders', getDealsNearingDeadline); // Get deals nearing deadline
router.get('/:id', getDealById);                        // Get deal by ID
router.post('/', createDeal);                           // Create new deal
router.put('/:id', updateDeal);                         // Update deal by ID
router.delete('/:id', deleteDeal);                      // Delete deal by ID
router.put('/:id/progress', progressDealStage);         // Progress deal to next stage

module.exports = {
    router,
    updateDealsSummary
};