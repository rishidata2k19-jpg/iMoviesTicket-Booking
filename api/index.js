const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignored in runtimes without setDefaultResultOrder
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../server/.env') });
dotenv.config();

// Static requires so Vercel NFT bundles server routes and models
const authRoutes = require('../server/routes/authRoutes');
const movieRoutes = require('../server/routes/movieRoutes');
const theatreRoutes = require('../server/routes/theatreRoutes');
const showRoutes = require('../server/routes/showRoutes');
const bookingRoutes = require('../server/routes/bookingRoutes');
const favoriteRoutes = require('../server/routes/favoriteRoutes');
const reviewRoutes = require('../server/routes/reviewRoutes');
const paymentRoutes = require('../server/routes/paymentRoutes');
const adminRoutes = require('../server/routes/adminRoutes');
const { seedInitialData } = require('../server/utils/seedData');

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
    dbState: mongoose.connection.readyState,
  });
});

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://rishidata2k19_db_user:d3KfjFuJxXHL32GE@cluster0.xndy3pu.mongodb.net/imovies_db?retryWrites=true&w=majority';

let isConnected = false;
let isSeeded = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return true;
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 6000,
    });
    isConnected = true;
    if (!isSeeded) {
      isSeeded = true;
      seedInitialData().catch((err) => console.warn('[Seed Error]:', err.message));
    }
    return true;
  } catch (err) {
    console.error('[Vercel DB Connection Error]:', err.message);
    return false;
  }
};

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
