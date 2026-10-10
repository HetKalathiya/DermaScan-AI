import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, Mail, ShieldCheck, Brain, Calendar, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PatientNavbar from './PatientNavbar';

const faqs = [
    {
        q: 'How does the AI skin scan work?',
        a: 'Our AI model analyzes your uploaded skin image using a deep convolutional neural network trained on over 10 million dermatology images. It identifies patterns associated with conditions like melanoma, benign nevi, and actinic keratosis, returning a condition name, confidence score, and risk level within seconds.'
    },
    {
        q: 'How do I share my scan with a doctor?',
        a: 'After running an AI analysis on your scan, click the "Share with Doctor" button on the results panel. Your scan image and AI findings will be securely uploaded to our cloud and a consultation request will be created for a dermatologist to review.'
    },
    {
        q: 'How do I book an appointment?',
        a: 'Go to the "Find Dermatologists" page from your dashboard or the navigation menu. Browse available doctors, choose one, and click "Book Appointment". Fill in your preferred date, time, and a brief message. The doctor will be notified immediately.'
    },
    {
        q: 'How do I view my doctor\'s report?',
        a: 'Once a doctor reviews your consultation and submits a diagnosis, you will receive a notification. You can then visit "My Reports" from the profile menu or the dashboard to see the full diagnosis, treatment recommendations, and follow-up schedule.'
    },
    {
        q: 'Is my medical data secure?',
        a: 'Yes. All images are stored on Cloudinary with HTTPS encryption. Your personal data is stored in a secure MongoDB database. Passwords are hashed using bcrypt. Only verified doctors can access your consultation data, and they can only see what you explicitly share.'
    },
    {
        q: 'Can I delete my scan history?',
        a: 'Yes. Go to "Scan History" from the profile menu. Each scan card has a delete button. Once deleted, the record is permanently removed from our database. Note that scans already shared in a consultation cannot be removed from the consultation record.'
    },
    {
        q: 'What should I do if the AI shows a high-risk result?',
        a: 'Do not panic — the AI is a screening tool, not a definitive diagnosis. If you see a high-risk or malignant indicator, immediately click "Book Dermatologist" to schedule an in-person or telehealth appointment with a qualified dermatologist for proper evaluation.'
    },
    {
        q: 'Can I cancel my appointment?',
        a: 'Yes. Go to "My Appointments" from the dashboard. Any upcoming appointment has a "Cancel" button. You can only cancel appointments that have not yet passed. Completed or in-progress appointments cannot be cancelled.'
    }
];

const Help: React.FC = () => {
    const navigate = useNavigate();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const isPatient = (() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            return (u?.role || '').toLowerCase() === 'patient';
        } catch {
            return false;
        }
    })();

    const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i));

    return (
        <div className="min-h-screen bg-[#0B1C2C] text-white font-sans">
            <div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: `radial-gradient(circle, rgba(0,229,255,0.3) 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />

            {isPatient ? (
                <>
                    <PatientNavbar currentPath="/help" />
                    <div className="pt-24 relative z-10 border-b border-white/10 bg-[#0B1C2C]/50 backdrop-blur-xl px-6 py-4">
                        <div className="max-w-2xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center">
                                    <HelpCircle className="w-5 h-5 text-[#00E5FF]" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Help & FAQ</h1>
                                    <p className="text-xs text-gray-400">Common questions & platform guides</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <header className="relative z-10 border-b border-white/10 bg-[#0B1C2C]/80 backdrop-blur-xl px-6 h-20 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#00E5FF] transition-colors"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                    <div className="flex items-center gap-2"><HelpCircle className="w-6 h-6 text-[#00E5FF]" /><h1 className="text-xl font-bold">Help & FAQ</h1></div>
                </header>
            )}

            <main className="relative z-10 max-w-2xl mx-auto px-4 py-12">
                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="w-20 h-20 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(0,229,255,0.1)]">
                        <HelpCircle className="w-10 h-10 text-[#00E5FF]" />
                    </div>
                    <h2 className="text-3xl font-extrabold mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>How can we help?</h2>
                    <p className="text-gray-400">Find answers to common questions about DermaScan AI.</p>
                </motion.div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                    {[
                        { icon: Brain, label: 'AI Scan', fn: () => navigate('/dashboard') },
                        { icon: Calendar, label: 'Appointments', fn: () => navigate('/appointments') },
                        { icon: FileText, label: 'My Reports', fn: () => navigate('/my-reports') },
                        { icon: ShieldCheck, label: 'Privacy', fn: () => setOpenIndex(4) },
                    ].map(({ icon: Icon, label, fn }) => (
                        <button key={label} onClick={fn}
                            className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-[#00E5FF]/5 hover:border-[#00E5FF]/20 transition-all group">
                            <Icon className="w-6 h-6 text-[#00E5FF] group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-gray-300 font-medium">{label}</span>
                        </button>
                    ))}
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className="bg-[#0a1622]/70 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                            <button onClick={() => toggle(i)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors">
                                <span className="font-semibold text-sm text-white pr-4">{faq.q}</span>
                                {openIndex === i ? <ChevronUp className="w-4 h-4 text-[#00E5FF] shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                                        <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-3">{faq.a}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* Contact */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="mt-10 bg-[#00E5FF]/5 border border-[#00E5FF]/20 rounded-2xl p-8 text-center">
                    <Mail className="w-10 h-10 text-[#00E5FF] mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-1">Still need help?</h3>
                    <p className="text-gray-400 text-sm mb-4">Our support team responds within 24 hours.</p>
                    <a href="mailto:support@dermascan.ai"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] rounded-xl font-bold hover:bg-[#00E5FF]/20 transition-all">
                        <Mail className="w-4 h-4" /> support@dermascan.ai
                    </a>
                </motion.div>
            </main>
        </div>
    );
};

export default Help;
