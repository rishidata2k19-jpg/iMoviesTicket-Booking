const Favorite = require('../models/favoriteModel');
const Movie = require('../models/movieModel');

// 1. Get user's favorites
exports.getUserFavorites = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const favorites = await Favorite.find({ userEmail }).sort({ createdAt: -1 });

    const movieIds = favorites.map((f) => f.movieId);
    const movies = await Movie.find({ _id: { $in: movieIds } });

    return res.status(200).json({ success: true, count: movies.length, favorites: movies, rawFavorites: favorites });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Add or Toggle favorite
exports.addFavorite = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({ success: false, message: 'Movie ID is required.' });
    }

    const existing = await Favorite.findOne({ userEmail, movieId });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.status(200).json({ success: true, isFavorite: false, message: 'Movie removed from Watchlist.' });
    }

    const newFav = await Favorite.create({ userEmail, movieId });
    return res.status(201).json({ success: true, isFavorite: true, message: 'Movie added to Watchlist!', favorite: newFav });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Remove favorite
exports.removeFavorite = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { movieId } = req.params;

    await Favorite.findOneAndDelete({ userEmail, movieId });
    return res.status(200).json({ success: true, message: 'Movie removed from Watchlist.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
