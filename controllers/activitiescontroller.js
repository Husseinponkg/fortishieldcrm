const db = require('../config/db');

// Get all activities
const getAllActivities = async (req, res) => {
    try {
        const sql = `
            SELECT a.*, c.username as customer_name 
            FROM activities a 
            LEFT JOIN customers c ON a.customer_id = c.id
            ORDER BY a.created_at DESC
        `;
        const [rows] = await db.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get activity by ID
const getActivityById = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT a.*, c.username as customer_name 
            FROM activities a 
            LEFT JOIN customers c ON a.customer_id = c.id
            WHERE a.id = ?
        `;
        const [rows] = await db.execute(sql, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Activity not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create new activity
const createActivity = async (req, res) => {
    try {
        let { customer_id, opportunity_id, task_type, description, notification, assigned_to, status } = req.body;
        
        // Validate required fields
        if (!task_type || !description || !assigned_to || !status) {
            return res.status(400).json({ message: 'Task type, description, assigned to, and status are required' });
        }
        
        // Convert undefined values to null for database insertion
        customer_id = customer_id === undefined ? null : customer_id;
        opportunity_id = opportunity_id === undefined ? null : opportunity_id;
        notification = notification === undefined ? null : notification;
        
        const sql = `
            INSERT INTO activities (customer_id, opportunity_id, task_type, description, notification, assigned_to, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        const [result] = await db.execute(sql, [customer_id, opportunity_id, task_type, description, notification, assigned_to, status]);
        
        res.status(201).json({ id: result.insertId, message: 'Activity created successfully' });
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update activity
const updateActivity = async (req, res) => {
    try {
        const { id } = req.params;
        let { customer_id, opportunity_id, task_type, description, notification, assigned_to, status } = req.body;
        
        // Validate required fields
        if (!task_type || !description || !assigned_to || !status) {
            return res.status(400).json({ message: 'Task type, description, assigned to, and status are required' });
        }
        
        // Convert undefined values to null for database update
        customer_id = customer_id === undefined ? null : customer_id;
        opportunity_id = opportunity_id === undefined ? null : opportunity_id;
        notification = notification === undefined ? null : notification;
        
        const sql = `
            UPDATE activities
            SET customer_id = ?, opportunity_id = ?, task_type = ?, description = ?, notification = ?, assigned_to = ?, status = ?
            WHERE id = ?
        `;
        const [result] = await db.execute(sql, [customer_id, opportunity_id, task_type, description, notification, assigned_to, status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Activity not found' });
        }
        
        res.status(200).json({ message: 'Activity updated successfully' });
    } catch (error) {
        console.error('Error updating activity:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete activity
const deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `DELETE FROM activities WHERE id = ?`;
        const [result] = await db.execute(sql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Activity not found' });
        }
        
        res.status(200).json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get activities by status
const getActivitiesByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const sql = `
            SELECT a.*, c.username as customer_name 
            FROM activities a 
            LEFT JOIN customers c ON a.customer_id = c.id
            WHERE a.status = ?
            ORDER BY a.created_at DESC
        `;
        const [rows] = await db.execute(sql, [status]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching activities by status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get activities by assigned user
const getActivitiesByAssignedUser = async (req, res) => {
    try {
        const { assigned_to } = req.params;
        const sql = `
            SELECT a.*, c.username as customer_name 
            FROM activities a 
            LEFT JOIN customers c ON a.customer_id = c.id
            WHERE a.assigned_to = ?
            ORDER BY a.created_at DESC
        `;
        const [rows] = await db.execute(sql, [assigned_to]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching activities by assigned user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getAllActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivitiesByStatus,
    getActivitiesByAssignedUser
};