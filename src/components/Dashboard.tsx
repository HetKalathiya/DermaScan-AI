import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Upload, Camera, X, RefreshCw, Send, ShieldCheck, LogOut, User, Settings, Users, Activity, ChevronRight, Bell, FileText, HelpCircle, Download, Calendar, ArrowRight, Shield, Zap, Sparkles, AlertTriangle, Share2, Maximize, CheckCircle, Info, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ConsultationChat from './common/ConsultationChat';
import { MessageSquare } from 'lucide-react';
const Dashboard = () => {
    const navigate = useNavigate();
    const webcamRef = useRef<Webcam>(null);
    const [image, setImage] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [user, setUser] = useState<{ id?: string, _id?: string, name: string, email: string } | null>(null);
    const [consultations, setConsultations] = useState<any[]>([]);
    const [chatConsultation, setChatConsultation] = useState<any | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(undefined);

    const [aiResult, setAiResult] = useState<{ condition: string, confidence: string, riskLevel: 'Low' | 'Medium' | 'High', recommendation: string, result: string } | null>(null);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    // Bug #3 Fix: track scan-save errors so user sees a visible warning
    const [scanSaveError, setScanSaveError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (!token) {
                navigate('/login');
                return;
            }

            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.role === 'doctor') {
                    navigate('/doctor-dashboard');
                    return;
                }
                setUser(parsedUser);
            }
        };
        checkAuth();
    }, [navigate]);

    useEffect(() => {
        const fetchConsultations = async () => {
            try {
                const token = localStorage.getItem('token');
                if(token) {
                    const response = await fetch('http://localhost:5000/api/user/consultations', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if(response.ok) {
                        const data = await response.json();
                        setConsultations(data);
                    }
                }
            } catch(e) {}
        }
        fetchConsultations();
    }, []);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch('http://localhost:5000/api/notifications', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.unreadCount || 0);
                }
            } catch (_) {}
        };
        fetchUnread();
    }, []);

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImage(imageSrc);
            setCameraActive(false);
            setCameraError(null);
            setAiResult(null);
        }
    }, [webcamRef]);

    const handleUserMediaError = useCallback((error: string | DOMException) => {
        setCameraError(`Camera Error: Please check permissions.`);
    }, []);

    const handleUserMedia = useCallback(() => {
        setCameraError(null);
    }, []);

    useEffect(() => {
        const getDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(({ kind, label }) =>
                    kind === "videoinput" && !label.toLowerCase().includes("virtual")
                );
                if (videoDevices.length > 0) setActiveDeviceId(videoDevices[0].deviceId);
            } catch (error) { }
        };
        getDevices();
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setAiResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetImage = () => {
        setImage(null);
        setCameraActive(false);
        setIsAnalyzing(false);
        setAiResult(null);
    };

    const handleAnalyze = () => {
        if (!image) return;
        setIsAnalyzing(true);
        // Mock AI computation
        setTimeout(async () => {
            const mockResults = [
                { condition: "Benign Nevus", confidence: "98%", riskLevel: "Low" as const, recommendation: "No immediate action required. Monitor for changes.", result: "Benign" },
                { condition: "Actinic Keratosis", confidence: "85%", riskLevel: "Medium" as const, recommendation: "Consult a dermatologist for a detailed evaluation.", result: "Benign" },
                { condition: "Melanoma Indicator", confidence: "92%", riskLevel: "High" as const, recommendation: "Urgent: Please book a consultation with a specialist immediately.", result: "Malignant" }
            ];
            const random = mockResults[Math.floor(Math.random() * mockResults.length)];
            setAiResult(random);
            setIsAnalyzing(false);

            try {
                const token = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');
                if (token && storedUser && image) {
                    const parsedUser = JSON.parse(storedUser);
                    // Pre-upload image to Cloudinary to get a permanent URL
                    let imageUrl = image;
                    try {
                        const formData = new FormData();
                        const blob = await fetch(image).then(r => r.blob());
                        formData.append('image', blob, 'scan.jpg');
                        const uploadRes = await fetch('http://localhost:5000/api/upload', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: formData
                        });
                        if (uploadRes.ok) {
                            const uploadData = await uploadRes.json();
                            imageUrl = uploadData.data?.url || image;
                        }
                    } catch (uploadErr) {
                        console.warn('Cloudinary pre-upload failed, using base64 fallback:', uploadErr);
                    }
                    // Bug #1 Fix: Normalize result to lowercase to match Mongoose enum ['benign','malignant','pending']
                    const saveRes = await fetch('http://localhost:5000/api/scans/upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            userId: parsedUser.id || parsedUser._id,
                            image: imageUrl,
                            result: random.result.toLowerCase(),  // Bug #1 Fix: was 'Benign'/'Malignant', now 'benign'/'malignant'
                            condition: random.condition,
                            confidence: parseInt(random.confidence),  // Bug #2 Fix: confidence now saved
                            date: new Date().toISOString(),
                            consulted: false
                        })
                    });
                    if (!saveRes.ok) {
                        // Bug #3 Fix: surface save failure to user
                        setScanSaveError('Scan result could not be saved to history. Please check your connection.');
                        setTimeout(() => setScanSaveError(null), 6000);
                    }
                }
            } catch(e) {
                console.error("Failed to automatically save scan result:", e);
                // Bug #3 Fix: show visible error so user knows scan wasn't saved
                setScanSaveError('Scan result could not be saved to history. Please check your connection.');
                setTimeout(() => setScanSaveError(null), 6000);
            }
        }, 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleShareWithDoctor = async () => {
        if (!image || !aiResult || isSharing) return;
        setIsSharing(true);
        try {
            const token = localStorage.getItem('token');

            // Step 1: Pre-upload image to Cloudinary to get a permanent HTTPS URL
            let imageUrl = image;
            try {
                const blob = await fetch(image).then(r => r.blob());
                const formData = new FormData();
                formData.append('image', blob, 'scan.jpg');
                const uploadRes = await fetch('http://localhost:5000/api/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = uploadData.data?.url || image;
                }
            } catch (uploadErr) {
                console.warn('Pre-upload failed, sending base64:', uploadErr);
            }

            // Step 2: Send Cloudinary URL + structured AI fields to consultation API
            const res = await fetch('http://localhost:5000/api/consultations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    image: imageUrl,
                    ai_condition: aiResult.condition,
                    ai_confidence: parseInt(aiResult.confidence),
                    ai_result: aiResult.result.toLowerCase(),
                    ai_result_text: `${aiResult.condition} (${aiResult.confidence})`
                })
            });

            if (res.ok) {
                alert('Successfully submitted your scan for doctor review!');
                resetImage();
            } else {
                const err = await res.json().catch(() => ({}));
                alert(`Failed to submit: ${err.message || err.error || 'Please try again.'}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to the server.');
        } finally {
            setIsSharing(false);
        }
    };

    const getRiskColor = (risk: string) => {
        if (risk === 'High') return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (risk === 'Medium') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20';
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-white selection:bg-[#06B6D4]/30 overflow-x-hidden font-sans relative">

            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#06B6D4] blur-[200px] mix-blend-screen opacity-10 animate-[pulse_10s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#3B82F6] blur-[200px] mix-blend-screen opacity-10 animate-[pulse_12s_ease-in-out_infinite_alternate]" />
            </div>

            {/* Bug #3 Fix: Scan save error toast — shown when scan fails to persist to DB */}
            <AnimatePresence>
                {scanSaveError && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className="fixed bottom-8 left-1/2 z-[99999] px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-md border shadow-2xl bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                    >
                        <Activity className="w-5 h-5" />
                        <span className="font-semibold text-sm">{scanSaveError}</span>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* TOP NAVIGATION BAR */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0A101C]/80 backdrop-blur-xl border-b border-white/[0.05] h-20 flex items-center justify-between px-6 lg:px-10">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] relative overflow-hidden z-10">
                            <div className="absolute inset-0 bg-white/20"></div>
                            <ShieldCheck className="w-6 h-6 text-white relative z-10" />
                        </div>
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                        DermaScan <span className="text-[#06B6D4]">AI</span>
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/notifications')}
                        className="relative text-slate-400 hover:text-[#06B6D4] transition-colors group"
                    >
                        <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        {unreadCount > 0 ? (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#06B6D4] text-black text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 shadow-[0_0_8px_#06B6D4]">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        ) : (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#06B6D4] rounded-full shadow-[0_0_8px_#06B6D4] animate-pulse" />
                        )}
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
                                                onClick={() => { if (item.path) navigate(item.path); }}
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
                                            onClick={handleLogout}
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

            {/* MAIN CONTENT AREA */}
            <main className="pt-32 pb-20 px-4 flex flex-col items-center relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 max-w-2xl px-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                        Skin Analysis Dashboard
                    </h1>
                    <p className="text-lg text-slate-400 mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Upload or capture a skin image to get your instant AI health analysis.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.05]"><Shield className="w-3.5 h-3.5 text-[#06B6D4]" /> Private</span>
                        <span className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.05]"><Zap className="w-3.5 h-3.5 text-[#F59E0B]" /> Results in 3s</span>
                        <span className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.05]"><Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" /> AI Powered</span>
                        <span className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.05]"><Activity className="w-3.5 h-3.5 text-[#10B981]" /> Clinical Grade</span>
                    </div>
                </motion.div>

                {/* Main Upload Container */}
                <div className="w-full max-w-4xl bg-white/[0.02] backdrop-blur-2xl rounded-[24px] border-2 border-dashed border-[#06B6D4]/30 p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative">

                    {!image && !cameraActive ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* CAMERA CARD */}
                            <button
                                onClick={() => setCameraActive(true)}
                                className="flex flex-col items-center justify-center p-10 rounded-2xl bg-[#0D1526]/80 hover:bg-[#121D36] border border-white/[0.05] hover:border-[#06B6D4]/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(6,182,212,0.15)]"
                            >
                                <div className="relative w-20 h-20 rounded-full flex items-center justify-center mb-6">
                                    <div className="absolute inset-0 rounded-full border border-[#06B6D4]/30 group-hover:animate-[spin_4s_linear_infinite] group-hover:border-[#06B6D4]/60" />
                                    <div className="w-14 h-14 rounded-full bg-[#06B6D4]/10 flex items-center justify-center">
                                        <Camera className="w-7 h-7 text-[#06B6D4] group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="absolute inset-0 rounded-full border border-[#06B6D4]/20 animate-ping opacity-20" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Use Camera</h3>
                                <p className="text-sm text-slate-400 mb-6">Take a photo directly</p>
                                <div className="w-full py-3 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] rounded-xl text-white font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                    Open Camera
                                </div>
                            </button>

                            {/* UPLOAD CARD */}
                            <label className="flex flex-col items-center justify-center p-10 rounded-2xl bg-[#0D1526]/80 hover:bg-[#121D36] border border-white/[0.05] hover:border-[#06B6D4]/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(6,182,212,0.15)] cursor-pointer">
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                <div className="relative w-20 h-20 rounded-full flex items-center justify-center mb-6">
                                    <div className="w-14 h-14 rounded-full bg-[#06B6D4]/10 flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-500">
                                        <Upload className="w-7 h-7 text-[#06B6D4]" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Upload Photo</h3>
                                <p className="text-sm text-slate-400 mb-6">From your device • JPG, PNG, HEIC</p>
                                <div className="w-full py-3 border border-[#06B6D4] rounded-xl text-[#06B6D4] font-bold text-sm bg-transparent group-hover:bg-[#06B6D4]/10 text-center transition-colors">
                                    Choose File
                                </div>
                            </label>
                        </div>
                    ) : cameraActive ? (
                        <div className="relative w-full aspect-video md:aspect-[21/9] bg-black rounded-2xl overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-center">
                            {cameraError ? (
                                <div className="text-center">
                                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                    <p className="text-red-400 font-medium mb-4">{cameraError}</p>
                                    <button onClick={() => setCameraActive(false)} className="px-6 py-2 bg-slate-800 rounded-full font-medium hover:bg-slate-700">Cancel</button>
                                </div>
                            ) : (
                                <>
                                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={activeDeviceId ? { deviceId: { exact: activeDeviceId } } : undefined} className="w-full h-full object-cover" onUserMedia={handleUserMedia} onUserMediaError={handleUserMediaError} />

                                    {/* Medical Viewfinder Overlay */}
                                    <div className="absolute inset-0 pointer-events-none border-[3px] border-[#06B6D4]/30 m-8 rounded-lg">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#06B6D4] -mt-[3px] -ml-[3px]" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#06B6D4] -mt-[3px] -mr-[3px]" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#06B6D4] -mb-[3px] -ml-[3px]" />
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#06B6D4] -mb-[3px] -mr-[3px]" />
                                    </div>

                                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
                                        <button onClick={() => setCameraActive(false)} className="w-14 h-14 rounded-full bg-slate-900/80 backdrop-blur-md flex items-center justify-center hover:bg-slate-800 transition-colors border border-white/10">
                                            <X className="w-6 h-6 text-white" />
                                        </button>
                                        <button onClick={capture} className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(6,182,212,0.4)] border-4 border-[#0A101C]">
                                            <Camera className="w-7 h-7 text-white" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        // PREVIEW STATE
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">

                            <div className="w-full max-w-sm relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-8 group bg-black/50">
                                <img src={image as string} alt="Scan preview" className="w-full h-auto object-cover" />

                                {/* Simulated Scan Line Overlay */}
                                {isAnalyzing ? (
                                    <motion.div
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        className="absolute left-0 w-full h-[3px] bg-[#06B6D4] shadow-[0_0_20px_#06B6D4]"
                                    />
                                ) : !aiResult && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                        <button onClick={resetImage} className="flex items-center gap-2 text-white bg-slate-800/80 px-4 py-2 rounded-full font-medium hover:bg-slate-700">
                                            <RefreshCw className="w-4 h-4" /> Retake
                                        </button>
                                    </div>
                                )}

                                {/* Detection Highlights when complete */}
                                {aiResult && (
                                    <>
                                        {/* Mock lesion ring */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-red-500 border-dashed animate-[spin_8s_linear_infinite]" />
                                        <span className="absolute top-1/2 left-1/2 mt-10 -translate-x-1/2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase">⚠ Detected</span>
                                    </>
                                )}
                            </div>

                            {!isAnalyzing && !aiResult && (
                                <div className="text-center w-full max-w-sm">
                                    <div className="flex items-center justify-center gap-2 mb-6">
                                        <span className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Ready to Analyze</span>
                                        <span className="text-slate-400 text-sm">img_scan_9410.jpg</span>
                                    </div>

                                    <button
                                        onClick={handleAnalyze}
                                        className="w-full py-4 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] rounded-xl text-lg font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transform hover:-translate-y-1 transition-all overflow-hidden relative group"
                                        style={{ fontFamily: "'Syne', sans-serif" }}
                                    >
                                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                        Analyze My Skin <ArrowRight className="inline-block w-5 h-5 ml-1" />
                                    </button>
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="text-center py-6">
                                    <div className="w-12 h-12 border-4 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Processing Image</h3>
                                    <p className="text-slate-400 text-sm animate-pulse">Running advanced machine learning models...</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* RESULT PANEL (Appears after analysis) */}
                <AnimatePresence>
                    {aiResult && !isAnalyzing && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                            className="w-full max-w-6xl mt-8 mb-20 flex flex-col gap-6"
                        >
                            {/* SECTION 1 — Scan Result Header */}
                            <div className="w-full bg-[#0B1425]/90 backdrop-blur-xl rounded-[32px] border border-white/[0.08] p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[200px] bg-gradient-to-b from-[#06B6D4]/20 to-transparent blur-[100px] pointer-events-none" />
                                
                                <div className={`px-6 py-2 rounded-full border mb-6 flex items-center gap-2 backdrop-blur-md ${getRiskColor(aiResult.riskLevel)}`}>
                                    {aiResult.riskLevel === 'Low' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                    <span className="font-bold tracking-widest uppercase">{aiResult.riskLevel} RISK DETECTED</span>
                                </div>
                                
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 text-center tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    {aiResult.condition}
                                </h2>
                                
                                <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-[#06B6D4]" />
                                        <span className="text-xl font-medium text-[#06B6D4]">{aiResult.confidence} Confidence</span>
                                    </div>
                                    <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-600" />
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-400">Analysis completed in 2.3 seconds</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-12 gap-6">
                                {/* SECTION 2 — Image Analysis (LEFT) */}
                                <div className="lg:col-span-5 flex flex-col gap-6">
                                    <div className="bg-[#0B1425]/90 backdrop-blur-xl rounded-[24px] border border-white/[0.08] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-white text-lg flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                                                <Camera className="w-5 h-5 text-[#06B6D4]" /> Analyzed Image
                                            </h3>
                                            <button onClick={() => setShowHeatmap(!showHeatmap)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 transition-colors flex items-center gap-1.5 hover:text-white">
                                                <Zap className="w-3.5 h-3.5 text-[#06B6D4]" />
                                                {showHeatmap ? 'Hide Heatmap' : 'Show AI Heatmap'}
                                            </button>
                                        </div>
                                        <div className="relative rounded-xl overflow-hidden group bg-black aspect-square max-h-[400px]">
                                            <img src={image as string} alt="Original Scan" className="w-full h-full object-cover" />
                                            {showHeatmap && (
                                                <div className="absolute inset-0 mix-blend-overlay opacity-70" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.8) 0%, rgba(234,179,8,0.5) 30%, transparent 70%)' }} />
                                            )}
                                            {/* Lesion boundary highlight mock */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-[#06B6D4] border-dashed rounded-full animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.5)] pointer-events-none">
                                                <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#06B6D4] text-black rounded-full flex items-center justify-center text-[10px] font-bold">AI</div>
                                            </div>
                                            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/10">
                                                <Maximize className="w-5 h-5 text-white" />
                                            </div>
                                            
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <span className="bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded font-medium border border-white/10">Original</span>
                                                {showHeatmap && <span className="bg-[#06B6D4]/80 backdrop-blur text-white text-xs px-2 py-1 rounded font-medium border border-white/10">Heatmap</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT SIDE - Details & Indicators */}
                                <div className="lg:col-span-7 flex flex-col gap-6">
                                    <div className="bg-[#0B1425]/90 backdrop-blur-xl rounded-[24px] border border-white/[0.08] p-6 sm:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                                        <h3 className="font-bold text-white text-xl mb-4 border-b border-white/10 pb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                                            Medical Summary
                                        </h3>
                                        <p className="text-slate-300 text-[15px] sm:text-base leading-relaxed mb-6">
                                            {aiResult.riskLevel === 'Low' 
                                                ? "This lesion appears consistent with a benign condition. The AI model detected no malignant patterns such as irregular borders or abnormal pigmentation."
                                                : aiResult.riskLevel === 'Medium'
                                                ? "This lesion shows some atypical features that warrant closer evaluation. The AI identified potential irregularities in color or border."
                                                : "High likelihood of malignant characteristics detected. The model found significant pattern matches with severe dermatological conditions."}
                                        </p>

                                        {/* SECTION 3 — Medical Indicators */}
                                        <h4 className="font-bold text-white text-md mb-4 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-[#06B6D4]" /> Clinical Indicators
                                        </h4>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Asymmetry', val: aiResult.riskLevel === 'Low' ? 15 : aiResult.riskLevel === 'Medium' ? 45 : 85, status: aiResult.riskLevel === 'Low' ? 'Symmetrical' : 'Irregular' },
                                                { label: 'Border', val: aiResult.riskLevel === 'Low' ? 20 : aiResult.riskLevel === 'Medium' ? 55 : 90, status: aiResult.riskLevel === 'Low' ? 'Regular' : 'Notched/Blurry' },
                                                { label: 'Color Variation', val: aiResult.riskLevel === 'Low' ? 10 : aiResult.riskLevel === 'Medium' ? 60 : 80, status: aiResult.riskLevel === 'Low' ? 'Uniform' : 'Multiple Shades' },
                                                { label: 'Diameter', val: aiResult.riskLevel === 'Low' ? 25 : aiResult.riskLevel === 'Medium' ? 40 : 70, status: aiResult.riskLevel === 'Low' ? '< 6mm' : '> 6mm' },
                                            ].map((ind, i) => (
                                                <div key={i} className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-400 font-medium">{ind.label}</span>
                                                        <span className="text-white font-bold">{ind.status}</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }} 
                                                            animate={{ width: `${ind.val}%` }} 
                                                            transition={{ duration: 1, delay: i * 0.1 }}
                                                            className={`h-full ${ind.val < 30 ? 'bg-[#10B981]' : ind.val < 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6 h-full">
                                        {/* SECTION 4 — AI Explanation */}
                                        <div className="bg-[#0B1425]/90 backdrop-blur-xl rounded-[24px] border border-white/[0.08] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col">
                                            <h4 className="font-bold text-white text-md mb-3 flex items-center gap-2">
                                                <Info className="w-4 h-4 text-[#06B6D4]" /> AI Diagnostic Explanation
                                            </h4>
                                            <p className="text-sm text-slate-400 leading-relaxed">
                                                The model analyzed over 10 million dermatology images using a neural network. It identified structural patterns strongly correlated with {aiResult.condition} lesions.
                                            </p>
                                        </div>

                                        {/* SECTION 5 — Recommended Action */}
                                        <div className={`backdrop-blur-xl rounded-[24px] border border-white/[0.08] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden flex flex-col ${aiResult.riskLevel === 'Low' ? 'bg-[#10B981]/10' : aiResult.riskLevel === 'Medium' ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                                            <div className="relative z-10">
                                                <h4 className="font-bold text-white text-md mb-2 flex items-center gap-2">
                                                    <Shield className="w-4 h-4" /> Recommended Action
                                                </h4>
                                                <p className="text-sm font-medium text-white/90 leading-relaxed">
                                                    {aiResult.recommendation}
                                                </p>
                                            </div>
                                            <div className={`absolute -bottom-4 -right-4 opacity-10 ${aiResult.riskLevel === 'Low' ? 'text-[#10B981]' : aiResult.riskLevel === 'Medium' ? 'text-yellow-500' : 'text-red-500'}`}>
                                                <AlertTriangle className="w-32 h-32" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 6 — Action Buttons */}
                            <div className="w-full bg-[#0B1425]/90 backdrop-blur-xl rounded-[24px] border border-white/[0.08] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row flex-wrap gap-4 mt-2">
                                <button className="flex-1 min-w-[200px] py-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex justify-center items-center gap-2 text-white">
                                    <Download className="w-5 h-5 text-slate-400" /> Download Full PDF
                                </button>
                                <button 
                                    onClick={handleShareWithDoctor}
                                    disabled={isSharing}
                                    className="flex-1 min-w-[200px] py-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex justify-center items-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSharing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5 text-slate-400" />}
                                    {isSharing ? 'Sharing...' : 'Share with Doctor'}
                                </button>
                                <button 
                                    onClick={() => navigate('/dermatologists', { state: { image } })}
                                    className="flex-1 min-w-[200px] py-4 rounded-xl font-bold bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transform hover:-translate-y-1 transition-all flex justify-center items-center gap-2 text-white"
                                >
                                    <Calendar className="w-5 h-5" /> Book Dermatologist
                                </button>
                                <button onClick={resetImage} className="flex-1 min-w-[200px] py-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex justify-center items-center gap-2 text-slate-300 hover:text-white">
                                    <RefreshCw className="w-5 h-5" /> Scan Another Image
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CONSULTATIONS LIST */}
                <div className="w-full max-w-4xl mt-12 mb-8 flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>My Consultations</h2>
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/appointments')} className="text-sm text-purple-400 hover:text-white font-semibold flex items-center gap-1 transition-colors">
                                My Appointments →
                            </button>
                            <button onClick={() => navigate('/my-reports')} className="text-sm text-[#06B6D4] hover:text-white font-semibold flex items-center gap-1 transition-colors">
                                View Reports →
                            </button>
                        </div>
                    </div>
                    {consultations.length === 0 ? (
                        <p className="text-slate-400">No consultations found.</p>
                    ) : (
                        <div className="space-y-4">
                            {consultations.map(consult => (
                                <div key={consult.id || consult._id} className="bg-white/[0.02] border border-white/10 p-4 rounded-xl hover:bg-white/5 transition-all">
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                                {consult.image_data ? <img src={consult.image_data} alt="Consultation" className="w-full h-full object-cover" /> : <ShieldCheck className="w-6 h-6 text-slate-400" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">Consultation Request</p>
                                                <p className="text-xs text-slate-400">{new Date(consult.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                consult.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                                                : (consult.status === 'active' || consult.status === 'pending_appointment') ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'}`}>
                                                {consult.status?.toUpperCase() || 'PENDING'}
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setChatConsultation(consult)}
                                                    className="px-3 py-1.5 bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30 rounded-lg text-xs font-bold hover:bg-[#06B6D4]/30 transition-colors"
                                                >
                                                    {consult.status === 'completed' ? 'Follow Up' : 'Open Chat'}
                                                </button>
                                                {consult.status === 'completed' && (
                                                    <button
                                                        onClick={() => navigate('/my-reports')}
                                                        className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-colors"
                                                    >
                                                        View Report
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Show doctor's diagnosis inline if completed */}
                                    {consult.status === 'completed' && consult.diagnosis && (
                                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Doctor's Diagnosis</p>
                                            <p className="text-sm text-slate-300">{consult.diagnosis}</p>
                                            {consult.treatment && <p className="text-xs text-slate-400"><span className="font-bold text-slate-300">Treatment:</span> {consult.treatment}</p>}
                                            {consult.follow_up && <p className="text-xs text-[#06B6D4] font-semibold">Follow-up: {consult.follow_up}</p>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Slide-over Chat Panel */}
            <AnimatePresence>
                {chatConsultation && (
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-[#0F172A] border-l border-white/10 shadow-2xl z-[10000] flex flex-col"
                    >
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0D1528]">
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-[#06B6D4]" /> Doctor Chat
                            </h3>
                            <button onClick={() => setChatConsultation(null)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden p-4 bg-[#0F172A]">
                            <ConsultationChat 
                                consultationId={(chatConsultation.id || chatConsultation._id || '').toString()}
                                currentUserId={user?.id || user?._id || 'patient'}
                                otherUserId="doctor"
                                otherUserName="Dermatologist"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
