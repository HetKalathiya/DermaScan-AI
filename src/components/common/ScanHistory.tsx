import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Filter, Download, Trash2, ShieldCheck, 
    Activity, Calendar, ChevronDown, 
    Bell, User, Settings, FileText, 
    LogOut, Image, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Scan {
    id: string;
    _id: string;
    image: string;
    result: string;
    condition: string;
    confidence: number;
    date: string;
    time: string;
    consulted: boolean;
}

interface ScanHistoryProps {
    role?: 'patient' | 'doctor';
}

const ScanHistory: React.FC<ScanHistoryProps> = ({ role = 'patient' }) => {
    const navigate = useNavigate();
    const [scans, setScans] = useState<Scan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('All');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [user, setUser] = useState<{ id: string, name: string, email: string } | null>(null);
    const [scanToDelete, setScanToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Auto hide toast
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchScans(parsedUser.id);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchScans = async (userId: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const api = (await import('../../services/api')).default;
            
            let data: Scan[] = [];
            
            if (role === 'doctor') {
                const response = await api.get('/doctor/consultations');
                data = response.data.map((c: any) => {
                    let condition = "Unknown";
                    let confidence = 0;
                    let result = "Unknown";
        
                    if (c.diagnosis && c.diagnosis.includes('AI Analysis:')) {
                        const match = c.diagnosis.match(/AI Analysis:\s*(.+?)\s*\((.+?)\)/);
                        if (match) {
                            condition = match[1];
                            confidence = parseInt(match[2].replace('%', '')) || 0;
                            if (condition.toLowerCase().includes('concern') || condition.toLowerCase().includes('melanoma') || confidence >= 85) {
                                result = 'Malignant';
                            } else {
                                result = 'Benign';
                            }
                        }
                    }

                    return {
                        id: "SCAN" + (c._id || c.id).substring(0, 6).toUpperCase(),
                        _id: c._id || c.id,
                        image: c.image_data,
                        result,
                        condition,
                        confidence,
                        date: new Date(c.created_at).toISOString().split('T')[0],
                        time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        consulted: true // Doctor ones mapped from consultations are technically already reviewed
                    };
                });
            } else {
                let rawData;
                try {
                    const response = await api.get(`/scans/${userId}`);
                    rawData = response.data.data || response.data;
                } catch (e: any) {
                    try {
                        const response = await api.get(`/scan-history/${userId}`);
                        rawData = response.data;
                    } catch(innerE) {
                        throw innerE;
                    }
                }
                
                data = rawData.map((c: any) => {
                    if (c.id && c.id.startsWith("SCAN")) {
                        // Already formatted from old backend
                        return c;
                    }
                    const rawDate = c.date || c.created_at || new Date();
                    const scanDate = new Date(rawDate);
                    const finalDate = !isNaN(scanDate.getTime()) ? scanDate : new Date();

                    return {
                        id: "SCAN" + String(c._id || c.id || "000000").substring(0, 6).toUpperCase(),
                        _id: c._id || c.id,
                        image: c.image || c.image_url || 'https://images.unsplash.com/photo-1614088612130-1b2ea13dadd4?w=400&h=400&fit=crop',
                        result: c.result || "Unknown",
                        condition: c.condition || "AI Analysis",
                        confidence: c.confidence || c.risk_level || 0,
                        date: finalDate.toISOString().split('T')[0],
                        time: finalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        consulted: c.consulted || false
                    };
                });
            }
            
            setScans(data);
        } catch (err) {
            console.error('Error fetching scans:', err);
            setError('Failed to fetch scan history. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleDeleteConfirm = async () => {
        if (!scanToDelete) return;
        setIsDeleting(true);
        try {
            const api = (await import('../../services/api')).default;
            try {
                await api.delete(`/scans/${scanToDelete}`);
            } catch (e) {
                await api.delete(`/scan/${scanToDelete}`);
            }
            
            setScans(prev => prev.filter(scan => scan._id !== scanToDelete));
            setToastMessage({ type: 'success', text: 'Scan deleted successfully' });
        } catch (err) {
            console.error('Error deleting scan:', err);
            setToastMessage({ type: 'error', text: 'Failed to delete scan' });
        } finally {
            setIsDeleting(false);
            setScanToDelete(null);
        }
    };

    const dashboardPath = role === 'doctor' ? '/doctor-dashboard' : '/dashboard';
    
    const menuLinks = role === 'doctor' ? [
        { icon: User, label: 'Doctor Profile', path: '/profile' },
        { icon: Activity, label: 'Patient Scans', path: '/scan-history' },
        { icon: Settings, label: 'Settings', path: '#' }
    ] : [
        { icon: User, label: 'My Profile', path: '/profile' },
        { icon: Activity, label: 'My Scan History', path: '/scan-history' },
        { icon: FileText, label: 'My Reports', path: '#' },
        { icon: Settings, label: 'Settings', path: '#' }
    ];

    const filteredScans = scans.filter(scan => {
        const matchesSearch = scan.condition.toLowerCase().includes(searchQuery.toLowerCase()) || scan.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'All' || scan.result === filter;
        return matchesSearch && matchesFilter;
    });

    const getRiskGlow = (result: string) => {
        if (result === 'Malignant') return 'shadow-[0_0_15px_rgba(239,68,68,0.3)] border-red-500/30 hover:border-red-500/60 hover:shadow-[0_10px_30px_rgba(239,68,68,0.4)]';
        return 'shadow-[0_0_15px_rgba(16,185,129,0.3)] border-[#10B981]/30 hover:border-[#10B981]/60 hover:shadow-[0_10px_30px_rgba(16,185,129,0.4)]';
    };

    const getRiskText = (result: string) => {
        if (result === 'Malignant') return 'text-red-500 bg-red-500/10 border-red-500/20';
        return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20';
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-white selection:bg-[#06B6D4]/30 overflow-x-hidden font-sans relative">
            
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#06B6D4] blur-[200px] mix-blend-screen opacity-10 animate-[pulse_10s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#7C4DFF] blur-[200px] mix-blend-screen opacity-10 animate-[pulse_12s_ease-in-out_infinite_alternate]" />
            </div>

            {/* TOP NAVIGATION BAR */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0A101C]/80 backdrop-blur-xl border-b border-white/[0.05] h-20 flex items-center justify-between px-6 lg:px-10">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(dashboardPath)}>
                    <div className="relative flex items-center justify-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#2979FF] flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] relative overflow-hidden z-10 transition-transform hover:scale-105">
                            <div className="absolute inset-0 bg-white/20"></div>
                            <ShieldCheck className="w-6 h-6 text-white relative z-10" />
                        </div>
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight hidden sm:block" style={{ fontFamily: "'Syne', sans-serif" }}>
                        DermaScan <span className="text-[#06B6D4]">AI</span>
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <button className="relative text-slate-400 hover:text-[#06B6D4] transition-colors group">
                        <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#06B6D4] rounded-full shadow-[0_0_8px_#06B6D4] animate-pulse" />
                    </button>

                    <div className="relative">
                        <div
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="relative w-[38px] h-[38px] rounded-full cursor-pointer group flex items-center justify-center transition-transform hover:scale-105"
                        >
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#06B6D4] to-[#2979FF] p-[2px] animate-[spin_4s_linear_infinite] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                                <div className="w-full h-full bg-[#0F172A] rounded-full" />
                            </div>
                            <span className="relative z-10 text-white text-[13px] font-bold tracking-wider" style={{ fontFamily: "'Syne', sans-serif" }}>
                                {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'HK'}
                            </span>
                        </div>

                        {/* Profile Menu Dropdown */}
                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-3 w-[240px] rounded-[16px] overflow-hidden z-[9999]"
                                    style={{
                                        backgroundColor: 'rgba(13, 21, 40, 0.92)',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 0 20px rgba(6,182,212,0.1), 0 10px 40px rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(6,182,212,0.2)'
                                    }}
                                >
                                    <div className="p-2 space-y-0.5 mt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                        {menuLinks.map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { if(item.path) navigate(item.path); setShowProfileMenu(false); }}
                                                className={`w-full relative flex items-center justify-between px-3 py-2.5 rounded-lg group transition-all duration-300 ${item.path === '/scan-history' ? 'bg-[#06B6D4]/10' : 'hover:bg-[#06B6D4]/10'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className={`w-4 h-4 transition-colors ${item.path === '/scan-history' ? 'text-[#06B6D4]' : 'text-slate-400 group-hover:text-[#06B6D4]'}`} />
                                                    <span className={`text-sm font-medium transition-colors ${item.path === '/scan-history' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{item.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="h-px w-full bg-white/[0.06] my-2" />
                                    <div className="p-2 mb-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all duration-300 hover:bg-[#ef4444]/10"
                                        >
                                            <LogOut className="w-4 h-4 text-[#ef4444]" />
                                            <span className="text-sm font-medium text-[#ef4444]">Sign Out</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT AREA */}
            <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                            {role === 'doctor' ? 'Patient Scans' : 'Scan History'}
                        </h1>
                        <p className="text-lg text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {role === 'doctor' ? 'Review analysis reports submitted by patients' : 'View and track your previous skin analysis reports'}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-[#06B6D4] transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search scans..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#0B1425]/80 backdrop-blur-md border border-white/10 text-white rounded-[16px] pl-11 pr-4 py-3.5 focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4] transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] placeholder:text-slate-500 hover:border-white/20"
                            />
                            {/* Glowing effect inside the input border */}
                            <div className="absolute inset-0 rounded-[16px] pointer-events-none border border-[#06B6D4] opacity-0 group-focus-within:opacity-100 group-focus-within:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all" />
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative w-full sm:w-auto">
                            <button 
                                onClick={() => setShowFilterMenu(!showFilterMenu)}
                                className="w-full flex items-center justify-between gap-3 bg-[#0B1425]/80 backdrop-blur-md border border-white/10 hover:border-white/20 text-white rounded-[16px] px-5 py-3.5 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] whitespace-nowrap"
                            >
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-[#06B6D4]" />
                                    <span className="font-medium">{filter}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showFilterMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute right-0 mt-2 w-48 bg-[#0D1528]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden z-50 py-1"
                                    >
                                        {['All', 'Benign', 'Malignant', 'Recent'].map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => { setFilter(item); setShowFilterMenu(false); }}
                                                className={`w-full text-left px-5 py-3 hover:bg-white/5 transition-colors flex items-center justify-between ${filter === item ? 'text-[#06B6D4] font-bold bg-[#06B6D4]/5' : 'text-slate-300'}`}
                                            >
                                                {item}
                                                {filter === item && <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* History Cards Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-[#0B1425]/70 border border-white/[0.08] rounded-[20px] h-[360px] animate-pulse">
                                <div className="h-48 bg-white/5 rounded-t-[20px]"></div>
                                <div className="p-6">
                                    <div className="h-6 bg-white/10 rounded w-3/4 mb-4"></div>
                                    <div className="h-4 bg-white/10 rounded w-1/2 mb-6"></div>
                                    <div className="flex gap-3">
                                        <div className="h-10 bg-white/10 rounded flex-1"></div>
                                        <div className="h-10 w-10 bg-white/10 rounded"></div>
                                        <div className="h-10 w-10 bg-white/10 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full text-center py-20 text-red-400 bg-red-500/10 rounded-[32px] border border-red-500/20 shadow-lg">
                        <p className="text-xl font-bold">{error}</p>
                        <button onClick={() => user && fetchScans(user.id)} className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition-colors">Retry</button>
                    </motion.div>
                ) : filteredScans.length > 0 ? (
                    <motion.div 
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredScans.sort((a,b) => (filter === 'Recent' ? new Date(b.date).getTime() - new Date(a.date).getTime() : 0)).map((scan, idx) => (
                            <motion.div 
                                key={scan.id}
                                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                                className={`group relative bg-[#0B1425]/70 backdrop-blur-xl border border-white/[0.08] hover:border-[#06B6D4]/50 rounded-[20px] overflow-hidden transition-all duration-300 hover:-translate-y-2 ${getRiskGlow(scan.result)}`}
                            >
                                {/* Highlight latest scan */}
                                {idx === 0 && filter === 'All' && !searchQuery && (
                                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#06B6D4] to-[#2979FF] z-20" />
                                )}

                                {/* Top Image Section */}
                                <div className="relative h-48 overflow-hidden bg-black/50 group/img">
                                    <img 
                                        src={scan.image || 'https://images.unsplash.com/photo-1614088612130-1b2ea13dadd4?w=400&h=400&fit=crop'} 
                                        alt={scan.condition} 
                                        className="w-full h-full object-cover transform group-hover/img:scale-110 transition-transform duration-700 opacity-80 group-hover/img:opacity-100"
                                    />
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1425] to-transparent opacity-90" />
                                    
                                    {/* Quick Preview Hover State */}
                                    <div className="absolute inset-0 bg-[#06B6D4]/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transform scale-50 group-hover:scale-100 transition-transform duration-300 delay-100">
                                            <Search className="w-5 h-5 text-white" />
                                        </div>
                                    </div>

                                    {/* Status Pill */}
                                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                        <div className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md border ${getRiskText(scan.result)} shadow-[0_0_10px_currentColor] w-fit`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                            {scan.result.toUpperCase()}
                                        </div>
                                        {role !== 'doctor' && (
                                            <div className={`px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 backdrop-blur-md border shadow-lg w-fit ${scan.consulted ? 'bg-[#7C4DFF]/20 text-[#7C4DFF] border-[#7C4DFF]/30' : 'bg-slate-500/20 text-slate-300 border-white/10'}`}>
                                                {scan.consulted ? 'REVIEWED BY DOCTOR' : 'NOT REVIEWED'}
                                            </div>
                                        )}
                                    </div>

                                    {/* AI Tag */}
                                    <div className="absolute top-4 right-4 z-10 bg-[#0A101C]/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg">
                                        <Activity className="w-3.5 h-3.5 text-[#06B6D4]" /> 
                                        <span className="tracking-wider">AI ANALYZED</span>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6 flex flex-col gap-5">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1.5 group-hover:text-[#06B6D4] transition-colors line-clamp-1" style={{ fontFamily: "'Syne', sans-serif" }}>{scan.condition}</h3>
                                        <p className="text-[11px] text-slate-400 font-mono tracking-wider">{scan.id}</p>
                                    </div>

                                    <div className="flex items-center justify-between text-sm bg-white/[0.02] p-3 rounded-[12px] border border-white/[0.03]">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Calendar className="w-4 h-4 text-[#06B6D4]" />
                                            <span className="font-medium text-[13px]">{scan.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white font-semibold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></span>
                                            <span className="text-[#06B6D4] text-[13px]">{scan.confidence}%</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 pt-1">
                                        <button className="flex-1 py-2.5 rounded-[12px] border border-[#06B6D4]/30 text-[#06B6D4] hover:text-white font-bold transition-all flex justify-center items-center gap-2 group/btn relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4] to-[#2979FF] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                                            <FileText className="w-4 h-4 relative z-10" /> 
                                            <span className="relative z-10">View Report</span>
                                        </button>
                                        <button className="p-2.5 rounded-[12px] bg-white/5 hover:bg-[#06B6D4]/10 border border-white/10 hover:border-[#06B6D4]/30 text-slate-300 hover:text-[#06B6D4] transition-colors" title="Download">
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => setScanToDelete(scan._id)}
                                            className="p-2.5 rounded-[12px] bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-500 transition-colors" 
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    /* Empty State */
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        className="w-full flex justify-center items-center py-20"
                    >
                        <div className="max-w-md w-full text-center flex flex-col items-center bg-[#0B1425]/60 backdrop-blur-xl border border-white/10 p-12 rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#06B6D4] to-[#7C4DFF]" />
                            <div className="w-24 h-24 rounded-full bg-[#06B6D4]/10 flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 rounded-full border border-[#06B6D4]/30 animate-[spin_4s_linear_infinite]" />
                                <Image className="w-10 h-10 text-[#06B6D4]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                                {role === 'doctor' ? "No patient scans found" : "No scan history available"}
                            </h3>
                            <p className="text-slate-400 mb-8 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                {filter !== 'All' 
                                    ? `You don't have any scans matching the "${filter}" filter.`
                                    : (role === 'doctor' 
                                        ? "There are no consultation requests yet." 
                                        : "You haven't performed any skin scans yet. Start your first analysis to track your skin health.")
                                }
                            </p>
                            {role !== 'doctor' && (
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full py-4 bg-gradient-to-r from-[#06B6D4] to-[#2979FF] rounded-xl text-lg font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transform hover:-translate-y-1 transition-all flex justify-center items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" /> Start New Scan
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </main>

            {/* DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {scanToDelete && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0A101C]/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#0B1425] border border-white/10 p-8 rounded-[24px] max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600" />
                            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>Delete Scan History</h3>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                Are you sure you want to delete this scan? This action cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setScanToDelete(null)}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white transition-all border border-white/10 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteConfirm}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500/90 hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex justify-center items-center disabled:opacity-50"
                                >
                                    {isDeleting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete Scan'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOAST NOTIFICATION */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, x: '-50%' }} 
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className={`fixed bottom-8 left-1/2 z-[99999] px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-md border shadow-2xl ${
                            toastMessage.type === 'success' 
                                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' 
                                : 'bg-red-500/10 border-red-500/30 text-red-500'
                        }`}
                    >
                        {toastMessage.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                        <span className="font-semibold text-sm">{toastMessage.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>
            
        </div>
    );
};

export default ScanHistory;
