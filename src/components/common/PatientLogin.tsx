import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff,
    BrainCircuit, Sparkles, Activity, ScanLine, FileHeart, CalendarCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

const PatientLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            // @ts-ignore
            const response = await import('../../services/api').then(module =>
                module.default.post('/auth/login/patient', {
                    email: formData.email,
                    password: formData.password,
                })
            );

            if (response.data?.requires_2fa) {
                navigate('/verify-otp', {
                    state: {
                        email: response.data.email || formData.email,
                        masked_email: response.data.masked_email,
                        role: 'patient',
                        purpose: '2fa',
                    }
                });
                return;
            }

            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            navigate('/dashboard');
        } catch (err: any) {
            if (err.response?.data?.requires_2fa) {
                navigate('/verify-otp', {
                    state: {
                        email: err.response.data.email || formData.email,
                        masked_email: err.response.data.masked_email,
                        role: 'patient',
                        purpose: '2fa',
                    }
                });
                return;
            }
            if (err.response?.data?.requires_verification) {
                const { email: unverifiedEmail, masked_email, role: userRole } = err.response.data;
                navigate('/verify-otp', {
                    state: {
                        email: unverifiedEmail || formData.email,
                        masked_email,
                        role: userRole || 'patient',
                        purpose: 'registration',
                    }
                });
                return;
            }
            setError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please try again.');
            setIsLoading(false);
        }
    };

    const features = [
        { icon: ScanLine, label: 'AI Skin Analysis', desc: 'Instant, accurate dermatology scans' },
        { icon: FileHeart, label: 'Medical Reports', desc: 'Access all your health records' },
        { icon: CalendarCheck, label: 'Appointments', desc: 'Book & manage consultations' },
    ];

    return (
        <div className="min-h-screen bg-[#061B2E] flex items-center justify-center relative overflow-hidden text-white selection:bg-[#00E5FF]/30 w-full">

            {/* Background elements */}
            <div className="absolute inset-0 z-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at center, #00E5FF 2px, transparent 2px)`, backgroundSize: '30px 30px' }} />
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-[#00E5FF]/5 rounded-full blur-[150px] mix-blend-screen pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-[#1A73E8]/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row h-full lg:h-[88vh] lg:max-h-[820px] rounded-3xl overflow-hidden relative z-10 p-4 lg:p-0">

                {/* LEFT: Patient branding panel */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hidden lg:flex w-full lg:w-1/2 flex-col justify-between relative overflow-hidden p-12 bg-gradient-to-br from-[#00E5FF]/8 to-[#1A73E8]/8 border-r border-white/5 rounded-l-3xl"
                >
                    {/* Animated grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_translateZ(-200px)] opacity-60" />

                    {/* Top logo */}
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00E5FF]/20 to-[#1A73E8]/20 border border-[#00E5FF]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                            <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            DermaScan <span className="text-[#00E5FF]">AI</span>
                        </span>
                    </div>

                    {/* Center hero */}
                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <motion.div
                            animate={{ y: [0, -12, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                            className="w-28 h-28 mx-auto relative flex items-center justify-center rounded-full border border-[#00E5FF]/30 bg-[#0B2A44]/60 shadow-[0_0_60px_rgba(0,229,255,0.2)] mb-10"
                        >
                            <BrainCircuit className="w-14 h-14 text-[#00E5FF]" />
                            <div className="absolute inset-0 rounded-full border border-[#00E5FF]/20 animate-ping opacity-40" style={{ animationDuration: '3s' }} />
                            <div className="absolute -inset-4 rounded-full border border-[#00E5FF]/10 animate-spin" style={{ animationDuration: '12s' }} />
                            <Sparkles className="w-5 h-5 text-[#1A73E8] absolute -top-2 right-4 animate-pulse" />
                            <Activity className="w-4 h-4 text-[#00E5FF] absolute -bottom-2 left-4 animate-bounce" />
                        </motion.div>

                        <div className="text-center mb-10">
                            <h1 className="text-4xl xl:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-[#00E5FF] to-white leading-tight">
                                Patient Portal
                            </h1>
                            <p className="text-blue-200/70 text-lg leading-relaxed max-w-sm mx-auto">
                                Your intelligent dermatology companion for early skin condition detection.
                            </p>
                        </div>

                        {/* Feature list */}
                        <div className="space-y-4 max-w-sm mx-auto w-full">
                            {features.map(({ icon: Icon, label, desc }, i) => (
                                <motion.div
                                    key={label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.12 }}
                                    className="flex items-center gap-4 bg-[#0B2A44]/40 border border-[#00E5FF]/10 rounded-xl px-4 py-3"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-[#00E5FF]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{label}</p>
                                        <p className="text-xs text-gray-400">{desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom badge */}
                    <div className="relative z-10 flex items-center gap-2 text-xs text-gray-500 justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                        Secure · HIPAA-Aware · End-to-End Encrypted
                    </div>
                </motion.div>

                {/* RIGHT: Login form */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#00E5FF]/8 rounded-full blur-[100px] pointer-events-none" />

                    <div className="w-full max-w-md bg-[#0a1622]/80 backdrop-blur-2xl rounded-[24px] p-8 sm:p-10 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(0,229,255,0.08)] relative z-10 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(0,229,255,0.15)] transition-all">

                        {/* Mobile logo */}
                        <div className="lg:hidden flex flex-col items-center mb-8">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-blue-600/20 border border-[#00E5FF]/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                                <BrainCircuit className="w-7 h-7 text-[#00E5FF]" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#00E5FF]">DermaScan AI</span>
                        </div>

                        {/* Role badge */}
                        <div className="flex justify-center mb-6">
                            <span className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/25 text-[#00E5FF]">
                                Patient Login
                            </span>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
                            <p className="text-sm text-gray-400">Sign in to access your patient dashboard</p>
                        </div>

                        {/* Error message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm flex items-start gap-2"
                            >
                                <span className="shrink-0 mt-0.5">⚠</span>
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div className="group">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" />
                                    </div>
                                    <input
                                        id="patient-email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="peer w-full pl-11 pr-4 py-3.5 bg-[#0B1C2C]/60 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/30 transition-all font-medium focus:bg-[#0B1C2C]"
                                        placeholder="Email address"
                                    />
                                    <label htmlFor="patient-email" className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#0a1622] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-[#00E5FF] peer-focus:uppercase transition-all cursor-text pointer-events-none rounded-sm">
                                        Email Address
                                    </label>
                                </div>
                            </div>

                            {/* Password */}
                            <div className="group">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" />
                                    </div>
                                    <input
                                        id="patient-password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="peer w-full pl-11 pr-12 py-3.5 bg-[#0B1C2C]/60 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/30 transition-all font-medium focus:bg-[#0B1C2C]"
                                        placeholder="Password"
                                    />
                                    <label htmlFor="patient-password" className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#0a1622] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-[#00E5FF] peer-focus:uppercase transition-all cursor-text pointer-events-none rounded-sm">
                                        Password
                                    </label>
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#00E5FF] transition-colors focus:outline-none">
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember me + Forgot */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative w-4 h-4 flex items-center justify-center">
                                        <input type="checkbox" className="peer appearance-none w-4 h-4 border border-gray-600 rounded bg-[#0B1C2C] checked:bg-[#00E5FF] checked:border-[#00E5FF] transition-colors cursor-pointer" />
                                        <svg className="absolute w-3 h-3 text-[#0a1622] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
                                            <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
                                </label>
                                <Link to="/forgot-password" className="text-sm font-semibold text-[#00E5FF] hover:text-white transition-colors underline decoration-[#00E5FF]/30 underline-offset-4 hover:decoration-white">
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit */}
                            <div className="pt-2">
                                <button
                                    id="patient-login-submit"
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-[#0a1622] bg-gradient-to-r from-[#00E5FF] to-[#1A73E8] hover:from-[#33ebff] hover:to-[#2e7ceb] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/50 focus:ring-offset-2 focus:ring-offset-[#0a1622] shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-wait group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-[#0a1622]/30 border-t-[#0a1622] rounded-full animate-spin" />
                                    ) : (
                                        <>Sign In <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Footer links */}
                        <div className="mt-6 space-y-3">
                            <div className="text-center bg-white/[0.02] border border-white/5 rounded-lg py-3">
                                <p className="text-sm text-gray-400">
                                    New patient?{' '}
                                    <Link to="/register" className="font-bold text-[#00E5FF] hover:text-white transition-colors border-b border-[#00E5FF]/30 hover:border-white pb-0.5">
                                        Create an account
                                    </Link>
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500">
                                    Are you a doctor?{' '}
                                    <Link to="/doctor" className="font-semibold text-[#818CF8] hover:text-white transition-colors">
                                        Visit Doctor Portal →
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PatientLogin;
