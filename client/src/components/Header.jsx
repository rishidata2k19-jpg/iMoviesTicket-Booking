import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Film, 
  Ticket, 
  Heart, 
  ShieldAlert, 
  User, 
  LogOut, 
  Menu, 
  X,
  Compass,
  Sun,
  Moon
} from 'lucide-react';

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#080c14]/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-none transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? "/home" : "/landing"} className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-md shadow-red-500/25 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                i<span className="text-red-600">Movies</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold -mt-1">
                Tickets Made Simple
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5">
            <Link
              to="/home"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/home')
                  ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-600/10 dark:text-red-500 dark:border-red-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore Movies</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/favoriteshows"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    isActive('/favoriteshows')
                      ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-600/10 dark:text-red-500 dark:border-red-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>Watchlist</span>
                </Link>

                <Link
                  to="/bookings"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    isActive('/bookings')
                      ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-600/10 dark:text-red-500 dark:border-red-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>My Tickets</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <div className="relative group pl-1">
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    location.pathname.startsWith('/admin') ||
                    ['/addmovie', '/addtheatre', '/addshow', '/addadmin', '/adminbookings'].includes(location.pathname)
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                      : 'text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Admin Hub</span>
                </Link>
              </div>
            )}
          </nav>

          {/* User Profile / Theme Toggle / Auth Action */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle light/dark theme"
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400 transition-transform rotate-0 hover:rotate-90" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600 transition-transform rotate-0 hover:-rotate-12" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2.5">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/60 text-sm text-slate-800 dark:text-slate-200 transition-colors shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-red-600/15 text-red-600 dark:bg-red-600/20 dark:text-red-400 flex items-center justify-center font-bold text-xs">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="font-medium max-w-[120px] truncate">{user?.username}</span>
                  {isAdmin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 font-bold uppercase">
                      Admin
                    </span>
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20 transition-all hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 pt-2 pb-6 space-y-2 shadow-lg">
          <Link
            to="/home"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Explore Movies
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/favoriteshows"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Watchlist
              </Link>
              <Link
                to="/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                My Tickets
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Profile ({user?.username})
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800"
                >
                  Admin Management
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-white bg-red-600 rounded-lg font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
