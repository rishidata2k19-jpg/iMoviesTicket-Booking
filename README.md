# 🍿 iMovies - Movie Ticket Booking Platform

> *Movie ticket booking made simple.*

iMovies is a full-stack, responsive, production-ready Movie Ticket Booking Web Application engineered following the **Model-View-Controller (MVC)** architectural pattern. It features real-time temporary seat locking with automatic TTL expiry, live WebSocket availability synchronization, interactive SVG/CSS cinema seat maps with tiered pricing, digital QR tickets, automated reminders via `node-cron`, and full administrative moderation capabilities.

---

## 🌟 Key Highlights & Architectural Features

- **Razorpay Test-Mode Payment Gateway (5-Step Flow)**:
  - Secure integration using the official `razorpay` Node.js SDK and Razorpay Checkout (`checkout.js`).
  - Cryptographic server-side HMAC SHA-256 signature verification (`crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)`).
  - Multi-channel payment support: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, MasterCard, RuPay), NetBanking (50+ banks), and Wallets.
  - Test mode credentials pre-configured (`RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`).
- **Admin Transactions & Refund Management Panel**:
  - Live ledger displaying all customer bookings and Razorpay transactions (`GET /api/admin/transactions`).
  - Color-coded badges for `Completed` (green), `Refunded` (rose), `Cancelled` (red), and `Pending` (amber).
  - Interactive **"Issue Refund"** control (`POST /api/admin/refund/:paymentId`): initiates Razorpay refund via SDK (`razorpay.payments.refund()`), updates booking status to `Refunded`, and instantly releases booked seats back into the public seating pool with real-time WebSocket broadcast!
- **Real-Time Market Movies via TMDB API**:
  - Replaced hardcoded/static mock movie lists with live data dynamically retrieved from **The Movie Database (TMDB) API** (`https://api.themoviedb.org/3`).
  - Supports live `/movie/now_playing`, `/movie/popular`, and `/search/movie` endpoints.
  - Automatic synchronization and upserting into MongoDB with high-resolution poster artwork (`w500`), backdrops (`original`), duration, genres, directors, cast, and YouTube trailers.
  - Automatic showtime generation: whenever users select any live TMDB release, auditoriums and scheduled slots are generated across theatres for immediate real-time seat locking and booking.
- **Real-Time Seat Locking Mechanism (TTL)**:
  - When users select seats on `/seatslug/:showId`, seats are locked for 5 minutes (`300,000 ms`).
  - Automatic seat release via `cleanupService.js` if the session expires or if the user cancels.
  - Live availability sync across all connected clients via **Socket.io**.
- **Interactive Tiered Cinema Seat Map**:
  - Distinct tiers: **Balcony VIP**, **Middle Premium**, and **Lower Standard** rows.
  - Visual states: *Available*, *Selected* (cyan glow), *Locked by another user* (amber TTL warning), and *Sold/Booked* (darkened disabled).
  - Curved screen visual effect (*"All Eyes This Way"*).
- **Contactless Digital QR Ticket & PDF Printing**:
  - Confirmed bookings generate digital passes with verifiable QR codes, transaction IDs, cinema audit info, and printable stub views.
- **Automated Background Reminders**:
  - `node-cron` scheduled jobs scan upcoming showtimes and dispatch automated reminder emails through `mailer.js`.
- **Role-Based Access Control**:
  - JWT token-based authentication (`fetchUser.js`) with password hashing (`bcryptjs`).
  - Dedicated administrative dashboard with gross revenue analytics, booking counts, user moderation, and management of movies, theatres, and show schedules.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM (v6 Code Splitting / Lazy Loading), Tailwind CSS, Lucide Icons, React-Toastify, Axios, Dayjs, QRCode.react, Canvas-Confetti |
| **Backend** | Node.js, Express.js REST API server, Socket.io, JSON Web Tokens (JWT), Bcrypt.js, Node-cron, Nodemailer |
| **Database** | MongoDB (Mongoose ODM) with schemas for Users, Admins, Movies, Theatres, Shows, Bookings, Favorites, and Reviews (with seamless embedded MongoMemoryServer fallback) |

---

## 📂 Project Directory Structure

