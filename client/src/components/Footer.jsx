import React from 'react';
import { Film, ShieldCheck, Zap, Award, Mail, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#05080e] border-t border-slate-800/80 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10 border-b border-slate-800/60 mb-10">
          <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/50">
            <div className="w-12 h-12 rounded-lg bg-red-600/10 text-red-500 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Instant Real-Time Booking</h4>
              <p className="text-xs text-slate-400 mt-0.5">Live seat locking with instant digital QR tickets</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/50">
            <div className="w-12 h-12 rounded-lg bg-emerald-600/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">100% Secure Checkout</h4>
              <p className="text-xs text-slate-400 mt-0.5">Encrypted payment gateways and automated refunds</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/50">
            <div className="w-12 h-12 rounded-lg bg-amber-600/10 text-amber-500 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">VIP Cinema Network</h4>
              <p className="text-xs text-slate-400 mt-0.5">IMAX with Laser, Dolby Atmos & Luxury Recliners</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">iMovies</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Movie ticket booking made simple. Discover blockbuster premieres, explore interactive seat maps, and book in seconds.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Quick Navigation</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/home" className="hover:text-red-400 transition-colors">Now Showing</Link></li>
              <li><Link to="/favoriteshows" className="hover:text-red-400 transition-colors">Saved Watchlist</Link></li>
              <li><Link to="/bookings" className="hover:text-red-400 transition-colors">My Digital Tickets</Link></li>
              <li><Link to="/profile" className="hover:text-red-400 transition-colors">Account Dashboard</Link></li>
              <li><Link to="/admin-login" className="hover:text-amber-400 transition-colors flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>Admin Portal</span></Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Genres</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><span className="hover:text-red-400 cursor-pointer">Action & Adventure</span></li>
              <li><span className="hover:text-red-400 cursor-pointer">Sci-Fi & Fantasy</span></li>
              <li><span className="hover:text-red-400 cursor-pointer">Drama & History</span></li>
              <li><span className="hover:text-red-400 cursor-pointer">Animation 3D</span></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Cinema Experience</h5>
            <p className="text-xs text-slate-400 mb-3">
              Automated reminders powered by Node-Cron. Email confirmations delivered straight to your inbox.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Mail className="w-3.5 h-3.5 text-red-400" />
              <span>support@imovies.com</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} iMovies Inc. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for cinema lovers everywhere</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
