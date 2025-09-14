const db = require('../config/db');

// Get all deals
const getAllDeals = async (req, res) => {
    try {
        const sql = `SELECT d.*, c.username as customer_name 
                     FROM deals d 
                     LEFT JOIN customers c ON d.customer_id = c.id 
                     ORDER BY d.created_at DESC`;
        const [rows] = await db.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching deals:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
};

// Get deal by ID
const getDealById = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `SELECT d.*, c.username as customer_name 
                     FROM deals d 
                     LEFT JOIN customers c ON d.customer_id = c.id 
                     WHERE d.id = ?`;
        const [rows] = await db.execute(sql, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Deal not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching deal:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
};

// Create new deal
const createDeal = async (req, res) => {
    try {
        const { customer_id, title, description, value, stage, probability, dead_line } = req.body;
        
        // Validate required fields
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        
        const sql = `INSERT INTO deals (customer_id, title, description, value, stage, probability, dead_line) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [
            customer_id || null,
            title,
            description || '',
            value || 0,
            stage || 'prospect',
            probability || 0,
            dead_line || null
        ]);
        
    // Update deals summary statistics and return updated pipeline data
    const summary = await updateDealsSummary();

    res.status(201).json({ id: result.insertId, message: 'Deal created successfully', summary });
    } catch (error) {
        console.error('Error creating deal:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
};

// Update deal
const updateDeal = async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_id, title, description, value, stage, probability, dead_line } = req.body;
        
        // Check if deal exists
        const checkSql = `SELECT id FROM deals WHERE id = ?`;
        const [checkResult] = await db.execute(checkSql, [id]);
        
        if (checkResult.length === 0) {
            return res.status(404).json({ message: 'Deal not found' });
        }
        
        const sql = `UPDATE deals SET customer_id = ?, title = ?, description = ?, value = ?, 
                     stage = ?, probability = ?, dead_line = ? WHERE id = ?`;
        const [result] = await db.execute(sql, [
            customer_id || null,
            title,
            description || '',
            value || 0,
            stage || 'prospect',
            probability || 0,
            dead_line || null,
            id
        ]);
        
        // Update deals summary statistics
        await updateDealsSummary();
        
        res.status(200).json({ message: 'Deal updated successfully' });
    } catch (error) {
        console.error('Error updating deal:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
};

// Delete deal
const deleteDeal = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `DELETE FROM deals WHERE id = ?`;
        const [result] = await db.execute(sql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Deal not found' });
        }
        
        // Update deals summary statistics
        await updateDealsSummary();
        
        res.status(200).json({ message: 'Deal deleted successfully' });
    } catch (error) {
        console.error('Error deleting deal:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
};

// Get deals by stage
const getDealsByStage = async (req, res) => {
    try {
        const sql = `SELECT stage, COUNT(*) as count, SUM(value) as total_value 
                     FROM deals 
                     GROUP BY stage 
                     ORDER BY FIELD(stage, 'prospect', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')`;
        const [rows] = await db.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching deals by stage:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
};

// Get deals summary
const getDealsSummary = async (req, res) => {
    try {
        // Total deals
        const [totalDeals] = await db.execute(`SELECT COUNT(*) as count FROM deals`);
        
        // Total value of deals
        const [totalValue] = await db.execute(`SELECT SUM(value) as total FROM deals`);
        
        // Deals by stage
        const [dealsByStage] = await db.execute(`
            SELECT stage, COUNT(*) as count 
            FROM deals 
            GROUP BY stage 
            ORDER BY FIELD(stage, 'prospect', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')
        `);
        
        // Recent deals
        const [recentDeals] = await db.execute(`
            SELECT d.*, c.username as customer_name 
            FROM deals d 
            LEFT JOIN customers c ON d.customer_id = c.id 
            ORDER BY d.created_at DESC 
            LIMIT 5
        `);
        
        res.status(200).json({
            totalDeals: totalDeals[0].count,
            totalValue: totalValue[0].total || 0,
            dealsByStage,
            recentDeals
        });
    } catch (error) {
        console.error('Error fetching deals summary:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
};

// Progress deal to next stage
const progressDealStage = async (req, res) => {
    try {
        const { id } = req.params;
        const { direction } = req.body; // 'forward' or 'backward'
        
        // Get current deal
        const [dealRows] = await db.execute(`SELECT * FROM deals WHERE id = ?`, [id]);
        if (dealRows.length === 0) {
            return res.status(404).json({ message: 'Deal not found' });
        }
        
        const deal = dealRows[0];
        const stages = ['prospect', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
        const currentStageIndex = stages.indexOf(deal.stage);
        
        let newStageIndex;
        if (direction === 'forward') {
            newStageIndex = Math.min(currentStageIndex + 1, stages.length - 1);
        } else if (direction === 'backward') {
            newStageIndex = Math.max(currentStageIndex - 1, 0);
        } else {
            return res.status(400).json({ message: 'Invalid direction. Use "forward" or "backward"' });
        }
        
        const newStage = stages[newStageIndex];
        
        // Update probability based on stage
        let newProbability = deal.probability;
        switch (newStage) {
            case 'prospect': newProbability = 10; break;
            case 'qualification': newProbability = 25; break;
            case 'proposal': newProbability = 50; break;
            case 'negotiation': newProbability = 75; break;
            case 'closed_won': newProbability = 100; break;
            case 'closed_lost': newProbability = 0; break;
        }
        
        // Update deal
        const [result] = await db.execute(
            `UPDATE deals SET stage = ?, probability = ? WHERE id = ?`,
            [newStage, newProbability, id]
        );
        
        // Update deals summary statistics
        await updateDealsSummary();
        
        res.status(200).json({
            message: `Deal progressed to ${newStage}`,
            stage: newStage,
            probability: newProbability
        });
    } catch (error) {
        console.error('Error progressing deal stage:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
};

// Get deals nearing deadline
const getDealsNearingDeadline = async (req, res) => {
    try {
        // Get deals with deadlines within the next 7 days
        const sql = `
            SELECT d.*, c.username as customer_name
            FROM deals d
            LEFT JOIN customers c ON d.customer_id = c.id
            WHERE d.dead_line IS NOT NULL 
            AND d.dead_line > NOW() 
            AND d.dead_line <= DATE_ADD(NOW(), INTERVAL 7 DAY)
            AND d.stage NOT IN ('closed_won', 'closed_lost')
            ORDER BY d.dead_line ASC
        `;
        const [rows] = await db.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching deals nearing deadline:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
};

// Update deals summary statistics
async function updateDealsSummary() {
    try {
        // Compute fresh statistics for deals
        const [totalDealsRows] = await db.execute(`SELECT COUNT(*) as count FROM deals`);
        const totalDeals = totalDealsRows[0].count || 0;

        const [totalValueRows] = await db.execute(`SELECT IFNULL(SUM(value),0) as total FROM deals`);
        const totalValue = totalValueRows[0].total || 0;

        const [dealsByStageRows] = await db.execute(`
            SELECT stage, COUNT(*) as count, IFNULL(SUM(value),0) as total_value
            FROM deals
            GROUP BY stage
            ORDER BY FIELD(stage, 'prospect', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')
        `);

        const summary = {
            totalDeals,
            totalValue,
            dealsByStage: dealsByStageRows
        };

        // Log and return summary so callers (e.g., createDeal) can use it immediately
        console.log('Deals summary statistics updated', summary);
        return summary;
    } catch (error) {
        console.error('Error updating deals summary:', error);
        return null;
    }
}

module.exports = {
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
};