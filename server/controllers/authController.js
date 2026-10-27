const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const Booking = require('../models/bookingModel');
const Movie = require('../models/movieModel');
const Show = require('../models/showModel');
const { JWT_SECRET } = require('../middlewares/fetchUser');

// Helper to check MongoDB connection status before handling requests
const checkDbConnection = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message:
        'Database connection is unavailable. Please verify that MONGO_URI is correctly configured in your deployment environment variables.',
    });
    return false;
  }
  return true;
};

// Helper to generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// 1. User Register
exports.registerUser = async (req, res) => {
  try {
    if (!checkDbConnection(res)) return;

    const { username, email, password } = req.body;
    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password ? String(password) : '';

    if (!cleanUsername || !cleanEmail || !cleanPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return res.status(400).json({ success: false, message: 'Username must be between 3 and 20 characters.' });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check existing
    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === cleanEmail
          ? 'An account with this email already exists.'
          : 'Username is already taken.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    const newUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: 'user',
    });

    const token = generateToken({
      id: newUser._id,
      email: newUser.email,
      username: newUser.username,
      role: 'user',
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
};

// 2. User Login
exports.loginUser = async (req, res) => {
  try {
    if (!checkDbConnection(res)) return;

    const { email, username, password } = req.body;
    const identifier = (email || username || '').trim();
    const cleanEmail = identifier.toLowerCase();
    const cleanPassword = password ? String(password) : '';

    if (!identifier || !cleanPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    // Allow login by email OR username for maximum user convenience
    const user = await User.findOne({
      $or: [{ email: cleanEmail }, { username: identifier }],
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role || 'user',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
  }
};

// 3. Admin Register
exports.registerAdmin = async (req, res) => {
  try {
    if (!checkDbConnection(res)) return;

    const { username, email, password } = req.body;
    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password ? String(password) : '';

    if (!cleanUsername || !cleanEmail || !cleanPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all admin credentials.' });
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin with this email or username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    const newAdmin = await Admin.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: 'admin',
    });

    const token = generateToken({
      id: newAdmin._id,
      email: newAdmin.email,
      username: newAdmin.username,
      role: 'admin',
    });

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully!',
      token,
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error('Admin Register error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during admin registration.' });
  }
};

// 4. Admin Login
exports.loginAdmin = async (req, res) => {
  try {
    if (!checkDbConnection(res)) return;

    const { email, username, password } = req.body;
    const identifier = (email || username || '').trim();
    const cleanEmail = identifier.toLowerCase();
    const cleanPassword = password ? String(password) : '';

    if (!identifier || !cleanPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    // Allow admin login by email OR admin username
    const admin = await Admin.findOne({
      $or: [{ email: cleanEmail }, { username: identifier }],
    });

    if (!admin) {
      return res.status(400).json({ success: false, message: 'Admin account not found.' });
    }

    const isMatch = await bcrypt.compare(cleanPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = generateToken({
      id: admin._id,
      email: admin.email,
      username: admin.username,
      role: 'admin',
    });

    return res.status(200).json({
      success: true,
      message: 'Admin access granted!',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during admin login.' });
  }
};

// 5. Get Current User / Admin Profile
exports.getCurrentUser = async (req, res) => {
  try {
    let account = null;
    if (req.user.role === 'admin') {
      account = await Admin.findById(req.user.id).select('-password');
    } else {
      account = await User.findById(req.user.id).select('-password');
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    return res.status(200).json({ success: true, user: account });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Admin Analytics & Overall Stats
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await Admin.countDocuments();
    const totalMovies = await Movie.countDocuments();
    const totalShows = await Show.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Aggregate revenue
    const revenueAgg = await Booking.aggregate([
      { $match: { paymentStatus: 'Completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // Recent 10 bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalMovies,
        totalShows,
        totalBookings,
        totalRevenue,
      },
      recentBookings,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Admin Moderate Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Admin Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'User removed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
