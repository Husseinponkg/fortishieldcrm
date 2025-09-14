const express = require('express');
const db = require('./config/db');
const port = 3002;
const app = express();
const path = require('path');
const fs = require('fs');
const https = require('https');
const { createServer } = require('http');
const { Server } = require('socket.io');
require("dotenv").config();

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies (from forms)
app.use(express.urlencoded({ extended: true }));

const smsRoutes = require("./routes/sms");
app.use("/sms", smsRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Initialize Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store io instance in app locals for access in routes
app.locals.io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected with socket ID:', socket.id);
  
  
  socket.on('disconnect', () => {
    console.log('User disconnected with socket ID:', socket.id);
  });
});
// Serve static files (css, js, images, html inside public folder)
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const authrouter = require('./routes/auth');
const customerrouter = require('./routes/customer');
const serviceStatisticsRouter = require('./routes/service_statistics');
const trendsrouter = require('./routes/trends');
const activitiesrouter = require('./routes/activities');
const dealsrouter = require('./routes/deals');
const reportRouter = require('./routes/report');

// Use routes
app.use('/auth', authrouter);
app.use('/customer', customerrouter);
app.use('/service-statistics', serviceStatisticsRouter);
app.use('/api/trends', trendsrouter);
app.use('/activities', activitiesrouter);
// Support modules that export either a router directly or an object containing a router
app.use('/deals', dealsrouter && dealsrouter.router ? dealsrouter.router : dealsrouter);
// Report routes
app.use('/report', reportRouter);

// Log routes for debugging
console.log('Registering routes...');
console.log('Auth routes:', authrouter);
console.log('Customer routes:', customerrouter);
console.log('Deals routes:', dealsrouter);
const projectRoutes = require('./routes/projectRoutes');
app.use('/projects', projectRoutes);

// Users routes
const usersRoutes = require('./routes/users');
app.use('/users', usersRoutes);

// Conversations routes
const conversationsRoutes = require('./routes/conversations');
app.use('/conversations', conversationsRoutes);


// Default route (homepage)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simple test endpoint
app.get('/test-server', (req, res) => {
    res.status(200).json({ message: 'Server test endpoint working' });
});

// HTTPS options
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert'))
};

// Start both HTTP and HTTPS servers for testing
const http = require('http');
// Start HTTP server with Socket.IO
httpServer.listen(port + 1, () => {
    console.log(`CRM HTTP Server with Socket.IO is running on http://localhost:${port + 1}`);
});

// Start HTTPS server with Socket.IO
const httpsServer = https.createServer(httpsOptions, app);
io.attach(httpsServer);

httpsServer.listen(port, () => {
    console.log(`CRM HTTPS Server with Socket.IO is running on https://localhost:${port}`);
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
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please kill the process using this port or change the port number in server.js`);
        console.error('You can find the process using the port with: netstat -ano | findstr :3000 (Windows) or lsof -i :3000 (Mac/Linux)');
    } else {
        console.error('Failed to start server:', err.message);
    }
    process.exit(1);
});
