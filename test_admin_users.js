// Simple test script to verify the admin users API endpoint
async function testAdminUsers() {
  try {
    console.log('Testing admin users API endpoint...');
    const response = await fetch('/admin/get-all-users');
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      console.error('Request failed with status:', response.status);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Run the test
testAdminUsers();