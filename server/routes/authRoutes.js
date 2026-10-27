const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { fetchUser, requireAdmin } = require('../middlewares/fetchUser');

// User Auth
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/me', fetchUser, authController.getCurrentUser);

// Admin Auth (Registration strictly restricted to authenticated administrators)
router.post('/admin/register', requireAdmin, authController.registerAdmin);
router.post('/admin/login', authController.loginAdmin);
router.get('/admin/stats', requireAdmin, authController.getAdminStats);
router.get('/admin/users', requireAdmin, authController.getAllUsers);
router.delete('/admin/users/:id', requireAdmin, authController.deleteUser);

module.exports = router;
