const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const Movie = require('../models/movieModel');
const { sendBookingConfirmation } = require('../utils/mailer');

// TTL in milliseconds (5 minutes = 300,000 ms)
const LOCK_TTL_MS = 5 * 60 * 1000;

// 1. Lock Seats Temporarily
exports.lockSeats = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const userEmail = req.user.email;

    if (!showId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid show ID or seats list.' });
    }

    const show = await Show.findOne({
      $or: [{ _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }, { showId }],
    });

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);

    // Verify seat availability
    for (const seatId of seats) {
      const seat = show.tickets[seatId];
      if (!seat) {
        return res.status(400).json({ success: false, message: `Seat ${seatId} does not exist for this show.` });
      }

      if (seat.status === 'booked') {
        return res.status(409).json({ success: false, message: `Seat ${seatId} has already been booked.` });
      }

      // Check if locked by another user and not expired
      if (
        seat.status === 'locked' &&
        seat.lockedBy !== userEmail &&
        seat.lockExpiresAt &&
        new Date(seat.lockExpiresAt) > now
      ) {
        return res.status(409).json({
          success: false,
          message: `Seat ${seatId} is temporarily reserved by another user. Please choose another seat.`,
        });
      }
    }

    // Lock the seats
    for (const seatId of seats) {
      show.tickets[seatId] = {
        ...show.tickets[seatId],
        status: 'locked',
        lockedBy: userEmail,
        lockExpiresAt: expiresAt,
      };
    }

    show.markModified('tickets');
    await show.save();

    // Broadcast socket event
    const io = req.app.get('io');
    if (io) {
      io.to(show.showId).emit('seat_locked', {
        showId: show.showId,
        seats,
        lockedBy: userEmail,
        expiresAt,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Seats reserved temporarily!',
      lockedSeats: seats,
      expiresAt,
      ttlSeconds: LOCK_TTL_MS / 1000,
    });
  } catch (error) {
    console.error('Lock seats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Unlock Seats (Explicit Cancel/Release)
exports.unlockSeats = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const userEmail = req.user.email;

    if (!showId || !seats || !Array.isArray(seats)) {
      return res.status(400).json({ success: false, message: 'Invalid show ID or seats.' });
    }

    const show = await Show.findOne({
      $or: [{ _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }, { showId }],
    });

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    const released = [];
    for (const seatId of seats) {
      const seat = show.tickets[seatId];
      if (seat && (seat.lockedBy === userEmail || req.user.role === 'admin')) {
        show.tickets[seatId] = {
          ...seat,
          status: 'available',
          lockedBy: null,
          lockExpiresAt: null,
        };
        released.push(seatId);
      }
    }

    if (released.length > 0) {
      show.markModified('tickets');
      await show.save();

      const io = req.app.get('io');
      if (io) {
        io.to(show.showId).emit('seat_unlocked', {
          showId: show.showId,
          seats: released,
        });
      }
    }

    return res.status(200).json({ success: true, message: 'Seats released.', releasedSeats: released });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Confirm and Complete Booking
exports.confirmBooking = async (req, res) => {
  try {
    const { showId, selectedSeats, paymentMethod } = req.body;
    const userEmail = req.user.email;

    if (!showId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide show ID and selected seats.' });
    }

    const show = await Show.findOne({
      $or: [{ _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }, { showId }],
    });

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    const now = new Date();
    let totalAmount = 0;
    const ticketsData = {};

    // Validate that seats are locked by user or still available
    for (const seatId of selectedSeats) {
      const seat = show.tickets[seatId];
      if (!seat) {
        return res.status(400).json({ success: false, message: `Seat ${seatId} not found.` });
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
        return res.status(409).json({ success: false, message: `Seat ${seatId} is locked by another user.` });
      }

      totalAmount += seat.price || 200;
      ticketsData[seatId] = {
        tier: seat.tier,
        price: seat.price,
      };
    }

    // Mark seats as permanently booked
    for (const seatId of selectedSeats) {
      show.tickets[seatId] = {
        ...show.tickets[seatId],
        status: 'booked',
        lockedBy: userEmail,
        bookedBy: userEmail,
        lockExpiresAt: null,
      };
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

    // Generate unique booking ID
    const bookingId = 'IMV-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const booking = await Booking.create({
      bookingId,
      userEmail,
      showId: show.showId,
      ticketsData,
      selectedSeats,
      totalAmount,
      paymentStatus: 'Completed',
      paymentMethod: paymentMethod || 'Online Payment',
      transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      showDetails: {
        movieName,
        posterUrl,
        theatreName: show.theatreName,
        showDate: show.showDate,
        showTime: show.showTime,
        screenType: show.screenType,
      },
    });

    // Notify room of booked seats
    const io = req.app.get('io');
    if (io) {
      io.to(show.showId).emit('seat_booked', {
        showId: show.showId,
        seats: selectedSeats,
      });
    }

    // Send asynchronous confirmation email
    sendBookingConfirmation(userEmail, booking).catch((e) =>
      console.warn('Booking email error:', e.message)
    );

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking,
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. User's Personal Booking History
exports.getMyBookings = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const bookings = await Booking.find({ userEmail }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Booking by ID (Digital Ticket view)
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bookingId: id }],
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Ensure user is owner or admin
    if (booking.userEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this booking.' });
    }

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Cancel Booking
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bookingId: id }],
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.userEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking.' });
    }

    if (booking.paymentStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
    }

    booking.paymentStatus = 'Cancelled';
    await booking.save();

    // Release seats on show
    const show = await Show.findOne({ showId: booking.showId });
    if (show && show.tickets) {
      for (const seatId of booking.selectedSeats) {
        if (show.tickets[seatId]) {
          show.tickets[seatId] = {
            ...show.tickets[seatId],
            status: 'available',
            lockedBy: null,
            bookedBy: null,
            lockExpiresAt: null,
          };
        }
      }
      show.markModified('tickets');
      await show.save();

      const io = req.app.get('io');
      if (io) {
        io.to(show.showId).emit('seat_unlocked', {
          showId: show.showId,
          seats: booking.selectedSeats,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Refund initiated.',
      booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Admin View All Bookings
exports.getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
