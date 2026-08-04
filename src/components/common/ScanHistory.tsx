import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Filter, Download, Trash2, ShieldCheck, 
    Activity, Calendar, ChevronDown, 
    Bell, User, Settings, FileText, 
    LogOut, Image, Plus, Loader2,
    BrainCircuit, LayoutDashboard, Users, History, MessageSquare, HelpCircle, ChevronRight, BarChart2
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
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const scanTemplateRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
            // Bug #5 Fix: use .id OR ._id — old sessions may store _id instead of id
            const userId = parsedUser.id || parsedUser._id;
            if (userId) {
                fetchScans(userId);
            } else {
                setError('Session expired. Please log in again.');
                setIsLoading(false);
            }
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
                    // Use /me endpoint (JWT-based, secure — no userId in URL)
                    const response = await api.get('/scans/me');
                    rawData = response.data.data || response.data;
                } catch (e: any) {
                    // Fallback: try with userId in URL for backward compat
                    const response = await api.get(`/scans/${userId}`);
                    rawData = response.data.data || response.data;
                }

                data = rawData.map((c: any) => {
                    if (c.id && c.id.startsWith("SCAN")) {
                        // Already formatted from old backend
                        return c;
                    }
                    const rawDate = c.date || c.created_at || new Date();
                    const scanDate = new Date(rawDate);
                    const finalDate = !isNaN(scanDate.getTime()) ? scanDate : new Date();

                    // Bug #4 Fix: Normalize result to Title Case for consistent UI display and filter matching
                    // DB stores lowercase ('benign'/'malignant'), filter options are Title Case ('Benign'/'Malignant')
                    const rawResult = c.result || 'unknown';
                    const normalizedResult = rawResult.charAt(0).toUpperCase() + rawResult.slice(1).toLowerCase();

                    return {
                        id: "SCAN" + String(c._id || c.id || "000000").substring(0, 6).toUpperCase(),
                        _id: c._id || c.id,
                        image: c.image || c.image_url || 'https://images.unsplash.com/photo-1614088612130-1b2ea13dadd4?w=400&h=400&fit=crop',
                        result: normalizedResult,  // Bug #4 Fix: always Title Case ('Benign', 'Malignant', 'Pending')
                        condition: c.condition || "AI Analysis",
                        confidence: c.confidence || c.risk_level || 0,  // Bug #2 Fix: reads confidence field now saved properly
                        date: finalDate.toISOString().split('T')[0],
                        time: finalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        consulted: c.consulted || false  // Bug #6 Fix: reads consulted field now saved properly
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

    const handleDownloadScanPDF = async (scan: Scan) => {
        setDownloadingId(scan._id);
        try {
            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                import('html2canvas'),
                import('jspdf'),
            ]);

            // Build a minimal AI-report div on the fly
            const container = document.createElement('div');
            container.style.cssText = `
                width:794px; min-height:600px; background:#fff;
                font-family:'Segoe UI',Arial,sans-serif; color:#1e293b;
                position:absolute; left:-9999px; top:0; box-sizing:border-box;
            `;
            const riskColor = scan.result === 'Malignant' ? '#ef4444' : '#10B981';
            container.innerHTML = `
                <div style="background:linear-gradient(135deg,#0e7490,#06b6d4,#0284c7);padding:28px 36px;display:flex;justify-content:space-between;align-items:center;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:42px;height:42px;border-radius:10px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.4);">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                        </div>
                        <div><div style="font-size:20px;font-weight:800;color:#fff;">DermaScan <span style="color:#bae6fd;">AI</span></div><div style="font-size:10px;color:rgba(255,255,255,.75);letter-spacing:1.5px;text-transform:uppercase;">AI Skin Analysis Report</div></div>
                    </div>
                    <div style="text-align:right;"><div style="font-size:12px;color:rgba(255,255,255,.7);">Scan ID</div><div style="font-size:15px;font-weight:700;color:#fff;font-family:monospace;">${scan.id}</div><div style="font-size:11px;color:rgba(255,255,255,.65);margin-top:4px;">${scan.date}</div></div>
                </div>
                <div style="background:#f0f9ff;border-bottom:1px solid #bae6fd;padding:14px 36px;display:flex;justify-content:space-between;align-items:center;">
                    <div style="display:flex;gap:32px;">
                        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:3px;">Patient</div><div style="font-size:14px;font-weight:700;">${user?.name || 'Patient'}</div></div>
                        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:3px;">Date</div><div style="font-size:14px;font-weight:700;">${scan.date}</div></div>
                    </div>
                    <div style="background:${riskColor};color:#fff;font-size:11px;font-weight:800;letter-spacing:2px;border-radius:20px;padding:5px 14px;">${scan.result.toUpperCase()}</div>
                </div>
                <div style="padding:28px 36px;display:flex;gap:24px;">
                    <div style="flex-shrink:0;">
                        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:8px;">Scan Image</div>
                        <div style="width:180px;height:180px;border-radius:10px;overflow:hidden;border:2px solid #e2e8f0;background:#f8fafc;">
                            <img src="${scan.image}" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous" />
                        </div>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:10px;">AI Analysis</div>
                        <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                            <div style="padding:14px 18px;border-bottom:1px solid #e2e8f0;"><div style="font-size:10px;color:#64748b;margin-bottom:3px;font-weight:600;">Detected Condition</div><div style="font-size:20px;font-weight:800;">${scan.condition}</div></div>
                            <div style="padding:14px 18px;border-bottom:1px solid #e2e8f0;"><div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:10px;color:#64748b;font-weight:600;">Confidence</span><span style="font-size:13px;font-weight:800;color:#06b6d4;">${scan.confidence}%</span></div><div style="height:7px;background:#e2e8f0;border-radius:99px;overflow:hidden;"><div style="height:100%;width:${scan.confidence}%;background:linear-gradient(90deg,#06b6d4,#0284c7);border-radius:99px;"></div></div></div>
                            <div style="padding:14px 18px;"><div style="font-size:10px;color:#64748b;font-weight:600;margin-bottom:5px;">Risk Classification</div><div style="display:inline-block;background:${scan.result === 'Malignant' ? '#fef2f2' : '#f0fdf4'};color:${riskColor};border:1px solid ${scan.result === 'Malignant' ? '#fecaca' : '#bbf7d0'};border-radius:8px;padding:5px 12px;font-size:12px;font-weight:700;">${scan.result === 'Malignant' ? '⚠ Potentially Malignant — Consult a Doctor' : '✓ Benign — Low Risk'}</div></div>
                        </div>
                        <div style="margin-top:16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:10px 14px;"><p style="font-size:11px;color:#92400e;line-height:1.6;margin:0;"><strong>Note:</strong> This is an AI-generated preliminary analysis only. Please consult a licensed dermatologist for a formal diagnosis.</p></div>
                    </div>
                </div>
                <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 36px;display:flex;justify-content:space-between;align-items:center;">
                    <p style="font-size:11px;color:#94a3b8;margin:0;">⚠ AI-assisted report — not a substitute for professional medical advice</p>
                    <div style="text-align:right;"><div style="font-size:11px;font-weight:700;color:#0284c7;">DermaScan AI</div><div style="font-size:10px;color:#94a3b8;">Generated: ${scan.date}</div></div>
                </div>
            `;
            document.body.appendChild(container);

            const canvas = await html2canvas(container, {
                scale: 2, useCORS: true, allowTaint: true,
                backgroundColor: '#ffffff', logging: false,
            });
            document.body.removeChild(container);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (canvas.height * pdfW) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
            pdf.save(`DermaScan-AI-Report-${scan.date}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
            setToastMessage({ type: 'error', text: 'Failed to generate PDF. Please try again.' });
        } finally {
            setDownloadingId(null);
        }
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
        { icon: Settings, label: 'Settings', path: '/doctor/settings' },
    ] : [
        { icon: User, label: 'My Profile', path: '/profile' },
        { icon: Activity, label: 'My Scan History', path: '/scan-history' },
        { icon: FileText, label: 'My Reports', path: '/my-reports' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const filteredScans = scans.filter(scan => {
        const matchesSearch = scan.condition.toLowerCase().includes(searchQuery.toLowerCase()) || scan.id.toLowerCase().includes(searchQuery.toLowerCase());
        // Bug #4 Fix: case-insensitive comparison — DB returns lowercase, filter options are Title Case
        const matchesFilter = filter === 'All' || scan.result.toLowerCase() === filter.toLowerCase();
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



    const MainContent = (
        <>
            <div className="w-full relative z-10">
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
                                        {role !== 'doctor' && (
                                            <button
                                                onClick={() => handleDownloadScanPDF(scan)}
                                                disabled={downloadingId === scan._id}
                                                className="p-2.5 rounded-[12px] bg-white/5 hover:bg-[#06B6D4]/10 border border-white/10 hover:border-[#06B6D4]/30 text-slate-300 hover:text-[#06B6D4] transition-colors disabled:opacity-60 disabled:cursor-wait"
                                                title={downloadingId === scan._id ? 'Generating...' : 'Download AI Report'}
                                            >
                                                {downloadingId === scan._id
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Download className="w-4 h-4" />}
                                            </button>
                                        )}
                                        {role === 'doctor' && (
                                            <button className="p-2.5 rounded-[12px] bg-white/5 hover:bg-[#06B6D4]/10 border border-white/10 hover:border-[#06B6D4]/30 text-slate-300 hover:text-[#06B6D4] transition-colors" title="Download">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        )}
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
            </div>
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
            
        </>
    );

    if (role === 'doctor') {
        return (
            <div className="flex h-screen bg-[#0B1C2C] text-white font-sans overflow-hidden selection:bg-[#00E5FF]/30 selection:text-white">
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(0,229,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.2) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
                
                <aside className="w-20 lg:w-64 bg-[#0a1622]/90 backdrop-blur-xl border-r border-[#00E5FF]/10 flex flex-col items-center lg:items-start py-6 z-20 shrink-0 transition-all duration-300">
                    <div className="flex items-center gap-3 px-4 lg:px-6 mb-12">
                        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="relative">
                            <div className="absolute inset-0 bg-[#00E5FF] blur-[10px] opacity-40 rounded-full" />
                            <BrainCircuit className="w-10 h-10 text-[#00E5FF] relative z-10" />
                        </motion.div>
                        <span className="hidden lg:block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00E5FF] to-blue-400">DermaScan AI</span>
                    </div>

                    <div className="w-full flex-1 space-y-2 px-3">
                        {[
                            { icon: LayoutDashboard, label: 'Dashboard',            path: '/doctor-dashboard' },
                            { icon: Users,           label: 'Patient Requests',     path: '/doctor-dashboard' },
                            { icon: Activity,        label: 'AI Scan Results',      path: '/doctor/scans', active: true },
                            { icon: History,         label: 'Consultation History', path: '/doctor/history' },
                            { icon: MessageSquare,   label: 'Messages',             path: '/doctor/messages' },
                            { icon: BarChart2,       label: 'Analytics',            path: '/doctor/analytics' },
                            { icon: Settings,        label: 'Settings',             path: '/doctor/settings' },
                        ].map((item, i) => (
                            <button key={i} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${(item as any).active ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.15)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                                {(item as any).active && <div className="absolute inset-y-0 left-0 w-1 bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" />}
                                <item.icon className={`w-5 h-5 ${(item as any).active ? 'text-[#00E5FF]' : 'group-hover:text-[#00E5FF] transition-colors'}`} />
                                <span className="hidden lg:block font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
                    <header className="relative z-[1000] h-20 bg-[#0B1C2C]/50 backdrop-blur-lg border-b border-[#00E5FF]/10 flex items-center justify-between px-6 shrink-0">
                        <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">Doctor Consultation Dashboard</h1>
                    <div className="flex items-center gap-6">
                            {/* Bell — wired to notifications */}
                            <button
                                onClick={() => navigate('/notifications')}
                                className="relative p-2 text-gray-400 hover:text-[#00E5FF] transition-colors"
                            >
                                <Bell className="w-6 h-6" />
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#00E5FF] rounded-full shadow-[0_0_8px_#00E5FF]" />
                            </button>
                            <div className="relative">
                                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 p-1 pr-3 rounded-full border border-white/10 hover:border-[#00E5FF]/40 bg-[#0a1622] transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00E5FF] to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
                                    </div>
                                    <span className="text-sm font-semibold text-white hidden sm:block">Dr. {user?.name ? user.name.split(' ')[0] : 'Doctor'}</span>
                                </button>
                                <AnimatePresence>
                                    {showProfileMenu && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-56 bg-[#0a1622]/95 border border-[#00E5FF]/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[9999] backdrop-blur-xl">
                                            <div className="px-4 py-3 bg-gradient-to-br from-[#00E5FF]/10 to-transparent border-b border-white/10">
                                                <p className="font-bold text-white text-sm">{user?.name || 'Doctor'}</p>
                                                <p className="text-xs text-[#00E5FF]/80">{user?.email || ''}</p>
                                            </div>
                                            <div className="p-2 space-y-0.5">
                                                <button onClick={() => { navigate('/profile'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#00E5FF]/15 rounded-lg flex items-center gap-3 transition-all group">
                                                    <User className="w-4 h-4 group-hover:text-[#00E5FF] transition-colors" /> View Profile
                                                </button>
                                                <button onClick={() => { navigate('/notifications'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#00E5FF]/15 rounded-lg flex items-center gap-3 transition-all group">
                                                    <Bell className="w-4 h-4 group-hover:text-[#00E5FF] transition-colors" /> Notifications
                                                </button>
                                                <button onClick={() => { navigate('/doctor/settings'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#00E5FF]/15 rounded-lg flex items-center gap-3 transition-all group">
                                                    <Settings className="w-4 h-4 group-hover:text-[#00E5FF] transition-colors" /> Settings
                                                </button>
                                            </div>
                                            <div className="p-2 border-t border-white/10">
                                                <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg flex items-center gap-3 transition-all">
                                                    <LogOut className="w-4 h-4" /> Sign Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </header>
                    
                    <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                        <div className="max-w-7xl mx-auto w-full">
                            {MainContent}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] text-white selection:bg-[#06B6D4]/30 overflow-x-hidden font-sans relative">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#06B6D4] blur-[200px] mix-blend-screen opacity-10 animate-[pulse_10s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#7C4DFF] blur-[200px] mix-blend-screen opacity-10 animate-[pulse_12s_ease-in-out_infinite_alternate]" />
            </div>

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
                    {/* Bell — wired to notifications */}
                    <button
                        onClick={() => navigate('/notifications')}
                        className="relative text-slate-400 hover:text-[#06B6D4] transition-colors group"
                    >
                        <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#06B6D4] rounded-full shadow-[0_0_8px_#06B6D4] animate-pulse" />
                    </button>
                    <div className="relative">
                        {/* AVATAR TRIGGER */}
                        <div
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="relative w-[38px] h-[38px] rounded-full cursor-pointer group flex items-center justify-center transition-transform hover:scale-105"
                        >
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] p-[2px] animate-[spin_4s_linear_infinite] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                                <div className="w-full h-full bg-[#0F172A] rounded-full" />
                            </div>
                            <span className="relative z-10 text-white text-[13px] font-bold tracking-wider" style={{ fontFamily: "'Syne', sans-serif" }}>
                                {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'HK'}
                            </span>
                            <div className="absolute top-0.5 right-0.5 w-[9px] h-[9px] bg-[#10B981] rounded-full border-[1.5px] border-[#0F172A] z-20">
                                <div className="absolute inset-0 bg-[#10B981] rounded-full animate-ping opacity-75" />
                            </div>
                        </div>

                        {/* DROPDOWN MENU */}
                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2, staggerChildren: 0.04 }}
                                    className="absolute right-0 mt-3 w-[240px] rounded-[16px] overflow-hidden z-[9999]"
                                    style={{
                                        backgroundColor: 'rgba(13, 21, 40, 0.92)',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 0 20px rgba(6,182,212,0.1), 0 10px 40px rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(6,182,212,0.2)'
                                    }}
                                >
                                    <div className="p-5 flex flex-col items-center border-b border-white/[0.06]">
                                        <div className="relative w-[60px] h-[60px] rounded-full mb-3 flex items-center justify-center">
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] p-[2px] animate-[spin_5s_linear_infinite]">
                                                <div className="w-full h-full bg-[#0D1528] rounded-full" />
                                            </div>
                                            <span className="relative z-10 text-white text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
                                                {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'HK'}
                                            </span>
                                        </div>
                                        <h3 className="text-white text-[16px] font-bold mb-1.5" style={{ fontFamily: "'Syne', sans-serif" }}>
                                            {user?.name || 'Het Koustav'}
                                        </h3>
                                        <div className="flex items-center gap-1.5 bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-1 rounded-full mb-2">
                                            <span className="text-[10px] uppercase font-bold text-[#10B981] tracking-wider" style={{ fontFamily: "'DM Sans', sans-serif" }}>Patient</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-2.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                            {user?.email || 'het@gmail.com'}
                                        </p>
                                        <div className="flex items-center gap-1.5 bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                            <span className="text-[10px] text-[#10B981] font-bold tracking-widest uppercase">Online</span>
                                        </div>
                                    </div>

                                    <div className="p-2 space-y-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                        {[
                                            { icon: User, label: 'My Profile', delay: 0, path: '/profile' },
                                            { icon: Activity, label: 'My Scan History', delay: 0.04, path: '/scan-history' },
                                            { icon: FileText, label: 'My Reports', delay: 0.08, path: '/my-reports' },
                                            { icon: Settings, label: 'Settings', delay: 0.12, path: '/settings' },
                                            { icon: HelpCircle, label: 'Help & Support', delay: 0.16, path: '/help' }
                                        ].map((item, idx) => (
                                            <motion.button
                                                key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: item.delay, duration: 0.2 }}
                                                onClick={() => { if (item.path) navigate(item.path); setShowProfileMenu(false); }}
                                                className="w-full relative flex items-center justify-between px-3 py-2.5 rounded-lg group transition-all duration-300 hover:bg-[#06B6D4]/10 overflow-hidden"
                                            >
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-[#06B6D4] group-hover:h-full transition-all duration-300" />
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="w-4 h-4 text-slate-400 group-hover:text-[#06B6D4] transition-colors" />
                                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                                                </div>
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] transition-transform group-hover:translate-x-0.5" />
                                            </motion.button>
                                        ))}
                                    </div>

                                    <div className="h-px w-full bg-white/[0.06]" />

                                    <div className="p-2">
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.2 }}
                                            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all duration-300 hover:bg-[#ef4444]/10"
                                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                                        >
                                            <LogOut className="w-4 h-4 text-[#ef4444]" />
                                            <span className="text-sm font-medium text-[#ef4444]">Sign Out</span>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
                {MainContent}
            </main>
        </div>
    );
};

export default ScanHistory;
