import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
    ShieldAlert, ShieldCheck, Clock, CheckCircle2, AlertCircle,
    ArrowRight, Stethoscope, Building2, Award, RefreshCw, Mail,
    HelpCircle, ChevronRight, Sparkles, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface DoctorState {
    email?: string;
    doctor?: {
        license_number?: string;
        hospital_name?: string;
        specialization?: string;
        verified?: boolean;
    };
    message?: string;
}

const DoctorPendingApproval: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = (location.state as DoctorState) || {};

    const [email, setEmail] = useState<string>(
        state.email || localStorage.getItem('pending_doctor_email') || ''
    );
    const [doctorInfo, setDoctorInfo] = useState(state.doctor || null);
    const [isChecking, setIsChecking] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isApproved, setIsApproved] = useState<boolean>(false);
    const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

    // Save pending doctor email locally for page refresh persistence
    useEffect(() => {
        if (state.email) {
            localStorage.setItem('pending_doctor_email', state.email);
        }
    }, [state.email]);

    // Check status via API
    const handleCheckStatus = async () => {
        if (!email) {
            setStatusMessage('Please provide your registered doctor email address.');
            return;
        }

        setIsChecking(true);
        setStatusMessage(null);

        try {
            const response = await api.get(`/auth/doctor-status/${encodeURIComponent(email.trim().toLowerCase())}`);
            const data = response.data;

            setLastCheckedAt(new Date().toLocaleTimeString());

            if (data.approved) {
                setIsApproved(true);
                setDoctorInfo(data.doctor);
                setStatusMessage('Congratulations! Your medical credentials have been approved by the administration board.');
            } else {
                setIsApproved(false);
                if (data.doctor) {
                    setDoctorInfo(data.doctor);
                }
                setStatusMessage('Your credentials are still under active administrative review. Our board typically completes reviews within 24–48 business hours.');
            }
        } catch (err: any) {
            setStatusMessage(
                err.response?.data?.error ||
                'Unable to retrieve current verification status. Please verify your email or contact support.'
            );
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070D1B] text-white flex flex-col justify-between selection:bg-[#06B6D4]/30 relative overflow-x-hidden">
            {/* Background cyber-medical grid and glows */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(circle at center, #06B6D4 1.5px, transparent 1.5px)`,
                        backgroundSize: '32px 32px'
                    }}
                />
                <div className="absolute top-[-20%] right-[-10%] w-[65vw] h-[65vw] rounded-full bg-[#06B6D4]/10 blur-[180px] pointer-events-none animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#6366F1]/10 blur-[180px] pointer-events-none" />
            </div>

            {/* Header */}
            <header className="relative z-10 w-full border-b border-white/5 bg-[#0A1124]/60 backdrop-blur-md px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#06B6D4]/20 to-[#3B82F6]/20 border border-[#06B6D4]/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            <ShieldCheck className="w-5 h-5 text-[#06B6D4]" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            DermaScan <span className="text-[#06B6D4]">AI</span>
                        </span>
                        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6366F1]/20 border border-[#6366F1]/30 text-[#818CF8]">
                            Medical Credential Gate
                        </span>
                    </div>

                    <Link
                        to="/login/doctor"
                        className="text-xs sm:text-sm text-gray-400 hover:text-white transition flex items-center gap-1.5"
                    >
                        <span>Back to Doctor Sign In</span>
                        <ChevronRight className="w-4 h-4 text-[#06B6D4]" />
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full bg-[#0D162B]/90 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden"
                >
                    {/* Glowing top line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent opacity-80" />

                    {/* Status Badge */}
                    <div className="flex justify-center mb-6">
                        {isApproved ? (
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold tracking-wide animate-pulse">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>CREDENTIALS APPROVED — READY FOR ACCESS</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-semibold tracking-wide">
                                <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
                                <span>CREDENTIAL VERIFICATION IN PROGRESS</span>
                            </div>
                        )}
                    </div>

                    {/* Animated Icon Avatar */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                className={`w-24 h-24 rounded-2xl flex items-center justify-center border shadow-xl ${
                                    isApproved
                                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.25)]'
                                        : 'bg-[#131E38] border-amber-500/30 text-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.2)]'
                                }`}
                            >
                                {isApproved ? (
                                    <ShieldCheck className="w-12 h-12 text-emerald-400" />
                                ) : (
                                    <Stethoscope className="w-12 h-12 text-amber-400" />
                                )}
                            </motion.div>
                            <div className="absolute -inset-2 rounded-2xl border border-dashed border-white/10 animate-spin pointer-events-none" style={{ animationDuration: '20s' }} />
                        </div>
                    </div>

                    {/* Header Titles */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                            {isApproved ? 'Doctor Account Approved!' : 'Medical Credentials Under Review'}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
                            {isApproved
                                ? 'Your medical credentials have been formally validated by the DermaScan AI medical verification board. You can now access your clinical dashboard.'
                                : 'To protect patient safety and comply with healthcare standards, all practicing dermatologists must undergo administrative board verification before clinical tools are unlocked.'}
                        </p>
                    </div>

                    {/* Doctor Details Card */}
                    <div className="bg-[#09101F]/80 border border-white/5 rounded-2xl p-5 mb-8">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
                            <span>Submitted Practice Information</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                                <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                                    <Award className="w-3.5 h-3.5 text-[#06B6D4]" />
                                    <span>Specialization</span>
                                </div>
                                <div className="text-sm font-semibold text-white truncate">
                                    {doctorInfo?.specialization || 'Dermatology & Skin Pathology'}
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                                <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                                    <Building2 className="w-3.5 h-3.5 text-[#06B6D4]" />
                                    <span>Hospital / Clinic</span>
                                </div>
                                <div className="text-sm font-semibold text-white truncate">
                                    {doctorInfo?.hospital_name || 'Affiliated Medical Center'}
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                                <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                    <span>License Number</span>
                                </div>
                                <div className="text-sm font-semibold text-amber-400 font-mono truncate">
                                    {doctorInfo?.license_number || 'Pending Record Verification'}
                                </div>
                            </div>
                        </div>

                        {email && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-[#06B6D4]" />
                                    <span>Registered Doctor Email:</span>
                                    <strong className="text-white font-medium">{email}</strong>
                                </span>
                                <span className="hidden sm:inline-block text-amber-400/90 font-medium">
                                    Status: Pending Admin Gate
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 3-Step Verification Pipeline */}
                    <div className="mb-8">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            Verification Milestones
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Milestone 1 */}
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-emerald-400">Step 1</span>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">Email Verified</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Secure 6-digit OTP confirmed</div>
                                </div>
                            </div>

                            {/* Milestone 2 */}
                            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                                isApproved
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : 'bg-amber-500/5 border-amber-500/30'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-semibold ${isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        Step 2
                                    </span>
                                    {isApproved ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                        <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">Medical Board Review</div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {isApproved ? 'License verified' : 'License validation in queue'}
                                    </div>
                                </div>
                            </div>

                            {/* Milestone 3 */}
                            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                                isApproved
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : 'bg-white/[0.02] border-white/10 opacity-70'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-semibold ${isApproved ? 'text-emerald-400' : 'text-gray-400'}`}>
                                        Step 3
                                    </span>
                                    {isApproved ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                        <Lock className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">Clinical Portal Access</div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {isApproved ? 'Ready to launch' : 'Unlocked upon approval'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Feedback Banner */}
                    <AnimatePresence>
                        {statusMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`mb-6 p-4 rounded-xl border flex items-start gap-3 text-sm ${
                                    isApproved
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                        : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                                }`}
                            >
                                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isApproved ? 'text-emerald-400' : 'text-blue-400'}`} />
                                <div className="flex-1">
                                    <p>{statusMessage}</p>
                                    {lastCheckedAt && (
                                        <p className="text-xs opacity-75 mt-1">Checked at {lastCheckedAt}</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                        {isApproved ? (
                            <button
                                onClick={() => navigate('/login/doctor')}
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:brightness-110 transition"
                            >
                                <span>Sign In to Doctor Dashboard</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleCheckStatus}
                                disabled={isChecking}
                                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:brightness-110 transition disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                                <span>{isChecking ? 'Checking Board Status...' : 'Check Approval Status'}</span>
                            </button>
                        )}

                        <button
                            onClick={() => navigate('/login/doctor')}
                            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-medium text-sm transition"
                        >
                            Return to Sign In
                        </button>
                    </div>

                    {/* Support & Turnaround Notice */}
                    <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-center gap-2">
                        <span className="flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-[#06B6D4]" />
                            Need expedited verification or have questions?
                        </span>
                        <a
                            href="mailto:support@dermascan.ai?subject=Medical%20Credentials%20Verification%20Inquiry"
                            className="text-[#06B6D4] hover:underline font-medium"
                        >
                            Contact Medical Credentialing Desk
                        </a>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full border-t border-white/5 py-4 text-center text-xs text-gray-500">
                <p>&copy; {new Date().getFullYear()} DermaScan AI. Healthcare Provider Credential Management System.</p>
            </footer>
        </div>
    );
};

export default DoctorPendingApproval;
