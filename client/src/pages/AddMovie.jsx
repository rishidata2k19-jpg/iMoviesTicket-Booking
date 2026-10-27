import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Film, ArrowLeft, PlusCircle, Sparkles } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AddMovie = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    movieName: '',
    description: '',
    genres: 'Action, Sci-Fi, Adventure',
    releaseDate: '2025-05-15',
    language: 'English',
    duration: '150 min',
    certification: 'PG-13',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1400&auto=format&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    director: 'Christopher Nolan',
    cast: 'Cillian Murphy, Emily Blunt, Matt Damon',
    rating: 9.0,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.movieName || formData.movieName.trim().length < 2) {
      toast.error('Movie name must be at least 2 characters.');
      return;
    }
    if (!formData.description || formData.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/movie', formData);
      if (res.data.success) {
        toast.success(`"${formData.movieName}" added successfully and showtimes scheduled!`);
        navigate('/admin');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add movie.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="mb-6 flex items-center space-x-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          to="/admin"
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-xs font-bold text-red-600 dark:text-red-500 uppercase tracking-widest">Admin Catalog</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Create New Movie Listing</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-sm dark:shadow-2xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Movie Name *</label>
            <input
              type="text"
              name="movieName"
              required
              value={formData.movieName}
              onChange={handleChange}
              placeholder="e.g. Inception: Dream World"
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Description / Synopsis *</label>
            <textarea
              name="description"
              rows={3}
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed plot synopsis..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Genres (comma separated) *</label>
            <input
              type="text"
              name="genres"
              required
              value={formData.genres}
              onChange={handleChange}
              placeholder="Action, Sci-Fi, Drama"
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Release Date *</label>
            <input
              type="date"
              name="releaseDate"
              required
              value={formData.releaseDate}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Language *</label>
            <input
              type="text"
              name="language"
              required
              value={formData.language}
              onChange={handleChange}
              placeholder="English"
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Duration *</label>
            <input
              type="text"
              name="duration"
              required
              value={formData.duration}
              onChange={handleChange}
              placeholder="150 min"
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Certification</label>
            <select
              name="certification"
              value={formData.certification}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            >
              <option value="UA">UA (Parental Guidance)</option>
              <option value="U">U (Universal)</option>
              <option value="A">A (Adults Only)</option>
              <option value="PG-13">PG-13</option>
              <option value="R">R (Restricted)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Rating (0 - 10)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Poster URL *</label>
            <input
              type="url"
              name="posterUrl"
              required
              value={formData.posterUrl}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Banner Backdrop URL</label>
            <input
              type="url"
              name="bannerUrl"
              value={formData.bannerUrl}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Director</label>
            <input
              type="text"
              name="director"
              value={formData.director}
              onChange={handleChange}
              placeholder="e.g. Denis Villeneuve"
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Trailer URL (YouTube)</label>
            <input
              type="url"
              name="trailerUrl"
              value={formData.trailerUrl}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Cast (comma separated)</label>
            <input
              type="text"
              name="cast"
              value={formData.cast}
              onChange={handleChange}
              placeholder="Actor 1, Actor 2, Actor 3"
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
          <Link
            to="/admin"
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{submitting ? 'Adding Movie...' : 'Save & Schedule Shows'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMovie;
