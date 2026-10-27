const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });
dotenv.config();

const authRoutes = require('../server/routes/authRoutes');

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

// Normalizer: handle any Vercel query or header parameter
app.use((req, res, next) => {
  const sub =
    req.headers['x-imovies-endpoint'] ||
    req.headers['x-matched-path'] ||
    req.query?.match ||
    req.query?.path ||
    req.query?.all ||
    req.query?.slug;

  if (sub) {
    const s = Array.isArray(sub) ? sub.join('/') : sub;
    const clean = s.startsWith('/') ? s : `/${s}`;
    // Strip prefixes so both full /api/auth/login and relative /login are supported
    const stripped = clean.replace(/^\/api\/auth/, '').replace(/^\/auth/, '') || '/';
    req.url = stripped;
  }
  next();
});

// Mount on all prefixes so any router matches
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/', authRoutes);

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://rishidata2k19_db_user:d3KfjFuJxXHL32GE@cluster0.xndy3pu.mongodb.net/imovies_db?retryWrites=true&w=majority';

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return true;
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 6000 });
    return true;
  } catch (err) {
    console.error('[Auth DB Error]:', err.message);
    return false;
  }
};

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
