import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit, ShieldCheck, User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const AdminSetup: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [checking, setChecking]     = useState(true);
  const [alreadySetup, setAlreadySetup] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);

  // Check if admin already exists
  useEffect(() => {
    fetch('http://localhost:5000/api/admin/setup/status')
      .then(r => r.json())
      .then(d => {
        if (d.adminExists) setAlreadySetup(true);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Setup failed.'); return; }
      setSuccess(true);
      setTimeout(() => navigate('/admin/login'), 2500);
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

  if (checking) {
    return (
      <div className="min-h-screen bg-[#060f1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00E5FF] animate-spin" />
      </div>
    );
  }

  if (alreadySetup) {
    return (
      <div className="min-h-screen bg-[#060f1a] flex items-center justify-center relative overflow-hidden">
        <GridBg />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center max-w-md px-6">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Setup Already Complete</h1>
          <p className="text-gray-400 mb-8">An admin account already exists. You can log in to the admin panel.</p>
          <button onClick={() => navigate('/admin/login')} className="px-8 py-3 bg-[#00E5FF] text-black font-bold rounded-xl hover:bg-cyan-300 transition-colors shadow-[0_0_20px_rgba(0,229,255,0.3)]">
            Go to Admin Login
          </button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#060f1a] flex items-center justify-center relative overflow-hidden">
        <GridBg />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center max-w-md px-6">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}
            className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-3">Admin Account Created!</h1>
          <p className="text-gray-400">Redirecting you to the login page...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060f1a] flex items-center justify-center relative overflow-hidden">
      <GridBg />
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400 blur-[16px] opacity-30 rounded-full" />
              <div className="relative w-16 h-16 rounded-2xl bg-[#0a1622] border border-amber-400/30 flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 text-amber-400" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Setup</h1>
          <p className="text-gray-400 text-sm">Create your DermaScan AI admin account.<br />This can only be done once.</p>
          <div className="flex items-center justify-center gap-1.5 mt-3 bg-amber-400/10 border border-amber-400/20 px-4 py-1.5 rounded-full w-fit mx-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">One-Time Setup</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-[#0a1622]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Admin Name"
                  className="w-full pl-10 pr-4 py-3 bg-[#060f1a] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/50 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.1)] transition-all text-sm" />
              </div>
            </div>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Email Address</label>
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
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-12 py-3 bg-[#060f1a] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/50 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.1)] transition-all text-sm" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold rounded-xl hover:from-amber-300 hover:to-orange-400 transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Admin...</> : <><ShieldCheck className="w-4 h-4" /> Create Admin Account</>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Already set up? <button onClick={() => navigate('/admin/login')} className="text-amber-400 hover:underline">Go to Login</button>
        </p>
      </motion.div>
    </div>
  );
};

export default AdminSetup;
