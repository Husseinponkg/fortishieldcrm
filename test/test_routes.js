const express = require('express');
const app = express();
const customerRoutes = require('./routes/customer');

// Mount customer routes
app.use('/customer', customerRoutes);

// Log all registered routes for debugging
console.log('Registered routes:');
app._router && app._router.stack.forEach((r) => {
    if (r.name === 'router') {
        // This is a mounted router
        console.log(`Mounted router at: ${r.regexp.source}`);
        r.handle.stack.forEach((subRoute) => {
            if (subRoute.route) {
                console.log(`  Route: ${subRoute.route.path}`, Object.keys(subRoute.route.methods));
            }
        });
    } else if (r.route) {
        // This is a direct route
        console.log(`Route: ${r.route.path}`, Object.keys(r.route.methods));
    }
});

console.log('Test completed');