const db = require('../config/db');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to train the model
function trainModel() {
    return new Promise((resolve, reject) => {
        // Spawn a new process to run the model training script
        const python = spawn('python', [path.join(__dirname, '../trainer/model.py')]);

        python.on('close', (code) => {
            if (code === 0) {
                console.log('Model training completed successfully');
                resolve();
            } else {
                console.error(`Model training failed with code ${code}`);
                reject(new Error(`Model training failed with code ${code}`));
            }
        });

        python.on('error', (error) => {
            console.error('Error starting model training:', error);
            reject(error);
        });
    });
}

// Function to get predictions from the trained model
async function getModelPredictions() {
    // This would be implemented to use the trained model
    // For now, we'll return a placeholder
    return {
        modelStatus: 'Active',
        lastTraining: new Date().toLocaleString(),
        accuracy: '85.7%'
    };
}

// Function to load trends data from the JSON file
async function loadTrendsDataFromFile() {
    try {
        const trendsDataPath = path.join(__dirname, '../trainer/trends.json');
        const trendsData = JSON.parse(fs.readFileSync(trendsDataPath, 'utf8'));
        return trendsData;
    } catch (error) {
        console.error('Error loading trends data from file:', error);
        return null;
    }
}

// Function to retrain the trends model
function retrainTrendsModel() {
    return new Promise((resolve, reject) => {
        // Spawn a new process to run the trends retraining script
        const python = spawn('python', [path.join(__dirname, '../trainer/retrain_model.py')]);
        
        // Capture stdout and stderr for better debugging
        let stdout = '';
        let stderr = '';
        
        python.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        python.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        python.on('close', (code) => {
            if (code === 0) {
                console.log('Trends model retraining completed successfully');
                console.log('Python script output:', stdout);
                resolve();
            } else {
                console.error(`Trends model retraining failed with code ${code}`);
                console.error('Python script stdout:', stdout);
                console.error('Python script stderr:', stderr);
                reject(new Error(`Trends model retraining failed with code ${code}. Stderr: ${stderr}`));
            }
        });

        python.on('error', (error) => {
            console.error('Error starting trends model retraining:', error);
            reject(error);
        });
    });
}

