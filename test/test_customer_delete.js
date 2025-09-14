const db = require('../config/db');

// Test function to verify customer deletion with foreign key constraints
async function testCustomerDeletion() {
    console.log('Testing customer deletion with foreign key constraints...');
    
    try {
        // First, create a test customer
        console.log('Creating test customer...');
        const [customerResult] = await db.execute(
            `INSERT INTO customers(username, email, contacts, service, details) 
             VALUES (?, ?, ?, ?, ?)`,
            ['test_customer', 'test@example.com', '1234567890', 'test_service', 'Test customer details']
        );
        const customerId = customerResult.insertId;
        console.log(`Created customer with ID: ${customerId}`);
        
        // Create a test deal for this customer
        console.log('Creating test deal for the customer...');
        const [dealResult] = await db.execute(
            `INSERT INTO deals(customer_id, title, description, value, stage) 
             VALUES (?, ?, ?, ?, ?)`,
            [customerId, 'Test Deal', 'Test deal description', 1000.00, 'prospect']
        );
        const dealId = dealResult.insertId;
        console.log(`Created deal with ID: ${dealId}`);
        
        // Verify the customer and deal exist
        const [customerCheck] = await db.execute(`SELECT * FROM customers WHERE id = ?`, [customerId]);
        const [dealCheck] = await db.execute(`SELECT * FROM deals WHERE id = ?`, [dealId]);
        
        if (customerCheck.length === 0) {
            console.error('ERROR: Customer was not created');
            return;
        }
        
        if (dealCheck.length === 0) {
            console.error('ERROR: Deal was not created');
            return;
        }
        
        console.log('Customer and deal created successfully. Testing deletion...');
        
        // Now test the delete function by calling the controller function directly
        // We'll simulate the request and response objects
        const req = { params: { id: customerId } };
        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.body = data;
                return this;
            }
        };
        
        // Import the controller function
        const { deleteCustomer } = require('../controllers/customercontroller');
        
        // Call the delete function
        await deleteCustomer(req, res);
        
        console.log(`Delete response status: ${res.statusCode}`);
        console.log(`Delete response body:`, res.body);
        
        // Verify the customer and deal were deleted
        const [customerCheckAfter] = await db.execute(`SELECT * FROM customers WHERE id = ?`, [customerId]);
        const [dealCheckAfter] = await db.execute(`SELECT * FROM deals WHERE id = ?`, [dealId]);
        
        if (customerCheckAfter.length === 0 && dealCheckAfter.length === 0) {
            console.log('SUCCESS: Both customer and related deals were deleted successfully');
        } else {
            console.error('ERROR: Customer or deals still exist after deletion');
        }
        
    } catch (error) {
        console.error('Test failed with error:', error);
    } finally {
        // Clean up any remaining test data
        try {
            await db.execute(`DELETE FROM deals WHERE title = ?`, ['Test Deal']);
            await db.execute(`DELETE FROM customers WHERE username = ?`, ['test_customer']);
        } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
        }
        
        console.log('Test completed');
    }
}

// Run the test
testCustomerDeletion();