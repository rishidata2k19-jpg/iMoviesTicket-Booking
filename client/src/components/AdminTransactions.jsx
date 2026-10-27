import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  RotateCcw, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ArrowUpRight,
  ShieldAlert,
  Ticket,
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import api from '../utils/api';
import Loader from './Loader';
import { toast } from 'react-toastify';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Refund confirmation modal state
  const [selectedForRefund, setSelectedForRefund] = useState(null);
  const [refundProcessing, setRefundProcessing] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/transactions');
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        setMetrics(res.data.metrics || null);
      }
    } catch (err) {
      toast.error('Failed to load transaction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleProcessRefund = async () => {
    if (!selectedForRefund) return;
    setRefundProcessing(true);
    try {
      const paymentRef =
        selectedForRefund.razorpayPaymentId ||
        selectedForRefund.transactionId ||
        selectedForRefund.bookingId;

      const res = await api.post(`/admin/refund/${paymentRef}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Refund successfully processed!');
        setSelectedForRefund(null);
        fetchTransactions(); // Refresh table
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund processing failed.');
    } finally {
      setRefundProcessing(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return 'N/A';
    }
  };

  const filtered = transactions.filter((t) => {
    const matchesStatus = statusFilter === 'All' || t.paymentStatus === statusFilter;
    const term = (search || '').toLowerCase().trim();
    if (!matchesStatus) return false;
    if (!term) return true;
    const matchesSearch =
      (t.bookingId && t.bookingId.toLowerCase().includes(term)) ||
      (t.userEmail && t.userEmail.toLowerCase().includes(term)) ||
      (t.razorpayPaymentId && t.razorpayPaymentId.toLowerCase().includes(term)) ||
      (t.transactionId && t.transactionId.toLowerCase().includes(term)) ||
      (t.showDetails?.movieName && t.showDetails.movieName.toLowerCase().includes(term));
    return !!matchesSearch;
  });

  if (loading) return <Loader message="Auditing gateway transactions and refund ledger..." />;

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Gross Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ₹{metrics?.completedVolume?.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">
            {metrics?.counts?.completed || 0} completed payments
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Refunded</span>
            <RotateCcw className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            ₹{metrics?.refundedVolume?.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-rose-400 font-medium">
            {metrics?.counts?.refunded || 0} refunded orders
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Gateway Mode</span>
            <CreditCard className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">Razorpay</div>
          <span className="text-[11px] text-cyan-300 font-mono font-medium">Test Mode (rzp_test_...)</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Bookings</span>
            <Ticket className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {metrics?.counts?.total || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">All recorded transactions</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Payment ID, Order ID, Booking ID, or Customer Email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
          >
            <option value="All">All Statuses ({transactions.length})</option>
            <option value="Completed">Completed Only</option>
            <option value="Refunded">Refunded Only</option>
            <option value="Cancelled">Cancelled Only</option>
            <option value="Pending">Pending Only</option>
          </select>

          <button
            type="button"
            onClick={fetchTransactions}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Transactions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white">Razorpay Payment & Refund Ledger</h3>
          </div>
          <span className="text-xs text-slate-400">
            Showing {filtered.length} of {transactions.length} records
          </span>
        </div>

        <div className="overflow-x-auto min-w-0 w-full">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold bg-slate-950/60">
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Razorpay Payment ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Movie & Theatre</th>
                <th className="py-3 px-4">Seats</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 italic">
                    No transactions found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isCompleted = t.paymentStatus === 'Completed';
                  const isRefunded = t.paymentStatus === 'Refunded';
                  const isCancelled = t.paymentStatus === 'Cancelled';
                  const isPending = t.paymentStatus === 'Pending';

                  return (
                    <tr key={t._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        {t.bookingId}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-300 block">
                          {t.razorpayPaymentId || t.transactionId || 'N/A'}
                        </span>
                        {t.razorpayOrderId && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {t.razorpayOrderId}
                          </span>
                        )}
                        {t.refundId && (
                          <span className="text-[10px] text-rose-400 font-mono block">
                            Ref: {t.refundId}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-300">{t.userEmail}</td>

                      <td className="py-3 px-4 text-white font-semibold">
                        {t.showDetails?.movieName || 'Movie'}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {t.showDetails?.theatreName || 'Cineplex'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-emerald-400 font-bold">
                        {Array.isArray(t.selectedSeats) ? t.selectedSeats.join(', ') : t.selectedSeats || 'N/A'}
                      </td>

                      <td className="py-3 px-4 font-black text-white">
                        ₹{t.totalAmount}
                      </td>

                      <td className="py-3 px-4">
                        {isCompleted && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        )}
                        {isRefunded && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <RotateCcw className="w-3 h-3" />
                            <span>Refunded</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertCircle className="w-3 h-3" />
                            <span>Cancelled</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {formatDateTime(t.createdAt)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isCompleted ? (
                          <button
                            type="button"
                            onClick={() => setSelectedForRefund(t)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-[11px] font-bold transition-all shadow-sm"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Issue Refund</span>
                          </button>
                        ) : isRefunded ? (
                          <span className="text-[11px] text-slate-500 font-medium italic">
                            Refund Complete
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No Action</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Refund */}
      {selectedForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-rose-500">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Authorize Razorpay Refund</h3>
                <p className="text-xs text-slate-400">Initiate reversal & free booked seats</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Booking ID:</span>
                <span className="font-mono font-bold text-white">{selectedForRefund.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment ID:</span>
                <span className="font-mono text-cyan-400">
                  {selectedForRefund.razorpayPaymentId || selectedForRefund.transactionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="text-white">{selectedForRefund.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Movie & Seats:</span>
                <span className="text-white">
                  {selectedForRefund.showDetails?.movieName || 'Movie'} ({Array.isArray(selectedForRefund.selectedSeats) ? selectedForRefund.selectedSeats.join(', ') : selectedForRefund.selectedSeats || 'N/A'})
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-sm text-white">
                <span>Refund Amount:</span>
                <span className="text-rose-400 font-black">₹{selectedForRefund.totalAmount}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Reversing this payment via Razorpay will update the status to <strong>Refunded</strong> and immediately release seats back to the public booking pool.
              </span>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForRefund(null)}
                disabled={refundProcessing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessRefund}
                disabled={refundProcessing}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{refundProcessing ? 'Processing Refund...' : 'Confirm Full Refund'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
