import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Stethoscope, Users, BarChart3, MessageSquare, ShieldCheck, BrainCircuit,
    ArrowRight, Sparkles, Menu, X, Activity, Clock, CalendarCheck,
    Lock, Upload, Cpu, ClipboardCheck, Star, ChevronRight,
    CheckCircle, Zap, Eye, Heart
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Section animation helpers
   ───────────────────────────────────────────── */
const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const staggerContainer = {
    visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

/* ─────────────────────────────────────────────
   Data
   ───────────────────────────────────────────── */
const features = [
    { icon: BrainCircuit, title: 'AI Scan Analysis', desc: 'Leverage deep-learning models trained on 100K+ clinical images to get instant, dermatologist-level analysis for every patient scan.', color: 'from-[#818CF8] to-[#6366F1]' },
    { icon: Users, title: 'Patient Management', desc: 'Track patient histories, monitor treatment progress, and manage consultation queues — all from a single unified dashboard.', color: 'from-[#F472B6] to-[#EC4899]' },
    { icon: Activity, title: 'Consultation Dashboard', desc: 'Review pending cases, submit diagnoses, and prescribe treatments with AI-assisted recommendations in real time.', color: 'from-[#34D399] to-[#10B981]' },
    { icon: BarChart3, title: 'Clinical Analytics', desc: 'Visualize trends, track diagnosis accuracy, and gain data-driven insights into your practice performance over time.', color: 'from-[#FBBF24] to-[#F59E0B]' },
    { icon: MessageSquare, title: 'Secure Messaging', desc: 'Communicate with patients through end-to-end encrypted chat with image sharing, voice notes, and file attachments.', color: 'from-[#60A5FA] to-[#3B82F6]' },
    { icon: CalendarCheck, title: 'Smart Scheduling', desc: 'Automated appointment management with conflict detection, reminders, and patient self-booking capabilities.', color: 'from-[#A78BFA] to-[#7C3AED]' },
];

const steps = [
    { icon: Upload, num: '01', title: 'Patient Uploads Scan', desc: 'Patients upload a photo of their skin concern through the mobile-friendly interface. The AI instantly begins processing.' },
    { icon: Cpu, num: '02', title: 'AI Analyzes & Flags', desc: 'Our deep-learning engine classifies the condition, assigns a confidence score, and flags high-risk cases for immediate review.' },
    { icon: ClipboardCheck, num: '03', title: 'Doctor Reviews & Diagnoses', desc: 'You review the AI analysis alongside the original image, provide your expert diagnosis, and send treatment recommendations.' },
];

const testimonials = [
    { name: 'Dr. Priya Sharma', specialty: 'Dermatologist, Apollo Hospitals', quote: 'DermaScan AI has transformed my practice. The AI pre-screening saves me 3+ hours daily, and the diagnostic accuracy is remarkable.', rating: 5 },
    { name: 'Dr. Rajesh Patel', specialty: 'Skin Specialist, Fortis Healthcare', quote: 'The consultation dashboard is incredibly intuitive. I can manage 40+ patients per day with confidence, knowing the AI has my back.', rating: 5 },
    { name: 'Dr. Ananya Reddy', specialty: 'Cosmetic Dermatologist', quote: 'My patients love the instant AI analysis, and the secure messaging makes follow-ups seamless. A game-changer for modern dermatology.', rating: 5 },
];

/* ─────────────────────────────────────────────
   Component
   ───────────────────────────────────────────── */
const DoctorLanding: React.FC = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navLinks = [
        { label: 'Features', href: '#features' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Testimonials', href: '#testimonials' },
    ];

    return (
        <div className="min-h-screen bg-[#07071A] text-white overflow-x-hidden selection:bg-[#818CF8]/30 selection:text-white">

            {/* ════════════ Ambient Background ════════════ */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at center, #818CF8 1.5px, transparent 1.5px)`, backgroundSize: '28px 28px' }} />
                <div className="absolute top-[-20%] left-[-15%] w-[70vw] h-[70vw] bg-[#6366F1]/5 rounded-full blur-[200px]" />
                <div className="absolute bottom-[-30%] right-[-10%] w-[60vw] h-[60vw] bg-[#818CF8]/5 rounded-full blur-[200px]" />
            </div>

            {/* ════════════ SECTION 1: Navbar ════════════ */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#07071A]/80 backdrop-blur-xl border-b border-white/5 shadow-lg' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#818CF8]/20 to-[#6366F1]/20 border border-[#818CF8]/30 flex items-center justify-center shadow-[0_0_15px_rgba(129,140,248,0.2)] group-hover:shadow-[0_0_25px_rgba(129,140,248,0.35)] transition-shadow">
                                <Stethoscope className="w-5 h-5 text-[#818CF8]" />
                            </div>
                            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                DermaScan <span className="text-[#818CF8]">AI</span>
                            </span>
                        </button>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map(link => (
                                <a key={link.label} href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors font-medium">
                                    {link.label}
                                </a>
                            ))}
                            <button onClick={() => navigate('/login/doctor')} className="text-sm font-semibold text-[#818CF8] hover:text-white transition-colors border-b border-[#818CF8]/30 hover:border-white pb-0.5">
                                Sign In
                            </button>
                            <button onClick={() => navigate('/register-doctor')} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#818CF8] to-[#6366F1] shadow-[0_0_20px_rgba(129,140,248,0.3)] hover:shadow-[0_0_35px_rgba(129,140,248,0.5)] hover:-translate-y-0.5 transition-all relative overflow-hidden group">
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                Get Started
                            </button>
                        </div>

                        {/* Mobile Toggle */}
                        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-gray-400 hover:text-white p-2">
                            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-[#07071A]/95 backdrop-blur-xl border-b border-white/10 px-4 pb-6">
                        {navLinks.map(link => (
                            <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="block py-3 text-gray-300 hover:text-[#818CF8] font-medium transition-colors">
                                {link.label}
                            </a>
                        ))}
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => navigate('/login/doctor')} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[#818CF8]/30 text-[#818CF8] hover:bg-[#818CF8]/10 transition-colors">
                                Sign In
                            </button>
                            <button onClick={() => navigate('/register-doctor')} className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#818CF8] to-[#6366F1]">
                                Get Started
                            </button>
                        </div>
                    </motion.div>
                )}
            </nav>

            {/* ════════════ SECTION 2: Hero ════════════ */}
            <section className="relative z-10 pt-32 pb-20 lg:pt-40 lg:pb-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left — Copy */}
                    <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/25 mb-6">
                            <Sparkles className="w-4 h-4 text-[#818CF8]" />
                            <span className="text-xs font-semibold text-[#818CF8] uppercase tracking-wider">For Dermatologists & Physicians</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.1] mb-6">
                            AI-Powered{' '}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#818CF8] via-[#a78bfa] to-[#6366F1]">
                                Dermatology
                            </span>
                            <br />Practice Management
                        </h1>

                        <p className="text-lg text-gray-400 leading-relaxed max-w-lg mb-8">
                            Streamline your clinical workflow with AI-assisted skin analysis, intelligent patient management, and data-driven insights — all in one secure platform.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <button onClick={() => navigate('/register-doctor')} className="group flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#818CF8] to-[#6366F1] shadow-[0_0_30px_rgba(129,140,248,0.35)] hover:shadow-[0_0_50px_rgba(129,140,248,0.55)] hover:-translate-y-1 transition-all relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                <span className="relative z-10 flex items-center gap-2">
                                    Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                            <button onClick={() => navigate('/login/doctor')} className="px-8 py-4 rounded-2xl text-base font-semibold border border-white/15 hover:border-[#818CF8]/50 hover:bg-[#818CF8]/5 transition-all backdrop-blur-sm">
                                Sign In to Dashboard
                            </button>
                        </div>

                        {/* Trust Stats */}
                        <div className="flex items-center gap-8 text-sm">
                            {[
                                { value: '500+', label: 'Doctors Trust Us' },
                                { value: '50K+', label: 'Scans Analyzed' },
                                { value: '99%', label: 'AI Accuracy' },
                            ].map((stat, i) => (
                                <React.Fragment key={stat.label}>
                                    {i > 0 && <div className="w-px h-10 bg-white/10" />}
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-gray-500 text-xs">{stat.label}</p>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right — Animated Dashboard Preview */}
                    <motion.div initial={{ opacity: 0, x: 40, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative hidden lg:block">
                        {/* Glow */}
                        <div className="absolute -inset-8 bg-[#818CF8]/8 rounded-[40px] blur-[60px]" />

                        <div className="relative bg-[#0D0D20]/80 backdrop-blur-2xl rounded-[28px] border border-white/10 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
                            {/* Mini Titlebar */}
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                <span className="ml-3 text-xs text-gray-500 font-mono">Doctor Dashboard — DermaScan AI</span>
                            </div>

                            {/* Fake Stats Row */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {[
                                    { label: 'Pending', val: '12', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                                    { label: 'Completed', val: '47', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                                    { label: 'AI Accuracy', val: '98.5%', color: 'text-[#818CF8]', bg: 'bg-[#818CF8]/10', border: 'border-[#818CF8]/20' },
                                ].map(s => (
                                    <div key={s.label} className={`rounded-xl ${s.bg} border ${s.border} p-3`}>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                                        <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Fake Consultation List */}
                            <div className="space-y-2.5">
                                {[
                                    { name: 'Rahul M.', cond: 'Melanocytic Nevi', conf: '94%', status: 'Pending', statusColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
                                    { name: 'Sneha K.', cond: 'Dermatofibroma', conf: '87%', status: 'Reviewed', statusColor: 'text-green-400 bg-green-500/10 border-green-500/20' },
                                    { name: 'Amit J.', cond: 'Basal Cell Carcinoma', conf: '96%', status: 'Urgent', statusColor: 'text-red-400 bg-red-500/10 border-red-500/20' },
                                ].map((p, i) => (
                                    <motion.div key={p.name} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.15 }}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#818CF8]/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#818CF8]/20 to-[#6366F1]/20 flex items-center justify-center text-xs font-bold text-[#818CF8]">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">{p.name}</p>
                                                <p className="text-[11px] text-gray-500">{p.cond} · {p.conf}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${p.statusColor}`}>{p.status}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Floating badges */}
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            className="absolute -top-4 -right-4 bg-[#0D0D20]/90 backdrop-blur-xl border border-[#818CF8]/30 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#818CF8]/15 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-[#818CF8]" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400">AI Processing</p>
                                    <p className="text-xs font-bold text-[#818CF8]">3 Scans Queued</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
                            className="absolute -bottom-3 -left-6 bg-[#0D0D20]/90 backdrop-blur-xl border border-green-500/30 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <div>
                                    <p className="text-xs font-semibold text-white">Diagnosis Sent</p>
                                    <p className="text-[10px] text-gray-400">Patient notified ✓</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ════════════ SECTION 3: Features Grid ════════════ */}
            <section id="features" className="relative z-10 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                        className="text-center mb-16">
                        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#818CF8] mb-4 px-4 py-1.5 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/20">
                            Powerful Features
                        </span>
                        <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold mb-4">
                            Everything You Need to{' '}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#818CF8] to-[#6366F1]">Practice Smarter</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                            From AI-powered diagnostics to seamless patient communication, DermaScan AI gives you a complete clinical toolkit.
                        </p>
                    </motion.div>

                    <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((feat) => {
                            const Icon = feat.icon;
                            return (
                                <motion.div key={feat.title} variants={cardVariants}
                                    className="group relative rounded-[24px] bg-[#0D0D20]/60 backdrop-blur-xl border border-white/[0.06] p-7 hover:border-[#818CF8]/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(129,140,248,0.08)] hover:-translate-y-1">
                                    {/* Hover gradient overlay */}
                                    <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#818CF8]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    {/* Top edge highlight */}
                                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#818CF8]/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{feat.title}</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* ════════════ SECTION 4: How It Works ════════════ */}
            <section id="how-it-works" className="relative z-10 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                        className="text-center mb-16">
                        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#818CF8] mb-4 px-4 py-1.5 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/20">
                            Simple Workflow
                        </span>
                        <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold mb-4">
                            How It{' '}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#818CF8] to-[#6366F1]">Works</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                            A streamlined 3-step process from patient upload to your expert diagnosis.
                        </p>
                    </motion.div>

                    <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">

                        {/* Connector lines (desktop) */}
                        <div className="hidden md:block absolute top-[72px] left-[calc(33.33%+12px)] right-[calc(33.33%+12px)] h-px">
                            <div className="w-full h-full bg-gradient-to-r from-[#818CF8]/40 via-[#818CF8]/20 to-[#818CF8]/40" />
                        </div>

                        {steps.map((step) => {
                            const Icon = step.icon;
                            return (
                                <motion.div key={step.num} variants={cardVariants}
                                    className="relative text-center group">
                                    {/* Step number ring */}
                                    <div className="relative inline-flex items-center justify-center w-[88px] h-[88px] rounded-full bg-[#0D0D20] border-2 border-[#818CF8]/20 mb-6 group-hover:border-[#818CF8]/50 transition-colors shadow-[0_0_30px_rgba(129,140,248,0.1)] group-hover:shadow-[0_0_40px_rgba(129,140,248,0.2)]">
                                        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#818CF8]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Icon className="w-8 h-8 text-[#818CF8] relative z-10" />
                                        <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-[#818CF8] to-[#6366F1] flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                                            {step.num}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* ════════════ SECTION 5: Dashboard Preview ════════════ */}
            <section className="relative z-10 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                        className="text-center mb-16">
                        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#818CF8] mb-4 px-4 py-1.5 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/20">
                            Your Command Center
                        </span>
                        <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold mb-4">
                            A Dashboard Built for{' '}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#818CF8] to-[#6366F1]">Clinicians</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                            Purpose-built interface that puts AI analysis, patient data, and clinical tools at your fingertips.
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 60, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.8 }}
                        className="relative">
                        {/* Outer glow */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#818CF8]/10 via-[#6366F1]/5 to-[#818CF8]/10 rounded-[36px] blur-[30px]" />

                        <div className="relative bg-[#0D0D20]/70 backdrop-blur-2xl rounded-[28px] border border-white/10 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
                            {/* Titlebar */}
                            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-[#07071A]/50">
                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                <span className="ml-4 text-xs text-gray-500 font-mono">DermaScan AI — Doctor Consultation Dashboard</span>
                            </div>

                            <div className="p-6 lg:p-8">
                                {/* Stats */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                    {[
                                        { title: 'Total Patients', value: '1,247', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                                        { title: 'Pending Cases', value: '12', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                                        { title: 'Completed', value: '847', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                                        { title: 'AI Accuracy', value: '98.5%', icon: BrainCircuit, color: 'text-[#818CF8]', bg: 'bg-[#818CF8]/10', border: 'border-[#818CF8]/20' },
                                    ].map(stat => (
                                        <div key={stat.title} className={`p-4 rounded-2xl ${stat.bg} border ${stat.border} flex items-center justify-between`}>
                                            <div>
                                                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">{stat.title}</p>
                                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                            </div>
                                            <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
                                        </div>
                                    ))}
                                </div>

                                {/* Two columns */}
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                    {/* Patient list */}
                                    <div className="lg:col-span-2 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                                        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                            <Users className="w-4 h-4 text-[#818CF8]" /> Active Requests
                                            <span className="ml-auto text-[10px] text-[#818CF8] bg-[#818CF8]/10 px-2 py-0.5 rounded-full border border-[#818CF8]/20">12 New</span>
                                        </h4>
                                        <div className="space-y-2">
                                            {[
                                                { name: 'Rahul Mehta', condition: 'Melanocytic Nevi', time: '2 min ago', badge: 'Pending', badgeColor: 'text-yellow-400' },
                                                { name: 'Sneha Kapoor', condition: 'Dermatofibroma', time: '15 min ago', badge: 'Reviewed', badgeColor: 'text-green-400' },
                                                { name: 'Amit Joshi', condition: 'Basal Cell Carcinoma', time: '1 hr ago', badge: 'Urgent', badgeColor: 'text-red-400' },
                                                { name: 'Priya S.', condition: 'Actinic Keratoses', time: '2 hr ago', badge: 'Pending', badgeColor: 'text-yellow-400' },
                                            ].map(p => (
                                                <div key={p.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#818CF8]/15 transition-colors">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-[#818CF8]/10 flex items-center justify-center text-[10px] font-bold text-[#818CF8]">
                                                            {p.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-white">{p.name}</p>
                                                            <p className="text-[10px] text-gray-500">{p.condition} · {p.time}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[9px] font-bold ${p.badgeColor}`}>{p.badge}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* AI Analysis panel */}
                                    <div className="lg:col-span-3 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                                        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                            <BrainCircuit className="w-4 h-4 text-[#818CF8]" /> AI Analysis Engine
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                                                <p className="text-[10px] text-gray-500 uppercase mb-1">Detected Condition</p>
                                                <p className="text-sm font-bold text-white">Melanocytic Nevi</p>
                                            </div>
                                            <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                                                <p className="text-[10px] text-gray-500 uppercase mb-1">Confidence</p>
                                                <p className="text-sm font-bold text-[#818CF8]">94%</p>
                                            </div>
                                        </div>
                                        <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                                            <div className="flex justify-between text-[10px] mb-2">
                                                <span className="text-gray-400">Risk Indicator</span>
                                                <span className="text-green-400 font-semibold uppercase">Low Risk</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full w-[20%] bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 rounded-xl bg-[#818CF8]/5 border border-[#818CF8]/15">
                                            <p className="text-[10px] text-gray-400 uppercase mb-1">AI Recommendation</p>
                                            <p className="text-xs text-gray-300 leading-relaxed">Benign melanocytic lesion. No immediate intervention required. Recommend routine monitoring at 6-month intervals with dermoscopic imaging.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ════════════ SECTION 6: Testimonials ════════════ */}
            <section id="testimonials" className="relative z-10 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                        className="text-center mb-16">
                        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#818CF8] mb-4 px-4 py-1.5 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/20">
                            Trusted by Physicians
                        </span>
                        <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold mb-4">
                            What Doctors{' '}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#818CF8] to-[#6366F1]">Say</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                            Hear from dermatologists who have transformed their practice with DermaScan AI.
                        </p>
                    </motion.div>

                    <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t) => (
                            <motion.div key={t.name} variants={cardVariants}
                                className="group relative rounded-[24px] bg-[#0D0D20]/60 backdrop-blur-xl border border-white/[0.06] p-7 hover:border-[#818CF8]/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(129,140,248,0.08)] hover:-translate-y-1">
                                <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#818CF8]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="relative z-10">
                                    {/* Stars */}
                                    <div className="flex gap-1 mb-4">
                                        {Array.from({ length: t.rating }).map((_, i) => (
                                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        ))}
                                    </div>

                                    <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>

                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#818CF8]/30 to-[#6366F1]/30 border border-[#818CF8]/20 flex items-center justify-center text-sm font-bold text-[#818CF8]">
                                            {t.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{t.name}</p>
                                            <p className="text-xs text-gray-500">{t.specialty}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ════════════ SECTION 7: CTA + Footer ════════════ */}
            <section className="relative z-10 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* CTA Banner */}
                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="relative rounded-[32px] overflow-hidden">
                        {/* BG gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#818CF8]/20 via-[#6366F1]/10 to-[#818CF8]/20" />
                        <div className="absolute inset-0 bg-[#0D0D20]/60 backdrop-blur-sm" />
                        {/* Glow orbs */}
                        <div className="absolute top-0 left-1/4 w-48 h-48 bg-[#818CF8]/20 rounded-full blur-[80px]" />
                        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#6366F1]/20 rounded-full blur-[80px]" />

                        <div className="relative z-10 p-10 sm:p-16 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-6 backdrop-blur-sm">
                                <Heart className="w-4 h-4 text-[#818CF8]" />
                                <span className="text-xs font-semibold text-white/80">Join 500+ Dermatologists</span>
                            </div>

                            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold mb-4">
                                Ready to Transform{' '}
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#818CF8] to-[#a78bfa]">Your Practice?</span>
                            </h2>
                            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                                Start your free trial today. No credit card required. Set up in under 5 minutes.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button onClick={() => navigate('/register-doctor')} className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#818CF8] to-[#6366F1] shadow-[0_0_30px_rgba(129,140,248,0.4)] hover:shadow-[0_0_50px_rgba(129,140,248,0.6)] hover:-translate-y-1 transition-all relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                    <span className="relative z-10 flex items-center gap-2">
                                        Register as Doctor <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                                <button onClick={() => navigate('/login/doctor')} className="px-8 py-4 rounded-2xl text-base font-semibold border border-white/15 hover:border-[#818CF8]/50 hover:bg-[#818CF8]/5 transition-all">
                                    Sign In Instead
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Footer */}
                    <div className="mt-20 pt-10 border-t border-white/5">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            {/* Logo */}
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#818CF8]/20 to-[#6366F1]/20 border border-[#818CF8]/30 flex items-center justify-center">
                                    <Stethoscope className="w-4 h-4 text-[#818CF8]" />
                                </div>
                                <span className="text-sm font-bold text-gray-400">
                                    DermaScan <span className="text-[#818CF8]">AI</span> · Doctor Portal
                                </span>
                            </div>

                            {/* Links */}
                            <div className="flex items-center gap-6 text-xs text-gray-500">
                                <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Home</button>
                                <button onClick={() => navigate('/about')} className="hover:text-white transition-colors">About</button>
                                <button onClick={() => navigate('/help')} className="hover:text-white transition-colors">Help</button>
                                <button onClick={() => navigate('/login/doctor')} className="hover:text-white transition-colors">Login</button>
                                <button onClick={() => navigate('/register-doctor')} className="hover:text-white transition-colors">Register</button>
                            </div>

                            {/* Trust */}
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <ShieldCheck className="w-3.5 h-3.5 text-green-400/60" />
                                <span>HIPAA-Aware · Encrypted · Secure</span>
                            </div>
                        </div>

                        <p className="text-center text-[11px] text-gray-700 mt-8">
                            © {new Date().getFullYear()} DermaScan AI. All rights reserved. Built for healthcare professionals.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default DoctorLanding;
