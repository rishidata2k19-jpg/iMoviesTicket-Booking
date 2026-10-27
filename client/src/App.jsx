import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Loader from './components/Loader';
import ErrorBoundary from './components/ErrorBoundary';
import UserProtection from './components/UserProtection';
import AdminProtection from './components/AdminProtection';

// Lazy Loaded Pages (Code Splitting)
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const MovieDetails = lazy(() => import('./pages/MovieDetails'));
const MovieShows = lazy(() => import('./pages/MovieShows'));
const SeatMap = lazy(() => import('./pages/SeatMap'));
const Bookings = lazy(() => import('./pages/Bookings'));
const FavoriteShows = lazy(() => import('./pages/FavoriteShows'));
const Profile = lazy(() => import('./pages/Profile'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AddMovie = lazy(() => import('./pages/AddMovie'));
const AddTheatre = lazy(() => import('./pages/AddTheatre'));
const AddShow = lazy(() => import('./pages/AddShow'));
const AddAdmin = lazy(() => import('./pages/AddAdmin'));
const AdminBookings = lazy(() => import('./pages/AdminBookings'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100">
          <Header />
          <main className="flex-1">
            <ErrorBoundary>
              <Suspense fallback={<Loader message="Curating cinema experience..." />}>
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/landing" replace />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/register" element={<Register />} />

                {/* User Protected Routes */}
                <Route
                  path="/home"
                  element={
                    <UserProtection>
                      <Home />
                    </UserProtection>
                  }
                />
                <Route
                  path="/moviedetails/:movieId"
                  element={
                    <UserProtection>
                      <MovieDetails />
                    </UserProtection>
                  }
                />
                <Route
                  path="/movieshows/:movieId"
                  element={
                    <UserProtection>
                      <MovieShows />
                    </UserProtection>
                  }
                />
                <Route
                  path="/seatslug/:showId"
                  element={
                    <UserProtection>
                      <SeatMap />
                    </UserProtection>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <UserProtection>
                      <Bookings />
                    </UserProtection>
                  }
                />
                <Route
                  path="/favoriteshows"
                  element={
                    <UserProtection>
                      <FavoriteShows />
                    </UserProtection>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <UserProtection>
                      <Profile />
                    </UserProtection>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminProtection>
                      <AdminDashboard />
                    </AdminProtection>
                  }
                />
                <Route
                  path="/addmovie"
                  element={
                    <AdminProtection>
                      <AddMovie />
                    </AdminProtection>
                  }
                />
                <Route
                  path="/addtheatre"
                  element={
                    <AdminProtection>
                      <AddTheatre />
                    </AdminProtection>
                  }
                />
                <Route
                  path="/addshow"
                  element={
                    <AdminProtection>
                      <AddShow />
                    </AdminProtection>
                  }
                />
                <Route
                  path="/addadmin"
                  element={
                    <AdminProtection>
                      <AddAdmin />
                    </AdminProtection>
                  }
                />
                <Route
                  path="/adminbookings"
                  element={
                    <AdminProtection>
                      <AdminBookings />
                    </AdminProtection>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/landing" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
          <Footer />

          {/* Toast feedback system */}
          <ToastContainer
            position="bottom-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
