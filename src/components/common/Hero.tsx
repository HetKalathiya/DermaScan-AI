import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Scan, ArrowRight, Activity, Camera, Brain, FileCheck, Shield, Lock, ChevronDown, CheckCircle2, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ────────────────────────────────────────────
// Custom hook: count-up animation
// ────────────────────────────────────────────
function useCountUp(end: number, duration = 1500, suffix = '') {
    const [value, setValue] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const startTime = performance.now();
                    const animate = (now: number) => {
                        const elapsed = now - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        // Ease-out cubic
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setValue(Math.floor(eased * end));
                        if (progress < 1) requestAnimationFrame(animate);
                    };
                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [end, duration]);

    return { ref, display: `${value.toLocaleString()}${suffix}` };
}

// ────────────────────────────────────────────
// Floating particles background (lightweight)
// ────────────────────────────────────────────
const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i * 17 + 5) % 100}%`,
    top: `${(i * 23 + 10) % 100}%`,
    size: 2 + (i % 3) * 2,
    delay: i * 0.4,
    duration: 6 + (i % 4) * 2,
}));

const FloatingParticles = React.memo(() => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {particles.map((p) => (
            <div
                key={p.id}
                className="absolute rounded-full bg-cyan-400/30"
                style={{
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite`,
                    willChange: 'transform, opacity',
                }}
            />
        ))}
        {/* Ambient glow orbs — GPU-friendly replacements for blur blobs */}
        <div
            className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-cyan-500/10"
            style={{ animation: 'ambientGlow 8s ease-in-out infinite', filter: 'blur(60px)', willChange: 'opacity, transform' }}
        />
        <div
            className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-blue-600/10"
            style={{ animation: 'ambientGlow 10s 2s ease-in-out infinite', filter: 'blur(60px)', willChange: 'opacity, transform' }}
        />
    </div>
));

// ────────────────────────────────────────────
// Interactive scan mockup card
// ────────────────────────────────────────────
const ScanMockup = React.memo(({ reducedMotion }: { reducedMotion: boolean }) => {
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        if (reducedMotion) {
            setShowResult(true);
            return;
        }
        const timer = setTimeout(() => setShowResult(true), 2200);
        return () => clearTimeout(timer);
    }, [reducedMotion]);

    return (
        <div className="relative z-10 bg-gray-800/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl">
            <div className="aspect-[4/5] rounded-xl overflow-hidden relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" role="img" aria-label="DermaScan AI analysis mockup showing a skin scan with low risk result">
                {/* Simulated skin texture background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-orange-800/10 to-amber-700/15 rounded-xl" />
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(217,179,155,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(194,154,128,0.1) 0%, transparent 40%)',
                    }} />
                </div>

                {/* Scan line animation */}
                {!reducedMotion && (
                    <div className="absolute inset-x-0 top-0 h-1/4 z-20 pointer-events-none" style={{ animation: 'scanline 3s 0.5s ease-in-out infinite' }}>
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
                        <div className="w-full h-8 bg-gradient-to-b from-cyan-400/10 to-transparent" />
                    </div>
                )}

                {/* Corner scan markers */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400/60 rounded-tl" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400/60 rounded-tr" />
                <div className="absolute bottom-20 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400/60 rounded-bl" />
                <div className="absolute bottom-20 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400/60 rounded-br" />

                {/* Center scan icon */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="relative">
                        {!reducedMotion && (
                            <>
                                <div className="absolute inset-0 w-20 h-20 -m-4 border border-cyan-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                                <div className="absolute inset-0 w-16 h-16 -m-2 border border-blue-500/15 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                            </>
                        )}
                        <Scan className="text-cyan-400/40 w-12 h-12" />
                    </div>
                </div>

                {/* AI detection badges — appear after scan */}
                {showResult && (
                    <div className="absolute top-6 right-6 z-20" style={{ animation: reducedMotion ? 'none' : 'fadeInUp 0.5s ease-out' }}>
                        <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-300">Benign Nevus</span>
                        </div>
                    </div>
                )}
                {showResult && (
                    <div className="absolute top-16 right-8 z-20" style={{ animation: reducedMotion ? 'none' : 'fadeInUp 0.5s 0.2s ease-out both' }}>
                        <div className="bg-cyan-500/15 backdrop-blur-md border border-cyan-400/20 rounded-lg px-3 py-1.5">
                            <span className="text-xs text-cyan-300">Confidence: <strong>92%</strong></span>
                        </div>
                    </div>
                )}

                {/* Bottom result panel */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-sm text-gray-300 font-medium">Analysis Complete</span>
                            </div>
                            <span className="text-emerald-400 text-sm font-bold">Low Risk</span>
                        </div>
                        <div className="w-full bg-gray-700/80 h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                                style={{ animation: reducedMotion ? 'none' : 'fillProgress 1.5s 2s ease-out both', width: reducedMotion ? '12%' : undefined }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Risk Score</span>
                            <span>12%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

// ────────────────────────────────────────────
// "How It Works" steps
// ────────────────────────────────────────────
const steps = [
    { icon: Camera, label: 'Capture', description: 'Snap a photo of your skin concern' },
    { icon: Brain, label: 'Analyze', description: 'AI processes in under 3 seconds' },
    { icon: FileCheck, label: 'Results', description: 'Get risk assessment & next steps' },
];

const HowItWorks = () => (
    <div className="mt-14 pt-8 border-t border-white/5">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-6 font-medium">How It Works</p>
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {steps.map((step, i) => (
                <motion.div
                    key={step.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + i * 0.15 }}
                    className="text-center sm:text-left"
                >
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 mb-3">
                        <step.icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <p className="text-sm font-semibold text-white">{step.label}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed hidden sm:block">{step.description}</p>
                </motion.div>
            ))}
        </div>
    </div>
);

// ────────────────────────────────────────────
// Trust bar
// ────────────────────────────────────────────
const trustItems = [
    { icon: Shield, label: 'HIPAA Compliant' },
    { icon: Lock, label: '256-bit Encrypted' },
    { icon: Stethoscope, label: 'Doctor Reviewed' },
];

const TrustBar = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6"
    >
        {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-gray-500">
                <item.icon className="w-3.5 h-3.5 text-cyan-600/60" />
                <span className="text-xs font-medium">{item.label}</span>
            </div>
        ))}
    </motion.div>
);

