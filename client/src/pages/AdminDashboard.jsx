import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  DollarSign, 
  Ticket, 
  Film, 
  Users, 
  PlusCircle, 
  Calendar, 
  Trash2, 
  Clock, 
  MapPin, 
  TrendingUp,
  UserPlus,
  ArrowRight,
  CreditCard,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import api from '../utils/api';
import Loader from '../components/Loader';
import AdminTransactions from '../components/AdminTransactions';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'transactions'

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/auth/admin/stats'),
        api.get('/auth/admin/users'),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setRecentBookings(statsRes.data.recentBookings || []);
      }

      if (usersRes.data.success) {
        setUsers(usersRes.data.users || []);
      }
    } catch (err) {
      toast.error('Failed to load administrative analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await api.delete(`/auth/admin/users/${userId}`);
      if (res.data.success) {
        toast.success('User removed.');
        setUsers(users.filter((u) => u._id !== userId));
      }
    } catch {
      toast.error('Could not delete user.');
    }
  };

  if (loading) return <Loader message="Generating administrative reports and revenue metrics..." />;

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1 border border-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Master Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Platform Overview & Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time insight into box office revenue, registered moviegoers, active shows, and reservations.
          </p>
        </div>

        {/* View Switcher Tabs & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dashboard Stats
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'transactions'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Razorpay & Refunds</span>
            </button>
          </div>

          <Link
            to="/addshow"
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center space-x-1.5 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Show</span>
          </Link>
          <Link
            to="/addmovie"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <Film className="w-4 h-4" />
            <span>Add Movie</span>
          </Link>
        </div>
      </div>

      {activeTab === 'transactions' ? (
        /* Dedicated Razorpay Transactions & Refund Management Panel */
        <AdminTransactions />
      ) : (
        /* Overview & Standard Controls */
        <>
          {/* Metric Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                <DollarSign className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                  ₹{stats?.totalRevenue?.toLocaleString() || 0}
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">Box office sales</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0 border border-red-500/20">
                <Ticket className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {stats?.totalBookings || 0}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Tickets reserved</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                <Film className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Movies</span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {stats?.totalMovies || 0}
                </div>
                <span className="text-[11px] text-cyan-400 font-medium">{stats?.totalShows || 0} active shows</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Users</span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {stats?.totalUsers || 0}
                </div>
                <span className="text-[11px] text-purple-400 font-medium">{stats?.totalAdmins || 1} administrators</span>
              </div>
            </div>
          </div>

          {/* Admin Quick Action Hub */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/50 transition-all flex flex-col justify-between group text-left min-w-0"
            >
              <CreditCard className="w-5 h-5 text-rose-500 mb-2 group-hover:scale-110 transition-transform flex-shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">Refunds & Ledger</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Razorpay Gateway</p>
              </div>
            </button>

            <Link
              to="/addmovie"
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-red-500/50 transition-all flex flex-col justify-between group min-w-0"
            >
              <Film className="w-5 h-5 text-red-500 mb-2 group-hover:scale-110 transition-transform flex-shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">Add New Movie</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Posters & cast</p>
              </div>
            </Link>

            <Link
              to="/addtheatre"
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between group min-w-0"
            >
              <MapPin className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform flex-shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">Add Theatre</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Locations & tiers</p>
              </div>
            </Link>

            <Link
              to="/addshow"
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between group min-w-0"
            >
              <Calendar className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform flex-shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">Schedule Show</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Date & time slots</p>
              </div>
            </Link>

            <Link
              to="/adminbookings"
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group min-w-0"
            >
              <Ticket className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform flex-shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">All Bookings</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Audit reservations</p>
              </div>
            </Link>

            <Link
              to="/addadmin"
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between group min-w-0"
            >
              <UserPlus className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform flex-shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">Create Admin</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Sub-administrators</p>
              </div>
            </Link>
          </div>

          {/* Recent Bookings Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Ticket className="w-4 h-4 text-red-500" />
                <h2 className="text-base font-bold text-white">Recent Customer Bookings</h2>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center space-x-1"
                >
                  <span>Refund Management</span>
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <Link to="/adminbookings" className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1">
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto min-w-0 w-full">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-3">Booking ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Movie & Theatre</th>
                    <th className="py-3 px-3">Seats</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No reservations recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono text-cyan-400 font-bold">{b.bookingId}</td>
                        <td className="py-3 px-3 text-slate-300">{b.userEmail}</td>
                        <td className="py-3 px-3 text-white font-semibold">
                          {b.showDetails?.movieName}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {b.showDetails?.theatreName}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">
                          {Array.isArray(b.selectedSeats) ? b.selectedSeats.join(', ') : b.selectedSeats || 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-white font-bold">₹{b.totalAmount}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.paymentStatus === 'Completed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : b.paymentStatus === 'Refunded'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {b.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Moderation Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <Users className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-bold text-white">Registered Moviegoer Accounts</h2>
            </div>

            <div className="overflow-x-auto min-w-0 w-full">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-3">Username</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Joined On</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 text-white font-bold">{u.username}</td>
                      <td className="py-3 px-3 text-slate-300">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
