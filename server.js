const express = require('express');
const db = require('./config/db'); // now points to Aiven
const path = require('path');
const fs = require('fs');
const https = require('https');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
let port = process.env.PORT || 3002;

// Middleware
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Initialize Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET','POST'] }
});
app.locals.io = io;

io.on('connection', socket => {
  console.log(`User connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`User disconnected: ${socket.id}`));
});

// Routes
const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

// Test endpoint
app.get('/test-server', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT NOW() AS now');
    res.json({ success: true, serverTime: rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// HTTPS options (keep if you have SSL)
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl','server.key')),
  cert: fs.readFileSync(path.join(__dirname,'ssl','server.cert'))
};

// Start HTTP + HTTPS servers
httpServer.listen(port + 1, () => console.log(`HTTP Server running on http://localhost:${port+1}`));
const httpsServer = https.createServer(httpsOptions, app);
io.attach(httpsServer);
httpsServer.listen(port, () => console.log(`HTTPS Server running on https://localhost:${port}`));
