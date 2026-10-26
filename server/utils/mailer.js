const nodemailer = require('nodemailer');

let transporter = null;

// Initialize transporter
const initMailer = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback using Ethereal test account or simulated mailer
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Mailer] Ethereal mailer initialized: ${testAccount.user}`);
    } catch (err) {
      console.warn('[Mailer] Could not create Ethereal account, falling back to simulated mailer.');
      transporter = {
        sendMail: async (options) => {
          console.log(`[Simulated Mailer] Sent to: ${options.to} | Subject: "${options.subject}"`);
          return { messageId: 'simulated-' + Date.now() };
        },
      };
    }
  }

  return transporter;
};

// Send booking confirmation email with styled HTML ticket
const sendBookingConfirmation = async (toEmail, booking) => {
  try {
    const mail = await initMailer();
    const movieName = booking.showDetails?.movieName || 'Movie';
    const theatre = booking.showDetails?.theatreName || 'iMovies Cinema';
    const seats = booking.selectedSeats ? booking.selectedSeats.join(', ') : 'Seats';
    const showTime = booking.showDetails?.showTime || 'N/A';
    const showDate = booking.showDetails?.showDate
      ? new Date(booking.showDetails.showDate).toLocaleDateString()
      : 'Today';

    const mailOptions = {
      from: '"iMovies Cinemas" <tickets@imovies.com>',
      to: toEmail,
      subject: `🍿 Booking Confirmed! [Ticket #${booking.bookingId}] - ${movieName}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #334155;">
          <div style="text-align: center; border-bottom: 2px solid #e50914; padding-bottom: 16px; margin-bottom: 20px;">
            <h1 style="color: #e50914; margin: 0; font-size: 28px; letter-spacing: 1px;">iMovies</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 14px;">Movie ticket booking made simple</p>
          </div>
          
          <h2 style="color: #38bdf8; margin-top: 0;">🎉 You're all set for the movies!</h2>
          <p>Thank you for booking with iMovies. Here are your digital ticket details:</p>
          
          <div style="background-color: #1e293b; padding: 18px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e50914;">
            <p style="margin: 6px 0;"><strong>🎬 Movie:</strong> ${movieName}</p>
            <p style="margin: 6px 0;"><strong>🏢 Theatre:</strong> ${theatre}</p>
            <p style="margin: 6px 0;"><strong>📅 Date & Time:</strong> ${showDate} at ${showTime}</p>
            <p style="margin: 6px 0;"><strong>🎟️ Seats:</strong> <span style="color: #4ade80; font-weight: bold;">${seats}</span></p>
            <p style="margin: 6px 0;"><strong>💳 Total Paid:</strong> $${booking.totalAmount}</p>
            <p style="margin: 6px 0;"><strong>🔖 Booking ID:</strong> <code style="background: #0f172a; padding: 2px 6px; border-radius: 4px;">${booking.bookingId}</code></p>
          </div>

          <p style="color: #cbd5e1; font-size: 14px;">
            Please present this booking confirmation or the QR code in your iMovies account upon entry.
          </p>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; font-size: 12px; color: #64748b;">
            <p>© ${new Date().getFullYear()} iMovies Inc. Enjoy your show!</p>
          </div>
        </div>
      `,
    };

    const info = await mail.sendMail(mailOptions);
    if (nodemailer.getTestMessageUrl && info && info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`[Mailer] Booking confirmation preview: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error('[Mailer Error] Failed to send booking confirmation:', error.message);
  }
};

// Send show reminder email
const sendShowReminder = async (toEmail, booking) => {
  try {
    const mail = await initMailer();
    const movieName = booking.showDetails?.movieName || 'your movie';
    const showTime = booking.showDetails?.showTime || 'soon';

    const mailOptions = {
      from: '"iMovies Reminders" <reminders@imovies.com>',
      to: toEmail,
      subject: `⏰ Reminder: Your show for "${movieName}" starts soon!`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">🎬 Showtime Reminder!</h2>
          <p>Hi movie lover! Your booked show for <strong>${movieName}</strong> is scheduled for <strong>${showTime}</strong>.</p>
          <p>Seats: <strong>${booking.selectedSeats?.join(', ')}</strong> at <strong>${booking.showDetails?.theatreName}</strong>.</p>
          <p>Grab your popcorn and arrive at least 15 minutes before showtime!</p>
        </div>
      `,
    };

    const info = await mail.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('[Mailer Error] Failed to send show reminder:', error.message);
  }
};

module.exports = {
  sendBookingConfirmation,
  sendShowReminder,
};
