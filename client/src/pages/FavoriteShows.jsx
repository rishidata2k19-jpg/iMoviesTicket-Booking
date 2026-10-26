import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Film, Trash2, Ticket, Star, Clock, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const FavoriteShows = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/favorite');
      if (res.data.success) {
        setFavorites(res.data.favorites || []);
      }
    } catch {
      toast.error('Failed to load watchlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemove = async (movieId) => {
    try {
      const res = await api.delete(`/favorite/${movieId}`);
      if (res.data.success) {
        toast.info('Removed from Watchlist');
        setFavorites(favorites.filter((m) => m._id !== movieId));
      }
    } catch {
      toast.error('Failed to remove movie.');
    }
  };

  if (loading) return <Loader message="Retrieving your curated watchlist..." />;

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-slate-800">
        <div className="p-3 rounded-2xl bg-red-600/10 text-red-500">
          <Heart className="w-6 h-6 fill-red-500" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">My Movie Watchlist</h1>
          <p className="text-xs text-slate-400 mt-1">
            Keep track of upcoming releases and must-watch titles in one place.
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
          <Heart className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-lg font-bold text-white">Your Watchlist is empty</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Browse our catalog and tap the heart icon on any movie poster to bookmark it for later.
          </p>
          <Link
            to="/home"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/20"
          >
            <Film className="w-4 h-4" />
            <span>Discover Movies</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map((movie) => (
            <div
              key={movie._id}
              className="group rounded-2xl overflow-hidden bg-slate-900/60 border border-slate-800 hover:border-red-500/50 transition-all flex flex-col shadow-xl"
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
                <img
                  src={movie.posterUrl}
                  alt={movie.movieName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                <button
                  type="button"
                  onClick={() => handleRemove(movie._id)}
                  title="Remove from Watchlist"
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-red-600 text-slate-300 hover:text-white transition-all shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="absolute bottom-3 left-3 flex items-center space-x-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-amber-400 text-xs font-bold border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{movie.rating}</span>
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="text-base font-bold text-white line-clamp-1">{movie.movieName}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {movie.genres?.slice(0, 2).map((g) => (
                      <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center space-x-2">
                  <Link
                    to={`/movieshows/${movie._id}`}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold text-center transition-colors shadow-md flex items-center justify-center space-x-1"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Book Tickets</span>
                  </Link>

                  <Link
                    to={`/moviedetails/${movie._id}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoriteShows;
