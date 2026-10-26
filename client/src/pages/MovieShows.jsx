import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Sparkles, 
  Ticket, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Film
} from 'lucide-react';
import api from '../utils/api';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const MovieShows = () => {
  const { movieId } = useParams();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate next 5 dates using dayjs
  const availableDates = Array.from({ length: 5 }, (_, i) => {
    const d = dayjs().add(i, 'day');
    return {
      dateObj: d,
      formattedDate: d.format('YYYY-MM-DD'),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.format('ddd'),
      dayNum: d.format('DD'),
      monthName: d.format('MMM'),
    };
  });

  const [selectedDate, setSelectedDate] = useState(availableDates[0].formattedDate);

  useEffect(() => {
    const loadMovieAndShows = async () => {
      try {
        setLoading(true);
        // Fetch movie details
        const movieRes = await api.get(`/movie/${movieId}`);
        if (movieRes.data.success) {
          setMovie(movieRes.data.movie);
        }

        // Fetch shows for this movie and date
        const showsRes = await api.get('/shows', {
          params: { movieId, date: selectedDate },
        });

        if (showsRes.data.success) {
          setShows(showsRes.data.shows);
        }
      } catch (err) {
        toast.error('Failed to load show schedules.');
      } finally {
        setLoading(false);
      }
    };

    loadMovieAndShows();
  }, [movieId, selectedDate]);

  // Group shows by Theatre Name
  const theatreGroups = shows.reduce((acc, show) => {
    const tName = show.theatreName || 'iMovies Cinema Screen';
    if (!acc[tName]) {
      acc[tName] = {
        theatreName: tName,
        theatreId: show.theatreId,
        screenType: show.screenType,
        shows: [],
      };
    }
    acc[tName].shows.push(show);
    return acc;
  }, {});

  if (loading && !movie) return <Loader message="Locating cinema auditoriums and showtimes..." />;

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Back button & Movie mini header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <Link
            to={`/moviedetails/${movieId}`}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Select Showtime</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{movie?.movieName}</h1>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
              <span>{movie?.duration}</span>
              <span>•</span>
              <span>{movie?.language}</span>
              <span>•</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">
                {movie?.certification}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Fast Booking Available</span>
          </div>
        </div>
      </div>

      {/* Date selector tabs (Dayjs) */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-3">
          <Calendar className="w-4 h-4 text-red-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Choose Date</h2>
        </div>

        <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
          {availableDates.map((item) => {
            const isSelected = selectedDate === item.formattedDate;
            return (
              <button
                key={item.formattedDate}
                type="button"
                onClick={() => setSelectedDate(item.formattedDate)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-20 py-3 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30 scale-105'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase">{item.dayName}</span>
                <span className="text-lg font-black my-0.5">{item.dayNum}</span>
                <span className="text-[10px] font-medium opacity-80">{item.monthName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theatres & Shows List */}
      <div className="space-y-6">
        {loading ? (
          <Loader message="Refreshing available seats and show schedules..." />
        ) : Object.keys(theatreGroups).length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
            <Film className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No showtimes found for {dayjs(selectedDate).format('dddd, MMMM D')}</h3>
            <p className="text-xs text-slate-400">Please choose a different date above or check back shortly.</p>
          </div>
        ) : (
          Object.values(theatreGroups).map((group) => (
            <div
              key={group.theatreName}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl transition-all hover:border-slate-700 space-y-4"
            >
              {/* Theatre header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-bold text-white">{group.theatreName}</h3>
                    <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-[10px] font-bold">
                      {group.screenType || '4K Laser'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>Downtown Cinema City • Parking & Food Court Available</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span className="text-slate-300">Tiers:</span>
                  <span className="text-emerald-400 font-semibold">Balcony ($350)</span>
                  <span className="text-cyan-400 font-semibold">Middle ($250)</span>
                  <span className="text-amber-400 font-semibold">Lower ($180)</span>
                </div>
              </div>

              {/* Show time chips */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Available Showtime Slots:
                </div>
                <div className="flex flex-wrap gap-3">
                  {group.shows.map((show) => (
                    <Link
                      key={show.showId}
                      to={`/seatslug/${show.showId}`}
                      className="group flex flex-col items-center justify-center px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500 hover:bg-slate-900 transition-all shadow-md transform hover:-translate-y-0.5"
                    >
                      <span className="text-sm font-black text-white group-hover:text-red-400 transition-colors">
                        {show.showTime}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-300 mt-0.5">
                        {show.screenType || 'Dolby Atmos'}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MovieShows;
