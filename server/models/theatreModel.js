const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    theatreName: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
    },
    theatreId: {
      type: String,
      required: [true, 'Theatre ID is required'],
      unique: true,
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    balconySeatPrice: {
      type: Number,
      required: [true, 'Balcony seat price is required'],
      min: 0,
    },
    middleSeatPrice: {
      type: Number,
      required: [true, 'Middle seat price is required'],
      min: 0,
    },
    lowerSeatPrice: {
      type: Number,
      required: [true, 'Lower seat price is required'],
      min: 0,
    },
    balconySeats: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Balcony seats layout is required'],
    },
    middleSeats: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Middle seats layout is required'],
    },
    lowerSeats: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Lower seats layout is required'],
    },
    facilities: {
      type: [String],
      default: ['4K Dolby Atmos', 'Recliner Seats', 'Gourmet Food', 'Parking'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Theatre', theatreSchema);
