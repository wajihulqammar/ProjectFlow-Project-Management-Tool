const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const commentRoutes = require('./routes/comments');
const activityRoutes = require('./routes/activities');
const dashboardRoutes = require('./routes/dashboard');

const { authenticateSocket } = require('./middleware/auth');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Security & perf middleware
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Socket.IO for real-time collaboration
io.use(authenticateSocket);

const connectedUsers = new Map();

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  connectedUsers.set(userId, socket.id);
  
  // Notify others that user is online
  socket.broadcast.emit('user:online', { userId, timestamp: new Date() });
  
  // Send current online users to newly connected user
  socket.emit('users:online', Array.from(connectedUsers.keys()));

  // Join project room
  socket.on('project:join', (projectId) => {
    socket.join(`project:${projectId}`);
    socket.to(`project:${projectId}`).emit('project:user_joined', {
      userId,
      projectId,
      timestamp: new Date()
    });
  });

  // Leave project room
  socket.on('project:leave', (projectId) => {
    socket.leave(`project:${projectId}`);
  });

  // Task updates - real time
  socket.on('task:update', (data) => {
    socket.to(`project:${data.projectId}`).emit('task:updated', data);
  });

  // Real-time cursor/presence in kanban
  socket.on('cursor:move', (data) => {
    socket.to(`project:${data.projectId}`).emit('cursor:moved', {
      userId,
      ...data
    });
  });

  // Comment typing indicator
  socket.on('comment:typing', (data) => {
    socket.to(`project:${data.projectId}`).emit('comment:user_typing', {
      userId,
      ...data
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    connectedUsers.delete(userId);
    io.emit('user:offline', { userId, timestamp: new Date() });
  });
});

// Make io available to routes
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/projectflow';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 ProjectFlow server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready for real-time connections`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

module.exports = { app, io };