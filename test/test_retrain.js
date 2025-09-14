const http = require('http');

// Test the customer details endpoint which should trigger model retraining
function testCustomerDetails() {
    const postData = JSON.stringify({
        username: 'Test User',
        email: 'test@example.com',
        contacts: '1234567890',
        service: 'Test Service',
        details: 'This is a test customer for model retraining'
    });

    const options = {
        hostname: 'localhost',
        port: 3001, // HTTP port
        path: '/customer',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('Testing customer details endpoint...');
    
    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Response body:');
            console.log(data);
        });
    });
    
    req.on('error', (error) => {
        console.error('Error:', error);
    });
    
    req.write(postData);
    req.end();
}

testCustomerDetails();