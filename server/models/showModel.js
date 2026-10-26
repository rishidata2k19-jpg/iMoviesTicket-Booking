const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    adminEmail: {
      type: String,
      required: [true, 'Admin email is required'],
      trim: true,
    },
    showId: {
      type: String,
      required: [true, 'Show ID is required'],
      unique: true,
      trim: true,
    },
    movieId: {
      type: String,
      required: [true, 'Movie ID is required'],
      ref: 'Movie',
    },
    theatreName: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
    },
    theatreId: {
      type: String,
      default: '',
    },
    showDate: {
      type: Date,
      required: [true, 'Show date is required'],
    },
    showTime: {
      type: String,
      required: [true, 'Show time is required'],
      trim: true,
    },
    screenType: {
      type: String,
      default: '4K Dolby Atmos',
    },
    // tickets: key-value object where key is seat identifier (e.g. "B1", "M5", "L10")
    // value: { seatNumber: "B1", tier: "balcony", price: 350, status: "available"|"locked"|"booked", lockedBy: string, lockExpiresAt: Date }
    tickets: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Show ticket status mapping is required'],
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Show', showSchema);
