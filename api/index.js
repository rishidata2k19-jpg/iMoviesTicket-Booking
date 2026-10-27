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
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-auth-token',
      'x-imovies-endpoint',
      'x-matched-path',
      'x-vercel-matched-path',
    ],
  })
);
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// URL Normalizer for Vercel Serverless Function rewrites & catch-all routes
app.use((req, res, next) => {
  // 1. Check if client explicitly sent target endpoint in custom header
  const clientEndpoint = req.headers['x-imovies-endpoint'];

  // 2. Check if Vercel provided the real requested path in system headers
  const matchedPath =
    req.headers['x-matched-path'] ||
    req.headers['x-vercel-matched-path'] ||
    req.headers['x-forwarded-uri'] ||
    req.headers['x-original-uri'];

  // 3. Check if Vercel query parameters passed route segments
  const queryParam = req.query?.match || req.query?.path || req.query?.all || req.query?.slug;

  if (clientEndpoint) {
    const clean = clientEndpoint.startsWith('/') ? clientEndpoint : `/${clientEndpoint}`;
    req.url = clean.startsWith('/api') ? clean : `/api${clean}`;
  } else if (matchedPath) {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    req.url = matchedPath.includes('?') ? matchedPath : matchedPath + query;
  } else if (queryParam) {
    const subpath = Array.isArray(queryParam) ? queryParam.join('/') : queryParam;
    const cleanSubpath = subpath.startsWith('/') ? subpath : `/${subpath}`;
    if (req.url.startsWith('/api/auth') || req.originalUrl?.startsWith('/api/auth')) {
      req.url = `/api/auth${cleanSubpath}`;
    } else if (req.url.startsWith('/api/movie') || req.originalUrl?.startsWith('/api/movie')) {
      req.url = `/api/movie${cleanSubpath}`;
    } else {
      req.url = cleanSubpath.startsWith('/api') ? cleanSubpath : `/api${cleanSubpath}`;
    }
  } else if (
    req.originalUrl &&
    req.originalUrl !== '/api' &&
    req.originalUrl !== '/api/index' &&
    req.originalUrl !== '/api/index.js' &&
    (req.originalUrl.startsWith('/api') ||
      req.originalUrl.startsWith('/auth') ||
      req.originalUrl.startsWith('/movie') ||
      req.originalUrl.startsWith('/theatre') ||
      req.originalUrl.startsWith('/shows') ||
      req.originalUrl.startsWith('/bookings') ||
      req.originalUrl.startsWith('/payment') ||
      req.originalUrl.startsWith('/admin'))
  ) {
    req.url = req.originalUrl;
  }

  // Strip accidental function entry prefix if present
  if (req.url.startsWith('/api/index.js/')) {
    req.url = req.url.replace('/api/index.js/', '/api/');
  } else if (req.url === '/api/index.js' || req.url === '/api/index') {
    req.url = '/api';
  }

  next();
});

// Mount API Routes (Support both /api/xxx and /xxx for robust Vercel serverless routing)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/movie', movieRoutes);
app.use('/movie', movieRoutes);

app.use('/api/theatre', theatreRoutes);
app.use('/theatre', theatreRoutes);

app.use('/api/shows', showRoutes);
app.use('/shows', showRoutes);

app.use('/api/bookings', bookingRoutes);
app.use('/bookings', bookingRoutes);

app.use('/api/favorite', favoriteRoutes);
app.use('/favorite', favoriteRoutes);

app.use('/api/review', reviewRoutes);
app.use('/review', reviewRoutes);

app.use('/api/payment', paymentRoutes);
app.use('/payment', paymentRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

// Health check endpoint
const handleHealth = (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'iMovies Vercel Serverless API',
    time: new Date().toISOString(),
    dbConnected: mongoose.connection.readyState === 1,
    dbState: mongoose.connection.readyState,
  });
};
app.get('/api/health', handleHealth);
app.get('/health', handleHealth);
app.get('/api', handleHealth);
app.get('/', handleHealth);

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
