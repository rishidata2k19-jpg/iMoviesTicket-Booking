import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Ticket, 
  Heart, 
  MessageSquare, 
  Calendar,
  LogOut,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Loader from '../components/Loader';

const Profile = () => {
  const { user, isAdmin, logout } = useAuth();
  const [stats, setStats] = useState({
    bookingCount: 0,
    watchlistCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const [bookingsRes, favsRes] = await Promise.all([
          api.get('/bookings/my-bookings').catch(() => ({ data: { count: 0 } })),
          api.get('/favorite').catch(() => ({ data: { count: 0 } })),
        ]);

        setStats({
          bookingCount: bookingsRes.data?.count || 0,
          watchlistCount: favsRes.data?.count || 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  if (loading) return <Loader message="Loading account activity..." />;

  return (
    <div className="min-h-screen pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Profile Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-red-600/30">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{user?.username}</h1>
              <div className="flex items-center justify-center space-x-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                  {isAdmin ? 'Cinema Administrator' : 'VIP Cinephile Member'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.email}</span>
            </p>

            <div className="pt-2 text-xs text-slate-500">
              Account status: <span className="text-emerald-400 font-semibold">Active & Verified</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-800 text-center">
          <Link
            to="/bookings"
            className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-red-500/40 transition-colors"
          >
            <Ticket className="w-5 h-5 text-red-500 mx-auto mb-1.5" />
            <span className="text-2xl font-black text-white block">{stats.bookingCount}</span>
            <span className="text-[11px] font-semibold text-slate-400">Total Bookings</span>
          </Link>

          <Link
            to="/favoriteshows"
            className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-red-500/40 transition-colors"
          >
            <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
            <span className="text-2xl font-black text-white block">{stats.watchlistCount}</span>
            <span className="text-[11px] font-semibold text-slate-400">Watchlist Movies</span>
          </Link>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 col-span-2 sm:col-span-1">
            <Award className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
            <span className="text-2xl font-black text-white block">VIP Club</span>
            <span className="text-[11px] font-semibold text-slate-400">Reward Tier</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/bookings"
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
              Access My Digital Tickets
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">View QR passes and cancel active reservations</p>
          </div>
          <Ticket className="w-5 h-5 text-slate-500 group-hover:text-red-400 transition-colors" />
        </Link>

        {isAdmin && (
          <Link
            to="/admin"
            className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 transition-all flex items-center justify-between group"
          >
            <div>
              <h3 className="text-sm font-bold text-amber-400">Administration Console</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage movies, schedule shows, and view analytics</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </Link>
        )}
      </div>

      {/* Logout button */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors text-xs font-bold"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of iMovies</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
