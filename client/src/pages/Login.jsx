import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, Lock, Mail, ShieldAlert, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const Login = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRemoteDeploymentMissingApi = !import.meta.env.VITE_API_URL && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || (isAdminMode ? '/admin' : '/home');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRemoteDeploymentMissingApi) {
      toast.error('Backend URL not configured! Please add VITE_API_URL in your Vercel/hosting environment variables and redeploy.');
      return;
    }

    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(email, password, isAdminMode);
      if (res.success) {
        toast.success(`Welcome back, ${res.user.username}!`);
        navigate(from, { replace: true });
      } else {
        toast.error(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      if (!err.response) {
        toast.error('Unable to connect to backend server. Please verify your backend is running and VITE_API_URL is configured in your deployment settings.');
      } else if (err.response.status === 404) {
        toast.error('API endpoint not found (404). Please ensure VITE_API_URL points to your deployed backend API URL.');
      } else if (err.response.status === 503) {
        toast.error(err.response.data?.message || 'Database service is currently unavailable. Please check MONGO_URI in backend environment.');
      } else {
        toast.error(err.response.data?.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoUser = () => {
    setIsAdminMode(false);
    setEmail('user@imovies.com');
    setPassword('user123');
    toast.info('Filled Demo User credentials');
  };

  const fillDemoAdmin = () => {
    setIsAdminMode(true);
    setEmail('admin@imovies.com');
    setPassword('admin123');
    toast.info('Filled Demo Admin credentials');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow accent */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 ${isAdminMode ? 'bg-amber-500' : 'bg-red-600'}`} />

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-xl bg-red-600/10 text-red-500 mb-1">
            <Film className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isAdminMode ? 'Admin Portal Sign In' : 'Sign in to iMovies'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAdminMode
              ? 'Access theatre moderation, revenue statistics & show schedule'
              : 'Enter your credentials to book tickets and view your watchlist'}
          </p>
        </div>

        {isRemoteDeploymentMissingApi && (
          <div className="p-3.5 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">Backend API Not Connected</p>
              <p className="text-slate-300 leading-relaxed">
                Your frontend is deployed on Vercel, but <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">VITE_API_URL</code> has not been added to your Vercel Environment Variables.
              </p>
              <p className="text-slate-400">
                Go to <b>Vercel Settings ➔ Environment Variables</b>, add <code className="text-white">VITE_API_URL = https://your-backend.onrender.com</code>, and click <b>Redeploy</b>.
              </p>
            </div>
          </div>
        )}

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsAdminMode(false)}
            className={`py-2 rounded-lg transition-all ${
              !isAdminMode ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Moviegoer
          </button>
          <button
            type="button"
            onClick={() => setIsAdminMode(true)}
            className={`py-2 rounded-lg flex items-center justify-center space-x-1 transition-all ${
              isAdminMode ? 'bg-amber-500 text-slate-950 shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Administrator</span>
          </button>
        </div>

        {/* Demo Fast Fill Buttons */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>One-Click Demo Credentials:</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillDemoUser}
              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Demo User
            </button>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/20 transition-colors"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
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
            className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${
              isAdminMode
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
            } disabled:opacity-50`}
          >
            <span>{submitting ? 'Authenticating...' : isAdminMode ? 'Sign In as Administrator' : 'Sign In to iMovies'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-red-400 hover:text-red-300 transition-colors">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
