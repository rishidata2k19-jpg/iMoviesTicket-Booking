import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, Play, Star, Calendar, ShieldCheck, Clock, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

const Landing = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [activeTrailer, setActiveTrailer] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await api.get('/movie');
        if (res.data.success) {
          setFeaturedMovies(res.data.movies.slice(0, 4));
        }
      } catch (err) {
        console.warn('Failed to load featured movies', err);
      }
    };
    fetchMovies();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* Background Ambient Glow & Poster Backdrop */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop"
            alt="Cinema Backdrop"
            className="w-full h-full object-cover opacity-20 filter brightness-50 contrast-125 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#080c14] via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/80 dark:from-[#080c14] via-transparent to-slate-50/80 dark:to-[#080c14]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 pt-12 pb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-600/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs sm:text-sm font-semibold tracking-wide">
            <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Next-Generation Cinema Experience</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-amber-500">iMovies</span>
          </h1>

          <p className="text-lg sm:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Your ultimate destination for the latest blockbusters and timeless classics. Movie ticket booking made simple.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/home"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-base shadow-xl shadow-red-600/30 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <Film className="w-5 h-5" />
              <span>Explore Now Showing</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-base shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <span>Sign In / Demo Login</span>
            </Link>
          </div>

          {/* Quick Perks */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-red-500" />
              <span>Live Seat Locking</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Zero Booking Delays</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Digital QR Tickets</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-500" />
              <span>Automated Reminders</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Blockbusters Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-red-600 dark:text-red-500 text-xs font-bold uppercase tracking-widest">In Theaters Now</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Trending Premieres</h2>
          </div>
          <Link to="/home" className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredMovies.map((movie) => (
            <div
              key={movie._id}
              className="group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-red-500/50 transition-all duration-300 flex flex-col shadow-sm hover:shadow-xl dark:shadow-lg dark:hover:shadow-red-500/10 hover:-translate-y-1"
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-slate-900">
                <img
                  src={movie.posterUrl}
                  alt={movie.movieName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                  {movie.certification || 'UA'}
                </div>

                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{movie.rating}</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                  <span className="flex items-center space-x-1 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                    <span>{movie.duration}</span>
                  </span>
                  <span className="text-slate-200 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                    {movie.language}
                  </span>
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                    {movie.movieName}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {movie.genres?.slice(0, 2).map((g) => (
                      <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-2">
                  <Link
                    to={`/movieshows/${movie._id}`}
                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold text-center transition-colors shadow-md shadow-red-600/20"
                  >
                    Book Tickets
                  </Link>
                  <Link
                    to={`/moviedetails/${movie._id}`}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors"
                    title="Movie Details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why iMovies Cinema Section */}
      <section className="bg-white dark:bg-slate-950/60 border-y border-slate-200 dark:border-slate-800/80 py-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Engineered for the Modern Moviegoer</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              From instant real-time seat locking to automated calendar sync and reminders, iMovies redefines cinema ticketing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-600/10 text-red-600 dark:text-red-500 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live 5-Minute Seat Lock</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                No more losing seats at the payment screen. Our WebSocket-powered TTL reservation holds your seats securely while you finish checkout.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-600/10 text-cyan-600 dark:text-cyan-500 flex items-center justify-center">
                <Film className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Interactive Tiered Seat Map</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pick your preferred view with precision across Balcony VIP, Middle Premium, and Lower standard rows with crystal-clear pricing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contactless Digital Ticket</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Scan your QR code right from your smartphone. Email confirmations and show reminders are dispatched automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready for your next movie night?</h2>
            <p className="text-sm sm:text-base text-white/90 mt-2">
              Join thousands of film fans enjoying hassle-free booking, exclusive perks, and seamless entry.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-3.5 rounded-xl bg-white text-slate-900 font-bold shadow-lg hover:bg-slate-100 transition-all"
              >
                Create Free Account
              </Link>
              <Link
                to="/home"
                className="px-8 py-3.5 rounded-xl bg-black/20 hover:bg-black/30 text-white font-semibold border border-white/30 transition-all"
              >
                Browse All Shows
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
