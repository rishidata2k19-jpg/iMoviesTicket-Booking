import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, ArrowLeft, Building2 } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AddTheatre = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    theatreName: '',
    theatreId: '',
    location: '',
    balconySeatPrice: 350,
    middleSeatPrice: 250,
    lowerSeatPrice: 180,
    facilities: 'Dolby Atmos, 4K Laser, Recliner Seats, Parking',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.theatreName || !formData.location) {
      toast.error('Theatre name and location are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        facilities: formData.facilities.split(',').map((f) => f.trim()),
      };
      const res = await api.post('/theatre', payload);
      if (res.data.success) {
        toast.success(`"${formData.theatreName}" added successfully!`);
        navigate('/admin');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add theatre.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="mb-6 flex items-center space-x-4 pb-4 border-b border-slate-800">
        <Link
          to="/admin"
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Cinema Venues</span>
          <h1 className="text-2xl font-black text-white">Register Theatre & Configure Seat Tiers</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Theatre Name *</label>
            <input
              type="text"
              name="theatreName"
              required
              value={formData.theatreName}
              onChange={handleChange}
              placeholder="e.g. Cineplex IMAX Screen 1"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Theatre ID (Optional)</label>
              <input
                type="text"
                name="theatreId"
                value={formData.theatreId}
                onChange={handleChange}
                placeholder="Auto-generated if empty (e.g. THTR-01)"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Location / City *</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="Downtown Mall, 4th Floor"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Seat Tier Pricing Configuration */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Tier Seat Pricing ($):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 mb-1">Balcony VIP ($)</label>
                <input
                  type="number"
                  name="balconySeatPrice"
                  required
                  min={1}
                  value={formData.balconySeatPrice}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-cyan-400 mb-1">Middle Premium ($)</label>
                <input
                  type="number"
                  name="middleSeatPrice"
                  required
                  min={1}
                  value={formData.middleSeatPrice}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-400 mb-1">Lower Standard ($)</label>
                <input
                  type="number"
                  name="lowerSeatPrice"
                  required
                  min={1}
                  value={formData.lowerSeatPrice}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Facilities & Amenities (comma separated)
            </label>
            <input
              type="text"
              name="facilities"
              value={formData.facilities}
              onChange={handleChange}
              placeholder="Dolby Atmos, 4K Laser, Food Court, Parking"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/30 transition-all disabled:opacity-50"
          >
            {submitting ? 'Registering...' : 'Register Theatre'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTheatre;
