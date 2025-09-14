const http = require('http');

// Test the new trends API endpoint
function testTrendsApi() {
    const options = {
        hostname: 'localhost',
        port: 3001, // HTTP port
        path: '/api/trends',
        method: 'GET'
    };

    console.log('Testing trends API endpoint...');
    
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
    
    req.end();
}

testTrendsApi();