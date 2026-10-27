import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, 
  ArrowLeft, 
  Search, 
  XCircle, 
  CheckCircle2, 
  DollarSign, 
  AlertTriangle 
} from 'lucide-react';
import api from '../utils/api';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const loadAllBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/admin/all');
      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch {
      toast.error('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllBookings();
  }, []);

  const handleAdminCancel = async (bookingId) => {
    if (!window.confirm(`Moderate Booking: Cancel #${bookingId} and release seats?`)) return;

    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      if (res.data.success) {
        toast.success(`Booking #${bookingId} cancelled.`);
        loadAllBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'All' || b.paymentStatus === statusFilter;
    const matchesSearch =
      b.bookingId?.toLowerCase().includes(search.toLowerCase()) ||
      b.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.showDetails?.movieName?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) return <Loader message="Compiling platform-wide reservations database..." />;

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Platform Moderation</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">All Platform Reservations</h1>
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Total Bookings: <strong className="text-slate-900 dark:text-white">{bookings.length}</strong>
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Booking ID, User Email, or Movie..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm"
        >
          <option value="All">All Statuses</option>
          <option value="Completed">Completed Only</option>
          <option value="Cancelled">Cancelled Only</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-sm dark:shadow-2xl">
        <div className="overflow-x-auto min-w-0 w-full">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold bg-slate-50 dark:bg-slate-950/60">
                <th className="py-3.5 px-4">Booking ID</th>
                <th className="py-3.5 px-4">Customer Email</th>
                <th className="py-3.5 px-4">Movie & Theatre</th>
                <th className="py-3.5 px-4">Showtime</th>
                <th className="py-3.5 px-4">Seats</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No reservations matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">{b.bookingId}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{b.userEmail}</td>
                    <td className="py-3.5 px-4 text-slate-900 dark:text-white font-semibold">
                      {b.showDetails?.movieName}
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        {b.showDetails?.theatreName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {b.showDetails?.showTime}
                      <span className="block text-[10px] text-slate-500">
                        {b.showDetails?.showDate ? new Date(b.showDetails.showDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                      {Array.isArray(b.selectedSeats) ? b.selectedSeats.join(', ') : b.selectedSeats || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 dark:text-white font-black">₹{b.totalAmount}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.paymentStatus === 'Completed'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.paymentStatus !== 'Cancelled' ? (
                        <button
                          type="button"
                          onClick={() => handleAdminCancel(b.bookingId)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 dark:border-red-500/30 text-[11px] font-semibold transition-colors"
                        >
                          Cancel / Refund
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
