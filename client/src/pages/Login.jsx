import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, Lock, Mail, ArrowRight, Sparkles, Shield } from 'lucide-react';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/home';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      // Regular user login (isAdmin = false)
      const res = await login(email, password, false);
      if (res.success) {
        toast.success(`Welcome back, ${res.user.username}!`);
        navigate(from, { replace: true });
      } else {
        toast.error(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      if (!err.response) {
        toast.error('Unable to connect to backend server. Please verify your connection.');
      } else if (err.response.status === 404) {
        toast.error('API endpoint not found (404). Please ensure backend is running.');
      } else if (err.response.status === 503) {
        toast.error(err.response.data?.message || 'Database service is currently unavailable.');
      } else {
        toast.error(err.response.data?.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoUser = () => {
    setEmail('user@imovies.com');
    setPassword('user123');
    toast.info('Filled Demo User credentials');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 bg-red-600" />

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-xl bg-red-600/10 text-red-500 mb-1">
            <Film className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Sign in to iMovies</h2>
          <p className="text-xs text-slate-400">
            Enter your credentials to book tickets, reserve seats, and manage your watchlist
          </p>
        </div>

        {/* Quick Demo Credentials */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Try demo account:</span>
          </div>
          <button
            type="button"
            onClick={fillDemoUser}
            className="py-1 px-3 rounded-lg bg-red-600/15 hover:bg-red-600/25 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/30 transition-colors"
          >
            Fill Demo User
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email or Username</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@imovies.com or username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{submitting ? 'Authenticating...' : 'Sign In to iMovies'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 space-y-3">
          <div>
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-red-400 hover:text-red-300 transition-colors">
              Create a free account
            </Link>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center">
            <Link
              to="/admin-login"
              className="inline-flex items-center space-x-1.5 text-[11px] text-slate-500 hover:text-amber-400 transition-colors"
            >
              <Shield className="w-3 h-3 text-slate-500" />
              <span>Cinema Staff / Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
