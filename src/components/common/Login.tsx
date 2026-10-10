import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Activity, Eye, EyeOff, BrainCircuit, Fingerprint, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [role, setRole] = useState<'patient' | 'doctor'>('patient');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // @ts-ignore
            const response = await import('../../services/api').then(module => module.default.post('/auth/login', {
                email: formData.email,
                password: formData.password,
                role
            }));

            if (response.data?.requires_2fa) {
                const isDoc = response.data.role === 'doctor' || role === 'doctor';
                navigate(isDoc ? '/doctor/verify-otp' : '/verify-otp', {
                    state: {
                        email: response.data.email || formData.email,
                        masked_email: response.data.masked_email,
                        role: response.data.role || role || 'patient',
                        purpose: '2fa',
                    }
                });
                return;
            }

            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.role === 'doctor') {
                navigate('/doctor-dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (error: any) {
            console.error('Login failed:', error);
            if (error.response?.data?.requires_2fa) {
                const isDoc = error.response.data.role === 'doctor' || role === 'doctor';
                navigate(isDoc ? '/doctor/verify-otp' : '/verify-otp', {
                    state: {
                        email: error.response.data.email || formData.email,
                        masked_email: error.response.data.masked_email,
                        role: error.response.data.role || role || 'patient',
                        purpose: '2fa',
                    }
                });
                return;
            }
            if (error.response?.data?.requires_verification) {
                const { email: unverifiedEmail, masked_email, role: userRole } = error.response.data;
                navigate('/verify-otp', {
                    state: {
                        email: unverifiedEmail || formData.email,
                        masked_email,
                        role: userRole || role || 'patient',
                        purpose: 'registration',
                    }
                });
                return;
            }
            if (error.response?.data?.requires_approval) {
                navigate('/doctor/pending-approval', {
                    state: {
                        email: formData.email,
                        doctor: error.response.data.doctor,
                        message: error.response.data.message
                    }
                });
                return;
            }
            alert(error.response?.data?.error || error.response?.data?.message || 'Login failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#061B2E] bg-gradient-to-br from-[#061B2E] to-[#0B2A44] flex items-center justify-center relative overflow-hidden text-white selection:bg-[#00E5FF]/30 w-full">

            {/* Global Background Elements */}
            <div className="absolute inset-0 z-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at center, #00E5FF 2px, transparent 2px)`, backgroundSize: '30px 30px' }} />
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-[#00E5FF]/5 rounded-full blur-[150px] mix-blend-screen pointer-events-none animate-pulse" />

            <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row h-full lg:h-[85vh] lg:max-h-[800px] rounded-3xl overflow-hidden relative z-10 p-4 lg:p-0">

                {/* LEFT SIDE: Visual Section */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hidden lg:flex w-full lg:w-1/2 flex-col justify-center items-center relative overflow-hidden p-12 bg-gradient-to-br from-[#00E5FF]/10 to-[#1A73E8]/10 border-r border-white/5 order-1 lg:order-1 rounded-t-3xl lg:rounded-tr-none lg:rounded-l-3xl"
                >
                    <div className="absolute inset-0 z-0">
                        {/* Animated Grid overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_translateZ(-200px)] opacity-60 animate-[grid-move_20s_linear_infinite]" />
                    </div>

                    <div className="relative z-10 w-full max-w-md">
                        <div className="relative mb-12">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="w-32 h-32 mx-auto relative flex items-center justify-center rounded-full border border-[#00E5FF]/30 bg-[#0B2A44]/50 shadow-[0_0_50px_rgba(0,229,255,0.2)]"
                            >
                                <BrainCircuit className="w-16 h-16 text-[#00E5FF]" />
                                {/* Pulsing rings */}
                                <div className="absolute inset-0 rounded-full border border-[#00E5FF]/20 animate-ping opacity-50" style={{ animationDuration: '3s' }} />
                                <div className="absolute -inset-4 rounded-full border border-[#00E5FF]/10 animate-spin" style={{ animationDuration: '10s' }} />
                            </motion.div>

                            {/* Floating particles */}
                            <Sparkles className="w-6 h-6 text-[#1A73E8] absolute top-0 right-10 animate-pulse" />
                            <Activity className="w-5 h-5 text-[#00E5FF] absolute bottom-0 left-10 animate-bounce" />
                        </div>

                        <div className="text-center relative z-10">
                            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-[#00E5FF] to-white pb-2 leading-tight">
                                AI-Powered Skin<br />Analysis Platform
                            </h1>
                            <p className="text-lg text-blue-200/80 font-medium leading-relaxed max-w-sm mx-auto">
                                Detect skin conditions early using intelligent dermatology technology.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* RIGHT SIDE: Login Card */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative order-2 lg:order-2"
                >
                    {/* Soft radial lighting behind card */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#00E5FF]/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="w-full max-w-md bg-[#0a1622]/80 backdrop-blur-2xl rounded-[24px] p-8 sm:p-10 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(0,229,255,0.1)] relative z-10 transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(0,229,255,0.2)]">

                        {/* Mobile Logo View */}
                        <div className="lg:hidden flex flex-col items-center justify-center mb-8">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-blue-600/20 border border-[#00E5FF]/30 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                                <BrainCircuit className="w-8 h-8 text-[#00E5FF]" />
                            </div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#00E5FF]">DermaScan AI</h1>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
                            <p className="text-sm text-gray-400">Sign in to access your DermaScan dashboard</p>
                        </div>

                        {/* Custom Segmented Toggle */}
                        <div className="bg-[#0B1C2C] p-1.5 rounded-xl flex items-center justify-center mb-8 border border-white/5 relative">
                            {/* Animated Background Pill */}
                            <motion.div
                                className="absolute left-1.5 top-1.5 bottom-1.5 bg-gradient-to-r from-[#00E5FF]/20 to-blue-500/20 border border-[#00E5FF]/30 rounded-lg shadow-[inset_0_0_10px_rgba(0,229,255,0.2)]"
                                initial={false}
                                animate={{
                                    width: 'calc(50% - 6px)',
                                    x: role === 'patient' ? 0 : '100% ' // Space calculation hack
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                style={{ transformOrigin: 'left' }}
                            />

                            <button
                                type="button"
                                onClick={() => setRole('patient')}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors ${role === 'patient' ? 'text-[#00E5FF]' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                Patient
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('doctor')}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors ${role === 'doctor' ? 'text-[#00E5FF]' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                Doctor
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="group">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="peer w-full pl-11 pr-4 py-3.5 bg-[#0B1C2C]/50 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/30 transition-all font-medium focus:bg-[#0B1C2C]"
                                        placeholder="Email address"
                                    />
                                    <label htmlFor="email" className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#0a1622] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:uppercase-none peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-[#00E5FF] peer-focus:uppercase tracking-widest transition-all cursor-text pointer-events-none rounded-sm">
                                        Email Address
                                    </label>
                                </div>
                            </div>

                            <div className="group">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="peer w-full pl-11 pr-12 py-3.5 bg-[#0B1C2C]/50 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/30 transition-all font-medium focus:bg-[#0B1C2C]"
                                        placeholder="Password"
                                    />
                                    <label htmlFor="password" className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#0a1622] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:uppercase-none peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-[#00E5FF] peer-focus:uppercase tracking-widest transition-all cursor-text pointer-events-none rounded-sm">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#00E5FF] transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

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

                                <a href="#" className="text-sm font-semibold text-[#00E5FF] hover:text-white transition-colors underline decoration-[#00E5FF]/30 underline-offset-4 hover:decoration-white">
                                    Forgot password?
                                </a>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-[#0a1622] bg-gradient-to-r from-[#00E5FF] to-[#1A73E8] hover:from-[#33ebff] hover:to-[#2e7ceb] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/50 focus:ring-offset-2 focus:ring-offset-[#0a1622] shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-wait group relative overflow-hidden"
                                >
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />

                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-[#0a1622]/30 border-t-[#0a1622] rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="mt-8 text-center bg-white/[0.02] border border-white/5 rounded-lg py-4">
                                <p className="text-sm text-gray-400">
                                    New to DermaScan?{' '}
                                    <Link to={role === 'doctor' ? "/register-doctor" : "/register"} className="font-bold text-[#00E5FF] hover:text-white transition-colors border-b border-[#00E5FF]/30 hover:border-white pb-0.5">
                                        Create an account
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Security Indicator below card */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 text-xs font-medium text-gray-500 bg-[#0a1622]/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 shadow-lg hidden lg:flex">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                        Secure AI Medical Platform
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
