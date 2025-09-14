const db = require('./config/db');

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        
        // Test connection
        const connection = await db.getConnection();
        console.log('Connected to database successfully');
        connection.release();
        
        // Test fetching customers
        console.log('Fetching customers...');
        const [customerRows] = await db.execute('SELECT * FROM customers LIMIT 5');
        console.log('Customers:', customerRows);
        
        // Test fetching activities
        console.log('Fetching activities...');
        const [activityRows] = await db.execute('SELECT * FROM activities LIMIT 5');
        console.log('Activities:', activityRows);
        
        // Test fetching opportunities
        console.log('Fetching opportunities...');
        const [opportunityRows] = await db.execute('SELECT * FROM opportunities LIMIT 5');
        console.log('Opportunities:', opportunityRows);
        
        // Test the specific queries used in getCustomerTrends
        console.log('Testing service distribution query...');
        const [serviceRows] = await db.execute('SELECT service, COUNT(*) as count FROM customers GROUP BY service');
        console.log('Service distribution:', serviceRows);
        
        console.log('Testing top services query...');
        const [topServicesRows] = await db.execute('SELECT service, COUNT(*) as count FROM customers GROUP BY service ORDER BY count DESC LIMIT 5');
        console.log('Top services:', topServicesRows);
        
        console.log('Testing activity status distribution query...');
        const [activityStatusRows] = await db.execute('SELECT status, COUNT(*) as count FROM activities GROUP BY status');
        console.log('Activity status distribution:', activityStatusRows);
        
        console.log('Testing opportunity stage distribution query...');
        const [opportunityStageRows] = await db.execute('SELECT stage, COUNT(*) as count FROM opportunities GROUP BY stage');
        console.log('Opportunity stage distribution:', opportunityStageRows);
        
        console.log('All tests completed successfully');
    } catch (error) {
        console.error('Error in database test:', error);
    }
}

testDatabase();