const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { fetchUser, requireAdmin } = require('../middlewares/fetchUser');

router.post('/lock-seats', fetchUser, bookingController.lockSeats);
router.post('/unlock-seats', fetchUser, bookingController.unlockSeats);
router.post('/confirm', fetchUser, bookingController.confirmBooking);
router.get('/my-bookings', fetchUser, bookingController.getMyBookings);
router.get('/admin/all', requireAdmin, bookingController.getAllBookingsAdmin);
router.get('/:id', fetchUser, bookingController.getBookingById);
router.post('/:id/cancel', fetchUser, bookingController.cancelBooking);

module.exports = router;
