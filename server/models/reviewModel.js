const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      default: 'Cinema Lover',
    },
    movieId: {
      type: String,
      required: [true, 'Movie ID is required'],
      ref: 'Movie',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [10, 'Rating cannot exceed 10'],
    },
    reviewText: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
      minlength: [5, 'Review must be at least 5 characters'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
