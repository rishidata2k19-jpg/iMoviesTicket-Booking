const cron = require('node-cron');
const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const { sendShowReminder } = require('./mailer');

/**
 * Initializes cron jobs for automated reminders and notifications
 */
const startReminderJob = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[ReminderService] Running hourly show reminder check...');
    try {
      const now = new Date();
      // Look for bookings created in the last 24 hours that haven't been reminded
      const upcomingBookings = await Booking.find({
        paymentStatus: 'Completed',
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      }).limit(50);

      for (const booking of upcomingBookings) {
        if (booking.userEmail) {
          await sendShowReminder(booking.userEmail, booking);
        }
      }
    } catch (err) {
      console.error('[ReminderService Error]:', err.message);
    }
  });

  console.log('[ReminderService] Node-cron reminder service registered.');
};

module.exports = {
  startReminderJob,
};
