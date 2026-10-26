const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const Movie = require('../models/movieModel');
const Theatre = require('../models/theatreModel');
const Show = require('../models/showModel');
const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const tmdbService = require('../services/tmdbService');

const seedInitialData = async () => {
  try {
    // 1. Seed Default Admin & User
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);

    const admin = await Admin.findOneAndUpdate(
      { email: 'admin@imovies.com' },
      {
        username: 'admin',
        email: 'admin@imovies.com',
        password: adminPassword,
        role: 'admin',
      },
      { upsert: true, new: true }
    );

    const user = await User.findOneAndUpdate(
      { email: 'user@imovies.com' },
      {
        username: 'cinephile_alex',
        email: 'user@imovies.com',
        password: userPassword,
        role: 'user',
      },
      { upsert: true, new: true }
    );

    console.log('[Database] Admin & User credentials verified (admin@imovies.com / user@imovies.com)');

    // 2. Seed Theatres if needed
    const createSeats = (prefix, rows, cols) => {
      const seats = {};
      for (let r = 0; r < rows; r++) {
        const rowLetter = String.fromCharCode(prefix.charCodeAt(0) + r);
        for (let c = 1; c <= cols; c++) {
          seats[`${rowLetter}${c}`] = { row: rowLetter, number: c };
        }
      }
      return seats;
    };

    const existingTheatres = await Theatre.countDocuments();
    let seededTheatres = [];
    if (existingTheatres === 0) {
      const theatresData = [
        {
          theatreName: 'iMovies Grand IMAX - Downtown',
          theatreId: 'THTR-IMAX-01',
          location: 'Downtown Cultural Plaza, 7th Ave',
          balconySeatPrice: 350,
          middleSeatPrice: 250,
          lowerSeatPrice: 180,
          balconySeats: createSeats('A', 2, 10),
          middleSeats: createSeats('C', 3, 10),
          lowerSeats: createSeats('F', 2, 10),
          facilities: ['IMAX with Laser', '12-Channel Sound', 'Luxury Recliners', 'Gourmet Lounge'],
        },
        {
          theatreName: 'Cinépolis VIP Lux & Dolby Atmos',
          theatreId: 'THTR-VIP-02',
          location: 'Westfield Galleria Mall, 3rd Floor',
          balconySeatPrice: 400,
          middleSeatPrice: 280,
          lowerSeatPrice: 200,
          balconySeats: createSeats('A', 2, 10),
          middleSeats: createSeats('C', 3, 10),
          lowerSeats: createSeats('F', 2, 10),
          facilities: ['Dolby Atmos', 'In-Seat Butler Service', 'Reclining Sofas', 'Valet Parking'],
        },
        {
          theatreName: 'PVR ICON 4DX & RealD 3D',
          theatreId: 'THTR-4DX-03',
          location: 'Metro City Center, Gate 2',
          balconySeatPrice: 320,
          middleSeatPrice: 220,
          lowerSeatPrice: 160,
          balconySeats: createSeats('A', 2, 10),
          middleSeats: createSeats('C', 3, 10),
          lowerSeats: createSeats('F', 2, 10),
          facilities: ['4DX Motion Seats', 'Environmental Effects', 'Laser 4K', 'Cafeteria'],
        },
      ];
      seededTheatres = await Theatre.insertMany(theatresData);
      console.log(`[Database] Seeded ${seededTheatres.length} cinema theatres.`);
    } else {
      seededTheatres = await Theatre.find();
    }

    // 3. Fetch Live Market Movies directly from TMDB API to populate
    console.log('[TMDB Live Sync] Fetching real-time market movies from TMDB API...');
    try {
      const liveMarket = await tmdbService.getLiveMarketMovies({ page: 1 });
      console.log(
        `[TMDB Live Sync] Successfully synchronized ${liveMarket.count} real-time market movies from TMDB API!`
      );
    } catch (tmdbErr) {
      console.warn('[TMDB Live Sync] Initial TMDB pull warning:', tmdbErr.message);
    }

    // 4. Sample Booking for Demo User if none exists
    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0) {
      const firstShow = await Show.findOne();
      const firstMovie = await Movie.findOne();
      if (firstShow && firstMovie) {
        await Booking.create({
          bookingId: 'IMV-DEMO-TICKET-77',
          userEmail: 'user@imovies.com',
          showId: firstShow.showId,
          ticketsData: {
            C5: { tier: 'middle', price: 250 },
            C6: { tier: 'middle', price: 250 },
          },
          selectedSeats: ['C5', 'C6'],
          totalAmount: 500,
          paymentStatus: 'Completed',
          paymentMethod: 'iMovies VIP Card',
          transactionId: 'TXN-DEMO-8849302',
          showDetails: {
            movieName: firstMovie.movieName,
            posterUrl: firstMovie.posterUrl,
            theatreName: firstShow.theatreName,
            showDate: firstShow.showDate,
            showTime: firstShow.showTime,
            screenType: firstShow.screenType,
          },
        });
        console.log('[Database] Demo user sample ticket initialized.');
      }
    }

    console.log('[Database] Seeding and TMDB real-time synchronization complete! 🍿');
  } catch (err) {
    console.error('[Database Seed Error]:', err);
  }
};

module.exports = { seedInitialData };
