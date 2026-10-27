const path = require('path');
const fs = require('fs');

// Dynamically locate server directory whether invoked from root or client/
let serverDir = path.join(__dirname, '../server');
if (!fs.existsSync(serverDir)) {
  serverDir = path.join(__dirname, '../../server');
}

// Ensure module resolution searches server, root, and client node_modules
if (module.paths) {
  module.paths.push(path.join(serverDir, 'node_modules'));
  module.paths.push(path.join(__dirname, '../node_modules'));
  module.paths.push(path.join(__dirname, '../../node_modules'));
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(serverDir, '.env') });
dotenv.config();

const authRoutes = require(path.join(serverDir, 'routes/authRoutes'));
const movieRoutes = require(path.join(serverDir, 'routes/movieRoutes'));
const theatreRoutes = require(path.join(serverDir, 'routes/theatreRoutes'));
const showRoutes = require(path.join(serverDir, 'routes/showRoutes'));
const bookingRoutes = require(path.join(serverDir, 'routes/bookingRoutes'));
const favoriteRoutes = require(path.join(serverDir, 'routes/favoriteRoutes'));
const reviewRoutes = require(path.join(serverDir, 'routes/reviewRoutes'));
const paymentRoutes = require(path.join(serverDir, 'routes/paymentRoutes'));
const adminRoutes = require(path.join(serverDir, 'routes/adminRoutes'));
const { seedInitialData } = require(path.join(serverDir, 'utils/seedData'));

const app = express();

app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  })
);
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  res.status(200).json({
    status: 'OK',
    service: 'iMovies Vercel Serverless API',
    time: new Date().toISOString(),
    dbConnected: mongoose.connection.readyState === 1,
  });
});

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://rishidata2k19_db_user:d3KfjFuJxXHL32GE@cluster0.xndy3pu.mongodb.net/imovies_db?retryWrites=true&w=majority';

let isConnected = false;
let isSeeded = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    if (!isSeeded) {
      isSeeded = true;
      seedInitialData().catch((err) => console.warn('[Seed Error]:', err.message));
    }
  } catch (err) {
    console.error('[Vercel DB Error]:', err.message);
  }
};

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
