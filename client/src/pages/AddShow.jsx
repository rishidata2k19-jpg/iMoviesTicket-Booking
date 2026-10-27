import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Clock, Film, MapPin } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';

const AddShow = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    movieId: '',
    theatreId: '',
    theatreName: '',
    showDate: new Date().toISOString().split('T')[0],
    showTime: '07:30 PM',
    screenType: '4K Dolby Atmos',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [movieRes, theatreRes] = await Promise.all([
          api.get('/movie'),
          api.get('/theatre'),
        ]);

        if (movieRes.data.success && movieRes.data.movies.length > 0) {
          setMovies(movieRes.data.movies);
          setFormData((prev) => ({ ...prev, movieId: movieRes.data.movies[0]._id }));
        }

        if (theatreRes.data.success && theatreRes.data.theatres.length > 0) {
          setTheatres(theatreRes.data.theatres);
          setFormData((prev) => ({
            ...prev,
            theatreId: theatreRes.data.theatres[0].theatreId,
            theatreName: theatreRes.data.theatres[0].theatreName,
          }));
        }
      } catch (err) {
        toast.error('Failed to load movies or theatres.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTheatreChange = (e) => {
    const chosenTheatre = theatres.find((t) => t.theatreId === e.target.value);
    setFormData({
      ...formData,
      theatreId: e.target.value,
      theatreName: chosenTheatre ? chosenTheatre.theatreName : '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let resolvedTheatreName = formData.theatreName;
    if (!resolvedTheatreName && formData.theatreId) {
      const match = theatres.find((t) => t.theatreId === formData.theatreId || t._id === formData.theatreId);
      if (match) resolvedTheatreName = match.theatreName;
    }

    if (!formData.movieId || !resolvedTheatreName || !formData.showDate || !formData.showTime) {
      toast.error('Please complete all show details (movie, theatre, date, and showtime).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/shows', {
        ...formData,
        theatreName: resolvedTheatreName,
      });
      if (res.data.success) {
        toast.success('Show scheduled successfully! Seats are now open for booking.');
        navigate('/admin');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule show.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader message="Loading available theatres and film catalog..." />;

  return (
    <div className="min-h-screen pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="mb-6 flex items-center space-x-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          to="/admin"
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Showtime Manager</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Schedule New Movie Showtime</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-sm dark:shadow-2xl space-y-6">
        <div className="space-y-4">
          {/* Movie Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Film className="w-4 h-4 text-red-600" />
              <span>Select Movie *</span>
            </label>
            <select
              value={formData.movieId}
              onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              {movies.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.movieName} ({m.language}) - {m.duration}
                </option>
              ))}
            </select>
          </div>

          {/* Theatre Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-cyan-600" />
              <span>Select Cinema Theatre *</span>
            </label>
            <select
              value={formData.theatreId}
              onChange={handleTheatreChange}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              {theatres.map((t) => (
                <option key={t.theatreId} value={t.theatreId}>
                  {t.theatreName} - {t.location}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Show Date *</span>
              </label>
              <input
                type="date"
                required
                value={formData.showDate}
                onChange={(e) => setFormData({ ...formData, showDate: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Show Time Slot *</span>
              </label>
              <input
                type="text"
                required
                value={formData.showTime}
                onChange={(e) => setFormData({ ...formData, showTime: e.target.value })}
                placeholder="e.g. 10:30 AM, 02:00 PM, 07:30 PM"
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Screen Format / Technology</label>
            <input
              type="text"
              value={formData.screenType}
              onChange={(e) => setFormData({ ...formData, screenType: e.target.value })}
              placeholder="IMAX 3D, Dolby Atmos, RealD 3D, 4DX"
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-md shadow-amber-400/20 transition-all disabled:opacity-50"
          >
            {submitting ? 'Generating Seat Layout...' : 'Publish Scheduled Showtime'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddShow;
