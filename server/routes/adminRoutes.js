const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middlewares/fetchUser');

// Transactions & Refund Management (Admin Protected)
router.get('/transactions', requireAdmin, adminController.getAllTransactions);
router.post('/refund/:paymentId', requireAdmin, adminController.processRefund);

module.exports = router;
