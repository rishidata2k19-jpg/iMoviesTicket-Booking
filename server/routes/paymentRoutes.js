const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { fetchUser } = require('../middlewares/fetchUser');

// Public Razorpay Key Config
router.get('/config', paymentController.getPaymentConfig);

// Protected Payment Endpoints
router.post('/create-order', fetchUser, paymentController.createOrder);
router.post('/verify', fetchUser, paymentController.verifyPayment);

module.exports = router;
