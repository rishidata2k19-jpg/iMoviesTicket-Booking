const Review = require('../models/reviewModel');
const Movie = require('../models/movieModel');

// 1. Get reviews for a movie
exports.getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const reviews = await Review.find({ movieId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Add or update user review
exports.addReview = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const username = req.user.username || 'Movie Enthusiast';
    const { movieId, rating, reviewText } = req.body;

    if (!movieId || !rating || !reviewText) {
      return res.status(400).json({ success: false, message: 'Movie ID, rating, and review text are required.' });
    }

    if (rating < 1 || rating > 10) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 10.' });
    }

    // Check if user already reviewed
    let review = await Review.findOne({ userEmail, movieId });
    if (review) {
      review.rating = Number(rating);
      review.reviewText = reviewText;
      review.username = username;
      await review.save();
    } else {
      review = await Review.create({
        userEmail,
        username,
        movieId,
        rating: Number(rating),
        reviewText,
      });
    }

    // Recalculate movie average rating
    const allReviews = await Review.find({ movieId });
    if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await Movie.findByIdAndUpdate(movieId, {
        rating: Number(avgRating.toFixed(1)),
        votesCount: allReviews.length,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review,
    });
  } catch (error) {
    console.error('Add review error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.userEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this review.' });
    }

    await Review.findByIdAndDelete(id);

    // Update movie rating
    const remaining = await Review.find({ movieId: review.movieId });
    const avgRating = remaining.length > 0 ? remaining.reduce((s, r) => s + r.rating, 0) / remaining.length : 8.0;
    await Movie.findByIdAndUpdate(review.movieId, {
      rating: Number(avgRating.toFixed(1)),
      votesCount: remaining.length,
    });

    return res.status(200).json({ success: true, message: 'Review deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
