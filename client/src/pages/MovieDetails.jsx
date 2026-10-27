import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, 
  Clock, 
  Calendar, 
  Film, 
  Play, 
  MessageSquare, 
  Ticket, 
  Heart, 
  ArrowLeft,
  UserCheck,
  Send
} from 'lucide-react';
import api from '../utils/api';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const MovieDetails = () => {
  const { movieId } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Review submission state
  const [rating, setRating] = useState(9);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Video trailer modal
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/movie/${movieId}`);
      if (res.data.success) {
        setMovie(res.data.movie);
        setReviews(res.data.reviews || []);
      }

      if (isAuthenticated) {
        const favRes = await api.get('/favorite');
        if (favRes.data.success) {
          const match = favRes.data.favorites.some((f) => f._id === movieId);
          setIsFavorite(match);
        }
      }
    } catch (err) {
      toast.error('Failed to load movie details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [movieId]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to add this movie to your watchlist.');
      return;
    }
    try {
      const res = await api.post('/favorite', { movieId });
      if (res.data.success) {
        setIsFavorite(res.data.isFavorite);
        toast.success(res.data.message);
      }
    } catch {
      toast.error('Failed to update watchlist.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please log in to share your review.');
      return;
    }

    if (!reviewText.trim()) {
      toast.error('Please write a short review.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.post('/review', {
        movieId,
        rating: Number(rating),
        reviewText: reviewText.trim(),
      });

      if (res.data.success) {
        toast.success('Your review has been published!');
        setReviewText('');
        fetchDetails(); // refresh average and review list
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Loader message="Loading movie details and audience reviews..." />;
  if (!movie) return <div className="text-center py-20 text-slate-500">Movie not found.</div>;

  return (
    <div className="min-h-screen pb-24">
      {/* Backdrop Hero */}
      <div className="relative min-h-[45vh] sm:min-h-[55vh] w-full overflow-hidden bg-slate-950 shadow-md">
        <img
          src={movie.bannerUrl || movie.posterUrl}
          alt={movie.movieName}
          className="w-full h-full object-cover object-center filter brightness-50 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#080c14] via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <Link
            to="/home"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold backdrop-blur-md border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Movies</span>
          </Link>
        </div>
      </div>

      {/* Main Container Overlapping Backdrop */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 sm:-mt-44 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Poster Column */}
          <div className="lg:col-span-4 flex flex-col items-center sm:items-start">
            <div className="w-64 sm:w-80 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 relative group">
              <img
                src={movie.posterUrl}
                alt={movie.movieName}
                className="w-full h-auto aspect-[2/3] object-cover"
              />
              {movie.trailerUrl && (
                <button
                  type="button"
                  onClick={() => setShowTrailerModal(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors backdrop-blur-[2px]"
                >
                  <div className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transform group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 fill-white ml-1" />
                  </div>
                </button>
              )}
            </div>

            <div className="w-64 sm:w-80 mt-4 flex items-center space-x-3">
              <Link
                to={`/movieshows/${movie._id}`}
                className="flex-1 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-center text-sm shadow-xl shadow-red-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <Ticket className="w-4 h-4" />
                <span>Book Tickets</span>
              </Link>

              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`p-3.5 rounded-xl border transition-all ${
                  isFavorite
                    ? 'bg-red-600 text-white border-red-500 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'
                }`}
                title={isFavorite ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
              </button>
            </div>
          </div>

          {/* Details Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
                  {movie.certification || 'UA'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                  {movie.language}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{movie.duration}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {movie.movieName}
              </h1>

              {/* Rating score badge */}
              <div className="flex items-center space-x-4 pt-1">
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-amber-500/30 px-3.5 py-1.5 rounded-xl shadow-sm">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  <span className="text-lg font-black text-slate-900 dark:text-white">{movie.rating}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ 10</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Based on {movie.votesCount || reviews.length} audience reviews
                </span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-medium shadow-sm"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-2 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">About the Movie</h3>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                {movie.description}
              </p>
            </div>

            {/* Cast & Crew */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Director</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{movie.director || 'Visionary Filmmaker'}</p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cast</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {movie.cast && movie.cast.length > 0 ? movie.cast.join(', ') : 'Ensemble Cast'}
                </p>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-red-600" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Audience Feedback & Reviews</h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              {/* Submit Review Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Have you seen this film? Leave a rating</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Your Score:</span>
                    <select
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-amber-500 font-bold px-2 py-1 rounded-lg text-xs focus:outline-none"
                    >
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                        <option key={num} value={num}>
                          ⭐ {num} / 10
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <textarea
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your thoughts about the acting, visual effects, story, or sound..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingReview ? 'Posting...' : 'Submit Review'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No reviews yet. Be the first to share your thoughts!</p>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-red-600/15 text-red-600 dark:bg-red-600/20 dark:text-red-400 flex items-center justify-center font-bold text-xs">
                            {rev.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{rev.username || rev.userEmail}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded text-amber-600 dark:text-amber-400 text-xs font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{rev.rating}/10</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-9">
                        {rev.reviewText}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{movie.movieName} - Official Trailer</h3>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                Close (ESC)
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                title="Movie Trailer"
                className="w-full h-full"
                src={movie.trailerUrl?.replace('watch?v=', 'embed/')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
