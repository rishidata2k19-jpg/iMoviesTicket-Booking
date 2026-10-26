import React from 'react';
import { Film } from 'lucide-react';

const Loader = ({ message = 'Loading cinema experience...' }) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        {/* Animated outer glowing ring */}
        <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Film className="w-6 h-6 text-red-500 animate-pulse" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-400 tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default Loader;
