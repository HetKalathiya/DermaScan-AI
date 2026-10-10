import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff,
    Stethoscope, Users, BarChart3, MessageSquare, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

const DoctorLogin = () => {
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
                module.default.post('/auth/login/doctor', {
                    email: formData.email,
                    password: formData.password,
                })
            );

            if (response.data?.requires_2fa) {
                navigate('/doctor/verify-otp', {
                    state: {
                        email: response.data.email || formData.email,
                        masked_email: response.data.masked_email,
                        role: 'doctor',
                        purpose: '2fa',
                    }
                });
                return;
            }

            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            navigate('/doctor-dashboard');
        } catch (err: any) {
            if (err.response?.data?.requires_2fa) {
                navigate('/doctor/verify-otp', {
                    state: {
                        email: err.response.data.email || formData.email,
                        masked_email: err.response.data.masked_email,
                        role: 'doctor',
                        purpose: '2fa',
                    }
                });
                return;
            }
            if (err.response?.data?.requires_verification) {
                const { email: unverifiedEmail, masked_email, role: userRole } = err.response.data;
                navigate('/doctor/verify-otp', {
                    state: {
                        email: unverifiedEmail || formData.email,
                        masked_email,
                        role: userRole || 'doctor',
                        purpose: 'registration',
                    }
                });
                return;
            }
            if (err.response?.data?.requires_approval) {
                navigate('/doctor/pending-approval', {
                    state: {
                        email: formData.email,
                        doctor: err.response.data.doctor,
                        message: err.response.data.message,
                    }
                });
                return;
            }
            setError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please try again.');
            setIsLoading(false);
        }
    };

    const features = [
        { icon: Users, label: 'Patient Management', desc: 'Track all your patients in one place' },
        { icon: BarChart3, label: 'Clinical Analytics', desc: 'Insights from AI-powered scan data' },
        { icon: MessageSquare, label: 'Consultations', desc: 'Real-time chat & video with patients' },
    ];

    return (
        <div className="min-h-screen bg-[#07071A] flex items-center justify-center relative overflow-hidden text-white selection:bg-[#818CF8]/30 w-full">

            {/* Background elements */}
            <div className="absolute inset-0 z-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at center, #818CF8 2px, transparent 2px)`, backgroundSize: '30px 30px' }} />
            <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-[#6366F1]/5 rounded-full blur-[160px] mix-blend-screen pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[55vw] h-[55vw] bg-[#818CF8]/5 rounded-full blur-[160px] pointer-events-none" />

            <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row h-full lg:h-[88vh] lg:max-h-[820px] rounded-3xl overflow-hidden relative z-10 p-4 lg:p-0">

                {/* LEFT: Doctor branding panel */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hidden lg:flex w-full lg:w-1/2 flex-col justify-between relative overflow-hidden p-12 bg-gradient-to-br from-[#818CF8]/8 to-[#6366F1]/8 border-r border-white/5 rounded-l-3xl"
                >
                    {/* Animated grid — warmer purple hue */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(129,140,248,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(129,140,248,0.04)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_translateZ(-200px)] opacity-60" />

                    {/* Top logo */}
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#818CF8]/20 to-[#6366F1]/20 border border-[#818CF8]/30 flex items-center justify-center shadow-[0_0_20px_rgba(129,140,248,0.2)]">
                            <ShieldCheck className="w-5 h-5 text-[#818CF8]" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            DermaScan <span className="text-[#818CF8]">AI</span>
                        </span>
                    </div>

                    {/* Center hero */}
                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <motion.div
                            animate={{ y: [0, -12, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                            className="w-28 h-28 mx-auto relative flex items-center justify-center rounded-full border border-[#818CF8]/30 bg-[#181830]/60 shadow-[0_0_60px_rgba(129,140,248,0.2)] mb-10"
                        >
                            <Stethoscope className="w-14 h-14 text-[#818CF8]" />
                            <div className="absolute inset-0 rounded-full border border-[#818CF8]/20 animate-ping opacity-40" style={{ animationDuration: '3s' }} />
                            <div className="absolute -inset-4 rounded-full border border-[#818CF8]/10 animate-spin" style={{ animationDuration: '14s' }} />
                            <Sparkles className="w-5 h-5 text-[#6366F1] absolute -top-2 right-4 animate-pulse" />
                        </motion.div>

                        <div className="text-center mb-10">
                            <h1 className="text-4xl xl:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-[#818CF8] to-white leading-tight">
                                Doctor Portal
                            </h1>
                            <p className="text-indigo-200/70 text-lg leading-relaxed max-w-sm mx-auto mb-3">
                                Your clinical command center for AI-assisted dermatology practice management.
                            </p>
                            <button onClick={() => navigate('/doctor')} className="text-sm text-[#818CF8] hover:text-white transition-colors font-semibold inline-flex items-center gap-1">
                                Learn more about our platform →
                            </button>
                        </div>

                        {/* Feature list */}
                        <div className="space-y-4 max-w-sm mx-auto w-full">
                            {features.map(({ icon: Icon, label, desc }, i) => (
                                <motion.div
                                    key={label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.12 }}
                                    className="flex items-center gap-4 bg-[#181830]/50 border border-[#818CF8]/10 rounded-xl px-4 py-3"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-[#818CF8]/10 border border-[#818CF8]/20 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-[#818CF8]" />
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
                        Verified Physician Platform · Secure · Encrypted
                    </div>
                </motion.div>

                {/* RIGHT: Login form */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#818CF8]/8 rounded-full blur-[100px] pointer-events-none" />

                    <div className="w-full max-w-md bg-[#0D0D20]/80 backdrop-blur-2xl rounded-[24px] p-8 sm:p-10 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(129,140,248,0.08)] relative z-10 hover:shadow-[0_20px_60px_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(129,140,248,0.15)] transition-all">

                        {/* Mobile logo */}
                        <div className="lg:hidden flex flex-col items-center mb-8">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#818CF8]/20 to-[#6366F1]/20 border border-[#818CF8]/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(129,140,248,0.3)]">
                                <Stethoscope className="w-7 h-7 text-[#818CF8]" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#818CF8]">DermaScan AI</span>
                        </div>

                        {/* Role badge */}
                        <div className="flex justify-center mb-6">
                            <span className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/25 text-[#818CF8]">
                                Doctor Login
                            </span>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome, Doctor</h2>
                            <p className="text-sm text-gray-400">Sign in to access your clinical dashboard</p>
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
                                        <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-[#818CF8] transition-colors" />
                                    </div>
                                    <input
                                        id="doctor-email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="peer w-full pl-11 pr-4 py-3.5 bg-[#181830]/60 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#818CF8]/50 focus:ring-1 focus:ring-[#818CF8]/30 transition-all font-medium focus:bg-[#181830]"
                                        placeholder="Email address"
                                    />
                                    <label htmlFor="doctor-email" className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#0D0D20] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-[#818CF8] peer-focus:uppercase transition-all cursor-text pointer-events-none rounded-sm">
                                        Email Address
                                    </label>
                                </div>
                            </div>

                            {/* Password */}
                            <div className="group">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#818CF8] transition-colors" />
                                    </div>
                                    <input
                                        id="doctor-password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="peer w-full pl-11 pr-12 py-3.5 bg-[#181830]/60 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#818CF8]/50 focus:ring-1 focus:ring-[#818CF8]/30 transition-all font-medium focus:bg-[#181830]"
                                        placeholder="Password"
                                    />
                                    <label htmlFor="doctor-password" className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#0D0D20] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-[#818CF8] peer-focus:uppercase transition-all cursor-text pointer-events-none rounded-sm">
                                        Password
                                    </label>
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#818CF8] transition-colors focus:outline-none">
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember me + Forgot */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative w-4 h-4 flex items-center justify-center">
                                        <input type="checkbox" className="peer appearance-none w-4 h-4 border border-gray-600 rounded bg-[#181830] checked:bg-[#818CF8] checked:border-[#818CF8] transition-colors cursor-pointer" />
                                        <svg className="absolute w-3 h-3 text-[#0D0D20] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
                                            <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
                                </label>
                                <Link to="/forgot-password" className="text-sm font-semibold text-[#818CF8] hover:text-white transition-colors underline decoration-[#818CF8]/30 underline-offset-4 hover:decoration-white">
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit */}
                            <div className="pt-2">
                                <button
                                    id="doctor-login-submit"
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#818CF8] to-[#6366F1] hover:from-[#a5b4fc] hover:to-[#818CF8] focus:outline-none focus:ring-2 focus:ring-[#818CF8]/50 focus:ring-offset-2 focus:ring-offset-[#0D0D20] shadow-[0_0_20px_rgba(129,140,248,0.35)] hover:shadow-[0_0_30px_rgba(129,140,248,0.55)] transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-wait group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                                    Not registered?{' '}
                                    <Link to="/register-doctor" className="font-bold text-[#818CF8] hover:text-white transition-colors border-b border-[#818CF8]/30 hover:border-white pb-0.5">
                                        Apply as a Doctor
                                    </Link>
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500">
                                    Are you a patient?{' '}
                                    <Link to="/login" className="font-semibold text-[#00E5FF] hover:text-white transition-colors">
                                        Sign in here →
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

export default DoctorLogin;
