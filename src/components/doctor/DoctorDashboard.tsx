import React, { useState, useEffect } from 'react';
import {
    ShieldCheck, LogOut, User, CheckCircle, Clock, Stethoscope,
    Bell, LayoutDashboard, Users, Activity, History, MessageSquare,
    Settings, ZoomIn, Send, ChevronRight, ActivitySquare, BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Consultation {
    id: number;
    patient_name: string;
    patient_email: string;
    image_data: string; // Base64 or URL
    status: 'pending' | 'completed' | 'pending_appointment';
    diagnosis: string | null;
    created_at: string;
}

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [treatment, setTreatment] = useState('');
    const [followUp, setFollowUp] = useState('1 week');
    const [user, setUser] = useState<{ name: string, email: string } | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            if (!token || !storedUser) {
                navigate('/login');
                return;
            }
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role !== 'doctor') {
                navigate('/dashboard');
                return;
            }
            setUser(parsedUser);
            fetchConsultations();
        };
        checkAuth();

        // Polling for updates (optional simulation)
        const interval = setInterval(() => {
            fetchConsultations();
        }, 15000);
        return () => clearInterval(interval);
    }, [navigate]);

    const fetchConsultations = async () => {
        try {
            // @ts-ignore
            const response = await import('../../services/api').then(module => module.default.get('/doctor/consultations?role=doctor'));
            console.log("Fetched consultations:", response.data);
            setConsultations(response.data);
        } catch (error) {
            console.error('Error fetching consultations:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleSelectConsultation = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setDiagnosis(consultation.diagnosis && !consultation.diagnosis.startsWith('AI Analysis') ? consultation.diagnosis : '');
        setTreatment('');
    };

    const handleSubmitDiagnosis = async () => {
        if (!selectedConsultation) return;

        try {
            const fullDiagnosisText = `Diagnosis: ${diagnosis}\nTreatment: ${treatment}\nFollow-up: ${followUp}`;
            // @ts-ignore
            await import('../../services/api').then(module => module.default.put(`/doctor/consultations/${selectedConsultation.id}`, {
                diagnosis: fullDiagnosisText,
                status: 'completed'
            }));

            fetchConsultations();
            setSelectedConsultation(null);
            alert('Response sent successfully!');
        } catch (error) {
            console.error('Error submitting diagnosis:', error);
            alert('Failed to submit response');
        }
    };

    const getStats = () => {
        const total = consultations.length;
        const pending = consultations.filter(c => c.status === 'pending' || c.status === 'pending_appointment').length;
        const completed = total - pending;
        return { total, pending, completed };
    };
    const stats = getStats();

    // Helper to parse AI result from early diagnostic string if available
    const extractAIInfo = (text: string | null) => {
        let condition = "Unknown";
        let confidence = "N/A";
        let riskLevel = "low";
        let riskColor = "text-green-400";
        let barColor = "bg-green-400";

        if (text && text.includes('AI Analysis:')) {
            const match = text.match(/AI Analysis:\s*(.+?)\s*\((.+?)\)/);
            if (match) {
                condition = match[1];
                confidence = match[2];
                // mock risk
                const num = parseInt(confidence);
                if (condition.toLowerCase().includes('concern') || condition.toLowerCase().includes('melanoma')) {
                    riskLevel = 'high';
                    riskColor = 'text-red-400';
                    barColor = 'from-red-500 to-orange-500';
                } else if (num < 80) {
                    riskLevel = 'medium';
                    riskColor = 'text-yellow-400';
                    barColor = 'from-yellow-500 to-orange-400';
                } else {
                    riskColor = 'text-[#00E5FF]';
                    barColor = 'from-[#00E5FF] to-blue-500';
                }
            }
        }
        return { condition, confidence, riskLevel, riskColor, barColor };
    };

    return (
        <div className="flex h-screen bg-[#0B1C2C] text-white font-sans overflow-hidden selection:bg-[#00E5FF]/30 selection:text-white">

            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: `linear-gradient(rgba(0,229,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.2) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
            />

            {/* Fixed Left Sidebar */}
            <aside className="w-20 lg:w-64 bg-[#0a1622]/90 backdrop-blur-xl border-r border-[#00E5FF]/10 flex flex-col items-center lg:items-start py-6 z-20 shrink-0 transition-all duration-300">
                <div className="flex items-center gap-3 px-4 lg:px-6 mb-12">
                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="relative">
                        <div className="absolute inset-0 bg-[#00E5FF] blur-[10px] opacity-40 rounded-full" />
                        <BrainCircuit className="w-10 h-10 text-[#00E5FF] relative z-10" />
                    </motion.div>
                    <span className="hidden lg:block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00E5FF] to-blue-400">
                        DermaScan AI
                    </span>
                </div>

                <div className="w-full flex-1 space-y-2 px-3">
                    {[
                        { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor-dashboard' },
                        { icon: Users, label: 'Patient Requests', active: true, path: '/doctor-dashboard' },
                        { icon: Activity, label: 'AI Scan Results', path: '/doctor/scans' },
                        { icon: History, label: 'Consultation History', path: '#' },
                        { icon: MessageSquare, label: 'Messages', path: '#' },
                        { icon: Settings, label: 'Settings', path: '#' }
                    ].map((item, i) => (
                        <button key={i} onClick={() => { if(item.path && item.path !== '#') navigate(item.path); }} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${item.active ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.15)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                            {item.active && <div className="absolute inset-y-0 left-0 w-1 bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" />}
                            <item.icon className={`w-5 h-5 ${item.active ? 'text-[#00E5FF]' : 'group-hover:text-[#00E5FF] transition-colors'}`} />
                            <span className="hidden lg:block font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">

                {/* Top Navigation */}
                <header className="relative z-[1000] h-20 bg-[#0B1C2C]/50 backdrop-blur-lg border-b border-[#00E5FF]/10 flex items-center justify-between px-6 shrink-0">
                    <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                        Doctor Consultation Dashboard
                    </h1>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-gray-400 hover:text-[#00E5FF] transition-colors">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#00E5FF] rounded-full shadow-[0_0_8px_#00E5FF]" />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-3 p-1 pr-3 rounded-full border border-white/10 hover:border-[#00E5FF]/40 bg-[#0a1622] transition-colors"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00E5FF] to-blue-600 flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-sm font-medium mr-1">{user?.name || 'Dr. Smith'}</span>
                            </button>

                            <AnimatePresence>
                                {showProfileMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        className="absolute right-0 mt-3 w-56 bg-[#0B1C2C]/95 border border-[#00E5FF]/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl z-[9999]"
                                    >
                                        <div className="p-4 border-b border-white/10 bg-gradient-to-br from-[#00E5FF]/10 to-transparent">
                                            <p className="font-bold text-white tracking-wide">{user?.name}</p>
                                            <p className="text-xs text-[#00E5FF] mt-0.5">{user?.email}</p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <button onClick={() => navigate('/profile')} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#00E5FF]/15 hover:shadow-[inset_0_0_10px_rgba(0,229,255,0.2)] rounded-lg flex items-center gap-3 transition-all group">
                                                <User className="w-4 h-4 group-hover:text-[#00E5FF] transition-colors" /> View Profile
                                            </button>
                                            <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#00E5FF]/15 hover:shadow-[inset_0_0_10px_rgba(0,229,255,0.2)] rounded-lg flex items-center gap-3 transition-all group">
                                                <Bell className="w-4 h-4 group-hover:text-[#00E5FF] transition-colors" /> Notifications
                                            </button>
                                            <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#00E5FF]/15 hover:shadow-[inset_0_0_10px_rgba(0,229,255,0.2)] rounded-lg flex items-center gap-3 transition-all group">
                                                <Settings className="w-4 h-4 group-hover:text-[#00E5FF] transition-colors" /> Settings
                                            </button>
                                        </div>
                                        <div className="p-2 border-t border-white/10">
                                            <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg flex items-center gap-3 transition-all group">
                                                <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" /> Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-visible p-6 scroll-smooth custom-scrollbar relative z-[1]">

                    {/* Analytics Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { title: 'Total Requests', value: stats.total, icon: Users, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
                            { title: 'Pending Cases', value: stats.pending, icon: Clock, color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/10' },
                            { title: 'Completed Diagnoses', value: stats.completed, icon: CheckCircle, color: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-500/10' },
                            { title: 'AI Accuracy Rate', value: '98.5%', icon: ActivitySquare, color: 'text-[#00E5FF]', border: 'border-[#00E5FF]/20', bg: 'bg-[#00E5FF]/10', shadow: 'shadow-[0_0_20px_rgba(0,229,255,0.1)]' }
                        ].map((stat, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                                key={idx}
                                className={`relative z-[1] p-5 rounded-2xl bg-[#0a1622]/80 backdrop-blur-md border ${stat.border} ${stat.shadow || ''} flex items-center justify-between group hover:-translate-y-1 transition-transform`}
                            >
                                <div>
                                    <p className="text-gray-400 text-sm font-medium mb-1">{stat.title}</p>
                                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[600px]">

                        {/* Patient Request Panel */}
                        <div className="xl:col-span-1 bg-[#0a1622]/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-white/10 bg-[#0B1C2C]/50 flex justify-between items-center">
                                <h2 className="font-semibold text-lg flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[#00E5FF]" />
                                    Active Requests
                                </h2>
                                <span className="bg-[#00E5FF]/20 text-[#00E5FF] text-xs px-2 py-1 rounded-full font-medium border border-[#00E5FF]/30">
                                    {stats.pending} New
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                <AnimatePresence>
                                    {consultations.length === 0 ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                                            <div className="w-20 h-20 mb-6 bg-[#00E5FF]/5 rounded-full flex items-center justify-center">
                                                <BrainCircuit className="w-10 h-10 text-[#00E5FF]/40" />
                                            </div>
                                            <h3 className="text-white font-medium mb-2">No consultation requests yet.</h3>
                                            <p className="text-sm">When patients request a diagnosis, their cases will appear here.</p>
                                        </motion.div>
                                    ) : (
                                        consultations.map((consult) => {
                                            const aiInfo = extractAIInfo(consult.diagnosis);
                                            const isSelected = selectedConsultation?.id === consult.id;

                                            return (
                                                <motion.div
                                                    layout
                                                    key={consult.id}
                                                    onClick={() => handleSelectConsultation(consult)}
                                                    className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 group ${isSelected
                                                        ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/50 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                                                        : 'bg-white/5 border border-white/5 hover:border-[#00E5FF]/30 hover:bg-[#00E5FF]/5'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10">
                                                                <User className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-white text-sm">{consult.patient_name}</h4>
                                                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                                    <Clock className="w-3 h-3" />
                                                                    {new Date(consult.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            {consult.status === 'completed' ? (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/20">Reviewed</span>
                                                            ) : consult.status === 'pending_appointment' ? (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20">Appointment</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Pending</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="bg-black/30 rounded-lg p-2.5 border border-white/5">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs text-gray-400 tracking-wide">AI DETECTION</span>
                                                            <span className={`text-xs font-bold ${aiInfo.riskColor}`}>{aiInfo.confidence}</span>
                                                        </div>
                                                        <p className="text-sm text-white font-medium truncate">{aiInfo.condition}</p>
                                                    </div>

                                                    {/* Hover Overlay Button */}
                                                    <div className={`absolute inset-0 bg-[#0a1622]/80 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 ${!isSelected && 'group-hover:opacity-100'} transition-opacity`}>
                                                        <span className="bg-[#00E5FF] text-black px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_#00E5FF] flex items-center gap-2">
                                                            View Case <ChevronRight className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Case Detail Panel */}
                        <div className="xl:col-span-2 bg-[#0a1622]/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden relative">
                            {selectedConsultation ? (
                                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                                    {/* Top Detail Header */}
                                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#0B1C2C] to-[#0a1622]">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-blue-600/20 flex items-center justify-center border border-[#00E5FF]/30 backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                                                    <User className="w-7 h-7 text-[#00E5FF]" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-white mb-1">{selectedConsultation.patient_name}</h2>
                                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                                        <span>Age: 32</span> • <span>Gender: M</span> •
                                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(selectedConsultation.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-[#00E5FF] font-mono mb-1">REQ-ID: {selectedConsultation.id.toString().padStart(5, '0')}</p>
                                                {selectedConsultation.status === 'completed' && <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30"><CheckCircle className="w-3.5 h-3.5" /> Diagnosed</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">

                                        {/* Left Column: Image & AI Analysis */}
                                        <div className="space-y-6">
                                            {/* Image Viewer */}
                                            <div className="relative aspect-square rounded-xl overflow-hidden bg-black/50 border border-white/10 group cursor-crosshair">
                                                {selectedConsultation.image_data ? (
                                                    <img
                                                        src={selectedConsultation.image_data}
                                                        alt="Scan"
                                                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.15]"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                                                        <User className="w-16 h-16 mb-4 opacity-30" />
                                                        <p className="text-sm font-medium">No image provided for this consultation request.</p>
                                                    </div>
                                                )}
                                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                                    <ZoomIn className="w-4 h-4 text-white" /> <span className="text-xs font-medium">Pan & Zoom</span>
                                                </div>
                                                <div className="absolute inset-0 pointer-events-none border border-[#00E5FF]/0 group-hover:border-[#00E5FF]/30 rounded-xl transition-colors shadow-[inset_0_0_20px_rgba(0,229,255,0)] group-hover:shadow-[inset_0_0_20px_rgba(0,229,255,0.1)]" />
                                            </div>

                                            {/* AI Analysis Panel */}
                                            {(() => {
                                                const aiInfo = extractAIInfo(selectedConsultation.diagnosis);
                                                return (
                                                    <div className="bg-[#0B1C2C]/80 rounded-xl p-5 border border-[#00E5FF]/20 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E5FF]/5 rounded-full blur-[30px] -mr-10 -mt-10" />

                                                        <h3 className="text-sm font-semibold text-[#00E5FF] mb-4 flex items-center gap-2 tracking-wide">
                                                            <BrainCircuit className="w-4 h-4" /> AI ANALYSIS ENGINE
                                                        </h3>

                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Detected Condition</p>
                                                                <p className="text-sm font-bold text-white">{aiInfo.condition}</p>
                                                            </div>
                                                            <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Confidence Score</p>
                                                                <p className={`text-sm font-bold ${aiInfo.riskColor}`}>{aiInfo.confidence}</p>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="flex justify-between text-xs mb-1.5">
                                                                <span className="text-gray-400">Risk Level Indicator</span>
                                                                <span className={aiInfo.riskColor + " font-medium uppercase text-[10px]"}>{aiInfo.riskLevel}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: aiInfo.confidence.replace('%', '') + '%' }}
                                                                    transition={{ duration: 1, delay: 0.2 }}
                                                                    className={`h-full bg-gradient-to-r ${aiInfo.barColor} shadow-[0_0_10px_currentColor]`}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Right Column: Diagnosis Input */}
                                        <div className="flex flex-col bg-[#0B1C2C]/50 rounded-xl border border-white/10 p-5 shadow-inner">
                                            <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2 border-b border-white/10 pb-3">
                                                <Stethoscope className="w-5 h-5 text-gray-400" /> Medical Evaluation form
                                            </h3>

                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Final Diagnosis</label>
                                                    <textarea
                                                        value={diagnosis}
                                                        onChange={(e) => setDiagnosis(e.target.value)}
                                                        placeholder="Enter definitive medical diagnosis..."
                                                        className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all resize-none"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Treatment Recommendation</label>
                                                    <textarea
                                                        value={treatment}
                                                        onChange={(e) => setTreatment(e.target.value)}
                                                        placeholder="Prescriptions, creams, or procedures..."
                                                        className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all resize-none"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Follow-up Schedule</label>
                                                    <select
                                                        value={followUp}
                                                        onChange={(e) => setFollowUp(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#00E5FF] appearance-none"
                                                    >
                                                        <option value="None required">None required</option>
                                                        <option value="1 week">In 1 week</option>
                                                        <option value="2 weeks">In 2 weeks</option>
                                                        <option value="1 month">In 1 month</option>
                                                        <option value="In-person visit required immediately">In-person visit required immediately</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="pt-6 mt-4 border-t border-white/10">
                                                <button
                                                    onClick={handleSubmitDiagnosis}
                                                    disabled={!diagnosis.trim()}
                                                    className="w-full py-3.5 bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black rounded-lg font-bold shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Send className="w-5 h-5" />
                                                    Submit Medical Response to Patient
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-[#00E5FF] blur-[40px] opacity-10 rounded-full animate-pulse" />
                                        <ActivitySquare className="w-24 h-24 text-gray-600 relative z-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-mono tracking-wide text-gray-300 mb-2">Awaiting Selection</h3>
                                    <p className="text-gray-500 max-w-sm">Select a patient request from the left panel to begin medical evaluation and provide an AI-assisted diagnosis.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DoctorDashboard;

