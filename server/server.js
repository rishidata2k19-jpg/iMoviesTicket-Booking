const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignored in runtimes without setDefaultResultOrder
}

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env, falling back to root .env
dotenv.config({ path: path.join(__dirname, '.env') });
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

const fs = require('fs');
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
    credentials: true,
  },
});

app.set('io', io);

// Configure Cross-Origin Resource Sharing (CORS)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : '*';

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (such as mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins === '*' || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  })
);
app.options('*', cors());

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'OK' : 'DEGRADED',
    service: 'iMovies API Server',
    time: new Date().toISOString(),
    dbConnected: isConnected,
    environment: process.env.NODE_ENV || 'development',
    mongoUriConfigured: !!process.env.MONGO_URI,
  });
});

// Serve static frontend build if present (for single-service / monolithic production deployments)
const clientBuildPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
  console.log(`[Deployment] Serving static frontend build from: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB Atlas
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://rishidata2k19_db_user:d3KfjFuJxXHL32GE@cluster0.xndy3pu.mongodb.net/imovies_db?retryWrites=true&w=majority';

// Persistent MongoMemoryServer instance in module scope to prevent GC process termination
let mongodInstance = null;

const connectDB = async () => {
  let isConnected = false;
  const maskedUri = MONGO_URI.replace(/:([^:@]{4,})@/, ':****@');

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${maskedUri}`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 6000,
    });
    console.log('[Database] Connected to external MongoDB successfully.');
    isConnected = true;
  } catch (err) {
    console.warn(`[Database Connection Warning]: Could not connect to ${maskedUri}`);
    console.warn(`[Reason]: ${err.message}`);

    // If outside production or if MongoMemoryServer is available, attempt in-memory fallback
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.warn('[Database] Starting in-memory MongoDB fallback...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        global.__mongodInstance = mongodInstance;
        const memoryUri = mongodInstance.getUri();
        await mongoose.connect(memoryUri);
        console.log('[Database] Connected to in-memory MongoDB successfully.');
        isConnected = true;
      } catch (memErr) {
        console.error('[Database In-Memory Error]:', memErr.message);
      }
    } else {
      console.error(
        '[Database Deployment Alert] In production, verify that MONGO_URI is set in environment variables and MongoDB Atlas IP access list contains 0.0.0.0/0.'
      );
    }
  }

  return isConnected;
};

const startServer = async () => {
  try {
    const dbConnected = await connectDB();

    if (dbConnected) {
      // Seed initial mock data
      await seedInitialData();

      // Start seat lock background cleanup service
      startCleanupJob(io, 10000);

      // Start node-cron reminders
      startReminderJob();
    } else {
      console.warn('[Server Warning] Starting HTTP server with database in disconnected state.');
      console.warn('[Server Warning] Auth and booking endpoints will report 503 until MongoDB is available.');
    }

    server.listen(PORT, '0.0.0.0', () => {
      console.log('====================================');
      console.log(`🎬 iMovies API Server running on port ${PORT}`);
      console.log(`🔌 WebSocket ready on port ${PORT}`);
      console.log(`📊 DB Status: ${mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'}`);
      console.log('====================================');
    });

  } catch (err) {
    console.error('[Fatal Server Startup Error]:', err);
    process.exit(1);
  }
};

startServer();
