const axios = require('axios');
const dns = require('dns');
const Movie = require('../models/movieModel');
const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');

// Prioritize IPv4 on Windows to prevent sporadic IPv6 Cloudfront resets
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignored in runtimes without setDefaultResultOrder
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_POSTER = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMAGE_BASE_BACKDROP = 'https://image.tmdb.org/t/p/original';

// Get API Key with default fallback
const getApiKey = () => process.env.TMDB_API_KEY || 'c5cc193b6902f41d06168e18398fba37';

// In-memory genre mapping cache
let genreCache = null;

/**
 * Execute an HTTP request with automatic retry logic (handles sporadic cold TLS drops)
 */
const requestWithRetry = async (endpoint, params = {}, retries = 3) => {
  const apiKey = getApiKey();
  const url = `${TMDB_BASE_URL}${endpoint}`;
  const requestParams = {
    api_key: apiKey,
    language: 'en-US',
    ...params,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        params: requestParams,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) iMovies-Platform/1.0',
          Accept: 'application/json',
        },
        timeout: 10000,
      });
      return response.data;
    } catch (err) {
      if (attempt === retries) {
        console.error(`[TMDB API Error] ${endpoint} failed after ${retries} attempts:`, err.message);
        throw err;
      }
      await new Promise((r) => setTimeout(r, 250 * attempt));
    }
  }
};

/**
 * Fetch and cache genre list from TMDB
 */
const getGenreMap = async () => {
  if (genreCache) return genreCache;
  try {
    const data = await requestWithRetry('/genre/movie/list');
    const map = {};
    if (data && data.genres) {
      data.genres.forEach((g) => {
        map[g.id] = g.name;
      });
    }
    genreCache = map;
    return genreCache;
  } catch (err) {
    console.warn('[TMDB Service] Failed to load genre list, using fallback mapping:', err.message);
    return {
      28: 'Action',
      12: 'Adventure',
      16: 'Animation',
      35: 'Comedy',
      80: 'Crime',
      99: 'Documentary',
      18: 'Drama',
      10751: 'Family',
      14: 'Fantasy',
      36: 'History',
      27: 'Horror',
      10402: 'Music',
      9648: 'Mystery',
      10749: 'Romance',
      878: 'Sci-Fi',
      53: 'Thriller',
      10752: 'War',
      37: 'Western',
    };
  }
};

/**
 * Format a raw TMDB movie into iMovies schema structure
 */
const formatTmdbMovie = (tmdbMovie, genreMap = {}) => {
  const genres =
    tmdbMovie.genres && Array.isArray(tmdbMovie.genres)
      ? tmdbMovie.genres.map((g) => g.name || g)
      : Array.isArray(tmdbMovie.genre_ids)
      ? tmdbMovie.genre_ids.map((id) => genreMap[id] || 'Action').filter(Boolean)
      : ['Action', 'Drama'];

  const posterUrl = tmdbMovie.poster_path
    ? `${TMDB_IMAGE_BASE_POSTER}${tmdbMovie.poster_path}`
    : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop';

  const bannerUrl = tmdbMovie.backdrop_path
    ? `${TMDB_IMAGE_BASE_BACKDROP}${tmdbMovie.backdrop_path}`
    : posterUrl;

  // Extract director & cast if credits exist
  let director = 'Renowned Director';
  let cast = [];
  if (tmdbMovie.credits) {
    if (tmdbMovie.credits.crew) {
      const dirObj = tmdbMovie.credits.crew.find((c) => c.job === 'Director');
      if (dirObj) director = dirObj.name;
    }
    if (tmdbMovie.credits.cast) {
      cast = tmdbMovie.credits.cast.slice(0, 6).map((c) => c.name);
    }
  }

  // Extract YouTube trailer if videos exist
  let trailerUrl = '';
  if (tmdbMovie.videos && tmdbMovie.videos.results) {
    const trailer = tmdbMovie.videos.results.find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    if (trailer) {
      trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    }
  }

  // Language mapping
  const langMap = {
    en: 'English',
    hi: 'Hindi',
    es: 'Spanish',
    fr: 'French',
    ja: 'Japanese',
    ko: 'Korean',
    de: 'German',
    it: 'Italian',
    zh: 'Chinese',
  };
  const language = langMap[tmdbMovie.original_language] || tmdbMovie.original_language?.toUpperCase() || 'English';

  const duration = tmdbMovie.runtime ? `${tmdbMovie.runtime} min` : '128 min';
  const rating = tmdbMovie.vote_average ? Number(tmdbMovie.vote_average.toFixed(1)) : 8.0;

  return {
    tmdbId: tmdbMovie.id,
    movieName: tmdbMovie.title || tmdbMovie.original_title || 'Feature Film',
    description:
      tmdbMovie.overview && tmdbMovie.overview.length >= 10
        ? tmdbMovie.overview
        : 'Experience this thrilling cinematic masterpiece exclusively on the big screen at iMovies cinemas.',
    genres: genres.length > 0 ? genres : ['Action', 'Drama'],
    releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : new Date(),
    language,
    duration,
    certification: tmdbMovie.adult ? 'A' : 'UA',
    posterUrl,
    bannerUrl,
    trailerUrl: trailerUrl || 'https://www.youtube.com/watch?v=Way9Dexny3w',
    director,
    cast: cast.length > 0 ? cast : ['Leading Ensemble Cast'],
    rating,
    votesCount: tmdbMovie.vote_count || 240,
  };
};