// Insert customer details
const customerdetails = async (req, res) => {
    try {
        const { username, email, contacts, service, details, user_id } = req.body;

        // Validate required fields
        if (!username || !email || !contacts || !service) {
            return res.status(400).json({ message: 'Username, email, contacts, and service are required' });
        }

        // If user_id is not provided, use NULL
        const userId = user_id || null;

        const sql = `INSERT INTO customers(username, user_id, email, contacts, service, details) VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [username, userId, email, contacts, service, details]);

        // Train the model after adding a customer
        trainModel().catch(error => {
            console.error('Error training model:', error);
        });
        
        // Also retrain the trends model
        retrainTrendsModel().catch(error => {
            console.error('Error retraining trends model:', error);
        });

        res.status(201).json({ id: result.insertId, message: 'Customer added successfully' });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update customer
const updateDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, contacts, service, details, user_id } = req.body;
        const userId = user_id || null;
        const sql = `UPDATE customers SET username=?, user_id=?, email=?, contacts=?, service=?, details=? WHERE id=?`;
        const [result] = await db.execute(sql, [username, userId, email, contacts, service, details, id]);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Customer not found' });

        res.status(200).json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        // Retrain the trends model after updating a customer
        retrainTrendsModel().catch(error => {
            console.error('Error retraining trends model after customer update:', error);
        });
    }
};

// Delete customer
const deleteCustomer = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        
        // Get a connection from the pool
        connection = await db.getConnection();
        
        // Start transaction
        await connection.beginTransaction();
        
        // First, verify the customer exists
        const verifySql = `SELECT id, username, service FROM customers WHERE id = ?`;
        const [verifyResult] = await connection.execute(verifySql, [id]);
        
        if (verifyResult.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        const customerData = verifyResult[0];
        console.log(`Deleting customer: ${customerData.username} with service: ${customerData.service}`);
        
        // Delete all related records in other tables to avoid foreign key constraint violation
        // The order is important to maintain referential integrity
        
        // Delete all related SMS records
        const deleteSmsSql = `DELETE FROM sms WHERE customer_id = ?`;
        const [smsDeleteResult] = await connection.execute(deleteSmsSql, [id]);
        console.log(`Deleted ${smsDeleteResult.affectedRows} related SMS records for customer ${customerData.username}`);
        
        // Delete all related emails
        const deleteEmailsSql = `DELETE FROM emails WHERE customer_id = ?`;
        const [emailsDeleteResult] = await connection.execute(deleteEmailsSql, [id]);
        console.log(`Deleted ${emailsDeleteResult.affectedRows} related email records for customer ${customerData.username}`);
        
        // Delete all related reports
        const deleteReportsSql = `DELETE FROM report WHERE customer_id = ?`;
        const [reportsDeleteResult] = await connection.execute(deleteReportsSql, [id]);
        console.log(`Deleted ${reportsDeleteResult.affectedRows} related reports for customer ${customerData.username}`);
        
        // Delete all related conversations
        const deleteConversationsSql = `DELETE FROM conversations WHERE customer_id = ?`;
        const [conversationsDeleteResult] = await connection.execute(deleteConversationsSql, [id]);
        console.log(`Deleted ${conversationsDeleteResult.affectedRows} related conversations for customer ${customerData.username}`);
        
        // Delete all related activities
        const deleteActivitiesSql = `DELETE FROM activities WHERE customer_id = ?`;
        const [activitiesDeleteResult] = await connection.execute(deleteActivitiesSql, [id]);
        console.log(`Deleted ${activitiesDeleteResult.affectedRows} related activities for customer ${customerData.username}`);
        
        // Delete all related contacts
        const deleteContactsSql = `DELETE FROM contacts WHERE customer_id = ?`;
        const [contactsDeleteResult] = await connection.execute(deleteContactsSql, [id]);
        console.log(`Deleted ${contactsDeleteResult.affectedRows} related contacts for customer ${customerData.username}`);
        
        // Delete all related projects
        const deleteProjectsSql = `DELETE FROM projects WHERE customer_id = ?`;
        const [projectsDeleteResult] = await connection.execute(deleteProjectsSql, [id]);
        console.log(`Deleted ${projectsDeleteResult.affectedRows} related projects for customer ${customerData.username}`);
        
        // Delete all related deals
        const deleteDealsSql = `DELETE FROM deals WHERE customer_id = ?`;
        const [dealsDeleteResult] = await connection.execute(deleteDealsSql, [id]);
        console.log(`Deleted ${dealsDeleteResult.affectedRows} related deals for customer ${customerData.username}`);
        
        // Now delete the customer
        const deleteCustomerSql = `DELETE FROM customers WHERE id = ?`;
        const [customerDeleteResult] = await connection.execute(deleteCustomerSql, [id]);
        
        if (customerDeleteResult.affectedRows === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        // Commit the transaction
        await connection.commit();
        connection.release();
        
        console.log(`Successfully deleted customer: ${customerData.username}`);
        res.status(200).json({
            message: 'Customer and all related records deleted successfully',
            deletedCustomer: {
                id: customerData.id,
                username: customerData.username,
                service: customerData.service
            }
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        // Rollback the transaction in case of error
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        res.status(500).json({ message: 'Internal server error', error: error.message });
    } finally {
        // Retrain the trends model after deleting a customer
        retrainTrendsModel().catch(error => {
            console.error('Error retraining trends model after customer deletion:', error);
        });
    }
};

// Get service statistics
const getServiceStatistics = async (req, res) => {
    console.log('getServiceStatistics called');
    try {
        // Get service distribution
        const serviceSql = `SELECT service, COUNT(*) as count FROM customers GROUP BY service`;
        let serviceRows = [];
        try {
            [serviceRows] = await db.execute(serviceSql);
            console.log('Service distribution:', serviceRows);
        } catch (error) {
            console.error('Error fetching service distribution:', error);
            serviceRows = [];
        }
        
        // Get customer growth over time (simplified - just counting customers by month)
        const growthSql = `
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') as date,
                COUNT(*) as count,
                SUM(COUNT(*)) OVER (ORDER BY DATE_FORMAT(created_at, '%Y-%m')) as cumulative_count
            FROM customers
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY date
        `;
        let growthRows = [];
        try {
            [growthRows] = await db.execute(growthSql);
            console.log('Customer growth:', growthRows);
        } catch (error) {
            console.error('Error fetching customer growth:', error);
            growthRows = [];
        }
        
        // Get top services
        const topServicesSql = `SELECT service, COUNT(*) as count FROM customers GROUP BY service ORDER BY count DESC LIMIT 5`;
        let topServicesRows = [];
        try {
            [topServicesRows] = await db.execute(topServicesSql);
            console.log('Top services:', topServicesRows);
        } catch (error) {
            console.error('Error fetching top services:', error);
            topServicesRows = [];
        }
        
        // Return data in the format expected by the frontend
        res.status(200).json({
            serviceDistribution: serviceRows,
            customerGrowth: growthRows,  // Properly populated customer growth data
            topServices: topServicesRows,
            activityStatusDistribution: [],  // Placeholder for activity status distribution
            opportunityStageDistribution: []  // Placeholder for opportunity stage distribution
        });
    } catch (error) {
        console.error('Error fetching service statistics:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get trends data
const getTrendsData = async (req, res) => {
    console.log('getTrendsData called');
    try {
        // Get service distribution
        const serviceSql = `SELECT service, COUNT(*) as count FROM customers GROUP BY service`;
        let serviceRows = [];
        try {
            [serviceRows] = await db.execute(serviceSql);
            console.log('Service distribution:', serviceRows);
        } catch (error) {
            console.error('Error fetching service distribution:', error);
            serviceRows = [];
        }
        
        // Get customer growth over time (simplified - just counting customers by month)
        const growthSql = `
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') as date,
                COUNT(*) as count,
                SUM(COUNT(*)) OVER (ORDER BY DATE_FORMAT(created_at, '%Y-%m')) as cumulative_count
            FROM customers
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY date
        `;
        let growthRows = [];
        try {
            [growthRows] = await db.execute(growthSql);
            console.log('Customer growth:', growthRows);
        } catch (error) {
            console.error('Error fetching customer growth:', error);
            growthRows = [];
        }
        
        
        // Get customer growth by service over time
        const serviceGrowthSql = `
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') as date,
                service,
                COUNT(*) as count
            FROM customers
            GROUP BY DATE_FORMAT(created_at, '%Y-%m'), service
            ORDER BY date, service
        `;
        let serviceGrowthRows = [];
        try {
            [serviceGrowthRows] = await db.execute(serviceGrowthSql);
            console.log('Service growth:', serviceGrowthRows);
        } catch (error) {
            console.error('Error fetching service growth:', error);
            serviceGrowthRows = [];
        }
        // Get top services
        const topServicesSql = `SELECT service, COUNT(*) as count FROM customers GROUP BY service ORDER BY count DESC LIMIT 5`;
        let topServicesRows = [];
        try {
            [topServicesRows] = await db.execute(topServicesSql);
            console.log('Top services:', topServicesRows);
        } catch (error) {
            console.error('Error fetching top services:', error);
            topServicesRows = [];
        }
        
        res.status(200).json({
            serviceDistribution: serviceRows,
            customerGrowth: growthRows,
            topServices: topServicesRows,
            serviceGrowth: serviceGrowthRows
        });
    } catch (error) {
        console.error('Error fetching trends data:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get all customers
const getCustomers = async (req, res) => {
    try {
        const sql = `SELECT * FROM customers`;
        const [rows] = await db.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get count of new customers this month
const getNewCustomersThisMonth = async (req, res) => {
    try {
        const sql = `
            SELECT COUNT(*) as count
            FROM customers
            WHERE YEAR(created_at) = YEAR(CURRENT_DATE())
            AND MONTH(created_at) = MONTH(CURRENT_DATE())
        `;
        const [rows] = await db.execute(sql);
        res.status(200).json({ count: rows[0].count });
    } catch (error) {
        console.error('Error fetching new customers this month:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get customer by ID
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `SELECT * FROM customers WHERE id=?`;
        const [rows] = await db.execute(sql, [id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Customer not found' });

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get trends data from file
const getTrendsDataFromFile = async (req, res) => {
    console.log('getTrendsDataFromFile called');
    try {
        const trendsData = await loadTrendsDataFromFile();
        if (trendsData) {
            res.status(200).json(trendsData);
        } else {
            res.status(500).json({ message: 'Error loading trends data from file' });
        }
    } catch (error) {
        console.error('Error fetching trends data from file:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get customer trends
const getCustomerTrends = async (req, res) => {
    console.log('getCustomerTrends called');
    try {
        // Get service distribution
        const serviceSql = `SELECT service, COUNT(*) as count FROM customers GROUP BY service`;
        let serviceRows = [];
        try {
            [serviceRows] = await db.execute(serviceSql);
            console.log('Service distribution:', serviceRows);
        } catch (error) {
            console.error('Error fetching service distribution:', error);
            serviceRows = [];
        }

        // Get top services
        const topServicesSql = `SELECT service, COUNT(*) as count FROM customers GROUP BY service ORDER BY count DESC LIMIT 5`;
        let topServicesRows = [];
        try {
            [topServicesRows] = await db.execute(topServicesSql);
            console.log('Top services:', topServicesRows);
        } catch (error) {
            console.error('Error fetching top services:', error);
            topServicesRows = [];
        }

        // Get activity status distribution
        const activityStatusSql = `SELECT status, COUNT(*) as count FROM activities GROUP BY status`;
        let activityStatusRows = [];
        try {
            [activityStatusRows] = await db.execute(activityStatusSql);
            console.log('Activity status distribution:', activityStatusRows);
        } catch (error) {
            console.error('Error fetching activity status distribution:', error);
            // This might fail if the activities table doesn't exist or is empty
            activityStatusRows = [];
        }

        // Get opportunity stage distribution
        const opportunityStageSql = `SELECT stage, COUNT(*) as count FROM opportunities GROUP BY stage`;
        let opportunityStageRows = [];
        try {
            [opportunityStageRows] = await db.execute(opportunityStageSql);
            console.log('Opportunity stage distribution:', opportunityStageRows);
        } catch (error) {
            console.error('Error fetching opportunity stage distribution:', error);
            // This might fail if the opportunities table doesn't exist or is empty
            opportunityStageRows = [];
        }

        // Get model predictions
        let modelInfo = null;
        try {
            modelInfo = await getModelPredictions();
        } catch (error) {
            console.error('Error fetching model predictions:', error);
            modelInfo = null;
        }

        res.status(200).json({
            serviceDistribution: serviceRows,
            topServices: topServicesRows,
            activityStatusDistribution: activityStatusRows,
            opportunityStageDistribution: opportunityStageRows,
            modelInfo: modelInfo
        });
    } catch (error) {
        console.error('Error fetching customer trends:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports = { customerdetails, updateDetails, deleteCustomer, getCustomers, getCustomerById, getCustomerTrends, getServiceStatistics, getTrendsData, getTrendsDataFromFile, getNewCustomersThisMonth };
