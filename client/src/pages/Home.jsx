import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Film, 
  Star, 
  Clock, 
  Heart, 
  Sparkles, 
  Calendar, 
  Ticket,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  Radio,
  TrendingUp
} from 'lucide-react';
import api from '../utils/api';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const GENRES = ['All', 'Action', 'Sci-Fi', 'Adventure', 'Drama', 'Thriller', 'Animation', 'Horror', 'Comedy'];
const LANGUAGES = ['All', 'Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Spanish', 'Korean'];

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [feedType, setFeedType] = useState('now_playing'); // 'now_playing' | 'popular'
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // Fetch movies and favorites
  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        feed: feedType,
      };
      if (selectedGenre !== 'All') params.genre = selectedGenre;
      if (selectedLanguage !== 'All') params.language = selectedLanguage;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/movie', { params });
      if (res.data.success) {
        setMovies(res.data.movies);
      }

      if (isAuthenticated) {
        try {
          const favRes = await api.get('/favorite');
          if (favRes.data.success) {
            const ids = new Set(favRes.data.favorites.map((m) => m._id));
            setFavoriteIds(ids);
          }
        } catch {
          // ignore favorite fetch error
        }
      }
    } catch (err) {
      toast.error('Failed to load movies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedGenre, selectedLanguage, feedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const toggleFavorite = async (e, movieId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please log in to save movies to your watchlist.');
      return;
    }

    try {
      const res = await api.post('/favorite', { movieId });
      if (res.data.success) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (res.data.isFavorite) {
            next.add(movieId);
            toast.success('Added to Watchlist!');
          } else {
            next.delete(movieId);
            toast.info('Removed from Watchlist.');
          }
          return next;
        });
      }
    } catch (err) {
      toast.error('Error updating watchlist.');
    }
  };

  const featuredMovie = movies.length > 0 ? movies[0] : null;

  return (
    <div className="min-h-screen pb-20">
      {/* Featured Backdrop Hero Banner */}
      {featuredMovie && !search && selectedGenre === 'All' && (
        <div className="relative h-[65vh] w-full overflow-hidden bg-slate-950 mb-8 sm:mb-10 shadow-lg">
          <img
            src={featuredMovie.bannerUrl || featuredMovie.posterUrl}
            alt={featuredMovie.movieName}
            className="w-full h-full object-cover object-center filter brightness-65"
          />
          {/* Gradients blending to background */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#080c14] via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

          <div className="absolute bottom-10 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-3.5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                <Flame className="w-3.5 h-3.5" />
                <span>Now Playing • Live Cinema Network</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                {featuredMovie.movieName}
              </h1>

              <p className="text-sm sm:text-base text-slate-200 line-clamp-2 leading-relaxed drop-shadow">
                {featuredMovie.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-white pt-1">
                <span className="flex items-center space-x-1 bg-amber-500/30 text-amber-300 backdrop-blur-md px-2.5 py-1 rounded-full font-bold border border-amber-500/40">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{featuredMovie.rating} / 10</span>
                </span>
                <span className="flex items-center space-x-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  <span>{featuredMovie.duration}</span>
                </span>
                <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                  {featuredMovie.certification}
                </span>
                <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                  {featuredMovie.language}
                </span>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <Link
                  to={`/movieshows/${featuredMovie._id}`}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-600/30 flex items-center space-x-2 transition-transform hover:scale-105"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Book Tickets Now</span>
                </Link>

                <Link
                  to={`/moviedetails/${featuredMovie._id}`}
                  className="px-5 py-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-sm border border-white/30 transition-colors flex items-center space-x-1.5"
                >
                  <span>More Details</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Live Feed Toggle Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setFeedType('now_playing')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  feedType === 'now_playing'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Now In Theatres</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedType('popular')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  feedType === 'popular'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Popular Hits</span>
              </button>
            </div>

            {/* Live TMDB API Indicator */}
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-700 dark:text-slate-300">Live Cinema Feed</span>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search movies by title, genre, keyword..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors flex items-center justify-center space-x-1.5 shadow-md shadow-red-600/20"
            >
              <span>Search Movies</span>
            </button>
          </form>

          {/* Genre and Language Filter Chips */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
            {/* Genre list */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center space-x-1 flex-shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-red-500" />
                <span>Genre:</span>
              </span>
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGenre(g)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedGenre === g
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Language dropdown */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div className="flex items-center space-x-2.5">
            <Film className="w-5 h-5 text-red-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {feedType === 'popular' ? 'Popular Worldwide Releases' : 'Now Showing in Theatres'}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
              Live Feed
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
          </span>
        </div>

        {/* Loading state */}
        {loading ? (
          <Loader message="Synchronizing live movie catalog from TMDB..." />
        ) : movies.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Film className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No movies match your filters</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try resetting your search query or selecting "All" genres.</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedGenre('All');
                setSelectedLanguage('All');
              }}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Movie Card Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => {
              const isFav = favoriteIds.has(movie._id);
              return (
                <div
                  key={movie._id || movie.tmdbId}
                  className="group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-red-500/50 transition-all duration-300 flex flex-col shadow-sm hover:shadow-xl dark:shadow-md dark:hover:shadow-red-500/10 hover:-translate-y-1"
                >
                  {/* Poster Thumbnail */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-slate-900">
                    <img
                      src={movie.posterUrl}
                      alt={movie.movieName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />

                    {/* Certification Badge */}
                    <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-md">
                      {movie.certification || 'UA'}
                    </div>

                    {/* Watchlist Favorite Toggle */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, movie._id)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                        isFav
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-110'
                          : 'bg-black/60 text-slate-300 hover:text-red-400 hover:bg-black/80'
                      }`}
                      title={isFav ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                    </button>

                    {/* Rating badge */}
                    <div className="absolute bottom-3 left-3 flex items-center space-x-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/30 text-amber-400 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{movie.rating}</span>
                      <span className="text-[10px] text-slate-300 font-normal">({movie.votesCount || 100}+)</span>
                    </div>

                    <div className="absolute bottom-3 right-3 text-xs text-white bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                      {movie.duration}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <Link to={`/moviedetails/${movie._id}`}>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors line-clamp-1">
                          {movie.movieName}
                        </h3>
                      </Link>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {movie.genres?.slice(0, 3).map((genre) => (
                          <span
                            key={genre}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                        {movie.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                      <Link
                        to={`/movieshows/${movie._id}`}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold text-center transition-colors shadow-md shadow-red-600/20 flex items-center justify-center space-x-1.5"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Book Seats</span>
                      </Link>

                      <Link
                        to={`/moviedetails/${movie._id}`}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                        title="View Synopsis & Reviews"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