/**
 * Helper to build default ticket slots for a show
 */
const buildDefaultShowTickets = (balconyPrice = 350, middlePrice = 250, lowerPrice = 180) => {
  const tickets = {};
  ['A', 'B'].forEach((row) => {
    for (let col = 1; col <= 10; col++) {
      const id = `${row}${col}`;
      tickets[id] = { seatNumber: id, row, col, tier: 'balcony', price: balconyPrice, status: 'available', lockedBy: null, lockExpiresAt: null };
    }
  });
  ['C', 'D', 'E'].forEach((row) => {
    for (let col = 1; col <= 10; col++) {
      const id = `${row}${col}`;
      tickets[id] = { seatNumber: id, row, col, tier: 'middle', price: middlePrice, status: 'available', lockedBy: null, lockExpiresAt: null };
    }
  });
  ['F', 'G'].forEach((row) => {
    for (let col = 1; col <= 10; col++) {
      const id = `${row}${col}`;
      tickets[id] = { seatNumber: id, row, col, tier: 'lower', price: lowerPrice, status: 'available', lockedBy: null, lockExpiresAt: null };
    }
  });
  return tickets;
};

/**
 * Ensure scheduled showtimes exist for a movie across today and upcoming days
 */
const ensureShowsForMovie = async (movie) => {
  try {
    const existingCount = await Show.countDocuments({ movieId: movie._id.toString() });
    if (existingCount >= 4) return;

    const theatres = await Theatre.find().limit(3);
    if (!theatres || theatres.length === 0) return;

    const timeSlots = ['10:30 AM', '02:15 PM', '06:00 PM', '09:30 PM'];
    const showsToInsert = [];

    // Schedule shows for the next 4 days
    for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
      const showDate = new Date();
      showDate.setDate(showDate.getDate() + dayOffset);
      showDate.setHours(0, 0, 0, 0);

      const theatre = theatres[dayOffset % theatres.length];
      const slotsForDay = dayOffset % 2 === 0 ? [timeSlots[0], timeSlots[2]] : [timeSlots[1], timeSlots[3]];

      for (const slot of slotsForDay) {
        const tickets = buildDefaultShowTickets(
          theatre.balconySeatPrice || 350,
          theatre.middleSeatPrice || 250,
          theatre.lowerSeatPrice || 180
        );

        showsToInsert.push({
          adminEmail: 'admin@imovies.com',
          showId: `SHOW-${movie._id.toString().substring(18)}-D${dayOffset}-${slot.replace(/[: ]/g, '')}`,
          movieId: movie._id.toString(),
          theatreName: theatre.theatreName,
          theatreId: theatre.theatreId,
          showDate,
          showTime: slot,
          screenType: theatre.facilities[0] || 'Dolby Atmos',
          tickets,
        });
      }
    }

    if (showsToInsert.length > 0) {
      await Show.insertMany(showsToInsert);
    }
  } catch (err) {
    console.warn(`[TMDB Service] Show scheduling note for ${movie.movieName}:`, err.message);
  }
};

