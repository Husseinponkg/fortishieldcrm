const http = require('http');

// Test the activities API endpoint that the daily tasks page uses
function testDailyTasksApi() {
    const options = {
        hostname: 'localhost',
        port: 3001, // HTTP port
        path: '/activities',
        method: 'GET'
    };

    console.log('Testing activities API endpoint for daily tasks...');
    
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
            
            // Try to parse JSON response
            try {
                const jsonData = JSON.parse(data);
                console.log(`\nParsed ${jsonData.length} activities`);
                if (jsonData.length > 0) {
                    console.log('First activity:', jsonData[0]);
                }
            } catch (error) {
                console.log('Response is not valid JSON');
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('Error:', error);
    });
    
    req.end();
}

testDailyTasksApi();