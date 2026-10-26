const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const Movie = require('../models/movieModel');
const { sendBookingConfirmation } = require('../utils/mailer');

// Initialize Razorpay SDK instance
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TqTzbIAfhLKF63',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '3p2BtSgWg8TBkaaliP31y2nm',
  });
};

/**
 * Step 2 & 3: Create a Razorpay Order
 * POST /api/payment/create-order
 */
exports.createOrder = async (req, res) => {
  try {
    const { showId, selectedSeats } = req.body;
    const userEmail = req.user.email;

    if (!showId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid showId and selectedSeats.' });
    }

    const show = await Show.findOne({
      $or: [{ _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }, { showId }],
    });

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    const now = new Date();
    let subtotal = 0;

    // Validate that seats are locked by user or available
    for (const seatId of selectedSeats) {
      const seat = show.tickets[seatId];
      if (!seat) {
        return res.status(400).json({ success: false, message: `Seat ${seatId} not found on this show layout.` });
      }

      if (seat.status === 'booked') {
        return res.status(409).json({ success: false, message: `Seat ${seatId} has already been purchased.` });
      }

      if (
        seat.status === 'locked' &&
        seat.lockedBy !== userEmail &&
        seat.lockExpiresAt &&
        new Date(seat.lockExpiresAt) > now
      ) {
        return res.status(409).json({
          success: false,
          message: `Seat ${seatId} is temporarily reserved by another user.`,
        });
      }

      subtotal += seat.price || 200;
    }

    const convenienceFee = selectedSeats.length * 20;
    const totalAmount = subtotal + convenienceFee;
    const amountInPaise = Math.round(totalAmount * 100); // 1 INR = 100 paise

    const razorpay = getRazorpayInstance();
    const receiptId = `rcpt_${Math.random().toString(36).substring(2, 10)}`;

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        showId: show.showId,
        userEmail,
        seats: selectedSeats.join(','),
      },
    };

    const order = await razorpay.orders.create(options);

    console.log(`[Razorpay] Created order ${order.id} for user ${userEmail} (Amount: ₹${totalAmount})`);

    return res.status(200).json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TqTzbIAfhLKF63',
      totalAmount,
    });
  } catch (error) {
    console.error('[Razorpay Create Order Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error generating Razorpay order.' });
  }
};

/**
 * Step 4: Cryptographic Signature Verification & Booking Finalization
 * POST /api/payment/verify
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      showId,
      selectedSeats,
    } = req.body;
    const userEmail = req.user.email;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing mandatory Razorpay authorization parameters.',
      });
    }

    // Cryptographic HMAC SHA256 Verification
    const secret = process.env.RAZORPAY_KEY_SECRET || '3p2BtSgWg8TBkaaliP31y2nm';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('[Razorpay] Signature mismatch for order:', razorpay_order_id);
      return res.status(400).json({
        success: false,
        message: 'Cryptographic signature verification failed! Untrusted transaction.',
      });
    }

    console.log(`[Razorpay] Payment ${razorpay_payment_id} verified successfully for order ${razorpay_order_id}`);

    // Fetch and lock show seats permanently
    const show = await Show.findOne({
      $or: [{ _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }, { showId }],
    });

    if (!show) {
      return res.status(404).json({ success: false, message: 'Associated show not found.' });
    }

    let subtotal = 0;
    const ticketsData = {};

    for (const seatId of selectedSeats) {
      const seat = show.tickets[seatId];
      if (seat) {
        subtotal += seat.price || 200;
        ticketsData[seatId] = {
          tier: seat.tier,
          price: seat.price,
        };

        // Mark permanently booked
        show.tickets[seatId] = {
          ...seat,
          status: 'booked',
          lockedBy: userEmail,
          bookedBy: userEmail,
          lockExpiresAt: null,
        };
      }
    }

    show.markModified('tickets');
    await show.save();

    // Fetch movie title for snapshot
    let movieName = 'Feature Film';
    let posterUrl = '';
    if (show.movieId && show.movieId.match(/^[0-9a-fA-F]{24}$/)) {
      const movie = await Movie.findById(show.movieId);
      if (movie) {
        movieName = movie.movieName;
        posterUrl = movie.posterUrl;
      }
    }

    const convenienceFee = selectedSeats.length * 20;
    const totalAmount = subtotal + convenienceFee;
    const bookingId = 'IMV-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    // Create completed booking record
    const booking = await Booking.create({
      bookingId,
      userEmail,
      showId: show.showId,
      ticketsData,
      selectedSeats,
      totalAmount,
      paymentStatus: 'Completed',
      paymentMethod: 'Razorpay (Test Mode)',
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      showDetails: {
        movieName,
        posterUrl,
        theatreName: show.theatreName,
        showDate: show.showDate,
        showTime: show.showTime,
        screenType: show.screenType,
      },
    });

    // Notify room of permanently booked seats
    const io = req.app.get('io');
    if (io) {
      io.to(show.showId).emit('seat_booked', {
        showId: show.showId,
        seats: selectedSeats,
      });
    }

    // Step 5: Send confirmation email asynchronously
    sendBookingConfirmation(userEmail, booking).catch((e) =>
      console.warn('[Mailer Note]:', e.message)
    );

    return res.status(200).json({
      success: true,
      message: 'Payment verified and ticket confirmed!',
      booking,
    });
  } catch (error) {
    console.error('[Razorpay Verify Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Payment verification failed.' });
  }
};

/**
 * Public Config Endpoint: Provides Public Razorpay Key ID
 * GET /api/payment/config
 */
exports.getPaymentConfig = (req, res) => {
  return res.status(200).json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TqTzbIAfhLKF63',
  });
};
