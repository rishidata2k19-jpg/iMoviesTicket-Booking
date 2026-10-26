const Movie = require('../models/movieModel');
const Review = require('../models/reviewModel');
const tmdbService = require('../services/tmdbService');

// 1. Get all movies with live TMDB market integration, filtering & search
exports.getAllMovies = async (req, res) => {
  try {
    const { genre, language, search, page, feed } = req.query;

    // Fetch real-time market movies from TMDB API
    const result = await tmdbService.getLiveMarketMovies({
      genre,
      language,
      search,
      page: page ? Number(page) : 1,
      feed: feed || 'now_playing',
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching live movies:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get single movie details (supports both MongoDB _id and TMDB ID)
exports.getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    let movie = null;

    // Check if id is a 24-character hexadecimal MongoDB ObjectId
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      movie = await Movie.findById(id);
    }

    // Check if id is numeric TMDB ID
    if (!movie && !isNaN(Number(id))) {
      movie = await Movie.findOne({ tmdbId: Number(id) });
      if (!movie) {
        // Fetch detailed movie from TMDB and upsert
        try {
          const tmdbMovieData = await tmdbService.fetchMovieDetailsFromTMDB(Number(id));
          movie = await tmdbService.upsertMovieToDatabase(tmdbMovieData);
        } catch (tmdbErr) {
          console.warn(`Could not load TMDB movie ${id}:`, tmdbErr.message);
        }
      }
    }

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    // Get reviews for this movie
    const reviews = await Review.find({
      $or: [{ movieId: movie._id.toString() }, { movieId: id }],
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      movie,
      reviews,
    });
  } catch (error) {
    console.error('Error in getMovieById:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Direct TMDB Now Playing endpoint
exports.getTmdbNowPlaying = async (req, res) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const data = await tmdbService.fetchNowPlayingFromTMDB(page);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Direct TMDB Popular endpoint
exports.getTmdbPopular = async (req, res) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const data = await tmdbService.fetchPopularFromTMDB(page);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Direct TMDB Search endpoint
exports.searchTmdbMovies = async (req, res) => {
  try {
    const { query, page } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query parameter is required' });
    }
    const data = await tmdbService.searchMoviesFromTMDB(query, page ? Number(page) : 1);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Create a movie (Admin manual addition)
exports.createMovie = async (req, res) => {
  try {
    const {
      movieName,
      description,
      genres,
      releaseDate,
      language,
      duration,
      certification,
      posterUrl,
      bannerUrl,
      trailerUrl,
      director,
      cast,
      rating,
    } = req.body;

    const parsedGenres = Array.isArray(genres)
      ? genres
      : typeof genres === 'string'
      ? genres.split(',').map((g) => g.trim())
      : [];

    const parsedCast = Array.isArray(cast)
      ? cast
      : typeof cast === 'string'
      ? cast.split(',').map((c) => c.trim())
      : [];

    const movie = await Movie.create({
      movieName,
      description,
      genres: parsedGenres,
      releaseDate,
      language,
      duration,
      certification: certification || 'UA',
      posterUrl: posterUrl || '',
      bannerUrl: bannerUrl || posterUrl || '',
      trailerUrl: trailerUrl || '',
      director: director || 'Unknown',
      cast: parsedCast,
      rating: rating ? Number(rating) : 8.5,
    });

    return res.status(201).json({ success: true, message: 'Movie created successfully!', movie });
  } catch (error) {
    console.error('Create movie error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// 7. Update a movie (Admin)
exports.updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.genres && typeof updates.genres === 'string') {
      updates.genres = updates.genres.split(',').map((g) => g.trim());
    }

    if (updates.cast && typeof updates.cast === 'string') {
      updates.cast = updates.cast.split(',').map((c) => c.trim());
    }

    const movie = await Movie.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    return res.status(200).json({ success: true, message: 'Movie updated successfully!', movie });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// 8. Delete a movie (Admin)
exports.deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findByIdAndDelete(id);

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    return res.status(200).json({ success: true, message: 'Movie deleted successfully!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
