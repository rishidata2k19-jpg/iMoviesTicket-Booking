const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const theatreRoutes = require('./routes/theatreRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const { startCleanupJob } = require('./utils/cleanupService');
const { startReminderJob } = require('./utils/reminderService');
const { seedInitialData } = require('./utils/seedData');

const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io Room & Real-time Seat Availability Tracking
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // User joins a specific show's seatmap room
  socket.on('join_show', (showId) => {
    socket.join(showId);
    console.log(`[Socket.io] Socket ${socket.id} joined room: ${showId}`);
  });

  socket.on('leave_show', (showId) => {
    socket.leave(showId);
    console.log(`[Socket.io] Socket ${socket.id} left room: ${showId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movie', movieRoutes);
app.use('/api/theatre', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'iMovies API Server',
    time: new Date().toISOString(),
    dbConnected: mongoose.connection.readyState === 1,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB with graceful fallback
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies_db';

// Persistent MongoMemoryServer instance in module scope to prevent GC process termination
let mongodInstance = null;

const startServer = async () => {
  try {
    let connected = false;
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${MONGO_URI}`);
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
      console.log('[Database] Connected to external MongoDB successfully.');
      connected = true;
    } catch (dbErr) {
      console.warn('[Database] External MongoDB connection failed. Starting embedded MongoMemoryServer...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      global.__mongodInstance = mongodInstance;
      const memoryUri = mongodInstance.getUri();
      console.log(`[Database] MongoMemoryServer active at: ${memoryUri}`);
      await mongoose.connect(memoryUri);
      console.log('[Database] Connected to in-memory MongoDB.');
      connected = true;
    }

    if (connected) {
      // Seed initial mock data
      await seedInitialData();

      // Start seat lock background cleanup service
      startCleanupJob(io, 10000);

      // Start node-cron reminders
      startReminderJob();

      server.listen(PORT, '0.0.0.0', () => {
        console.log(`===============================================`);
        console.log(`🍿 iMovies API Server running on port ${PORT}`);
        console.log(`📡 WebSocket ready on port ${PORT}`);
        console.log(`===============================================`);
      });
    }
  } catch (err) {
    console.error('[Fatal Server Startup Error]:', err);
    process.exit(1);
  }
};

startServer();
