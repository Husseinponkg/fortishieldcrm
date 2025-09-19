const express = require('express');
const db = require('./config/db');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Debug environment variables
console.log('Environment variables loaded:');
console.log(`BEEM_API_KEY: ${process.env.BEEM_API_KEY ? 'Present' : 'Missing'}`);
console.log(`BEEM_SECRET_KEY: ${process.env.BEEM_SECRET_KEY ? 'Present' : 'Missing'}`);
console.log(`BEEM_SENDER_ID: ${process.env.BEEM_SENDER_ID ? 'Present' : 'Missing'}`);

const app = express();
// Ensure port is a valid number
let port = process.env.PORT || 3002;
if (typeof port === 'string') {
  port = parseInt(port, 10);
}
if (isNaN(port) || port < 0 || port > 65535) {
  port = 3002;
  console.log('Invalid PORT environment variable, defaulting to 3002');
}

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder at root (/)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Initialize Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.locals.io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`A user connected with socket ID: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`User disconnected with socket ID: ${socket.id}`);
  });
});

// Routes
const authRouter = require('./routes/auth');
const customerRouter = require('./routes/customer');
const serviceStatisticsRouter = require('./routes/service_statistics');
const trendsRouter = require('./routes/trends');
const activitiesRouter = require('./routes/activities');
const dealsRouter = require('./routes/deals');
const reportRouter = require('./routes/report');
const projectRoutes = require('./routes/projectRoutes');
const usersRoutes = require('./routes/users');
const conversationsRoutes = require('./routes/conversations');
const adminRoutes = require('./routes/admin');
const smsRoutes = require('./routes/sms');

app.use('/auth', authRouter);
app.use('/customer', customerRouter);
app.use('/service-statistics', serviceStatisticsRouter);
app.use('/api/trends', trendsRouter);
app.use('/activities', activitiesRouter);
app.use('/deals', dealsRouter.router || dealsRouter);
app.use('/report', reportRouter);
app.use('/projects', projectRoutes);
app.use('/users', usersRoutes);
app.use('/conversations', conversationsRoutes);
app.use('/admin', adminRoutes);
app.use('/sms', smsRoutes);

// Test endpoint
app.get('/test-server', (req, res) => {
  res.status(200).json({ success: true, message: 'Server test endpoint working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// HTTPS options
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert'))
};

// Start servers
httpServer.listen(port + 1, () => {
  console.log(`CRM HTTP Server with Socket.IO running on http://localhost:${port + 1}`);
});

const httpsServer = https.createServer(httpsOptions, app);
io.attach(httpsServer);
httpsServer.listen(port, () => {
  console.log(`CRM HTTPS Server with Socket.IO running on https://localhost:${port}`);
  console.log('Registered routes:');
  app._router.stack.forEach((r) => {
    if (r.route) {
      console.log(`Route: ${r.route.path} [${Object.keys(r.route.methods).join(', ').toUpperCase()}]`);
    } else if (r.name === 'router') {
      const prefix = r.regexp.source.replace(/^\^\\([^\\/]*)\\?\/?/, '$1') || '/';
      r.handle.stack.forEach((subRoute) => {
        if (subRoute.route) {
          console.log(`Route: ${prefix}${subRoute.route.path} [${Object.keys(subRoute.route.methods).join(', ').toUpperCase()}]`);
        }
      });
    }
  });
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Use 'netstat -ano | findstr :${port}' (Windows) or 'lsof -i :${port}' (Mac/Linux) to find the process.`);
  } else {
    console.error('Failed to start server:', err.message);
  }
  process.exit(1);
});