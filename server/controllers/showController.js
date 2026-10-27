const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');
const Movie = require('../models/movieModel');

// 1. Get all shows (with robust filtering by movieId and date)
exports.getAllShows = async (req, res) => {
  try {
    const { movieId, date, theatreName } = req.query;
    let query = {};

    if (movieId) {
      const idCandidates = [String(movieId)];
      try {
        let movieDoc = null;
        if (movieId.match(/^[0-9a-fA-F]{24}$/)) {
          movieDoc = await Movie.findById(movieId);
          if (movieDoc && movieDoc.tmdbId) {
            idCandidates.push(String(movieDoc.tmdbId));
          }
        } else if (!isNaN(Number(movieId))) {
          movieDoc = await Movie.findOne({ tmdbId: Number(movieId) });
          if (movieDoc) {
            idCandidates.push(movieDoc._id.toString());
          }
        }
      } catch (lookupErr) {
        // Silently proceed with primary ID candidate
      }
      query.movieId = { $in: idCandidates };
    }

    if (theatreName) {
      query.theatreName = new RegExp(theatreName, 'i');
    }

    if (date) {
      const parts = date.split('-').map(Number);
      if (parts.length === 3) {
        const [year, month, day] = parts;
        // Range covers +/- 14 hours to accommodate any client/server timezone offset
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        query.showDate = {
          $gte: new Date(startOfDay.getTime() - 14 * 3600 * 1000),
          $lte: new Date(endOfDay.getTime() + 14 * 3600 * 1000),
        };
      }
    }

    let shows = await Show.find(query).sort({ showDate: 1, showTime: 1 });

    // If no shows exist yet for this specific movie, ensure shows are auto-scheduled
    if (shows.length === 0 && movieId) {
      let movieDoc = null;
      if (movieId.match(/^[0-9a-fA-F]{24}$/)) {
        movieDoc = await Movie.findById(movieId);
      } else if (!isNaN(Number(movieId))) {
        movieDoc = await Movie.findOne({ tmdbId: Number(movieId) });
      }

      if (movieDoc) {
        const tmdbService = require('../services/tmdbService');
        await tmdbService.ensureShowsForMovie(movieDoc);
        shows = await Show.find(query).sort({ showDate: 1, showTime: 1 });
      }
    }

    // Populate movie info if needed
    const enrichedShows = await Promise.all(
      shows.map(async (show) => {
        let movie = null;
        if (show.movieId && show.movieId.match(/^[0-9a-fA-F]{24}$/)) {
          movie = await Movie.findById(show.movieId).select('movieName posterUrl duration certification');
        } else if (show.movieId && !isNaN(Number(show.movieId))) {
          movie = await Movie.findOne({ tmdbId: Number(show.movieId) }).select('movieName posterUrl duration certification');
        }
        return {
          ...show.toObject(),
          movieDetails: movie,
        };
      })
    );

    return res.status(200).json({ success: true, count: enrichedShows.length, shows: enrichedShows });
  } catch (error) {
    console.error('Error fetching shows:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get single show by ID (or showId)
exports.getShowById = async (req, res) => {
  try {
    const { id } = req.params;
    let show = await Show.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { showId: id }],
    });

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    // Auto-release expired locks for this show if any
    const now = new Date();
    let hasLockExpired = false;

    if (show.tickets) {
      for (const [seatId, seatData] of Object.entries(show.tickets)) {
        if (
          seatData &&
          seatData.status === 'locked' &&
          seatData.lockExpiresAt &&
          new Date(seatData.lockExpiresAt) <= now
        ) {
          show.tickets[seatId] = {
            ...seatData,
            status: 'available',
            lockedBy: null,
            lockExpiresAt: null,
          };
          hasLockExpired = true;
        }
      }
      if (hasLockExpired) {
        show.markModified('tickets');
        await show.save();
      }
    }

    let movie = null;
    if (show.movieId && show.movieId.match(/^[0-9a-fA-F]{24}$/)) {
      movie = await Movie.findById(show.movieId);
    }

    return res.status(200).json({
      success: true,
      show,
      movie,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create show (Admin)
exports.createShow = async (req, res) => {
  try {
    const {
      adminEmail,
      movieId,
      theatreName,
      theatreId,
      showDate,
      showTime,
      screenType,
      customTickets,
    } = req.body;

    const email = adminEmail || req.user?.email || 'admin@imovies.com';
    if (!movieId || !theatreName || !showDate || !showTime) {
      return res.status(400).json({ success: false, message: 'Missing required show fields: movieId, theatreName, showDate, or showTime.' });
    }

    // Try finding the theatre to generate tickets layout
    let theatre = null;
    if (theatreId) {
      const orConditions = [{ theatreId }];
      if (theatreId.match(/^[0-9a-fA-F]{24}$/)) {
        orConditions.push({ _id: theatreId });
      }
      theatre = await Theatre.findOne({ $or: orConditions });
    }
    if (!theatre && theatreName) {
      theatre = await Theatre.findOne({ theatreName });
    }

    let ticketsMap = customTickets || {};

    if (!customTickets || Object.keys(customTickets).length === 0) {
      // Build default ticket slots based on theatre or standard template
      const balconyPrice = theatre ? theatre.balconySeatPrice : 350;
      const middlePrice = theatre ? theatre.middleSeatPrice : 250;
      const lowerPrice = theatre ? theatre.lowerSeatPrice : 180;

      // Balcony: Rows A-B
      ['A', 'B'].forEach((row) => {
        for (let col = 1; col <= 10; col++) {
          const seatId = `${row}${col}`;
          ticketsMap[seatId] = {
            seatNumber: seatId,
            row,
            col,
            tier: 'balcony',
            price: balconyPrice,
            status: 'available',
            lockedBy: null,
            lockExpiresAt: null,
          };
        }
      });

      // Middle: Rows C-E
      ['C', 'D', 'E'].forEach((row) => {
        for (let col = 1; col <= 10; col++) {
          const seatId = `${row}${col}`;
          ticketsMap[seatId] = {
            seatNumber: seatId,
            row,
            col,
            tier: 'middle',
            price: middlePrice,
            status: 'available',
            lockedBy: null,
            lockExpiresAt: null,
          };
        }
      });

      // Lower: Rows F-G
      ['F', 'G'].forEach((row) => {
        for (let col = 1; col <= 10; col++) {
          const seatId = `${row}${col}`;
          ticketsMap[seatId] = {
            seatNumber: seatId,
            row,
            col,
            tier: 'lower',
            price: lowerPrice,
            status: 'available',
            lockedBy: null,
            lockExpiresAt: null,
          };
        }
      });
    }

    let parsedDate;
    if (typeof showDate === 'string' && showDate.includes('-')) {
      const [y, m, d] = showDate.split('-').map(Number);
      parsedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
    } else {
      parsedDate = new Date(showDate);
    }

    const generatedShowId = 'SHOW-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const newShow = await Show.create({
      adminEmail: email,
      showId: generatedShowId,
      movieId: String(movieId),
      theatreName: theatre ? theatre.theatreName : theatreName,
      theatreId: theatre ? theatre.theatreId : theatreId || '',
      showDate: parsedDate,
      showTime,
      screenType: screenType || (theatre?.facilities?.[0]) || '4K Dolby Atmos',
      tickets: ticketsMap,
    });

    return res.status(201).json({ success: true, message: 'Show created successfully!', show: newShow });
  } catch (error) {
    console.error('Create show error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// 4. Update show
exports.updateShow = async (req, res) => {
  try {
    const { id } = req.params;
    const show = await Show.findByIdAndUpdate(id, req.body, { new: true });

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    return res.status(200).json({ success: true, message: 'Show updated successfully!', show });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// 5. Delete show
exports.deleteShow = async (req, res) => {
  try {
    const { id } = req.params;
    const show = await Show.findByIdAndDelete(id);

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    return res.status(200).json({ success: true, message: 'Show deleted successfully!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
