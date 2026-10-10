import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, ShieldCheck, Activity, CheckCircle2, ChevronRight, Zap, Calendar, Users, Droplets, Phone, Globe, AlertCircle, Upload, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        dob: '',
        sex: '',
        skinType: '',
        phone: '',
        country: '',
        primaryConcern: '',
        hadSkinCancer: null as boolean | null,
    });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [profilePhotoName, setProfilePhotoName] = useState<string | null>(null);
    const [showTermsModal, setShowTermsModal] = useState<string | null>(null);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePhotoName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const concernOptions = ['Mole Check', 'Rash', 'Acne', 'Pigmentation', 'Other'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculateStrength = (pass: string) => {
        let score = 0;
        if (pass.length > 5) score += 25;
        if (pass.length > 8) score += 25;
        if (/[A-Z]/.test(pass)) score += 25;
        if (/[0-9]/.test(pass)) score += 25;
        return score;
    };

    const strength = calculateStrength(formData.password);

    const nextStep = () => {
        if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
            alert("Please fill in all basic account details.");
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
            alert("You must agree to the Medical Terms & Privacy Policy.");
            return;
        }

        setIsLoading(true);
        try {
            // @ts-ignore
            const response = await import('../../services/api').then(module => module.default.post('/auth/register', {
                name: formData.fullName,
                email: formData.email,
                password: formData.password,
                dob: formData.dob,
                gender: formData.sex,
                skin_type: formData.skinType,
                phone: formData.phone,
                country: formData.country,
                primary_concern: formData.primaryConcern,
                had_skin_cancer: formData.hadSkinCancer,
            }));

            const { email: registeredEmail, masked_email } = response.data;
            navigate('/verify-otp', {
                state: {
                    email: registeredEmail || formData.email,
                    masked_email,
                    role: 'patient'
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
            transition: { duration: 0.4, ease: "easeOut" }
        },
        exit: (dir: number) => ({
            x: dir < 0 ? 30 : -30,
            opacity: 0,
            transition: { duration: 0.3, ease: "easeIn" }
        })
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex text-white font-sans overflow-hidden selection:bg-[#06B6D4]/30 relative">

            {/* Global Abstract Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Diagonal mesh/dot overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

                {/* Bioluminescent Orbs */}
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[#06B6D4] blur-[150px] mix-blend-screen"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#3B82F6] blur-[150px] mix-blend-screen"
                />
            </div>

            <div className="w-full flex min-h-screen relative z-10">

                {/* =========================================
                    LEFT PANEL: BRANDING & AI VISUAL
                    ========================================= */}
                <div className="hidden lg:flex w-[45%] xl:w-1/2 flex-col justify-between p-12 lg:p-16 border-r border-white/5 bg-[#0F172A]/40 backdrop-blur-sm relative z-20">

                    {/* Top Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            <ShieldCheck className="w-6 h-6 text-white relative z-10" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            DermaScan <span className="text-[#06B6D4]">AI</span>
                        </span>
                    </div>

                    {/* Center Hero Content */}
                    <div className="relative mt-8">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6"
                        >
                            Scan Smart.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#3B82F6]">Detect Early.</span><br />
                            Live Longer.
                        </motion.h1>

                        <p className="text-lg text-slate-300 max-w-md leading-relaxed mb-12">
                            Join the world's most advanced AI dermatology platform. Instant preliminary analysis for peace of mind.
                        </p>

                        {/* Interactive UI Element Mockup */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="w-full max-w-sm rounded-2xl bg-[#1E293B]/50 backdrop-blur-md border border-[#334155] p-5 shadow-2xl relative overflow-hidden group"
                        >
                            {/* Scanning line animation */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#06B6D4] shadow-[0_0_10px_#06B6D4] z-20 animate-[scan_3s_ease-in-out_infinite]" />

                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-lg bg-[#0F172A] border border-[#06B6D4]/30 flex items-center justify-center relative shadow-[inset_0_0_15px_rgba(6,182,212,0.2)]">
                                    <Activity className="text-[#06B6D4] w-7 h-7" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                                        <span className="text-xs font-semibold text-[#10B981] uppercase tracking-wider">Analysis Complete</span>
                                    </div>
                                    <h3 className="font-bold text-white mb-1">Benign Nevus (Mole)</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-full flex-1 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-[#06B6D4] h-full w-[98%]" />
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium">98% Match</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom Trust Indicators & Quote */}
                    <div className="mt-12 w-full">
                        <div className="flex flex-wrap gap-3 mb-8">
                            {['99% Accuracy', 'ISIC Trained AI', 'HIPAA Aware'].map((badge, i) => (
                                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1E293B] border border-slate-700 text-xs font-medium text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#06B6D4]" />
                                    {badge}
                                </div>
                            ))}
                        </div>

                        <div className="border-l-2 border-[#3B82F6] pl-5 relative before:content-[''] before:absolute before:-left-[2px] before:top-0 before:w-1 before:h-1/3 before:bg-[#06B6D4]">
                            <p className="text-sm text-slate-400 italic mb-2">
                                "DermaScan AI has revolutionized how our patients track their skin changes between appointments. Highly recommended."
                            </p>
                            <p className="text-xs font-bold text-white tracking-wide uppercase">Dr. Emily Chen, Dermatologist</p>
                        </div>
                    </div>
                </div>

                {/* =========================================
                    RIGHT PANEL: REGISTRATION FORM WIZARD
                    ========================================= */}
                <div className="w-full lg:w-[55%] xl:w-1/2 flex items-center justify-center p-6 sm:p-12 xl:p-20 relative z-20 overflow-y-auto custom-scrollbar max-h-screen">

                    {/* Mobile Logo Only */}
                    <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2 z-50">
                        <ShieldCheck className="w-8 h-8 text-[#06B6D4]" />
                        <span className="text-xl font-bold">DermaScan <span className="text-[#06B6D4]">AI</span></span>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-[480px] py-12"
                    >
                        <div className="mb-10 mt-10 md:mt-0">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Create Account</h2>
                            <p className="text-slate-400">
                                Already have an account?{' '}
                                <Link to="/login" className="text-[#06B6D4] font-semibold hover:text-white transition-colors border-b border-[#06B6D4]/30 hover:border-white pb-0.5">
                                    Sign In here
                                </Link>
                            </p>
                        </div>

                        {/* Glass Form Card */}
                        <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-[28px] p-7 sm:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            {/* Soft top-edge light */}
                            <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/50 to-transparent" />

                            {/* WIZARD HEADER & PROGRESS */}
                            <div className="flex items-center justify-between mb-8">
                                {step === 2 ? (
                                    <button onClick={prevStep} type="button" className="text-sm border border-transparent font-semibold text-slate-400 hover:text-white flex items-center transition-colors group px-2 py-1 -ml-2 rounded-lg hover:bg-white/5">
                                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                                        Back
                                    </button>
                                ) : (
                                    <div className="w-[72px]" /> /* spacer */
                                )}

                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-widest mb-2.5">
                                        Step {step} of 2
                                    </span>
                                    <div className="flex items-center gap-2.5">
                                        <div className={`h-1.5 rounded-full transition-all duration-500 ease-out ${step >= 1 ? 'w-8 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'w-4 bg-slate-700/60'}`} />
                                        <div className={`h-1.5 rounded-full transition-all duration-500 ease-out ${step >= 2 ? 'w-8 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'w-4 bg-slate-700/60'}`} />
                                    </div>
                                </div>

                                <div className="w-[72px]" /> /* spacer */
                            </div>

                            <form onSubmit={handleSubmit} className="relative">
                                <AnimatePresence mode="wait" custom={direction}>

                                    {/* ================= STEP 1: ACCOUNT SETUP ================= */}
                                    {step === 1 && (
                                        <motion.div
                                            key="step1"
                                            custom={direction}
                                            variants={slideVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="space-y-5"
                                        >
                                            {/* Full Name Input */}
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <User className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                                </div>
                                                <input
                                                    id="fullName"
                                                    name="fullName"
                                                    type="text"
                                                    required
                                                    value={formData.fullName}
                                                    onChange={handleChange}
                                                    className="peer w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700/60 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/30 transition-all font-medium shadow-inner"
                                                    placeholder="Full Name"
                                                />
                                                <label htmlFor="fullName" className="absolute left-12 -top-2.5 px-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#1E293B] rounded peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-4 peer-placeholder-shown:uppercase-none peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#06B6D4] peer-focus:uppercase tracking-wider transition-all cursor-text pointer-events-none">
                                                    Full Name
                                                </label>
                                            </div>

                                            {/* Email Input */}
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                                </div>
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="peer w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700/60 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/30 transition-all font-medium shadow-inner"
                                                    placeholder="Email Address"
                                                />
                                                <label htmlFor="email" className="absolute left-12 -top-2.5 px-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#1E293B] rounded peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-4 peer-placeholder-shown:uppercase-none peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#06B6D4] peer-focus:uppercase tracking-wider transition-all cursor-text pointer-events-none">
                                                    Email Address
                                                </label>
                                            </div>

                                            {/* Password Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                                    </div>
                                                    <input
                                                        id="password"
                                                        name="password"
                                                        type="password"
                                                        required
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        className="peer w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700/60 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/30 transition-all font-medium shadow-inner"
                                                        placeholder="Password"
                                                    />
                                                    <label htmlFor="password" className="absolute left-12 -top-2.5 px-1.5 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#1E293B] rounded peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-4 peer-placeholder-shown:uppercase-none peer-focus:-top-2.5 peer-focus:text-[10px] sm:peer-focus:text-xs peer-focus:text-[#06B6D4] peer-focus:uppercase tracking-wider transition-all cursor-text pointer-events-none">
                                                        Password
                                                    </label>
                                                </div>

                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                                    </div>
                                                    <input
                                                        id="confirmPassword"
                                                        name="confirmPassword"
                                                        type="password"
                                                        required
                                                        value={formData.confirmPassword}
                                                        onChange={handleChange}
                                                        className="peer w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700/60 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/30 transition-all font-medium shadow-inner"
                                                        placeholder="Confirm"
                                                    />
                                                    <label htmlFor="confirmPassword" className="absolute left-12 -top-2.5 px-1.5 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#1E293B] rounded peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-4 peer-placeholder-shown:uppercase-none peer-focus:-top-2.5 peer-focus:text-[10px] sm:peer-focus:text-xs peer-focus:text-[#06B6D4] peer-focus:uppercase tracking-wider transition-all cursor-text pointer-events-none">
                                                        Confirm
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Password Strength Bar */}
                                            {formData.password && (
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                                                        <span>Password Strength</span>
                                                        <span>{strength <= 25 ? 'Weak' : strength <= 50 ? 'Fair' : strength <= 75 ? 'Good' : 'Strong'}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                                                        <div className={`h-full transition-all duration-300 ${strength > 0 ? (strength <= 25 ? 'bg-red-500 w-1/4' : strength <= 50 ? 'bg-yellow-500 w-2/4' : strength <= 75 ? 'bg-blue-500 w-3/4' : 'bg-[#10B981] w-full') : 'w-0'}`} />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-6">
                                                <button
                                                    type="button"
                                                    onClick={nextStep}
                                                    className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] hover:from-[#0891b2] hover:to-[#2563eb] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5 transition-all overflow-hidden group relative"
                                                >
                                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                                    Continue
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ================= STEP 2: PATIENT PROFILE ================= */}
                                    {step === 2 && (
                                        <motion.div
                                            key="step2"
                                            custom={direction}
                                            variants={slideVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="space-y-5"
                                        >
                                            {/* Extra Information Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                {/* Date of Birth Input */}
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Calendar className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                                    </div>
                                                    <input
                                                        id="dob"
                                                        name="dob"
                                                        type="date"
                                                        required
                                                        value={formData.dob}
                                                        onChange={handleChange}
                                                        className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700/60 rounded-xl text-white focus:outline-none focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/30 transition-all font-medium shadow-inner sm:text-sm"
                                                    />
                                                    <label htmlFor="dob" className="absolute left-12 -top-2.5 px-1.5 text-[10px] sm:text-xs font-semibold text-[#06B6D4] uppercase tracking-wider bg-[#1E293B] border border-[#0F172A] rounded transition-all pointer-events-none">
                                                        Date of Birth
                                                    </label>
                                                </div>

                                                {/* Biological Sex Select */}
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Users className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                                    </div>
                                                    <select
                                                        name="sex"
                                                        required
                                                        value={formData.sex}
                                                        onChange={handleChange}
                                                        className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700/60 rounded-xl text-white focus:outline-none focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/30 transition-all font-medium shadow-inner appearance-none sm:text-sm"
                                                    >
                                                        <option value="" disabled hidden>Select Sex</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Intersex">Intersex</option>
                                                        <option value="Prefer not to say">Prefer not to say</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                        <ChevronRight className="h-4 w-4 text-slate-500 rotate-90" />
                                                    </div>
                                                    <label className="absolute left-12 -top-2.5 px-1.5 text-[10px] sm:text-xs font-semibold text-[#06B6D4] uppercase tracking-wider bg-[#1E293B] border border-[#0F172A] rounded transition-all pointer-events-none">
                                                        Biological Sex
                                                    </label>
                                                </div>

                                                {/* Skin Type Select */}
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Droplets className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                                    </div>
                                                    <select
                                                        name="skinType"
                                                        required
                                                        value={formData.skinType}
                                                        onChange={handleChange}
                                                        className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700/60 rounded-xl text-white focus:outline-none focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/30 transition-all font-medium shadow-inner appearance-none sm:text-sm"
                                                    >
                                                        <option value="" disabled hidden>Select Skin Type</option>
                                                        {['Fitzpatrick I', 'Fitzpatrick II', 'Fitzpatrick III', 'Fitzpatrick IV', 'Fitzpatrick V', 'Fitzpatrick VI'].map(t => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                        <ChevronRight className="h-4 w-4 text-slate-500 rotate-90" />
                                                    </div>
                                                    <label className="absolute left-12 -top-2.5 px-1.5 text-[10px] sm:text-xs font-semibold text-[#06B6D4] uppercase tracking-wider bg-[#1E293B] border border-[#0F172A] rounded transition-all pointer-events-none">
                                                        Skin Type
                                                    </label>
                                                </div>

                                                {/* Phone Number Input */}
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Phone className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                                    </div>
                                                    <input
                                                        id="phone"
                                                        name="phone"
                                                        type="tel"
                                                        required
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        className="peer w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700/60 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/30 transition-all font-medium shadow-inner sm:text-sm"
                                                        placeholder="Phone Number"
                                                    />
                                                    <label htmlFor="phone" className="absolute left-12 -top-2.5 px-1.5 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#1E293B] rounded peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-4 peer-placeholder-shown:normal-case peer-focus:-top-2.5 peer-focus:text-[10px] sm:peer-focus:text-xs peer-focus:text-[#06B6D4] peer-focus:uppercase tracking-wider transition-all cursor-text pointer-events-none">
                                                        Phone Number
                                                    </label>
                                                </div>

                                                {/* Country Select */}
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Globe className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                                    </div>
                                                    <select
                                                        name="country"
                                                        required
                                                        value={formData.country}
                                                        onChange={handleChange}
                                                        className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700/60 rounded-xl text-white focus:outline-none focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/30 transition-all font-medium shadow-inner appearance-none sm:text-sm"
                                                    >
                                                        <option value="" disabled hidden>Select Country</option>
                                                        {['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Japan', 'Other'].map(t => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                        <ChevronRight className="h-4 w-4 text-slate-500 rotate-90" />
                                                    </div>
                                                    <label className="absolute left-12 -top-2.5 px-1.5 text-[10px] sm:text-xs font-semibold text-[#06B6D4] uppercase tracking-wider bg-[#1E293B] border border-[#0F172A] rounded transition-all pointer-events-none">
                                                        Country / Region
                                                    </label>
                                                </div>

                                                {/* Primary Concern Select */}
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <AlertCircle className="h-5 w-5 text-slate-500 group-focus-within:text-[#06B6D4] transition-colors" />
                                                    </div>
                                                    <select
                                                        name="primaryConcern"
                                                        required
                                                        value={formData.primaryConcern}
                                                        onChange={handleChange}
                                                        className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700/60 rounded-xl text-white focus:outline-none focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/30 transition-all font-medium shadow-inner appearance-none sm:text-sm"
                                                    >
                                                        <option value="" disabled hidden>Select Concern</option>
                                                        {concernOptions.map(t => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                        <ChevronRight className="h-4 w-4 text-slate-500 rotate-90" />
                                                    </div>
                                                    <label className="absolute left-12 -top-2.5 px-1.5 text-[10px] sm:text-xs font-semibold text-[#06B6D4] uppercase tracking-wider bg-[#1E293B] border border-[#0F172A] rounded transition-all pointer-events-none">
                                                        Primary Concern
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Skin Cancer Toggle */}
                                            <div className="relative group bg-[#0F172A] border border-slate-700/60 rounded-xl p-4 shadow-inner">
                                                <label className="block text-sm font-semibold text-slate-300 mb-3">Have you had skin cancer before?</label>
                                                <div className="flex gap-4">
                                                    <button type="button" onClick={() => setFormData({ ...formData, hadSkinCancer: true })} className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${formData.hadSkinCancer === true ? 'border-[#06B6D4] bg-[#06B6D4]/10 text-[#06B6D4]' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'}`}>Yes</button>
                                                    <button type="button" onClick={() => setFormData({ ...formData, hadSkinCancer: false })} className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${formData.hadSkinCancer === false ? 'border-[#06B6D4] bg-[#06B6D4]/10 text-[#06B6D4]' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'}`}>No</button>
                                                </div>
                                            </div>

                                            {/* Upload Profile Photo */}
                                            <div className="relative group">
                                                {profilePhoto ? (
                                                    <div className="flex items-center justify-between p-3 rounded-xl border border-[#06B6D4]/40 bg-[#0F172A]">
                                                        <div className="flex items-center gap-3">
                                                            <img src={profilePhoto} alt="Profile" className="w-12 h-12 rounded-lg object-cover border border-[#06B6D4]/50" />
                                                            <div className="text-left">
                                                                <p className="text-xs font-semibold text-white truncate max-w-[180px]">{profilePhotoName || 'Photo selected'}</p>
                                                                <span className="text-[10px] text-emerald-400">Photo attached</span>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => { setProfilePhoto(null); setProfilePhotoName(null); }}
                                                            className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-full h-20 sm:h-24 border-2 border-slate-700/60 border-dashed rounded-xl cursor-pointer bg-[#0F172A] hover:bg-[#1E293B]/50 hover:border-[#06B6D4]/50 transition-all group-hover:shadow-inner">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 mb-2 group-hover:text-[#06B6D4] transition-colors" />
                                                            <p className="text-xs sm:text-sm text-slate-400 font-medium group-hover:text-slate-300">
                                                                <span className="text-[#06B6D4] font-semibold">Upload Profile Photo</span> (Optional)
                                                            </p>
                                                        </div>
                                                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                                    </label>
                                                )}
                                            </div>

                                            {/* Terms Checkbox */}
                                            <div className="pt-2">
                                                <label className="flex items-start gap-3 cursor-pointer group">
                                                    <div className="relative flex items-start pt-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={agreed}
                                                            onChange={(e) => setAgreed(e.target.checked)}
                                                            className="peer appearance-none w-5 h-5 border-2 border-slate-600 rounded bg-[#0F172A] checked:bg-[#06B6D4] checked:border-[#06B6D4] transition-colors cursor-pointer shrink-0"
                                                        />
                                                        <svg className="absolute top-1 left-0 w-5 h-5 text-[#0F172A] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity p-1" viewBox="0 0 14 10" fill="none">
                                                            <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                                                        I agree to the <button type="button" onClick={() => setShowTermsModal('terms')} className="font-semibold text-[#06B6D4] hover:underline inline text-left">Medical Terms of Service</button> and acknowledge the <button type="button" onClick={() => setShowTermsModal('hipaa')} className="font-semibold text-[#3B82F6] hover:underline inline text-left">HIPAA Privacy Policy</button>.
                                                    </span>
                                                </label>
                                            </div>

                                            {/* Submit Button */}
                                            <div className="pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] hover:from-[#0891b2] hover:to-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50 focus:ring-offset-2 focus:ring-offset-[#1E293B] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group relative"
                                                >
                                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />

                                                    {isLoading ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Zap className="w-4 h-4 fill-white/20" />
                                                            ✦ Create My Account
                                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                        </div>

                        {/* Footer Doctor Link */}
                        <div className="mt-8 text-center bg-[#1E293B]/30 backdrop-blur-md border border-slate-700/50 rounded-xl py-4 flex items-center justify-center gap-2">
                            <span className="text-sm text-slate-400">Are you a medical professional?</span>
                            <Link to="/register-doctor" className="text-sm font-bold text-[#3B82F6] hover:text-[#60a5fa] transition-colors flex items-center group">
                                Register Clinic
                                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                    </motion.div>
                </div>
            </div>

            {/* Terms / HIPAA Policy Modal */}
            <AnimatePresence>
                {showTermsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0F172A] border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-[#06B6D4]" />
                                    {showTermsModal === 'terms' ? 'Medical Terms of Service' : 'HIPAA Privacy Policy'}
                                </h3>
                                <button 
                                    onClick={() => setShowTermsModal(null)}
                                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="text-xs text-slate-300 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {showTermsModal === 'terms' ? (
                                    <>
                                        <p><strong>1. Diagnostic Disclaimer:</strong> DermaScan AI is an assistive pre-screening tool powered by convolutional neural networks. It does NOT provide definitive medical diagnoses and does not replace in-person dermatological evaluation.</p>
                                        <p><strong>2. Emergency Situations:</strong> If you suspect acute infection, rapid tissue necrosis, or bleeding lesions, immediately seek emergency medical attention.</p>
                                        <p><strong>3. Data Privacy:</strong> User scans and clinical evaluations are stored under strict role-based access control and are only accessible by you and authorized healthcare providers you choose to consult.</p>
                                    </>
                                ) : (
                                    <>
                                        <p><strong>1. Protected Health Information (PHI):</strong> All patient health records, images, and consultation history are encrypted in transit via TLS 1.3 and at rest with AES-256 standard encryption.</p>
                                        <p><strong>2. Consent & Sharing:</strong> Your medical images are never shared with third parties or external commercial entities without your explicit consent.</p>
                                        <p><strong>3. Right to Erasure:</strong> You maintain full ownership of your clinical records and can permanently delete your account and associated scans from Account Settings at any time.</p>
                                    </>
                                )}
                            </div>
                            <div className="pt-3 border-t border-slate-800 flex justify-end">
                                <button 
                                    onClick={() => setShowTermsModal(null)}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] text-white text-xs font-bold shadow-lg"
                                >
                                    Understood
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Global Styles injected for scanning animation */}
            <style>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                
                /* Hide scrollbar for the right panel but allow scrolling */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(6, 182, 212, 0.2);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(6, 182, 212, 0.5);
                }
            `}</style>
        </div>
    );
};

export default Register;
