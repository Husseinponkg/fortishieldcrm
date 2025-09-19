// Test script to verify admin endpoints are working
const fetch = require('node-fetch');

async function testAdminEndpoints() {
    console.log('Testing admin endpoints...');
    
    try {
        // Test the troubleshoot endpoint
        const troubleshootResponse = await fetch('http://localhost:3002/admin/troubleshoot-system');
        const troubleshootData = await troubleshootResponse.json();
        console.log('Troubleshoot endpoint response:', troubleshootData);
        
        // Test the restart services endpoint
        const restartResponse = await fetch('http://localhost:3002/admin/restart-services', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const restartData = await restartResponse.json();
        console.log('Restart services endpoint response:', restartData);
        
        // Test the reset system endpoint
        const resetResponse = await fetch('http://localhost:3002/admin/reset-system', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const resetData = await resetResponse.json();
        console.log('Reset system endpoint response:', resetData);
        
        // Test the backup system endpoint
        const backupResponse = await fetch('http://localhost:3002/admin/backup-system', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const backupData = await backupResponse.json();
        console.log('Backup system endpoint response:', backupData);
    } catch (error) {
        console.error('Error testing admin endpoints:', error);
    }
}

testAdminEndpoints();