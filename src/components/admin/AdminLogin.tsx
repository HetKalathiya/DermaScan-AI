import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit, ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Redirect if already logged in as admin
  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try {
        const user = JSON.parse(stored);
        if (user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Failed to parse user data from localStorage', err);
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Login failed.'); return; }
      if (data.user?.role !== 'admin') {
        setError('Access denied. This login is for administrators only.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/admin/dashboard', { replace: true });
    } catch {
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const GridBg = () => (
    <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
      style={{ backgroundImage: 'linear-gradient(rgba(0,229,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.3) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
  );

  return (
    <div className="min-h-screen bg-[#060f1a] flex items-center justify-center relative overflow-hidden">
      <GridBg />
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#00E5FF]/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400 blur-[20px] opacity-25 rounded-full" />
              <div className="relative w-16 h-16 rounded-2xl bg-[#0a1622] border border-amber-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.15)]">
                <BrainCircuit className="w-8 h-8 text-amber-400" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400 text-sm">Sign in to manage DermaScan AI</p>
          <div className="flex items-center justify-center gap-1.5 mt-3 bg-amber-400/10 border border-amber-400/20 px-4 py-1.5 rounded-full w-fit mx-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Authorized Personnel Only</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-[#0a1622]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@dermascan.ai"
                  className="w-full pl-10 pr-4 py-3 bg-[#060f1a] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/50 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.1)] transition-all text-sm" />
              </div>
            </div>
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-[#060f1a] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/50 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.1)] transition-all text-sm" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold rounded-xl hover:from-amber-300 hover:to-orange-400 transition-all shadow-[0_0_20px_rgba(251,191,36,0.25)] disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</> : <><ShieldCheck className="w-4 h-4" /> Sign In to Admin Panel</>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          First time?{' '}
          <button onClick={() => navigate('/admin/setup')} className="text-amber-400 hover:underline">
            Create admin account
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
