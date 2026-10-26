import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';
import { 
  Film, 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  CreditCard,
  Smartphone,
  Building,
  Sparkles,
  Lock,
  Unlock,
  Ticket
} from 'lucide-react';
import api from '../utils/api';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const SeatMap = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [tickets, setTickets] = useState({});
  const [loading, setLoading] = useState(true);

  // User's currently selected seats (set of seat IDs, e.g. ['A1', 'A2'])
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Seat locking state
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [lockingLoading, setLockingLoading] = useState(false);

  // Payment checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Credit / Debit Card');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const socketRef = useRef(null);

  // 1. Initial Load of Show & Tickets
  const fetchShowData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/shows/${showId}`);
      if (res.data.success) {
        setShow(res.data.show);
        setMovie(res.data.movie);
        setTickets(res.data.show.tickets || {});

        // Check if user already has locked seats from previous refresh
        const myLocked = [];
        const now = new Date();
        let activeExpiry = null;

        for (const [sId, sData] of Object.entries(res.data.show.tickets || {})) {
          if (
            sData.status === 'locked' &&
            sData.lockedBy === user?.email &&
            sData.lockExpiresAt &&
            new Date(sData.lockExpiresAt) > now
          ) {
            myLocked.push(sId);
            activeExpiry = new Date(sData.lockExpiresAt);
          }
        }

        if (myLocked.length > 0) {
          setSelectedSeats(myLocked);
          setIsLockedByMe(true);
          setLockExpiresAt(activeExpiry);
        }
      }
    } catch (err) {
      toast.error('Failed to load show seat configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowData();
  }, [showId]);

  // 2. Real-Time Socket.io Connection
  useEffect(() => {
    // Establish WebSocket connection
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to server, joining room:', showId);
      socket.emit('join_show', showId);
    });

    // Listen for seat locked by any user
    socket.on('seat_locked', ({ showId: incomingShowId, seats, lockedBy, expiresAt }) => {
      if (incomingShowId !== showId) return;
      setTickets((prev) => {
        const next = { ...prev };
        seats.forEach((seatId) => {
          if (next[seatId]) {
            next[seatId] = {
              ...next[seatId],
              status: 'locked',
              lockedBy,
              lockExpiresAt: expiresAt,
            };
          }
        });
        return next;
      });

      // If locked by someone else and we had selected it, remove it
      if (lockedBy !== user?.email) {
        setSelectedSeats((prev) => prev.filter((s) => !seats.includes(s)));
      }
    });

    // Listen for seat unlocked / lock expired
    socket.on('seat_unlocked', ({ showId: incomingShowId, seats }) => {
      if (incomingShowId !== showId) return;
      setTickets((prev) => {
        const next = { ...prev };
        seats.forEach((seatId) => {
          if (next[seatId]) {
            next[seatId] = {
              ...next[seatId],
              status: 'available',
              lockedBy: null,
              lockExpiresAt: null,
            };
          }
        });
        return next;
      });
    });

    // Listen for seat permanently booked
    socket.on('seat_booked', ({ showId: incomingShowId, seats }) => {
      if (incomingShowId !== showId) return;
      setTickets((prev) => {
        const next = { ...prev };
        seats.forEach((seatId) => {
          if (next[seatId]) {
            next[seatId] = {
              ...next[seatId],
              status: 'booked',
            };
          }
        });
        return next;
      });
    });

    return () => {
      if (socket) {
        socket.emit('leave_show', showId);
        socket.disconnect();
      }
    };
  }, [showId, user?.email]);

  // 3. Countdown Timer for Lock TTL
  useEffect(() => {
    if (!isLockedByMe || !lockExpiresAt) return;

    const interval = setInterval(() => {
      const remainingMs = new Date(lockExpiresAt).getTime() - new Date().getTime();
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
      setSecondsRemaining(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(interval);
        setIsLockedByMe(false);
        setLockExpiresAt(null);
        setSelectedSeats([]);
        toast.warn('Your seat lock session has expired. Please select seats again.');
        fetchShowData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLockedByMe, lockExpiresAt]);

  // 4. Toggle Seat Selection (Before locking)
  const handleSeatClick = (seatId) => {
    const seat = tickets[seatId];
    if (!seat) return;

    // If booked, do nothing
    if (seat.status === 'booked') {
      toast.info(`Seat ${seatId} is already booked.`);
      return;
    }

    // If locked by another user and not expired
    const isLockedByOther =
      seat.status === 'locked' &&
      seat.lockedBy !== user?.email &&
      seat.lockExpiresAt &&
      new Date(seat.lockExpiresAt) > new Date();

    if (isLockedByOther) {
      toast.warning(`Seat ${seatId} is temporarily reserved by another guest.`);
      return;
    }

    // If already locked by me, cannot toggle individual seats until release
    if (isLockedByMe) {
      toast.info('Seats are already locked. Proceed to checkout or unlock them.');
      return;
    }

    // Toggle in selection
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      if (selectedSeats.length >= 8) {
        toast.info('Maximum 8 tickets per transaction.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // 5. Lock Selected Seats (Temporary TTL)
  const handleLockSeats = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat.');
      return;
    }

    setLockingLoading(true);
    try {
      const res = await api.post('/bookings/lock-seats', {
        showId: show.showId,
        seats: selectedSeats,
      });

      if (res.data.success) {
        setIsLockedByMe(true);
        setLockExpiresAt(new Date(res.data.expiresAt));
        setSecondsRemaining(res.data.ttlSeconds || 300);
        toast.success(`Reserved ${selectedSeats.length} seat(s) for 5 minutes!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not lock selected seats.');
      fetchShowData();
    } finally {
      setLockingLoading(false);
    }
  };

  // 6. Release / Unlock Seats
  const handleUnlockSeats = async () => {
    try {
      await api.post('/bookings/unlock-seats', {
        showId: show.showId,
        seats: selectedSeats,
      });
      setIsLockedByMe(false);
      setLockExpiresAt(null);
      setSelectedSeats([]);
      toast.info('Seats released.');
    } catch {
      toast.error('Failed to unlock seats.');
    }
  };

  // 7. Razorpay 5-Step Online Payment & Cryptographic Verification
  const handleRazorpayPayment = async () => {
    setPaymentProcessing(true);
    try {
      // Step 2: Request Order Creation from Backend
      const orderRes = await api.post('/payment/create-order', {
        showId: show.showId,
        selectedSeats,
      });

      if (!orderRes.data.success) {
        toast.error(orderRes.data.message || 'Failed to create payment order.');
        setPaymentProcessing(false);
        return;
      }

      const { order, keyId, totalAmount } = orderRes.data;

      // Check for Razorpay SDK on window
      if (!window.Razorpay) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection.');
        setPaymentProcessing(false);
        return;
      }

      // Step 3 & 4: Configure Razorpay Checkout Modal
      const options = {
        key: keyId || 'rzp_test_TqTzbIAfhLKF63',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'iMovies Cinemas',
        description: `Booking for ${movie?.movieName || 'Movie'} (${selectedSeats.join(', ')})`,
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=200&auto=format&fit=crop',
        order_id: order.id,
        handler: async function (response) {
          // Step 4b: Cryptographic Signature Verification
          try {
            toast.info('Verifying secure signature with Razorpay...');
            const verifyRes = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              showId: show.showId,
              selectedSeats,
            });

            if (verifyRes.data.success) {
              // Step 5: Confetti, notification, redirect
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
              });

              toast.success(`Payment Verified! [Ref: ${response.razorpay_payment_id}]`);
              setShowCheckoutModal(false);

              setTimeout(() => {
                navigate('/bookings', {
                  state: { newBookingId: verifyRes.data.booking.bookingId },
                });
              }, 1200);
            } else {
              toast.error(verifyRes.data.message || 'Payment signature verification failed.');
            }
          } catch (verifyErr) {
            toast.error(verifyErr.response?.data?.message || 'Payment verification failed on server.');
          } finally {
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: user?.username || 'Cinema Lover',
          email: user?.email || 'user@imovies.com',
          contact: '9999999999',
        },
        notes: {
          showId: show.showId,
          movieName: movie?.movieName,
          seats: selectedSeats.join(', '),
        },
        theme: {
          color: '#e50914',
        },
        modal: {
          ondismiss: function () {
            setPaymentProcessing(false);
            toast.info('Razorpay checkout dismissed. Your seats remain locked.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        toast.error(`Payment Failed: ${resp.error?.description || resp.error?.reason || 'Authorization rejected'}`);
        setPaymentProcessing(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Razorpay Error:', err);
      toast.error(err.response?.data?.message || 'Payment initiation failed.');
      setPaymentProcessing(false);
    }
  };

  // 8. Fallback Instant Confirmation
  const handleConfirmBooking = async () => {
    setPaymentProcessing(true);
    try {
      const res = await api.post('/bookings/confirm', {
        showId: show.showId,
        selectedSeats,
        paymentMethod,
      });

      if (res.data.success) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success('Ticket booked successfully! Email confirmation sent.');
        setShowCheckoutModal(false);

        setTimeout(() => {
          navigate('/bookings', { state: { newBookingId: res.data.booking.bookingId } });
        }, 1200);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment or confirmation failed.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Calculate pricing breakdown
  const subtotal = selectedSeats.reduce((sum, sId) => {
    const seat = tickets[sId];
    return sum + (seat?.price || 200);
  }, 0);
  const convenienceFee = selectedSeats.length * 20;
  const grandTotal = subtotal + convenienceFee;

  // Format timer MM:SS
  const formatTimer = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <Loader message="Rendering interactive seat map..." />;
  if (!show) return <div className="text-center py-20 text-slate-400">Show session not found.</div>;

  // Group seats by Tier
  const balconySeats = Object.values(tickets).filter((s) => s.tier === 'balcony');
  const middleSeats = Object.values(tickets).filter((s) => s.tier === 'middle');
  const lowerSeats = Object.values(tickets).filter((s) => s.tier === 'lower');

  const renderSeatGrid = (seatList, tierTitle, price) => {
    // Group seats by Row letter
    const rows = {};
    seatList.forEach((s) => {
      if (!rows[s.row]) rows[s.row] = [];
      rows[s.row].push(s);
    });

    return (
      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">{tierTitle}</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ${price}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">10 seats / row</span>
        </div>

        <div className="flex flex-col items-center space-y-2">
          {Object.entries(rows).map(([rowLetter, rowSeats]) => (
            <div key={rowLetter} className="flex items-center space-x-2 sm:space-x-3">
              <span className="w-5 text-center text-xs font-black text-slate-500">{rowLetter}</span>

              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {rowSeats
                  .sort((a, b) => a.col - b.col)
                  .map((seat) => {
                    const isSelected = selectedSeats.includes(seat.seatNumber);
                    const isBooked = seat.status === 'booked';
                    const isLockedOther =
                      seat.status === 'locked' &&
                      seat.lockedBy !== user?.email &&
                      seat.lockExpiresAt &&
                      new Date(seat.lockExpiresAt) > new Date();

                    let btnStyle = 'bg-slate-800/80 hover:bg-cyan-500/30 text-slate-300 border-slate-700/80';

                    if (isBooked) {
                      btnStyle = 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed line-through';
                    } else if (isLockedOther) {
                      btnStyle = 'bg-amber-500/20 text-amber-400 border-amber-500/40 cursor-not-allowed animate-pulse';
                    } else if (isSelected) {
                      btnStyle = 'bg-cyan-500 text-slate-950 font-black border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105';
                    }

                    return (
                      <button
                        key={seat.seatNumber}
                        type="button"
                        onClick={() => handleSeatClick(seat.seatNumber)}
                        disabled={isBooked || isLockedOther}
                        title={`Seat ${seat.seatNumber} - $${seat.price} (${seat.status})`}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] sm:text-xs font-bold border transition-all flex items-center justify-center ${btnStyle}`}
                      >
                        {seat.col}
                      </button>
                    );
                  })}
              </div>

              <span className="w-5 text-center text-xs font-black text-slate-500">{rowLetter}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Top Breadcrumb & Info */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-4">
          <Link
            to={`/movieshows/${show.movieId}`}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest">{show.theatreName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                {show.screenType}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {movie?.movieName || 'Movie Showtime'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Showtime: <span className="text-slate-200 font-semibold">{show.showTime}</span> •{' '}
              {new Date(show.showDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Live Seat Locking Timer Banner */}
        {isLockedByMe && (
          <div className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse">
            <Lock className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="text-[11px] font-semibold block">Seats Reserved Exclusively:</span>
              <span className="text-lg font-black tracking-wider text-amber-300">
                {formatTimer(secondsRemaining)} remaining
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cinema Screen & Seat Map Grid Area */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          {/* Cinema Curved Screen graphic */}
          <div className="mb-12 max-w-xl mx-auto text-center">
            <div className="screen-curve w-full mx-auto" />
            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mt-3">
              All Eyes This Way • Cinema Screen
            </p>
          </div>

          {/* Seat Map Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-xs font-medium text-slate-400 border-b border-slate-800/60 pb-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700" />
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-md bg-cyan-500 border border-cyan-400 shadow-sm" />
              <span className="text-cyan-400 font-semibold">Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-md bg-amber-500/30 border border-amber-500/50" />
              <span>Locked (TTL)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-md bg-slate-950 border border-slate-900 line-through" />
              <span>Sold / Booked</span>
            </div>
          </div>

          {/* Seat Tiers */}
          <div className="space-y-6">
            {balconySeats.length > 0 &&
              renderSeatGrid(balconySeats, 'Balcony Tier (VIP Recliners)', balconySeats[0]?.price || 350)}

            {middleSeats.length > 0 &&
              renderSeatGrid(middleSeats, 'Middle Tier (Premium Club)', middleSeats[0]?.price || 250)}

            {lowerSeats.length > 0 &&
              renderSeatGrid(lowerSeats, 'Lower Tier (Standard Classic)', lowerSeats[0]?.price || 180)}
          </div>
        </div>

        {/* Sidebar Summary & Booking Checkout Card */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Ticket className="w-4 h-4 text-red-500" />
                <span>Ticket Summary</span>
              </h2>
              <span className="text-xs text-slate-400">
                {selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'} chosen
              </span>
            </div>

            {/* Selected seats list chips */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Selected Seats:
              </span>
              {selectedSeats.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  Click on any available seat in the map to select
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((sId) => {
                    const seat = tickets[sId];
                    return (
                      <span
                        key={sId}
                        className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-black flex items-center space-x-1.5"
                      >
                        <span>{sId}</span>
                        <span className="text-[10px] text-cyan-400/80 font-normal">(${seat?.price || 200})</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tickets Subtotal</span>
                <span className="font-semibold text-white">${subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience Fee (includes GST)</span>
                <span className="font-semibold text-white">${convenienceFee}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-3 border-t border-slate-800">
                <span>Total Payable</span>
                <span className="text-emerald-400">${grandTotal}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {!isLockedByMe ? (
                <button
                  type="button"
                  onClick={handleLockSeats}
                  disabled={selectedSeats.length === 0 || lockingLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
                >
                  <Lock className="w-4 h-4" />
                  <span>{lockingLoading ? 'Locking Seats...' : 'Lock Seats & Continue'}</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(true)}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Checkout (${grandTotal})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUnlockSeats}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center space-x-1"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Cancel / Unlock Seats</span>
                  </button>
                </div>
              )}
            </div>

            {/* Safe booking guarantee notice */}
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Real-time lock guarantees your seats for 5 minutes during checkout.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Payment Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-white">iMovies Express Checkout</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* Payment Summary */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Movie & Theatre:</span>
                <span className="font-semibold text-white">{movie?.movieName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Seats ({selectedSeats.length}):</span>
                <span className="font-bold text-cyan-400">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 font-black text-sm text-white">
                <span>Total Payable:</span>
                <span className="text-emerald-400">₹{grandTotal}</span>
              </div>
            </div>

            {/* Razorpay Gateway Badge & Multi-Payment Feature List */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-red-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                    R
                  </div>
                  <span className="text-xs font-black text-white">Razorpay Payment Gateway</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Test Mode Active
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Secure 256-bit encrypted checkout. Supports all major Indian payment channels:
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="flex items-center space-x-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant UPI / QR</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cards (Visa, MC, RuPay)</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  <span>50+ NetBanking Banks</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Wallets & PayLater</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Razorpay (Primary) and Simulation Fallback */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleRazorpayPayment}
                disabled={paymentProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 transition-all flex items-center justify-center space-x-2.5 disabled:opacity-50 transform hover:-translate-y-0.5"
              >
                <CreditCard className="w-5 h-5 text-white" />
                <span>
                  {paymentProcessing ? 'Initializing Razorpay...' : `Pay ₹${grandTotal} with Razorpay`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={paymentProcessing}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
              >
                Instant Offline / Dev Bypass Simulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatMap;
