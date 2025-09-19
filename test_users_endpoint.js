// Simple test script to verify the users endpoint
const http = require('http');

// Test the users endpoint
const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/users/',
  method: 'GET'
};

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
    
    // Try to parse JSON
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:');
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
});

req.on('error', (error) => {
 console.error('Error:', error);
});

req.end();