### Environment Configuration (.env)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/imovies_db
JWT_SECRET=imovies_super_secret_jwt_key_2026
NODE_ENV=development
TMDB_API_KEY=c5cc193b6902f41d06168e18398fba37
RAZORPAY_KEY_ID=rzp_test_TqTzbIAfhLKF63
RAZORPAY_KEY_SECRET=3p2BtSgWg8TBkaaliP31y2nm
```

```text
iMovies/
├── client/                     # Frontend (Vite + React)
│   ├── src/
│   │   ├── components/         # Header, Footer, Loader, UserProtection, AdminProtection
│   │   ├── context/            # AuthContext.jsx (JWT session state & role management)
│   │   ├── hooks/              # Custom Hooks (useFetch.js)
│   │   ├── pages/              # Landing, Login, Register, Home, MovieDetails, MovieShows,
│   │   │                       # SeatMap, Bookings, FavoriteShows, Profile,
│   │   │                       # AdminDashboard, AddMovie, AddTheatre, AddShow, AddAdmin, AdminBookings
│   │   ├── utils/              # api.js (Axios instance with auto-auth interceptors)
│   │   ├── App.jsx             # React Router config with Suspense & Lazy loading
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Tailwind cinema styles & screen curve effects
│   ├── tailwind.config.js
│   ├── vite.config.js          # API proxy (/api & /socket.io -> port 5000)
│   └── package.json
└── server/                     # Backend (Node + Express)
    ├── controllers/            # Logic handlers for Auth, Movies, Theatres, Shows, Bookings, Favorites, Reviews
    ├── middlewares/            # fetchUser.js (JWT validation & role verification)
    ├── models/                 # Mongoose ODM schemas (User, Admin, Movie, Theatre, Show, Booking, Favorite, Review)
    ├── routes/                 # Express REST API routes mounted under /api
    ├── utils/                  # reminderService.js, cleanupService.js, mailer.js, seedData.js
    ├── server.js               # Express entry point, Socket.io & MongoDB connection
    └── .env                    # MONGO_URI, PORT, JWT_SECRET
```

---

## 🔑 Pre-Seeded Demo Credentials

The platform automatically boots with realistic mock data, theatres, movies, reviews, and credentials:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Moviegoer** | `user@imovies.com` | `user123` | Browse shows, lock seats, book tickets, submit reviews, manage watchlist |
| **Administrator** | `admin@imovies.com` | `admin123` | Platform revenue stats, moderate bookings, add movies/theatres/shows/admins |

*(Quick-fill 1-click buttons are also built directly into the Login page for seamless evaluation!)*

---

## 🚀 Running the Application

### 1. Start the Backend Server
```bash
cd server
node server.js
```
The server will start on `http://localhost:5000` with WebSocket support and in-memory MongoDB initialized.

### 2. Start the Frontend Client
```bash
cd client
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 📡 Backend API Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - User authentication
- `POST /api/auth/admin/register` - Register administrator
- `POST /api/auth/admin/login` - Administrator authentication
- `GET /api/auth/me` - Validate session and get current profile
- `GET /api/auth/admin/stats` - Box office revenue, booking counts, platform metrics
- `GET /api/auth/admin/users` - List all registered user accounts
- `DELETE /api/auth/admin/users/:id` - Delete user account

### 🎬 Movies (`/api/movie`)
- `GET /api/movie` - Retrieve movies with search, genre, and language filtering
- `GET /api/movie/:id` - Retrieve movie synopsis, cast, and audience reviews
- `POST /api/movie` - Create movie listing *(Admin)*
- `PUT /api/movie/:id` - Update movie *(Admin)*
- `DELETE /api/movie/:id` - Delete movie *(Admin)*

### 🏢 Theatres (`/api/theatre`)
- `GET /api/theatre` - Get list of theatres
- `POST /api/theatre` - Register theatre and configure Balcony, Middle, Lower pricing *(Admin)*

### 🕒 Shows (`/api/shows`)
- `GET /api/shows` - Get showtimes filtered by movie ID, date, or theatre
- `GET /api/shows/:id` - Get single show with real-time seat availability map
- `POST /api/shows` - Schedule showtime linking movie and theatre *(Admin)*

### 🎟️ Bookings & Real-Time Locks (`/api/bookings`)
- `POST /api/bookings/lock-seats` - Temporarily lock seats with 5-minute TTL
- `POST /api/bookings/unlock-seats` - Release locked seats
- `POST /api/bookings/confirm` - Finalize booking, mock payment, and issue QR ticket
- `GET /api/bookings/my-bookings` - Fetch user's ticket wallet
- `POST /api/bookings/:id/cancel` - Cancel reservation and release seats
- `GET /api/bookings/admin/all` - Administrative overview of all platform bookings

### ❤️ Watchlist & Reviews (`/api/favorite` & `/api/review`)
- `GET /api/favorite` - Fetch user's saved movies
- `POST /api/favorite` - Add / remove movie from watchlist
- `GET /api/review/:movieId` - Get reviews and ratings for a movie
- `POST /api/review` - Post or update audience rating and review
