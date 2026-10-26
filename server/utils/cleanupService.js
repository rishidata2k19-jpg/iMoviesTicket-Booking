const Show = require('../models/showModel');

/**
 * Periodically cleans up expired seat locks across all shows
 * @param {object} io - Socket.io instance
 */
const cleanupExpiredLocks = async (io) => {
  try {
    const now = new Date();
    // Find shows that might have locked seats
    const shows = await Show.find({});

    for (const show of shows) {
      if (!show.tickets) continue;

      let hasChanges = false;
      const releasedSeats = [];

      for (const [seatId, seatData] of Object.entries(show.tickets)) {
        if (
          seatData &&
          seatData.status === 'locked' &&
          seatData.lockExpiresAt &&
          new Date(seatData.lockExpiresAt) <= now
        ) {
          // Release lock
          show.tickets[seatId] = {
            ...seatData,
            status: 'available',
            lockedBy: null,
            lockExpiresAt: null,
          };
          releasedSeats.push(seatId);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        show.markModified('tickets');
        await show.save();

        console.log(
          `[CleanupService] Released ${releasedSeats.length} expired seat(s) for show ${show.showId}: ${releasedSeats.join(', ')}`
        );

        if (io) {
          io.to(show.showId).emit('seat_unlocked', {
            showId: show.showId,
            seats: releasedSeats,
          });
        }
      }
    }
  } catch (err) {
    console.error('[CleanupService Error]:', err.message);
  }
};

const startCleanupJob = (io, intervalMs = 15000) => {
  console.log(`[CleanupService] Seat lock auto-release service started (every ${intervalMs / 1000}s)`);
  setInterval(() => cleanupExpiredLocks(io), intervalMs);
};

module.exports = {
  cleanupExpiredLocks,
  startCleanupJob,
};
