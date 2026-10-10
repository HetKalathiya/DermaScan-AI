import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Heart, FileText, Lock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Footer = () => {
    const navigate = useNavigate();
    const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'disclaimer' | null>(null);

    return (
        <footer className="bg-gray-900 border-t border-white/10 py-12 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="h-6 w-6 text-cyan-400" />
                            <span className="text-xl font-bold text-white">DermaScan AI</span>
                        </div>
                        <p className="text-gray-400 max-w-sm">
                            Empowering proactive health monitoring through advanced technology. Early detection is your best protection.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><button onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-cyan-400 transition-colors">Home</button></li>
                            <li><a href="#features" className="hover:text-cyan-400 transition-colors">Technology</a></li>
                            <li><button onClick={() => navigate('/doctor')} className="hover:text-cyan-400 transition-colors">For Doctors</button></li>
                            <li><button onClick={() => navigate('/about')} className="hover:text-cyan-400 transition-colors">About Us</button></li>
                            <li><button onClick={() => navigate('/login')} className="hover:text-cyan-400 transition-colors">Get Started</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><button onClick={() => setLegalModal('privacy')} className="hover:text-cyan-400 transition-colors">Privacy Policy</button></li>
                            <li><button onClick={() => setLegalModal('terms')} className="hover:text-cyan-400 transition-colors">Terms of Service</button></li>
                            <li><button onClick={() => setLegalModal('disclaimer')} className="hover:text-cyan-400 transition-colors">Medical Disclaimer</button></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 mt-8 text-center text-gray-500 text-sm">
                    <p className="flex items-center justify-center gap-2">
                        © 2026 DermaScan AI. Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for a healthier future.
                    </p>
                    <div id="medical-disclaimer" className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg max-w-2xl mx-auto text-yellow-200/80">
                        <strong>Disclaimer:</strong> This tool is for educational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for any questions you may have regarding a medical condition.
                    </div>
                </div>
            </div>

            {/* Legal Policies Modal */}
            <AnimatePresence>
                {legalModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0F172A] border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {legalModal === 'privacy' && <Lock className="w-5 h-5 text-cyan-400" />}
                                    {legalModal === 'terms' && <FileText className="w-5 h-5 text-blue-400" />}
                                    {legalModal === 'disclaimer' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                                    {legalModal === 'privacy' && 'Privacy Policy & Data Protection'}
                                    {legalModal === 'terms' && 'Terms of Service'}
                                    {legalModal === 'disclaimer' && 'Clinical Medical Disclaimer'}
                                </h3>
                                <button
                                    onClick={() => setLegalModal(null)}
                                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="text-xs text-slate-300 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {legalModal === 'privacy' && (
                                    <>
                                        <p><strong>1. Data Encryption:</strong> All dermatological photos and metadata are secured via AES-256 at rest and TLS 1.3 in transit.</p>
                                        <p><strong>2. HIPAA Alignment:</strong> Diagnostic data is segregated and never sold to third-party ad networks.</p>
                                        <p><strong>3. User Control:</strong> You can export or permanently delete your scan records anytime through Account Settings.</p>
                                    </>
                                )}
                                {legalModal === 'terms' && (
                                    <>
                                        <p><strong>1. Service Scope:</strong> DermaScan AI provides assistive machine learning analysis for skin lesion preliminary screening.</p>
                                        <p><strong>2. User Obligations:</strong> Users agree to provide clear, unaltered images and acknowledge that clinical decisions require in-person physician review.</p>
                                        <p><strong>3. Account Security:</strong> You are responsible for safeguarding your login credentials and two-factor authentication tokens.</p>
                                    </>
                                )}
                                {legalModal === 'disclaimer' && (
                                    <>
                                        <p><strong>1. Non-Diagnostic:</strong> DermaScan AI is NOT a replacement for a biopsy or examination by a licensed board-certified dermatologist.</p>
                                        <p><strong>2. Acute Symptoms:</strong> If a lesion is bleeding, itching severely, expanding rapidly, or ulcerating, consult emergency or immediate clinical care.</p>
                                        <p><strong>3. Algorithmic Confidence:</strong> High confidence levels reflect pattern similarity within reference databases, not definitive clinical confirmation.</p>
                                    </>
                                )}
                            </div>
                            <div className="pt-3 border-t border-slate-800 flex justify-end">
                                <button
                                    onClick={() => setLegalModal(null)}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </footer>
    );
};

export default Footer;
