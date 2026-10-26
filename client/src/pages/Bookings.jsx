import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Ticket, 
  Printer, 
  XCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Film,
  Sparkles
} from 'lucide-react';
import api from '../utils/api';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/my-bookings');
      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      toast.error('Failed to retrieve ticket bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Refund will be initiated immediately.')) {
      return;
    }

    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      if (res.data.success) {
        toast.success('Booking cancelled successfully.');
        loadBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel booking.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Loader message="Loading your digital cinema passes..." />;

  return (
    <div className="min-h-screen pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4 mb-8">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-600/10 text-red-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Ticket className="w-3.5 h-3.5" />
            <span>Pass Wallet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">My Digital Cinema Tickets</h1>
          <p className="text-xs text-slate-400 mt-1">
            Present your QR code at the cinema turnstile for instant contactless admission.
          </p>
        </div>

        {bookings.length > 0 && (
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 transition-colors shadow-md"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print All Tickets</span>
          </button>
        )}
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-lg font-bold text-white">No active bookings found</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't reserved any movie tickets yet. Explore today's showtimes to book your favorite seats!
          </p>
          <Link
            to="/home"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/20"
          >
            <Film className="w-4 h-4" />
            <span>Browse Now Showing</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {bookings.map((booking) => {
            const isCancelled = booking.paymentStatus === 'Cancelled';
            return (
              <div
                key={booking._id}
                className={`relative rounded-3xl overflow-hidden border backdrop-blur-xl shadow-2xl transition-all ${
                  isCancelled
                    ? 'bg-slate-950/70 border-slate-800/80 opacity-70'
                    : 'bg-slate-900/80 border-slate-700/80 hover:border-red-500/40'
                }`}
              >
                {/* Cinema Ticket Card Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
                  {/* Left Column: Movie & Showtime Details */}
                  <div className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-600 text-white shadow-sm">
                            {booking.showDetails?.theatreName || 'iMovies Cineplex'}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {booking.showDetails?.screenType || '4K Laser'}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1.5 ${
                            isCancelled
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isCancelled ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Cancelled (Refunded)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirmed & Active</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Movie Title */}
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {booking.showDetails?.movieName || 'Blockbuster Movie'}
                      </h2>

                      {/* Date, Time, Cinema Specs */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Date</span>
                          <span className="font-bold text-white mt-0.5 block">
                            {booking.showDetails?.showDate
                              ? new Date(booking.showDetails.showDate).toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Today'}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Time</span>
                          <span className="font-bold text-cyan-400 mt-0.5 block">
                            {booking.showDetails?.showTime || '07:30 PM'}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 col-span-2 sm:col-span-1">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Seats</span>
                          <span className="font-black text-emerald-400 mt-0.5 block">
                            {booking.selectedSeats?.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & Cancel option */}
                    <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                      <div>
                        <span>Booking ID: </span>
                        <code className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {booking.bookingId}
                        </code>
                        <span className="ml-3 text-slate-400">Total: ${booking.totalAmount}</span>
                      </div>

                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(booking.bookingId)}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1 font-semibold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel Booking</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Perforated Divider (Cinematic stub notch effect) */}
                  <div className="relative hidden md:block w-px bg-slate-800 my-4">
                    <div className="absolute -top-7 -left-3 w-6 h-6 rounded-full bg-[#080c14] border-b border-slate-800" />
                    <div className="absolute -bottom-7 -left-3 w-6 h-6 rounded-full bg-[#080c14] border-t border-slate-800" />
                  </div>

                  {/* Right Column: Contactless Digital QR Pass */}
                  <div className="md:col-span-4 p-6 sm:p-8 bg-slate-950/90 flex flex-col items-center justify-center text-center space-y-4 border-t md:border-t-0 border-slate-800">
                    <div className="p-3 bg-white rounded-2xl shadow-xl">
                      <QRCodeSVG
                        value={`https://imovies.cinemas/ticket/${booking.bookingId}`}
                        size={130}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Scan at Turnstile
                      </span>
                      <p className="text-[10px] text-slate-500 max-w-[180px] leading-tight">
                        Gate opens 20 minutes before scheduled start time.
                      </p>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500">
                      TXN: {booking.transactionId?.substring(0, 16)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bookings;