/**
 * Upsert a formatted movie into MongoDB Movie collection and generate shows
 */
const upsertMovieToDatabase = async (movieData) => {
  try {
    const existing = await Movie.findOne({
      $or: [{ tmdbId: movieData.tmdbId }, { movieName: movieData.movieName }],
    });

    let savedMovie;
    if (existing) {
      Object.assign(existing, movieData);
      savedMovie = await existing.save();
    } else {
      savedMovie = await Movie.create(movieData);
    }

    // Schedule shows so users can book tickets immediately
    await ensureShowsForMovie(savedMovie);

    return savedMovie;
  } catch (err) {
    console.error(`[TMDB Service] Error upserting movie ${movieData.movieName}:`, err.message);
    return null;
  }
};

/**
 * Fetch Now Playing movies directly from TMDB API
 */
const fetchNowPlayingFromTMDB = async (page = 1) => {
  return requestWithRetry('/movie/now_playing', { page });
};

/**
 * Fetch Popular movies from TMDB API
 */
const fetchPopularFromTMDB = async (page = 1) => {
  return requestWithRetry('/movie/popular', { page });
};

/**
 * Search movies on TMDB API
 */
const searchMoviesFromTMDB = async (query, page = 1) => {
  return requestWithRetry('/search/movie', { query, page, include_adult: false });
};

/**
 * Fetch detailed movie information including credits and videos from TMDB
 */
const fetchMovieDetailsFromTMDB = async (tmdbId) => {
  const data = await requestWithRetry(`/movie/${tmdbId}`, {
    append_to_response: 'credits,videos,release_dates',
  });
  const genreMap = await getGenreMap();
  return formatTmdbMovie(data, genreMap);
};

/**
 * Main function called by movieController to get real-time market movies.
 * Queries TMDB live, transforms the results, syncs to MongoDB, and returns them.
 */
const getLiveMarketMovies = async ({ genre, language, search, page = 1, feed = 'now_playing' }) => {
  try {
    const genreMap = await getGenreMap();
    let tmdbData;

    if (search && search.trim()) {
      tmdbData = await searchMoviesFromTMDB(search.trim(), page);
    } else if (feed === 'popular') {
      tmdbData = await fetchPopularFromTMDB(page);
    } else {
      tmdbData = await fetchNowPlayingFromTMDB(page);
    }

    const rawList = tmdbData.results || [];
    const formattedList = rawList.map((m) => formatTmdbMovie(m, genreMap));

    // Sync live market movies into MongoDB in parallel
    const syncedMovies = await Promise.all(
      formattedList.map(async (m) => {
        const saved = await upsertMovieToDatabase(m);
        return saved ? saved.toObject() : m;
      })
    );

    // Apply in-memory filtering for genre & language if specified
    let filtered = syncedMovies.filter(Boolean);

    if (genre && genre !== 'All') {
      const reg = new RegExp(genre, 'i');
      filtered = filtered.filter((m) => m.genres && m.genres.some((g) => reg.test(g)));
    }

    if (language && language !== 'All') {
      filtered = filtered.filter((m) => m.language && m.language.toLowerCase() === language.toLowerCase());
    }

    return {
      success: true,
      count: filtered.length,
      page: tmdbData.page || 1,
      totalPages: tmdbData.total_pages || 1,
      movies: filtered,
      source: 'TMDB_LIVE',
    };
  } catch (err) {
    console.warn('[TMDB Service] Fallback to MongoDB cached movies:', err.message);
    let query = {};
    if (genre && genre !== 'All') query.genres = { $in: [new RegExp(genre, 'i')] };
    if (language && language !== 'All') query.language = new RegExp(`^${language}$`, 'i');
    if (search && search.trim()) {
      query.$or = [
        { movieName: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    const movies = await Movie.find(query).sort({ releaseDate: -1 });
    return {
      success: true,
      count: movies.length,
      movies,
      source: 'LOCAL_FALLBACK',
    };
  }
};

module.exports = {
  getLiveMarketMovies,
  fetchNowPlayingFromTMDB,
  fetchPopularFromTMDB,
  fetchMovieDetailsFromTMDB,
  searchMoviesFromTMDB,
  upsertMovieToDatabase,
};
