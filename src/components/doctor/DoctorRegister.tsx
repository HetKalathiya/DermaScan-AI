import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, Stethoscope, Building2, FileBadge, ShieldCheck, CheckCircle2, Activity, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        specialization: '',
        licenseNumber: '',
        hospitalName: '',
        experience: '',
        password: '',
        confirmPassword: '',
    });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [licenseState, setLicenseState] = useState<'idle' | 'authenticating' | 'verified'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Experience Pill selector options
    const experienceOptions = ['1–3', '3–5', '5–10', '10–15', '15+'];

    // Mock License Authentication effect
    useEffect(() => {
        if (formData.licenseNumber.length > 4) {
            setLicenseState('authenticating');
            const timer = setTimeout(() => {
                setLicenseState('verified');
            }, 1200);
            return () => clearTimeout(timer);
        } else {
            setLicenseState('idle');
        }
    }, [formData.licenseNumber]);

    const calculateStrength = (pass: string) => {
        let score = 0;
        if (pass.length > 5) score += 25;
        if (pass.length > 8) score += 25;
        if (/[A-Z]/.test(pass)) score += 25;
        if (/[0-9]/.test(pass)) score += 25;
        return score; // 0, 25(Weak), 50(Fair), 75(Strong), 100(Excellent)
    };

    const strength = calculateStrength(formData.password);
    const passwordsMatch = formData.password.length > 0 && formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreed) {
            alert("You must agree to the Medical Professional Terms & Research Policy.");
            return;
        }

        if (!passwordsMatch) {
            alert("Passwords don't match!");
            return;
        }

        if (!formData.experience || !formData.specialization) {
            alert("Please select specialization and years of experience.");
            return;
        }

        setIsLoading(true);
        try {
            // @ts-ignore
            const response = await import('../../services/api').then(module => module.default.post('/auth/register-doctor', {
                name: formData.fullName,
                email: formData.email,
                password: formData.password,
                specialization: formData.specialization,
                license_number: formData.licenseNumber,
                hospital_name: formData.hospitalName,
                experience: formData.experience
            }));

            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            navigate('/doctor-dashboard');
        } catch (error: any) {
            console.error('Registration failed:', error);
            alert(error.response?.data?.error || 'Registration failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex text-white font-sans overflow-x-hidden selection:bg-[#06B6D4]/30">

            {/* Global Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Hexagonal Medical Grid Overlay */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="hexagons" width="30" height="52" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
                            <path d="M15 0 L30 8.66 L30 26 L15 34.64 L0 26 L0 8.66 Z M15 51.96 L30 43.3 L30 26 L15 34.64 L0 26 L0 43.3 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hexagons)" />
                </svg>

                {/* Soft Radial Gradient Orbs */}
                <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#06B6D4] blur-[200px] mix-blend-screen opacity-15 animate-[pulse_10s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#3B82F6] blur-[200px] mix-blend-screen opacity-15 animate-[pulse_12s_ease-in-out_infinite_alternate]" />

                {/* Floating Particles Mockup */}
                <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-[#06B6D4] rounded-full blur-[1px] opacity-50 animate-[ping_4s_infinite]" />
                <div className="absolute top-3/4 left-1/3 w-2 h-2 bg-[#3B82F6] rounded-full blur-[1px] opacity-40 animate-[ping_6s_infinite]" />
                <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white rounded-full blur-[1px] opacity-30 animate-[ping_5s_infinite]" />
            </div>

            <div className="w-full flex min-h-screen relative z-10 flex-col lg:flex-row">

                {/* =========================================
                    LEFT PANEL: BRAND HERO (40%)
                    ========================================= */}
                <div className="lg:w-[40%] xl:w-[38%] flex-col justify-between p-10 lg:p-14 border-r border-white/5 bg-[#0D1526]/80 backdrop-blur-md hidden lg:flex relative">

                    {/* Top Branding */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 relative z-20">
                        <div className="relative flex items-center justify-center">
                            {/* Pulsing ring animation */}
                            <div className="absolute inset-0 rounded-full border border-[#06B6D4] opacity-50 animate-[ping_3s_infinite]" />
                            <div className="absolute -inset-2 rounded-full border border-[#06B6D4]/30 animate-[spin_8s_linear_infinite] border-t-transparent" />
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] relative overflow-hidden z-10">
                                <div className="absolute inset-0 bg-white/20"></div>
                                <ShieldCheck className="w-7 h-7 text-white relative z-10" />
                            </div>
                        </div>
                        <span className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                            DermaScan <span className="text-[#06B6D4]">AI</span>
                        </span>
                    </motion.div>

                    {/* Middle Hero */}
                    <div className="relative z-20 mt-12 mb-auto">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-5xl font-extrabold tracking-tight leading-[1.1] mb-5"
                            style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                            Join Our <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#3B82F6]">Medical Network</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                            className="text-lg text-slate-400 max-w-sm leading-relaxed mb-12 font-medium"
                        >
                            Verified doctors powering AI-assisted dermatology worldwide. Access advanced diagnostics & research tools.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-5">
                            <div className="flex items-center gap-4 bg-[#0F172A]/50 border border-white/5 rounded-2xl p-4 shadow-lg backdrop-blur-sm group hover:border-[#06B6D4]/30 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-[#3B82F6]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Building2 className="text-[#3B82F6] w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white tracking-wide">Hospital Verified</h3>
                                    <p className="text-sm text-slate-500">Trusted global medical institutions</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-[#0F172A]/50 border border-white/5 rounded-2xl p-4 shadow-lg backdrop-blur-sm group hover:border-[#06B6D4]/30 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FileBadge className="text-[#10B981] w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white tracking-wide">License Authenticated</h3>
                                    <p className="text-sm text-slate-500">Secure automated credential checks</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-[#0F172A]/50 border border-white/5 rounded-2xl p-4 shadow-lg backdrop-blur-sm group hover:border-[#06B6D4]/30 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-[#06B6D4]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Activity className="text-[#06B6D4] w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white tracking-wide">AI Research Access</h3>
                                    <p className="text-sm text-slate-500">Contribute to machine learning models</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom Glowing Stat Strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                        className="relative z-20 mt-12 bg-gradient-to-r from-[#06B6D4]/10 to-[#3B82F6]/10 border border-[#06B6D4]/20 rounded-xl p-4 flex items-center justify-around overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[#06B6D4]/5 animate-[pulse_3s_infinite]" />
                        <div className="text-center relative z-10">
                            <div className="text-xl font-bold text-white">2,400+</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Doctors</div>
                        </div>
                        <div className="w-px h-8 bg-white/10 relative z-10" />
                        <div className="text-center relative z-10">
                            <div className="text-xl font-bold text-white">48</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Countries</div>
                        </div>
                        <div className="w-px h-8 bg-white/10 relative z-10" />
                        <div className="text-center relative z-10 flex flex-col items-center">
                            <div className="text-xl font-bold text-[#06B6D4]">99%</div>
                            <div className="text-[10px] text-[#06B6D4] uppercase tracking-widest font-bold">Accuracy</div>
                        </div>
                    </motion.div>
                </div>

                {/* =========================================
                    RIGHT PANEL: REGISTRATION FORM (60%)
                    ========================================= */}
                <div className="w-full lg:w-[60%] xl:w-[62%] flex items-center justify-center p-6 sm:p-10 lg:py-12 relative z-20 overflow-y-auto">

                    {/* Mobile Header */}
                    <div className="lg:hidden absolute top-6 left-6 flex items-center gap-3 z-50">
                        <ShieldCheck className="w-8 h-8 text-[#06B6D4]" />
                        <span className="text-xl font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>DermaScan AI</span>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-[560px] lg:mt-0 mt-16"
                    >
                        {/* Glass Form Card */}
                        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-[32px] p-6 sm:p-10 lg:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative">
                            {/* Inner ambient glow */}
                            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#06B6D4]/40 to-transparent" />
                            <div className="absolute inset-0 rounded-[32px] shadow-[inset_0_0_80px_rgba(255,255,255,0.02)] pointer-events-none" />

                            <div className="mb-10">
                                <button onClick={() => navigate('/doctor')} className="text-xs text-[#818CF8] hover:text-white transition-colors font-semibold inline-flex items-center gap-1 mb-4">
                                    ← Back to Doctor Portal
                                </button>
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Doctor Registration</h2>
                                <p className="text-slate-400 font-medium">Create your verified medical account.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Row 1: Name & Email */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                        </div>
                                        <input
                                            id="fullName" name="fullName" type="text" required
                                            value={formData.fullName} onChange={handleChange}
                                            className="peer w-full pl-12 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-transparent focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all font-medium"
                                            placeholder="Full Name"
                                        />
                                        <label htmlFor="fullName" className="absolute left-11 -top-2.5 px-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-[#151D2D] rounded-full peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-4 peer-placeholder-shown:uppercase-none peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:text-[#06B6D4] peer-focus:bg-[#151D2D] peer-focus:uppercase tracking-widest transition-all cursor-text pointer-events-none z-10">
                                            Dr. Full Name
                                        </label>
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                        </div>
                                        <input
                                            id="email" name="email" type="email" required
                                            value={formData.email} onChange={handleChange}
                                            className="peer w-full pl-12 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-transparent focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all font-medium"
                                            placeholder="Email Address"
                                        />
                                        <label htmlFor="email" className="absolute left-11 -top-2.5 px-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-[#151D2D] rounded-full peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-4 peer-placeholder-shown:uppercase-none peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:text-[#06B6D4] peer-focus:bg-[#151D2D] peer-focus:uppercase tracking-widest transition-all cursor-text pointer-events-none z-10">
                                            Email Address
                                        </label>
                                    </div>
                                </div>

                                {/* Row 2: Specialization (Select) */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                        <Stethoscope className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                    </div>
                                    <select
                                        id="specialization" name="specialization" required
                                        value={formData.specialization} onChange={handleChange}
                                        className="peer w-full pl-12 pr-10 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white appearance-none focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all font-medium cursor-pointer relative z-0"
                                    >
                                        <option value="" disabled className="bg-[#0D1526] text-slate-500">Select Specialization</option>
                                        <option value="Dermatologist" className="bg-[#0D1526]">Dermatologist</option>
                                        <option value="Oncologist" className="bg-[#0D1526]">Oncologist</option>
                                        <option value="General Practitioner" className="bg-[#0D1526]">General Practitioner</option>
                                        <option value="Surgeon" className="bg-[#0D1526]">Surgeon</option>
                                        <option value="Researcher" className="bg-[#0D1526]">Researcher</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
                                        <ChevronDown className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4]" />
                                    </div>
                                    <label className="absolute left-11 -top-2.5 px-1.5 text-[10px] font-bold uppercase tracking-widest bg-[#141B2E] rounded-full transition-all pointer-events-none z-10" style={{ color: formData.specialization ? '#06B6D4' : '#94a3b8' }}>
                                        Medical Specialization
                                    </label>
                                </div>

                                {/* Row 3: License & Verification */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FileBadge className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                    </div>
                                    <input
                                        id="licenseNumber" name="licenseNumber" type="text" required
                                        value={formData.licenseNumber} onChange={handleChange}
                                        className="peer w-full pl-12 pr-28 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-transparent focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all font-medium uppercase"
                                        placeholder="License / Reg Number"
                                    />
                                    <label htmlFor="licenseNumber" className="absolute left-11 -top-2.5 px-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-[#151D2D] rounded-full peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-4 peer-placeholder-shown:uppercase-none peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:text-[#06B6D4] peer-focus:bg-[#151D2D] peer-focus:uppercase tracking-widest transition-all cursor-text pointer-events-none z-10">
                                        License / Reg Number
                                    </label>

                                    {/* Verification Status */}
                                    <div className="absolute inset-y-0 right-3 flex items-center">
                                        <AnimatePresence mode="wait">
                                            {licenseState === 'authenticating' && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 bg-[#3B82F6]/20 border border-[#3B82F6]/40 px-2 py-1.5 rounded-md">
                                                    <div className="w-3 h-3 border-2 border-[#3B82F6]/30 border-t-[#3B82F6] rounded-full animate-spin" />
                                                    <span className="text-[10px] font-bold text-[#3B82F6] uppercase">Checking</span>
                                                </motion.div>
                                            )}
                                            {licenseState === 'verified' && (
                                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1 bg-[#10B981]/20 border border-[#10B981]/40 px-2 py-1.5 rounded-md shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                                                    <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">Verified ✓</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Row 4: Hospital / Clinic */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Building2 className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                    </div>
                                    <input
                                        id="hospitalName" name="hospitalName" type="text" required
                                        value={formData.hospitalName} onChange={handleChange}
                                        className="peer w-full pl-12 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-transparent focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all font-medium"
                                        placeholder="Hospital / Clinic Name"
                                    />
                                    <label htmlFor="hospitalName" className="absolute left-11 -top-2.5 px-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-[#151D2D] rounded-full peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-4 peer-placeholder-shown:uppercase-none peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:text-[#06B6D4] peer-focus:bg-[#151D2D] peer-focus:uppercase tracking-widest transition-all cursor-text pointer-events-none z-10">
                                        Hospital / Clinic Name
                                    </label>
                                </div>

                                {/* Experience Pill Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Years of Experience</label>
                                    <div className="flex flex-wrap gap-2">
                                        {experienceOptions.map(option => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, experience: option })}
                                                className={`flex-1 min-w-[60px] py-2.5 px-3 rounded-xl text-[13px] font-bold transition-all ${formData.experience === option
                                                        ? 'bg-[#06B6D4]/20 border border-[#06B6D4] text-[#06B6D4] shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                                        : 'bg-white/[0.03] border border-white/5 text-slate-400 hover:bg-white/[0.08] hover:text-white'
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Passwords */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                            </div>
                                            <input
                                                id="password" name="password" type="password" required
                                                value={formData.password} onChange={handleChange}
                                                className="peer w-full pl-12 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-transparent focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all font-medium"
                                                placeholder="Password"
                                            />
                                            <label htmlFor="password" className="absolute left-11 -top-2.5 px-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-[#151D2D] rounded-full peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-4 peer-placeholder-shown:uppercase-none peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:text-[#06B6D4] peer-focus:bg-[#151D2D] peer-focus:uppercase tracking-widest transition-all cursor-text pointer-events-none z-10">
                                                Password
                                            </label>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                            </div>
                                            <input
                                                id="confirmPassword" name="confirmPassword" type="password" required
                                                value={formData.confirmPassword} onChange={handleChange}
                                                className="peer w-full pl-12 pr-10 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-transparent focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all font-medium"
                                                placeholder="Confirm Password"
                                            />
                                            <label htmlFor="confirmPassword" className="absolute left-11 -top-2.5 px-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-[#151D2D] rounded-full peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-4 peer-placeholder-shown:uppercase-none peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:text-[#06B6D4] peer-focus:bg-[#151D2D] peer-focus:uppercase tracking-widest transition-all cursor-text pointer-events-none z-10">
                                                Confirm
                                            </label>
                                            {/* Match indicator */}
                                            <div className="absolute inset-y-0 right-4 flex items-center mb-0">
                                                {passwordsMatch && <Check className="w-5 h-5 text-[#10B981] drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Strength Bar moved here to span gracefully */}
                                    <div className="flex gap-1 h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden mt-2">
                                        <div className={`h-full transition-all duration-300 ${strength >= 25 ? 'w-1/4 bg-red-500' : 'w-0'}`} />
                                        <div className={`h-full transition-all duration-300 ${strength >= 50 ? 'w-1/4 bg-yellow-400' : 'w-0'}`} />
                                        <div className={`h-full transition-all duration-300 ${strength >= 75 ? 'w-1/4 bg-[#10B981]' : 'w-0'}`} />
                                        <div className={`h-full transition-all duration-500 ${strength >= 100 ? 'w-1/4 bg-[#06B6D4] shadow-[0_0_8px_#06B6D4]' : 'w-0'}`} />
                                    </div>
                                    <div className="text-[10px] text-right font-bold uppercase tracking-widest mt-1 pr-1" style={{ color: strength <= 25 && strength > 0 ? '#ef4444' : strength <= 50 && strength > 0 ? '#facc15' : strength <= 75 ? '#10b981' : strength >= 100 ? '#06b6d4' : '#64748b' }}>
                                        {strength === 0 ? '' : strength <= 25 ? 'Weak' : strength <= 50 ? 'Fair' : strength <= 75 ? 'Strong' : 'Excellent'}
                                    </div>
                                </div>

                                {/* Terms Checkbox */}
                                <div className="pt-2">
                                    <label className="flex items-start gap-4 cursor-pointer group">
                                        <div className="relative flex items-start pt-0.5">
                                            <input
                                                type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                                                className="peer appearance-none w-5 h-5 border-2 border-slate-600 rounded bg-white/[0.05] checked:bg-[#06B6D4] checked:border-[#06B6D4] transition-all cursor-pointer shrink-0 shadow-inner"
                                            />
                                            <Check className="absolute top-[2px] left-[2px] w-4 h-4 text-[#0A101C] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity drop-shadow-sm" strokeWidth={3} />
                                        </div>
                                        <span className="text-sm text-slate-400 leading-relaxed font-medium">
                                            I agree to the <a href="#" className="text-[#06B6D4] underline underline-offset-2 hover:text-white transition-colors">Medical Professional Terms</a> & <a href="#" className="text-[#3B82F6] underline underline-offset-2 hover:text-white transition-colors">DermaScan AI Research Policy</a>.
                                        </span>
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <button
                                        type="submit" disabled={isLoading}
                                        className="w-full relative flex justify-center items-center gap-2 py-4.5 px-6 rounded-full text-[15px] font-extrabold text-[#0D1526] bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transform hover:-translate-y-1 transition-all duration-300 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
                                        style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '0.05em' }}
                                    >
                                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_2s_infinite]" />

                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-[#0D1526]/30 border-t-[#0D1526] rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                REGISTER AS DOCTOR
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform stroke-[2.5px]" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="mt-8 text-center">
                            <Link to="/register" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-[#06B6D4] uppercase tracking-widest transition-colors group">
                                Not a doctor? Register as Patient
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                    </motion.div>
                </div>
            </div>
            {/* Global shimmer animation config */}
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default DoctorRegister;