// ────────────────────────────────────────────
// Scroll indicator
// ────────────────────────────────────────────
const ScrollIndicator = () => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => setVisible(window.scrollY < 100);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!visible) return null;

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20" style={{ animation: 'scrollBounce 2s ease-in-out infinite' }}>
            <span className="text-xs text-gray-500 tracking-wide">Scroll to explore</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
    );
};

// ════════════════════════════════════════════
// HERO COMPONENT
// ════════════════════════════════════════════
const Hero = () => {
    const navigate = useNavigate();
    const reducedMotion = useReducedMotion() ?? false;

    // Scan Now is a Patient workflow: route directly to /dashboard if logged in as patient,
    // or to /login (clearing any old doctor/admin session) so the patient can log in.
    const handleScanNow = useCallback(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role === 'patient') {
                    navigate('/dashboard');
                    return;
                }
                // If previously logged in as a doctor or admin, clear old session so patient can log in
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        navigate('/login');
    }, [navigate]);

    const handleLearnMore = useCallback(() => {
        document.getElementById('features')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }, [reducedMotion]);

    // Count-up stats
    const accuracy = useCountUp(99, 1500, '%');
    const doctors = useCountUp(500, 1200, '+');
    const scans = useCountUp(50, 1800, 'K+');

    return (
        <section aria-labelledby="hero-heading" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900 text-white pt-20">
            {/* Background — lightweight particles + ambient glow */}
            <FloatingParticles />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center w-full">
                {/* ── Left column: Copy ── */}
                <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-cyan-100">AI-Powered Skin Analysis</span>
                    </div>

                    {/* Heading */}
                    <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        Early Detection <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                            Saves Lives
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-lg sm:text-xl text-gray-400 mb-8 leading-relaxed max-w-lg">
                        Advanced artificial intelligence for instant, clinical-grade skin analysis.
                        Monitor your skin health with precision and peace of mind.
                    </p>

                    {/* Mobile mockup — visible only on small screens */}
                    <div className="md:hidden mb-8">
                        <motion.div
                            initial={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="max-w-xs mx-auto"
                        >
                            <ScanMockup reducedMotion={reducedMotion} />
                        </motion.div>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleScanNow}
                            aria-label="Start a skin scan — opens login or dashboard"
                            className="group flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Scan className="w-5 h-5" />
                            Scan Now
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={handleLearnMore}
                            aria-label="Learn more about DermaScan features"
                            className="px-8 py-4 rounded-full text-lg font-semibold text-white border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm"
                        >
                            Learn More
                        </button>
                    </div>

                    {/* Trust bar */}
                    <TrustBar />

                    {/* Stats — animated count-up */}
                    <div className="mt-10 flex items-center gap-6 sm:gap-8 text-gray-400 text-sm" role="list" aria-label="Key platform statistics">
                        <div ref={accuracy.ref} role="listitem" aria-label="99 percent accuracy rate">
                            <p className="text-2xl font-bold text-white tabular-nums">{accuracy.display}</p>
                            <p>Accuracy Rate</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" aria-hidden="true" />
                        <div ref={doctors.ref} role="listitem" aria-label="Over 500 verified doctors">
                            <p className="text-2xl font-bold text-white tabular-nums">{doctors.display}</p>
                            <p>Verified Doctors</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" aria-hidden="true" />
                        <div ref={scans.ref} role="listitem" aria-label="Over 50 thousand scans analyzed">
                            <p className="text-2xl font-bold text-white tabular-nums">{scans.display}</p>
                            <p>Scans Analyzed</p>
                        </div>
                    </div>

                    {/* How it works */}
                    <HowItWorks />
                </motion.div>

                {/* ── Right column: Mockup (desktop only) ── */}
                <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative hidden md:block"
                >
                    <ScanMockup reducedMotion={reducedMotion} />
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <ScrollIndicator />
        </section>
    );
};

export default Hero;
