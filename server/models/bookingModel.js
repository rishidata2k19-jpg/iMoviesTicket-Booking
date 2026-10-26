const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: [true, 'Booking ID is required'],
      unique: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      trim: true,
      lowercase: true,
    },
    showId: {
      type: String,
      required: [true, 'Show ID is required'],
      trim: true,
    },
    ticketsData: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Tickets data is required'],
    },
    selectedSeats: {
      type: [String],
      required: [true, 'Selected seats list is required'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Completed', 'Failed', 'Cancelled', 'Refunded'],
      default: 'Completed',
    },
    paymentMethod: {
      type: String,
      default: 'Razorpay (Test Mode)',
    },
    transactionId: {
      type: String,
      default: () => 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    },
    razorpayOrderId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    refundId: {
      type: String,
      default: '',
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundDate: {
      type: Date,
    },
    showDetails: {
      movieName: String,
      posterUrl: String,
      theatreName: String,
      showDate: Date,
      showTime: String,
      screenType: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
