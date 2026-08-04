import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Brain, Stethoscope, BarChart2, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
    { icon: Brain, title: 'Upload Your Scan', desc: 'Take a photo or upload an existing image of any skin lesion or area of concern directly from your device.' },
    { icon: BarChart2, title: 'Instant AI Analysis', desc: 'Our deep learning model analyzes the image in seconds, identifying patterns and providing a confidence-scored result.' },
    { icon: Stethoscope, title: 'Doctor Review', desc: 'Share your scan with a verified dermatologist who will provide an official diagnosis, treatment plan, and follow-up advice.' },
];

const plans = [
    { name: 'Free', price: '₹0', period: 'forever', color: 'border-white/10', btn: 'bg-white/10 text-white hover:bg-white/20', features: ['5 AI scans per month', 'Basic condition detection', 'Share with 1 doctor', 'Scan history (30 days)'] },
    { name: 'Pro', price: '₹499', period: 'per month', color: 'border-[#00E5FF]/40', btn: 'bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-bold shadow-[0_0_20px_rgba(0,229,255,0.4)]', badge: 'Most Popular', features: ['Unlimited AI scans', 'Advanced risk scoring', 'Unlimited doctor sharing', 'Full scan history', 'Priority notifications', 'PDF report download'] },
    { name: 'Enterprise', price: 'Custom', period: 'contact us', color: 'border-white/10', btn: 'bg-white/10 text-white hover:bg-white/20', features: ['Everything in Pro', 'Dedicated doctor team', 'HIPAA compliance', 'Custom integrations', 'Analytics dashboard', '24/7 SLA support'] },
];

const About: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0B1C2C] text-white font-sans overflow-x-hidden">
            <div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: `radial-gradient(circle, rgba(0,229,255,0.3) 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
            <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#00E5FF] opacity-5 blur-[150px] rounded-full pointer-events-none" />

            {/* Navbar */}
            <header className="relative z-10 border-b border-white/10 bg-[#0B1C2C]/80 backdrop-blur-xl px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00E5FF] to-blue-600 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>DermaScan <span className="text-[#00E5FF]">AI</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/login')} className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-all">Login</button>
                    <button onClick={() => navigate('/register')} className="text-sm font-bold text-black px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-cyan-400 transition-all">Get Started</button>
                </div>
            </header>

            {/* Hero */}
            <section className="relative z-10 text-center py-24 px-4">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                    <span className="inline-block px-4 py-1.5 bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-bold rounded-full tracking-wider uppercase mb-6">AI-Powered Dermatology</span>
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                        Skin Cancer Detection<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-blue-500">Powered by AI</span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
                        DermaScan AI combines cutting-edge deep learning with expert dermatologists to give you fast, accurate, and accessible skin health assessments — anytime, anywhere.
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <button onClick={() => navigate('/register')}
                            className="px-8 py-4 bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-bold rounded-xl shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:shadow-[0_0_50px_rgba(0,229,255,0.6)] transform hover:-translate-y-1 transition-all flex items-center gap-2">
                            Start Free Scan <ArrowRight className="w-5 h-5" />
                        </button>
                        <button onClick={() => navigate('/dermatologists')}
                            className="px-8 py-4 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/5 transition-all">
                            Find a Doctor
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* How It Works */}
            <section className="relative z-10 py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-extrabold text-center mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>How It Works</h2>
                    <p className="text-gray-400 text-center mb-12">Three simple steps to a professional skin assessment.</p>
                    <div className="grid md:grid-cols-3 gap-6">
                        {steps.map(({ icon: Icon, title, desc }, i) => (
                            <motion.div key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                                className="bg-[#0a1622]/70 border border-white/10 rounded-2xl p-6 text-center hover:border-[#00E5FF]/30 transition-all group">
                                <div className="w-14 h-14 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center mx-auto mb-4 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all">
                                    <Icon className="w-7 h-7 text-[#00E5FF]" />
                                </div>
                                <div className="w-7 h-7 bg-[#00E5FF]/10 rounded-full flex items-center justify-center text-[#00E5FF] text-sm font-bold mx-auto mb-3">{i + 1}</div>
                                <h3 className="font-bold text-white mb-2">{title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="relative z-10 py-16 px-4">
                <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { val: '10M+', label: 'Training Images' },
                        { val: '99%', label: 'AI Accuracy' },
                        { val: '500+', label: 'Verified Doctors' },
                        { val: '50K+', label: 'Scans Analyzed' },
                    ].map(({ val, label }) => (
                        <div key={label} className="text-center bg-white/[0.03] border border-white/10 rounded-2xl py-6 px-4 hover:border-[#00E5FF]/20 transition-all">
                            <p className="text-3xl font-extrabold text-[#00E5FF] mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{val}</p>
                            <p className="text-xs text-gray-400">{label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Doctor Portal CTA */}
            <section className="relative z-10 py-12 px-4">
                <div className="max-w-3xl mx-auto bg-gradient-to-r from-[#818CF8]/10 to-[#6366F1]/10 border border-[#818CF8]/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Are you a Dermatologist?</h3>
                        <p className="text-sm text-gray-400">Explore our AI-powered clinical dashboard built for physicians.</p>
                    </div>
                    <button onClick={() => navigate('/doctor')}
                        className="px-6 py-3 bg-gradient-to-r from-[#818CF8] to-[#6366F1] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(129,140,248,0.3)] hover:shadow-[0_0_35px_rgba(129,140,248,0.5)] transition-all whitespace-nowrap flex items-center gap-2">
                        Doctor Portal →
                    </button>
                </div>
            </section>

            {/* Pricing */}
            <section className="relative z-10 py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-extrabold text-center mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>Simple Pricing</h2>
                    <p className="text-gray-400 text-center mb-12">Start free. Upgrade when you need more.</p>
                    <div className="grid md:grid-cols-3 gap-6 items-start">
                        {plans.map((plan, i) => (
                            <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                className={`relative bg-[#0a1622]/70 backdrop-blur-xl border ${plan.color} rounded-2xl p-6 ${i === 1 ? 'shadow-[0_0_40px_rgba(0,229,255,0.1)]' : ''}`}>
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#00E5FF] text-black text-xs font-extrabold rounded-full">{plan.badge}</div>
                                )}
                                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                                <div className="mb-5">
                                    <span className="text-3xl font-extrabold">{plan.price}</span>
                                    <span className="text-gray-400 text-sm ml-1">/{plan.period}</span>
                                </div>
                                <ul className="space-y-2.5 mb-6">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                                            <Check className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => navigate('/register')} className={`w-full py-3 rounded-xl text-sm transition-all ${plan.btn}`}>
                                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative z-10 py-20 px-4 text-center">
                <div className="max-w-xl mx-auto bg-[#00E5FF]/5 border border-[#00E5FF]/20 rounded-3xl p-12">
                    <ShieldCheck className="w-12 h-12 text-[#00E5FF] mx-auto mb-4" />
                    <h2 className="text-3xl font-extrabold mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>Ready to take control of your skin health?</h2>
                    <p className="text-gray-400 mb-8 text-sm">Join thousands of patients using AI to detect skin conditions early.</p>
                    <button onClick={() => navigate('/register')}
                        className="px-10 py-4 bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-extrabold rounded-xl shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:shadow-[0_0_50px_rgba(0,229,255,0.6)] transition-all">
                        Start Free — No Credit Card Needed
                    </button>
                </div>
            </section>
        </div>
    );
};

export default About;
