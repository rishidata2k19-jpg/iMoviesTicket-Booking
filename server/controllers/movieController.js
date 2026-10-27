const Movie = require('../models/movieModel');
const Review = require('../models/reviewModel');
const tmdbService = require('../services/tmdbService');

// 1. Get all movies with live TMDB market integration, filtering, search & local custom listings
exports.getAllMovies = async (req, res) => {
  try {
    const { genre, language, search, page, feed } = req.query;

    // 1. Fetch custom / manually added movies from MongoDB first
    const customQuery = {
      $or: [{ tmdbId: null }, { tmdbId: { $exists: false } }],
    };

    if (search && search.trim()) {
      const term = search.trim();
      customQuery.$and = [
        {
          $or: [
            { movieName: { $regex: term, $options: 'i' } },
            { description: { $regex: term, $options: 'i' } },
            { director: { $regex: term, $options: 'i' } },
            { cast: { $in: [new RegExp(term, 'i')] } },
          ],
        },
      ];
    }

    if (genre && genre !== 'All') {
      customQuery.genres = { $in: [new RegExp(genre, 'i')] };
    }

    if (language && language !== 'All') {
      customQuery.language = new RegExp(`^${language}$`, 'i');
    }

    let customMovies = [];
    try {
      customMovies = await Movie.find(customQuery).sort({ createdAt: -1 });
    } catch (dbErr) {
      console.warn('Could not query local custom movies:', dbErr.message);
    }

    // 2. Fetch real-time market movies from TMDB API
    let tmdbResult = { movies: [], totalPages: 1, count: 0, page: 1 };
    try {
      tmdbResult = await tmdbService.getLiveMarketMovies({
        genre,
        language,
        search,
        page: page ? Number(page) : 1,
        feed: feed || 'now_playing',
      });
    } catch (tmdbErr) {
      console.warn('TMDB API fetch failed, falling back to local database movies:', tmdbErr.message);
      const tmdbCachedQuery = { tmdbId: { $exists: true, $ne: null } };
      if (genre && genre !== 'All') tmdbCachedQuery.genres = { $in: [new RegExp(genre, 'i')] };
      if (language && language !== 'All') tmdbCachedQuery.language = new RegExp(`^${language}$`, 'i');
      if (search && search.trim()) {
        tmdbCachedQuery.movieName = { $regex: search.trim(), $options: 'i' };
      }
      const cached = await Movie.find(tmdbCachedQuery).sort({ releaseDate: -1 });
      tmdbResult = { movies: cached, totalPages: 1, count: cached.length, page: 1 };
    }

    // 3. Merge custom movies at top, avoiding duplicates
    const seenIds = new Set();
    const combinedMovies = [];

    for (const m of customMovies) {
      const idStr = m._id.toString();
      if (!seenIds.has(idStr)) {
        seenIds.add(idStr);
        combinedMovies.push(m.toObject ? m.toObject() : m);
      }
    }

    for (const m of (tmdbResult.movies || [])) {
      const idStr = m._id ? m._id.toString() : (m.tmdbId ? `tmdb_${m.tmdbId}` : null);
      if (idStr && !seenIds.has(idStr)) {
        seenIds.add(idStr);
        combinedMovies.push(m);
      }
    }

    return res.status(200).json({
      success: true,
      count: combinedMovies.length,
      page: tmdbResult.page || 1,
      totalPages: tmdbResult.totalPages || 1,
      movies: combinedMovies,
      source: 'MERGED_CATALOG',
    });
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
      ? genres.filter(Boolean)
      : typeof genres === 'string'
      ? genres.split(',').map((g) => g.trim()).filter(Boolean)
      : [];

    const finalGenres = parsedGenres.length > 0 ? parsedGenres : ['Action', 'Drama'];

    const parsedCast = Array.isArray(cast)
      ? cast.filter(Boolean)
      : typeof cast === 'string'
      ? cast.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    const defaultPoster = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop';
    const defaultBanner = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1400&auto=format&fit=crop';

    const movie = await Movie.create({
      movieName: (movieName || '').trim(),
      description: (description || '').trim() || 'Exciting cinema experience showing in select premium theatres.',
      genres: finalGenres,
      releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
      language: (language || 'English').trim(),
      duration: (duration || '120 min').trim(),
      certification: certification || 'UA',
      posterUrl: posterUrl || defaultPoster,
      bannerUrl: bannerUrl || posterUrl || defaultBanner,
      trailerUrl: trailerUrl || '',
      director: director || 'Cinema Director',
      cast: parsedCast.length > 0 ? parsedCast : ['Featured Cast'],
      rating: rating ? Number(rating) : 8.5,
    });

    // Automatically generate showtimes so the movie is immediately bookable
    try {
      await tmdbService.ensureShowsForMovie(movie);
    } catch (showErr) {
      console.warn(`Could not auto-generate shows for newly added movie ${movie.movieName}:`, showErr.message);
    }

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
