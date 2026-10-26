const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      index: true,
    },
    movieName: {
      type: String,
      required: [true, 'Movie name is required'],
      trim: true,
      minlength: [2, 'Movie name must be at least 2 characters'],
      maxlength: [200, 'Movie name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    genres: {
      type: [String],
      required: [true, 'Genres are required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A movie must have at least one genre',
      },
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
    },
    certification: {
      type: String,
      default: 'UA',
    },
    posterUrl: {
      type: String,
      default: '',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    director: {
      type: String,
      default: 'Unknown',
    },
    cast: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 8.5,
      min: 0,
      max: 10,
    },
    votesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Movie', movieSchema);
