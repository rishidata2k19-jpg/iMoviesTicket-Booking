const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'imovies_super_secret_jwt_key_2026';

const fetchUser = (req, res, next) => {
  // Get token from header: Bearer token or x-auth-token
  let token = req.header('x-auth-token') || req.header('Authorization');

  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, username, role }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

const requireAdmin = (req, res, next) => {
  fetchUser(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access restricted. Administrator privileges required.',
      });
    }
  });
};

module.exports = { fetchUser, requireAdmin, JWT_SECRET };
