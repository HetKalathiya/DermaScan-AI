import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User, Mail, Lock, ArrowRight, ArrowLeft, Stethoscope, Building2,
    FileBadge, ShieldCheck, CheckCircle2, Activity, ChevronDown, Check, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorRegister = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<number>(1);
    const [direction, setDirection] = useState<number>(1);

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
    const [showPolicyModal, setShowPolicyModal] = useState<'terms' | 'research' | null>(null);

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

    const nextStep = () => {
        if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
            alert("Please fill in all basic account details.");
            return;
        }
        if (formData.password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
        setDirection(1);
        setStep(2);
    };

    const prevStep = () => {
        setDirection(-1);
        setStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreed) {
            alert("You must agree to the Medical Professional Terms & Research Policy.");
            return;
        }

        if (!formData.experience || !formData.specialization) {
            alert("Please select your medical specialization and years of experience.");
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

            const { email: registeredEmail, masked_email } = response.data;
            navigate('/doctor/verify-otp', {
                state: {
                    email: registeredEmail || formData.email,
                    masked_email,
                    role: 'doctor'
                }
            });
        } catch (error: any) {
            console.error('Registration failed:', error);
            alert(error.response?.data?.error || 'Registration failed');
            setIsLoading(false);
        }
    };

    const slideVariants = {
        initial: (dir: number) => ({
            x: dir > 0 ? 30 : -30,
            opacity: 0,
        }),
        animate: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.35, ease: "easeOut" }
        },
        exit: (dir: number) => ({
            x: dir < 0 ? 30 : -30,
            opacity: 0,
            transition: { duration: 0.25, ease: "easeIn" }
        })
    };

    return (
        <div className="min-h-screen bg-[#07071A] flex text-white font-sans overflow-x-hidden selection:bg-[#818CF8]/30 relative">

            {/* Global Background Elements matching DoctorLogin */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `radial-gradient(circle at center, #818CF8 2px, transparent 2px)`,
                        backgroundSize: '30px 30px'
                    }}
                />
                <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-[#6366F1]/5 rounded-full blur-[160px] mix-blend-screen pointer-events-none animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[55vw] h-[55vw] bg-[#818CF8]/5 rounded-full blur-[160px] pointer-events-none" />

                {/* Ambient Particles */}
                <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-[#818CF8] rounded-full blur-[1px] opacity-40 animate-[ping_4s_infinite]" />
                <div className="absolute top-3/4 left-1/3 w-2 h-2 bg-[#6366F1] rounded-full blur-[1px] opacity-30 animate-[ping_6s_infinite]" />
                <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white rounded-full blur-[1px] opacity-25 animate-[ping_5s_infinite]" />
            </div>

            <div className="w-full flex min-h-screen relative z-10 flex-col lg:flex-row">

                {/* =========================================
                    LEFT PANEL: BRAND HERO (40%)
                    ========================================= */}
                <div className="lg:w-[40%] xl:w-[38%] flex-col justify-between p-10 lg:p-14 border-r border-white/5 bg-gradient-to-br from-[#818CF8]/8 to-[#6366F1]/8 backdrop-blur-md hidden lg:flex relative">

                    {/* Animated grid overlay matching DoctorLogin */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(129,140,248,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(129,140,248,0.04)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_translateZ(-200px)] opacity-60 pointer-events-none" />

                    {/* Top Branding */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 relative z-20">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#818CF8]/20 to-[#6366F1]/20 border border-[#818CF8]/30 flex items-center justify-center shadow-[0_0_20px_rgba(129,140,248,0.2)]">
                            <ShieldCheck className="w-5 h-5 text-[#818CF8]" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            DermaScan <span className="text-[#818CF8]">AI</span>
                        </span>
                    </motion.div>

                    {/* Middle Hero */}
                    <div className="relative z-20 mt-12 mb-auto">
                        {/* Animated floating hero stethoscope */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                            className="w-24 h-24 relative flex items-center justify-center rounded-full border border-[#818CF8]/30 bg-[#181830]/60 shadow-[0_0_60px_rgba(129,140,248,0.2)] mb-8"
                        >
                            <Stethoscope className="w-12 h-12 text-[#818CF8]" />
                            <div className="absolute inset-0 rounded-full border border-[#818CF8]/20 animate-ping opacity-40" style={{ animationDuration: '3s' }} />
                            <div className="absolute -inset-3 rounded-full border border-[#818CF8]/10 animate-spin" style={{ animationDuration: '14s' }} />
                            <Sparkles className="w-4 h-4 text-[#6366F1] absolute -top-1 right-3 animate-pulse" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-[#818CF8] to-white"
                        >
                            Join Our <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] to-[#a5b4fc]">Medical Network</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                            className="text-base text-indigo-200/70 max-w-sm leading-relaxed mb-10 font-medium"
                        >
                            Verified doctors powering AI-assisted dermatology worldwide. Access advanced diagnostics, real-time consultations & research tools.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
                            <div className="flex items-center gap-4 bg-[#181830]/50 border border-[#818CF8]/10 rounded-2xl p-4 shadow-lg backdrop-blur-sm group hover:border-[#818CF8]/30 transition-colors">
                                <div className="w-11 h-11 rounded-xl bg-[#818CF8]/10 border border-[#818CF8]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <Building2 className="text-[#818CF8] w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white tracking-wide text-sm">Hospital Verified</h3>
                                    <p className="text-xs text-gray-400">Trusted global medical institutions</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-[#181830]/50 border border-[#818CF8]/10 rounded-2xl p-4 shadow-lg backdrop-blur-sm group hover:border-[#818CF8]/30 transition-colors">
                                <div className="w-11 h-11 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <FileBadge className="text-[#818CF8] w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white tracking-wide text-sm">License Authenticated</h3>
                                    <p className="text-xs text-gray-400">Secure automated credential checks</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-[#181830]/50 border border-[#818CF8]/10 rounded-2xl p-4 shadow-lg backdrop-blur-sm group hover:border-[#818CF8]/30 transition-colors">
                                <div className="w-11 h-11 rounded-xl bg-[#a5b4fc]/10 border border-[#a5b4fc]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <Activity className="text-[#818CF8] w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white tracking-wide text-sm">AI Research Access</h3>
                                    <p className="text-xs text-gray-400">Contribute to state-of-the-art diagnostics</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom Glowing Stat Strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                        className="relative z-20 mt-10 bg-[#181830]/60 border border-[#818CF8]/20 rounded-xl p-4 flex items-center justify-around overflow-hidden shadow-[0_0_30px_rgba(129,140,248,0.1)]"
                    >
                        <div className="absolute inset-0 bg-[#818CF8]/5 animate-[pulse_3s_infinite]" />
                        <div className="text-center relative z-10">
                            <div className="text-xl font-bold text-white">2,400+</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Doctors</div>
                        </div>
                        <div className="w-px h-8 bg-white/10 relative z-10" />
                        <div className="text-center relative z-10">
                            <div className="text-xl font-bold text-white">48</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Countries</div>
                        </div>
                        <div className="w-px h-8 bg-white/10 relative z-10" />
                        <div className="text-center relative z-10 flex flex-col items-center">
                            <div className="text-xl font-bold text-[#818CF8]">99%</div>
                            <div className="text-[10px] text-[#818CF8] uppercase tracking-widest font-bold">Accuracy</div>
                        </div>
                    </motion.div>
                </div>

                {/* =========================================
                    RIGHT PANEL: 2-STEP REGISTRATION FORM (60%)
                    ========================================= */}
                <div className="w-full lg:w-[60%] xl:w-[62%] flex items-center justify-center p-6 sm:p-10 lg:py-12 relative z-20 overflow-y-auto">

                    {/* Background glow matching DoctorLogin right side */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] h-[75%] bg-[#818CF8]/8 rounded-full blur-[120px] pointer-events-none" />

                    {/* Mobile Header */}
                    <div className="lg:hidden absolute top-6 left-6 flex items-center gap-3 z-50">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#818CF8]/20 to-[#6366F1]/20 border border-[#818CF8]/30 flex items-center justify-center shadow-[0_0_15px_rgba(129,140,248,0.25)]">
                            <ShieldCheck className="w-5 h-5 text-[#818CF8]" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#818CF8]">DermaScan AI</span>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-[560px] lg:mt-0 mt-16 relative z-10"
                    >
                        {/* Glass Form Card matching DoctorLogin styling */}
                        <div className="bg-[#0D0D20]/80 backdrop-blur-2xl border border-white/10 rounded-[28px] p-6 sm:p-10 lg:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(129,140,248,0.08)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(129,140,248,0.15)] relative transition-all">

                            {/* Inner ambient top glow line */}
                            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#818CF8]/40 to-transparent" />

                            {/* WIZARD HEADER & PROGRESS (Matching Patient Registration) */}
                            <div className="flex items-center justify-between mb-8">
                                {step === 2 ? (
                                    <button
                                        onClick={prevStep}
                                        type="button"
                                        className="text-xs font-semibold text-[#818CF8] hover:text-white flex items-center transition-colors group px-2 py-1 -ml-2 rounded-lg hover:bg-white/5"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-1 transition-transform" />
                                        Back
                                    </button>
                                ) : (
                                    <Link
                                        to="/login/doctor"
                                        className="text-xs font-semibold text-[#818CF8] hover:text-white flex items-center transition-colors group px-2 py-1 -ml-2 rounded-lg hover:bg-white/5"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-1 transition-transform" />
                                        Sign In
                                    </Link>
                                )}

                                <div className="flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-[#818CF8] uppercase tracking-widest mb-2">
                                        Step {step} of 2
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                                                step >= 1
                                                    ? 'w-8 bg-gradient-to-r from-[#818CF8] to-[#6366F1] shadow-[0_0_10px_rgba(129,140,248,0.5)]'
                                                    : 'w-4 bg-slate-700/60'
                                            }`}
                                        />
                                        <div
                                            className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                                                step >= 2
                                                    ? 'w-8 bg-gradient-to-r from-[#818CF8] to-[#6366F1] shadow-[0_0_10px_rgba(129,140,248,0.5)]'
                                                    : 'w-4 bg-slate-700/60'
                                            }`}
                                        />
                                    </div>
                                </div>

                                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/25 text-[#818CF8]">
                                    {step === 1 ? 'Account' : 'Credentials'}
                                </span>
                            </div>

                            {/* Section Title */}
                            <div className="mb-8">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                                    {step === 1 ? 'Create Doctor Account' : 'Medical Credentials'}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {step === 1
                                        ? 'Set up your master credentials to access the physician portal.'
                                        : 'Provide your clinical background for medical board review.'}
                                </p>
                            </div>

                            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); nextStep(); } : handleSubmit} className="relative overflow-hidden">
                                <AnimatePresence mode="wait" custom={direction}>

                                    {/* ================= STEP 1: BASIC CREDENTIALS ================= */}
                                    {step === 1 && (
                                        <motion.div
                                            key="doctor-step-1"
                                            custom={direction}
                                            variants={slideVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="space-y-5"
                                        >
                                            {/* Dr. Full Name */}
                                            <div className="group">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <User className="h-5 w-5 text-gray-500 group-focus-within:text-[#818CF8] transition-colors" />
                                                    </div>
                                                    <input
                                                        id="fullName"
                                                        name="fullName"
                                                        type="text"
                                                        required
                                                        value={formData.fullName}
                                                        onChange={handleChange}
                                                        className="peer w-full pl-11 pr-4 py-3.5 bg-[#181830]/60 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#818CF8]/50 focus:ring-1 focus:ring-[#818CF8]/30 transition-all font-medium focus:bg-[#181830]"
                                                        placeholder="Full Name"
                                                    />
                                                    <label
                                                        htmlFor="fullName"
                                                        className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#0D0D20] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-[#818CF8] peer-focus:uppercase transition-all cursor-text pointer-events-none rounded-sm"
                                                    >
                                                        Dr. Full Name
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Email Address */}
                                            <div className="group">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-[#818CF8] transition-colors" />
                                                    </div>
                                                    <input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        required
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        className="peer w-full pl-11 pr-4 py-3.5 bg-[#181830]/60 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#818CF8]/50 focus:ring-1 focus:ring-[#818CF8]/30 transition-all font-medium focus:bg-[#181830]"
                                                        placeholder="Email Address"
                                                    />
                                                    <label
                                                        htmlFor="email"
                                                        className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#0D0D20] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-[#818CF8] peer-focus:uppercase transition-all cursor-text pointer-events-none rounded-sm"
                                                    >
                                                        Email Address
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Passwords */}
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="group">
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#818CF8] transition-colors" />
                                                            </div>
                                                            <input
                                                                id="password"
                                                                name="password"
                                                                type="password"
                                                                required
                                                                value={formData.password}
                                                                onChange={handleChange}
                                                                className="peer w-full pl-11 pr-4 py-3.5 bg-[#181830]/60 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#818CF8]/50 focus:ring-1 focus:ring-[#818CF8]/30 transition-all font-medium focus:bg-[#181830]"
                                                                placeholder="Password"
                                                            />
                                                            <label
                                                                htmlFor="password"
                                                                className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#0D0D20] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-[#818CF8] peer-focus:uppercase transition-all cursor-text pointer-events-none rounded-sm"
                                                            >
                                                                Password
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div className="group">
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#818CF8] transition-colors" />
                                                            </div>
                                                            <input
                                                                id="confirmPassword"
                                                                name="confirmPassword"
                                                                type="password"
                                                                required
                                                                value={formData.confirmPassword}
                                                                onChange={handleChange}
                                                                className="peer w-full pl-11 pr-10 py-3.5 bg-[#181830]/60 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#818CF8]/50 focus:ring-1 focus:ring-[#818CF8]/30 transition-all font-medium focus:bg-[#181830]"
                                                                placeholder="Confirm Password"
                                                            />
                                                            <label
                                                                htmlFor="confirmPassword"
                                                                className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#0D0D20] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-[#818CF8] peer-focus:uppercase transition-all cursor-text pointer-events-none rounded-sm"
                                                            >
                                                                Confirm
                                                            </label>
                                                            {/* Match indicator */}
                                                            <div className="absolute inset-y-0 right-4 flex items-center">
                                                                {passwordsMatch && (
                                                                    <Check className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Strength Bar */}
                                                <div className="flex gap-1 h-1.5 w-full bg-[#181830] rounded-full overflow-hidden mt-2">
                                                    <div className={`h-full transition-all duration-300 ${strength >= 25 ? 'w-1/4 bg-red-500' : 'w-0'}`} />
                                                    <div className={`h-full transition-all duration-300 ${strength >= 50 ? 'w-1/4 bg-yellow-400' : 'w-0'}`} />
                                                    <div className={`h-full transition-all duration-300 ${strength >= 75 ? 'w-1/4 bg-emerald-400' : 'w-0'}`} />
                                                    <div className={`h-full transition-all duration-500 ${strength >= 100 ? 'w-1/4 bg-[#818CF8] shadow-[0_0_8px_#818CF8]' : 'w-0'}`} />
                                                </div>
                                                <div className="text-[10px] text-right font-bold uppercase tracking-widest mt-1 pr-1" style={{ color: strength <= 25 && strength > 0 ? '#ef4444' : strength <= 50 && strength > 0 ? '#facc15' : strength <= 75 ? '#34d399' : strength >= 100 ? '#818cf8' : '#64748b' }}>
                                                    {strength === 0 ? '' : strength <= 25 ? 'Weak' : strength <= 50 ? 'Fair' : strength <= 75 ? 'Strong' : 'Excellent'}
                                                </div>
                                            </div>

                                            {/* Continue Button */}
                                            <div className="pt-3">
                                                <button
                                                    type="button"
                                                    onClick={nextStep}
                                                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#818CF8] to-[#6366F1] hover:from-[#a5b4fc] hover:to-[#818CF8] focus:outline-none focus:ring-2 focus:ring-[#818CF8]/50 focus:ring-offset-2 focus:ring-offset-[#0D0D20] shadow-[0_0_20px_rgba(129,140,248,0.35)] hover:shadow-[0_0_30px_rgba(129,140,248,0.55)] transform hover:-translate-y-0.5 transition-all group relative overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                                    <span>Continue to Medical Details</span>
                                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ================= STEP 2: CLINICAL / DOCTOR CREDENTIALS ================= */}
                                    {step === 2 && (
                                        <motion.div
                                            key="doctor-step-2"
                                            custom={direction}
                                            variants={slideVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="space-y-5"
                                        >
                                            {/* Specialization (Select) */}
                                            <div className="group">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                        <Stethoscope className="h-5 w-5 text-gray-500 group-focus-within:text-[#818CF8] transition-colors" />
                                                    </div>
                                                    <select
                                                        id="specialization"
                                                        name="specialization"
                                                        required
                                                        value={formData.specialization}
                                                        onChange={handleChange}
                                                        className="peer w-full pl-11 pr-10 py-3.5 bg-[#181830]/60 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-[#818CF8]/50 focus:ring-1 focus:ring-[#818CF8]/30 transition-all font-medium cursor-pointer relative z-0 focus:bg-[#181830]"
                                                    >
                                                        <option value="" disabled className="bg-[#0D0D20] text-gray-500">Select Specialization</option>
                                                        <option value="Dermatologist" className="bg-[#0D0D20]">Dermatologist</option>
                                                        <option value="Oncologist" className="bg-[#0D0D20]">Oncologist</option>
                                                        <option value="General Practitioner" className="bg-[#0D0D20]">General Practitioner</option>
                                                        <option value="Surgeon" className="bg-[#0D0D20]">Surgeon</option>
                                                        <option value="Researcher" className="bg-[#0D0D20]">Researcher</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
                                                        <ChevronDown className="h-5 w-5 text-gray-500 group-focus-within:text-[#818CF8]" />
                                                    </div>
                                                    <label
                                                        className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold uppercase tracking-widest bg-[#0D0D20] rounded-sm transition-all pointer-events-none z-10"
                                                        style={{ color: formData.specialization ? '#818CF8' : '#9ca3af' }}
                                                    >
                                                        Medical Specialization
                                                    </label>
                                                </div>
                                            </div>

                                            {/* License / Reg Number */}
                                            <div className="group">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <FileBadge className="h-5 w-5 text-gray-500 group-focus-within:text-[#818CF8] transition-colors" />
                                                    </div>
                                                    <input
                                                        id="licenseNumber"
                                                        name="licenseNumber"
                                                        type="text"
                                                        required
                                                        value={formData.licenseNumber}
                                                        onChange={handleChange}
                                                        className="peer w-full pl-11 pr-28 py-3.5 bg-[#181830]/60 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#818CF8]/50 focus:ring-1 focus:ring-[#818CF8]/30 transition-all font-medium uppercase focus:bg-[#181830]"
                                                        placeholder="License / Reg Number"
                                                    />
                                                    <label
                                                        htmlFor="licenseNumber"
                                                        className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#0D0D20] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-[#818CF8] peer-focus:uppercase transition-all cursor-text pointer-events-none rounded-sm"
                                                    >
                                                        License / Reg Number
                                                    </label>

                                                    {/* Verification Status Badge */}
                                                    <div className="absolute inset-y-0 right-3 flex items-center">
                                                        <AnimatePresence mode="wait">
                                                            {licenseState === 'authenticating' && (
                                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 bg-[#818CF8]/15 border border-[#818CF8]/30 px-2.5 py-1 rounded-lg">
                                                                    <div className="w-3 h-3 border-2 border-[#818CF8]/30 border-t-[#818CF8] rounded-full animate-spin" />
                                                                    <span className="text-[10px] font-bold text-[#818CF8] uppercase tracking-wider">Checking</span>
                                                                </motion.div>
                                                            )}
                                                            {licenseState === 'verified' && (
                                                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Verified ✓</span>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hospital / Clinic Name */}
                                            <div className="group">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Building2 className="h-5 w-5 text-gray-500 group-focus-within:text-[#818CF8] transition-colors" />
                                                    </div>
                                                    <input
                                                        id="hospitalName"
                                                        name="hospitalName"
                                                        type="text"
                                                        required
                                                        value={formData.hospitalName}
                                                        onChange={handleChange}
                                                        className="peer w-full pl-11 pr-4 py-3.5 bg-[#181830]/60 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#818CF8]/50 focus:ring-1 focus:ring-[#818CF8]/30 transition-all font-medium focus:bg-[#181830]"
                                                        placeholder="Hospital / Clinic Name"
                                                    />
                                                    <label
                                                        htmlFor="hospitalName"
                                                        className="absolute left-11 -top-2.5 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#0D0D20] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-[#818CF8] peer-focus:uppercase transition-all cursor-text pointer-events-none rounded-sm"
                                                    >
                                                        Hospital / Clinic Name
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Years of Experience */}
                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                                                    Years of Experience
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {experienceOptions.map(option => (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, experience: option })}
                                                            className={`flex-1 min-w-[60px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                                                                formData.experience === option
                                                                    ? 'bg-gradient-to-r from-[#818CF8] to-[#6366F1] text-white shadow-[0_0_15px_rgba(129,140,248,0.4)] border border-[#818CF8]/50'
                                                                    : 'bg-[#181830]/60 border border-white/10 text-gray-400 hover:text-white hover:border-[#818CF8]/40'
                                                            }`}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Terms Checkbox */}
                                            <div className="pt-1">
                                                <label className="flex items-start gap-3 cursor-pointer group">
                                                    <div className="relative flex items-start pt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={agreed}
                                                            onChange={(e) => setAgreed(e.target.checked)}
                                                            className="peer appearance-none w-4 h-4 border border-gray-600 rounded bg-[#181830] checked:bg-[#818CF8] checked:border-[#818CF8] transition-colors cursor-pointer shrink-0"
                                                        />
                                                        <svg className="absolute w-3 h-3 text-[#0D0D20] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity top-[2px] left-[2px]" viewBox="0 0 14 10" fill="none">
                                                            <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs text-gray-400 leading-relaxed font-medium">
                                                        I agree to the <button type="button" onClick={() => setShowPolicyModal('terms')} className="text-[#818CF8] underline underline-offset-2 hover:text-white transition-colors">Medical Professional Terms</button> & <button type="button" onClick={() => setShowPolicyModal('research')} className="text-[#a5b4fc] underline underline-offset-2 hover:text-white transition-colors">DermaScan AI Research Policy</button>.
                                                    </span>
                                                </label>
                                            </div>

                                            {/* Submit & Back Action Row */}
                                            <div className="pt-2 flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={prevStep}
                                                    className="px-5 py-3.5 rounded-xl text-sm font-semibold text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <ArrowLeft className="w-4 h-4" />
                                                    <span>Back</span>
                                                </button>

                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="flex-1 flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#818CF8] to-[#6366F1] hover:from-[#a5b4fc] hover:to-[#818CF8] focus:outline-none focus:ring-2 focus:ring-[#818CF8]/50 focus:ring-offset-2 focus:ring-offset-[#0D0D20] shadow-[0_0_20px_rgba(129,140,248,0.35)] hover:shadow-[0_0_30px_rgba(129,140,248,0.55)] transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-wait group relative overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />

                                                    {isLoading ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <span>Register as Doctor</span>
                                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>

                            {/* Footer links */}
                            <div className="mt-8 space-y-3">
                                <div className="text-center bg-white/[0.02] border border-white/5 rounded-lg py-3">
                                    <p className="text-sm text-gray-400">
                                        Already registered?{' '}
                                        <Link to="/login/doctor" className="font-bold text-[#818CF8] hover:text-white transition-colors border-b border-[#818CF8]/30 hover:border-white pb-0.5">
                                            Sign in to Doctor Portal
                                        </Link>
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">
                                        Are you a patient?{' '}
                                        <Link to="/register" className="font-semibold text-[#00E5FF] hover:text-white transition-colors">
                                            Register as Patient →
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Medical Terms / Research Policy Modal */}
            <AnimatePresence>
                {showPolicyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#13132B] border border-[#818CF8]/30 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-[#818CF8]" />
                                    {showPolicyModal === 'terms' ? 'Medical Professional Terms' : 'DermaScan AI Research Policy'}
                                </h3>
                                <button
                                    onClick={() => setShowPolicyModal(null)}
                                    className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="text-xs text-gray-300 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {showPolicyModal === 'terms' ? (
                                    <>
                                        <p><strong>1. Professional Licensure:</strong> By creating a verified clinician account, you attest that your medical credentials and licensing details provided are authentic, current, and in good standing with your governing medical board.</p>
                                        <p><strong>2. Clinical Oversight:</strong> DermaScan AI acts as an algorithmic decision-support tool. Final diagnostic assessments, prescriptions, and follow-up clinical plans remain solely the responsibility of the licensed practitioner.</p>
                                        <p><strong>3. Confidentiality & Telemedicine:</strong> All patient consultations and records accessed through the Doctor Portal are subject to applicable health privacy statutes (HIPAA/GDPR). Practitioners must maintain strict patient confidentiality.</p>
                                    </>
                                ) : (
                                    <>
                                        <p><strong>1. Anonymized Research Datasets:</strong> Aggregated, de-identified dermatological imagery may be utilized to benchmark neural network confidence scores and reduce demographic disparity in lesion detection.</p>
                                        <p><strong>2. Opt-Out Protections:</strong> Patients retain full authority to exclude their diagnostic data from collaborative algorithmic training benchmarks at any time without impairment of service.</p>
                                        <p><strong>3. Model Governance & Peer Review:</strong> All model weights, validation benchmarks, and sensitivity/specificity matrices are audited against established clinical datasets (such as ISIC) before clinical deployment.</p>
                                    </>
                                )}
                            </div>
                            <div className="pt-3 border-t border-white/10 flex justify-end">
                                <button
                                    onClick={() => setShowPolicyModal(null)}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#818CF8] to-[#6366F1] text-white text-xs font-bold shadow-lg hover:shadow-indigo-500/25 transition-all"
                                >
                                    Understood
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Shimmer animation config */}
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default DoctorRegister;
