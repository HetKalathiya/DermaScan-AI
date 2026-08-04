import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileText, ShieldCheck, 
    Calendar, User, Bell, LogOut,
    Activity, Settings, Stethoscope, Download, Loader2, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportPDFTemplate from './ReportPDFTemplate';

interface Report {
    id: string;
    image_data: string;
    diagnosis: string | null;
    treatment?: string | null;
    follow_up?: string | null;
    status: string;
    created_at: string;
    ai_condition?: string;
    ai_confidence?: number;
    ai_result?: string;
}

const MyReports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [user, setUser] = useState<{ id: string, name: string, email: string, role?: string } | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const templateRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Close profile menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        if (showProfileMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchReports();
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchReports = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/user/consultations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Filter only completed reports
                const completedReports = data.filter((item: any) => item.status === 'completed').map((item: any) => ({
                    id: item.id || item._id,
                    image_data: item.image_data,
                    diagnosis: item.diagnosis || null,
                    treatment: item.treatment || null,
                    follow_up: item.follow_up || null,
                    status: item.status,
                    created_at: item.created_at,
                    ai_condition: item.ai_condition,
                    ai_confidence: item.ai_confidence,
                    ai_result: item.ai_result
                }));
                setReports(completedReports);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleDownloadPDF = async (report: Report) => {
        const templateEl = templateRefs.current[report.id];
        if (!templateEl) return;
        setDownloadingId(report.id);
        try {
            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                import('html2canvas'),
                import('jspdf'),
            ]);
            const canvas = await html2canvas(templateEl, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (canvas.height * pdfW) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
            const dateStr = new Date(report.created_at).toISOString().split('T')[0];
            pdf.save(`DermaScan-Report-${dateStr}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    // Parse diagnosis for display — supports both structured fields (new) and
    // old concatenated format: "Diagnosis: ...\nTreatment: ...\nFollow-up: ..."
    const parseDiagnosis = (report: Report) => {
        // New format: fields stored separately in DB
        if (report.treatment || report.follow_up) {
            return {
                diagnosis: report.diagnosis || 'No diagnosis provided',
                treatment: report.treatment || '',
                followup: report.follow_up || ''
            };
        }
        // Old format: everything concatenated in diagnosis string
        const text = report.diagnosis || '';
        const lines = text.split('\n');
        let diagnosis = text;
        let treatment = '';
        let followup = '';
        lines.forEach(line => {
            if (line.startsWith('Diagnosis:')) diagnosis = line.replace('Diagnosis:', '').trim();
            if (line.startsWith('Treatment:')) treatment = line.replace('Treatment:', '').trim();
            if (line.startsWith('Follow-up:')) followup = line.replace('Follow-up:', '').trim();
        });
        return { diagnosis, treatment, followup };
    };

    const menuLinks = [
        { icon: User,        label: 'My Profile',     path: '/profile' },
        { icon: Activity,    label: 'My Scan History', path: '/scan-history' },
        { icon: FileText,    label: 'My Reports',      path: '/my-reports' },
        { icon: Settings,    label: 'Settings',        path: '/settings' },
        { icon: HelpCircle,  label: 'Help & Support',  path: '/help' },
    ];

    return (
        <div className="min-h-screen bg-[#0F172A] text-white selection:bg-[#06B6D4]/30 overflow-x-hidden font-sans relative">
            
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#06B6D4] blur-[200px] mix-blend-screen opacity-10 animate-[pulse_10s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#3B82F6] blur-[200px] mix-blend-screen opacity-10 animate-[pulse_12s_ease-in-out_infinite_alternate]" />
            </div>

            <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0A101C]/80 backdrop-blur-xl border-b border-white/[0.05] h-20 flex items-center justify-between px-6 lg:px-10">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <div className="relative flex items-center justify-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] relative overflow-hidden z-10 transition-transform hover:scale-105">
                            <div className="absolute inset-0 bg-white/20"></div>
                            <ShieldCheck className="w-6 h-6 text-white relative z-10" />
                        </div>
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight hidden sm:block" style={{ fontFamily: "'Syne', sans-serif" }}>
                        DermaScan <span className="text-[#06B6D4]">AI</span>
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    {/* Bell — wired to notifications page */}
                    <button
                        onClick={() => navigate('/notifications')}
                        className="relative text-slate-400 hover:text-[#06B6D4] transition-colors group"
                    >
                        <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#06B6D4] rounded-full shadow-[0_0_8px_#06B6D4] animate-pulse" />
                    </button>

                    {/* Profile menu — now has full user info header + Help & Support */}
                    <div className="relative" ref={profileMenuRef}>
                        <div
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="relative w-[38px] h-[38px] rounded-full cursor-pointer group flex items-center justify-center transition-transform hover:scale-105"
                        >
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] p-[2px] animate-[spin_4s_linear_infinite] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                                <div className="w-full h-full bg-[#0F172A] rounded-full" />
                            </div>
                            <span className="relative z-10 text-white text-[13px] font-bold tracking-wider" style={{ fontFamily: "'Syne', sans-serif" }}>
                                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'ME'}
                            </span>
                        </div>

                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.97 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-3 w-[260px] rounded-[16px] overflow-hidden z-[9999]"
                                    style={{
                                        backgroundColor: 'rgba(13, 21, 40, 0.95)',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 0 20px rgba(6,182,212,0.1), 0 10px 40px rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(6,182,212,0.2)'
                                    }}
                                >
                                    {/* User info header — matches ScanHistory/Notifications style */}
                                    <div className="px-4 py-4 bg-gradient-to-br from-[#06B6D4]/10 to-transparent border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] flex items-center justify-center text-sm font-bold text-white shrink-0">
                                                {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-white text-sm truncate">{user?.name || 'Patient'}</p>
                                                <p className="text-xs text-[#06B6D4]/80 truncate">{user?.email || ''}</p>
                                                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">Patient</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-2.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-xs text-emerald-400 font-medium">Online</span>
                                        </div>
                                    </div>

                                    <div className="p-2 space-y-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                        {menuLinks.map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { navigate(item.path); setShowProfileMenu(false); }}
                                                className={`w-full relative flex items-center justify-between px-3 py-2.5 rounded-lg group transition-all duration-300 ${item.path === '/my-reports' ? 'bg-[#06B6D4]/10' : 'hover:bg-[#06B6D4]/10'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className={`w-4 h-4 transition-colors ${item.path === '/my-reports' ? 'text-[#06B6D4]' : 'text-slate-400 group-hover:text-[#06B6D4]'}`} />
                                                    <span className={`text-sm font-medium transition-colors ${item.path === '/my-reports' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{item.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="h-px w-full bg-white/[0.06]" />
                                    <div className="p-2">
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all duration-300 hover:bg-[#ef4444]/10">
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

            <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                        My Reports
                    </h1>
                    <p className="text-lg text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        View official medical reports and diagnoses submitted by your dermatologists.
                    </p>
                </motion.div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-[#0B1425]/70 border border-white/[0.08] rounded-[24px] h-[300px] animate-pulse" />
                        ))}
                    </div>
                ) : reports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {reports.map((report, index) => {
                            const parsed = parseDiagnosis(report);
                            return (
                                <motion.div 
                                    key={report.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-[#0B1425]/80 backdrop-blur-xl border border-white/10 rounded-[24px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col hover:border-[#06B6D4]/30 transition-all"
                                >
                                    <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#06B6D4]/10 flex items-center justify-center border border-[#06B6D4]/30">
                                                <Stethoscope className="w-5 h-5 text-[#06B6D4]" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>Medical Report</h3>
                                                <div className="text-xs text-slate-400 flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(report.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                            Reviewed
                                        </span>
                                    </div>

                                    <div className="p-6 flex flex-col md:flex-row gap-6 flex-1">
                                        <div className="w-full md:w-1/3 aspect-square rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                                            <img src={report.image_data || 'https://via.placeholder.com/300'} alt="Scan" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Final Diagnosis</p>
                                                <p className="text-white text-sm bg-white/5 p-3 rounded-lg border border-white/5">{parsed.diagnosis}</p>
                                            </div>
                                            {parsed.treatment && (
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Treatment Recommendation</p>
                                                    <p className="text-white text-sm bg-white/5 p-3 rounded-lg border border-white/5">{parsed.treatment}</p>
                                                </div>
                                            )}
                                            {parsed.followup && (
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Follow-up Schedule</p>
                                                    <p className="text-[#06B6D4] text-sm font-semibold">{parsed.followup}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
                                        <button
                                            onClick={() => handleDownloadPDF(report)}
                                            disabled={downloadingId === report.id}
                                            className="flex items-center gap-2 text-sm text-[#06B6D4] hover:text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-wait px-4 py-2 rounded-lg hover:bg-[#06B6D4]/10 border border-transparent hover:border-[#06B6D4]/30"
                                        >
                                            {downloadingId === report.id ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
                                            ) : (
                                                <><Download className="w-4 h-4" /> Download PDF</>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex justify-center items-center py-20">
                        <div className="max-w-md w-full text-center flex flex-col items-center bg-[#0B1425]/60 backdrop-blur-xl border border-white/10 p-12 rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                            <div className="w-24 h-24 rounded-full bg-[#06B6D4]/10 flex items-center justify-center mb-6">
                                <FileText className="w-10 h-10 text-[#06B6D4]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                                No Reports Yet
                            </h3>
                            <p className="text-slate-400 mb-8 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                You don't have any completed medical reports from doctors. Once a dermatologist reviews your consultation request, the final report will appear here.
                            </p>
                            <button 
                                onClick={() => navigate('/dermatologists')}
                                className="px-6 py-3 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] rounded-xl font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all"
                            >
                                Book a Consultation
                            </button>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Hidden PDF templates rendered off-screen for html2canvas capture */}
            <div aria-hidden="true" style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1, pointerEvents: 'none' }}>
                {reports.map(report => (
                    <ReportPDFTemplate
                        key={report.id}
                        ref={(el) => { templateRefs.current[report.id] = el; }}
                        report={report}
                        patientName={user?.name || 'Patient'}
                    />
                ))}
            </div>
        </div>
    );
};

export default MyReports;
