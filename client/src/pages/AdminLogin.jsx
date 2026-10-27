import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, Mail, ArrowRight, Sparkles, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both admin email and password.');
      return;
    }

    setSubmitting(true);
    try {
      // Admin authentication (isAdmin = true)
      const res = await login(email, password, true);
      if (res.success) {
        toast.success(`Welcome to Admin Hub, ${res.user.username}!`);
        navigate(from, { replace: true });
      } else {
        toast.error(res.message || 'Invalid administrator credentials.');
      }
    } catch (err) {
      if (!err.response) {
        toast.error('Unable to connect to backend server. Please verify backend is running.');
      } else if (err.response.status === 404) {
        toast.error('API endpoint not found (404). Please ensure backend is reachable.');
      } else if (err.response.status === 503) {
        toast.error(err.response.data?.message || 'Database service is currently unavailable.');
      } else {
        toast.error(err.response.data?.message || 'Admin authentication failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@imovies.com');
    setPassword('admin123');
    toast.info('Filled Demo Admin credentials');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-xl transition-colors">
        {/* Amber glow accent for admin portal */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 dark:opacity-30 bg-amber-500" />

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-1 border border-amber-200 dark:border-amber-500/20 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Administrator Portal</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Restricted access for cinema managers, box office moderators, and platform administrators.
          </p>
        </div>

        {/* Demo Fast Fill Button */}
        <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-slate-950/80 border border-amber-200 dark:border-slate-800/80 mb-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Pre-seeded administrator:</span>
          </div>
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="py-1 px-3 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 text-xs font-semibold border border-amber-300 dark:border-amber-500/30 transition-colors"
          >
            Fill Demo Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Official Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@imovies.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Master Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-bold text-sm text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-md shadow-amber-400/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{submitting ? 'Verifying Admin Access...' : 'Sign In as Administrator'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-center">
          <Link
            to="/login"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Regular User Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
