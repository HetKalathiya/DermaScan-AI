import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, ArrowLeft, Save, Stethoscope, Phone, MapPin,
    Lock, ShieldCheck, Camera, Activity, FileText, Calendar,
    Shield, ShieldAlert, Check, AlertTriangle, ChevronRight,
    Bell, LogOut, HelpCircle, Settings, Download, RefreshCw,
    HeartPulse, Sparkles, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import PatientNavbar from './PatientNavbar';

interface PatientClinicalData {
    skin_type: string;
    primary_concern: string[];
    had_skin_cancer: boolean;
    allergies: string;
    skincare_notes: string;
    medical_history: string[];
}

interface ProfileStats {
    totalScans: number;
    totalReports: number;
    totalConsultations: number;
    riskLevel: string;
}

const FITZPATRICK_TYPES = [
    { type: 'Type I', label: 'Pale White', desc: 'Always burns, never tans. Extremely sensitive.', color: '#FFE0BD' },
    { type: 'Type II', label: 'Fair White', desc: 'Usually burns, tans with difficulty.', color: '#F1C27D' },
    { type: 'Type III', label: 'Medium / Olive', desc: 'Mild burn, gradually tans uniformly.', color: '#E0AC69' },
    { type: 'Type IV', label: 'Olive / Light Brown', desc: 'Rarely burns, tans easily to moderate brown.', color: '#C68642' },
    { type: 'Type V', label: 'Brown', desc: 'Very rarely burns, easily tans to dark brown.', color: '#8D5524' },
    { type: 'Type VI', label: 'Deeply Pigmented', desc: 'Never burns, deeply pigmented dark brown/black.', color: '#4A2912' },
];

const COMMON_CONCERNS = [
    'Routine Screening',
    'Atypical Moles / Nevi',
    'Acne & Blemishes',
    'Melasma / Dark Spots',
    'Eczema / Dermatitis',
    'Psoriasis',
    'Rosacea & Redness',
    'Dry / Sensitive Skin',
    'Sun Damage'
];

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Active Tab
    const [activeTab, setActiveTab] = useState<'personal' | 'clinical' | 'security'>('personal');

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // User & Profile State
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        const parsed = stored ? JSON.parse(stored) : null;
        return {
            _id: parsed?._id || parsed?.id || '',
            name: parsed?.name || '',
            email: parsed?.email || '',
            role: parsed?.role || 'patient',
            phone: '',
            dob: '',
            age: '',
            gender: 'Prefer not to say',
            country: 'United States',
            location: '',
            bio: '',
            blood_group: 'Unknown',
            emergency_contact: { name: '', phone: '' },
            avatar: localStorage.getItem('user_avatar') || '',
            created_at: new Date().toISOString(),
            is_verified: true
        };
    });

    const [clinical, setClinical] = useState<PatientClinicalData>({
        skin_type: 'Type II - Fair White',
        primary_concern: ['Routine Screening'],
        had_skin_cancer: false,
        allergies: '',
        skincare_notes: '',
        medical_history: []
    });

    const [stats, setStats] = useState<ProfileStats>({
        totalScans: 0,
        totalReports: 0,
        totalConsultations: 0,
        riskLevel: 'Low Risk / Normal'
    });

    const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(() => {
        return localStorage.getItem('user_2fa') === 'true';
    });
    const [isUpdating2FA, setIsUpdating2FA] = useState<boolean>(false);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3800);
    };

    // Fetch Profile on Mount
    useEffect(() => {
        let isMounted = true;
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/user/profile');
                const resData = response.data?.data || response.data || {};
                
                if (isMounted && resData) {
                    setUser(prev => ({
                        ...prev,
                        _id: resData._id || resData.id || prev._id,
                        name: resData.name || prev.name,
                        email: resData.email || prev.email,
                        role: resData.role || prev.role,
                        phone: resData.phone || '',
                        dob: resData.dob || '',
                        age: resData.age ? String(resData.age) : '',
                        gender: resData.gender || 'Prefer not to say',
                        country: resData.country || 'United States',
                        location: resData.location || '',
                        bio: resData.bio || '',
                        blood_group: resData.blood_group || 'Unknown',
                        emergency_contact: resData.emergency_contact || { name: '', phone: '' },
                        avatar: resData.avatar || localStorage.getItem('user_avatar') || '',
                        created_at: resData.created_at || prev.created_at,
                        is_verified: resData.is_verified ?? true
                    }));

                    if (resData.patient) {
                        setClinical({
                            skin_type: resData.patient.skin_type || 'Type II - Fair White',
                            primary_concern: Array.isArray(resData.patient.primary_concern)
                                ? resData.patient.primary_concern
                                : resData.patient.primary_concern ? [resData.patient.primary_concern] : ['Routine Screening'],
                            had_skin_cancer: Boolean(resData.patient.had_skin_cancer),
                            allergies: resData.patient.allergies || '',
                            skincare_notes: resData.patient.skincare_notes || '',
                            medical_history: resData.patient.medical_history || []
                        });
                    }

                    if (resData.stats) {
                        setStats(resData.stats);
                    }

                    if (resData.two_factor_enabled !== undefined) {
                        const is2fa = Boolean(resData.two_factor_enabled);
                        setTwoFactorEnabled(is2fa);
                        localStorage.setItem('user_2fa', String(is2fa));
                    }
                }
            } catch (err: any) {
                console.warn('Could not load profile from backend, using local defaults:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchProfile();

        return () => { isMounted = false; };
    }, []);

    // Handle avatar image selection
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) {
                showToast('error', 'Image size must be less than 4MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const b64 = reader.result as string;
                setUser(prev => ({ ...prev, avatar: b64 }));
                localStorage.setItem('user_avatar', b64);
                showToast('success', 'Profile photo updated! Click Save to persist.');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setUser(prev => ({ ...prev, avatar: '' }));
        localStorage.removeItem('user_avatar');
        showToast('success', 'Profile photo reset to initials.');
    };

    // Calculate age from DOB
    const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        let calculatedAge = user.age;
        if (val) {
            const birthDate = new Date(val);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (!isNaN(age) && age >= 0 && age <= 120) {
                calculatedAge = String(age);
            }
        }
        setUser(prev => ({ ...prev, dob: val, age: calculatedAge }));
    };

    // Toggle skin concern chip
    const handleToggleConcern = (concern: string) => {
        setClinical(prev => {
            const exists = prev.primary_concern.includes(concern);
            const next = exists
                ? prev.primary_concern.filter(c => c !== concern)
                : [...prev.primary_concern, concern];
            return { ...prev, primary_concern: next };
        });
    };

    // Toggle 2FA
    const handleToggle2FA = async () => {
        if (isUpdating2FA) return;
        const next = !twoFactorEnabled;
        setIsUpdating2FA(true);
        try {
            const response = await api.put('/user/toggle-2fa', { enabled: next });
            const finalVal = response.data?.two_factor_enabled !== undefined 
                ? Boolean(response.data.two_factor_enabled) 
                : next;
            setTwoFactorEnabled(finalVal);
            localStorage.setItem('user_2fa', String(finalVal));

            // Sync user object in localStorage
            const stored = localStorage.getItem('user');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    parsed.two_factor_enabled = finalVal;
                    localStorage.setItem('user', JSON.stringify(parsed));
                } catch (_) {}
            }

            showToast('success', finalVal ? 'Two-Factor Authentication (2FA) enabled!' : 'Two-Factor Authentication (2FA) disabled.');
        } catch (err: any) {
            console.error('Failed to toggle 2FA:', err);
            showToast('error', err.response?.data?.error || 'Failed to update Two-Factor Authentication setting.');
        } finally {
            setIsUpdating2FA(false);
        }
    };

    // Save Profile
    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                name: user.name,
                email: user.email,
                phone: user.phone,
                age: (user.age && !isNaN(parseInt(user.age, 10))) ? parseInt(user.age, 10) : null,
                dob: user.dob,
                gender: user.gender,
                country: user.country,
                location: user.location,
                bio: user.bio,
                blood_group: user.blood_group,
                emergency_contact: user.emergency_contact,
                avatar: user.avatar,
                two_factor_enabled: twoFactorEnabled,
                // Clinical data
                skin_type: clinical.skin_type,
                primary_concern: clinical.primary_concern,
                had_skin_cancer: clinical.had_skin_cancer,
                allergies: clinical.allergies,
                skincare_notes: clinical.skincare_notes,
                medical_history: clinical.medical_history
            };

            const response = await api.put('/user/profile', payload);
            const updated = response.data?.data || payload;

            // Sync localStorage user object
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                const merged = { ...parsed, name: user.name, email: user.email };
                localStorage.setItem('user', JSON.stringify(merged));
            }
            if (user.avatar) {
                localStorage.setItem('user_avatar', user.avatar);
            }

            // Fire event so headers in current window sync
            window.dispatchEvent(new Event('storage'));

            showToast('success', 'Profile and clinical details saved successfully!');
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            showToast('error', error?.response?.data?.error || 'Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleExportData = () => {
        const exportData = {
            patient_profile: user,
            dermatology_data: clinical,
            stats: stats,
            exported_at: new Date().toISOString()
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `dermascan_profile_${user.name.toLowerCase().replace(/\s+/g, '_') || 'patient'}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('success', 'Patient record summary downloaded!');
    };

    const getInitials = (nameStr: string) => {
        if (!nameStr) return 'PT';
        const parts = nameStr.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const formatMemberSince = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return 'Active Member';
            return `Member since ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
        } catch {
            return 'Active Member';
        }
    };

    return (
        <div className="min-h-screen bg-[#071321] bg-gradient-to-br from-[#071321] via-[#0A1A2E] to-[#06111D] text-white font-sans selection:bg-[#00E5FF]/30 pb-20 pt-28 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">

            {/* Glowing Tech Mesh Background */}
            <div
                className="fixed inset-0 z-0 opacity-15 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at center, #00E5FF 1.5px, transparent 2px)`,
                    backgroundSize: '40px 40px'
                }}
            />
            <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#00E5FF]/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

            {/* FLOATING TOAST NOTIFICATION */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-2xl backdrop-blur-xl border ${
                            toast.type === 'success'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                                : 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
                        }`}
                    >
                        {toast.type === 'success' ? (
                            <Check className="w-5 h-5 text-emerald-400" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-rose-400" />
                        )}
                        <span>{toast.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* UNIFIED PATIENT PORTAL NAVBAR */}
            <PatientNavbar currentPath="/profile" />

            {/* MAIN CONTENT CONTAINER */}
            <div className="max-w-6xl mx-auto relative z-10 space-y-8">

                {/* HERO PROFILE CARD */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0A1626]/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-[0_15px_50px_rgba(0,0,0,0.4)] relative overflow-hidden"
                >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00E5FF] via-[#3B82F6] to-emerald-400" />
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                    />

                    <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
                        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                            
                            {/* Avatar with Glow Halo */}
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Click to upload profile photo">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-[#00E5FF] to-blue-600 rounded-full blur-md opacity-40 group-hover:opacity-75 transition-opacity duration-300" />
                                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-[#00E5FF]/60 bg-[#0B1C2C] flex items-center justify-center relative z-10 overflow-hidden shadow-[0_0_20px_rgba(0,229,255,0.25)]">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl sm:text-4xl font-extrabold text-[#00E5FF]" style={{ fontFamily: "'Syne', sans-serif" }}>
                                            {getInitials(user.name)}
                                        </span>
                                    )}

                                    {/* Hover Camera Overlay */}
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                                        <Camera className="w-7 h-7 text-white" />
                                    </div>
                                </div>

                                {user.avatar && (
                                    <button
                                        onClick={handleRemoveAvatar}
                                        title="Remove custom photo"
                                        className="absolute -top-1 -right-1 z-20 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg border border-black/40"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Patient Identity */}
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                                        {user.name || 'Patient'}
                                    </h1>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Patient
                                    </span>
                                </div>

                                <p className="text-sm text-slate-300 flex items-center justify-center sm:justify-start gap-2">
                                    <Mail className="w-4 h-4 text-slate-500" />
                                    {user.email || 'het@gmail.com'}
                                </p>

                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-400">
                                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                                        MRN: <strong className="text-white">PID-{user._id ? user._id.slice(0, 8).toUpperCase() : '2026-X'}</strong>
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                                        {formatMemberSince(user.created_at)}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Status: Online
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => handleSubmit()}
                                disabled={isSaving}
                                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#00E5FF] hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,229,255,0.3)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5)] transition-all disabled:opacity-50"
                            >
                                <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                                {isSaving ? 'Saving...' : 'Save Profile'}
                            </button>
                            <button
                                onClick={handleExportData}
                                className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                            >
                                <Download className="w-3.5 h-3.5 text-[#00E5FF]" />
                                Export Record
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* 4 HEALTH & ACTIVITY STATS CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stat 1: Total Scans */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        onClick={() => navigate('/scan-history')}
                        className="bg-[#0A1626]/70 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.06] hover:border-[#00E5FF]/40 transition-all cursor-pointer group hover:shadow-[0_0_20px_rgba(0,229,255,0.1)]"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Scans</span>
                            <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                            {stats.totalScans}
                        </div>
                        <span className="text-[11px] text-[#00E5FF] flex items-center gap-1 mt-1 font-medium group-hover:translate-x-1 transition-transform">
                            View Scan History <ChevronRight className="w-3 h-3" />
                        </span>
                    </motion.div>

                    {/* Stat 2: Diagnostic Reports */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => navigate('/my-reports')}
                        className="bg-[#0A1626]/70 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.06] hover:border-blue-500/40 transition-all cursor-pointer group hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reports Ready</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                            {stats.totalReports}
                        </div>
                        <span className="text-[11px] text-blue-400 flex items-center gap-1 mt-1 font-medium group-hover:translate-x-1 transition-transform">
                            Download Reports <ChevronRight className="w-3 h-3" />
                        </span>
                    </motion.div>

                    {/* Stat 3: Consultations */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        onClick={() => navigate('/appointments')}
                        className="bg-[#0A1626]/70 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.06] hover:border-purple-500/40 transition-all cursor-pointer group hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doctor Visits</span>
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Stethoscope className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                            {stats.totalConsultations}
                        </div>
                        <span className="text-[11px] text-purple-400 flex items-center gap-1 mt-1 font-medium group-hover:translate-x-1 transition-transform">
                            Book / Manage <ChevronRight className="w-3 h-3" />
                        </span>
                    </motion.div>

                    {/* Stat 4: Risk Level */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#0A1626]/70 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.06]"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Skin Status</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                <Shield className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-lg font-bold text-emerald-400 truncate" style={{ fontFamily: "'Syne', sans-serif" }}>
                            {stats.riskLevel}
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                            AI health classification
                        </span>
                    </motion.div>
                </div>

                {/* TAB SWITCHER */}
                <div className="flex items-center border-b border-white/[0.08] gap-2 sm:gap-6 overflow-x-auto pb-1">
                    {[
                        { id: 'personal', label: 'Personal & Contact Details', icon: User },
                        { id: 'clinical', label: 'Dermatology & Skin Profile', icon: HeartPulse },
                        { id: 'security', label: 'Security & Preferences', icon: Lock }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold transition-all relative whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/30'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="tabUnderline"
                                    className="absolute -bottom-1 left-2 right-2 h-0.5 bg-[#00E5FF]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT PANELS */}
                <AnimatePresence mode="wait">
                    {/* TAB 1: PERSONAL & CONTACT */}
                    {activeTab === 'personal' && (
                        <motion.div
                            key="personal"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-[#0A1626]/75 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-xl space-y-8"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    <User className="w-5 h-5 text-[#00E5FF]" /> Personal Demographics
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Manage your basic patient profile and emergency contact information.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Full Name */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Full Name</label>
                                        <div className="relative">
                                            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="text"
                                                value={user.name}
                                                onChange={e => setUser({ ...user, name: e.target.value })}
                                                placeholder="e.g. Het Koustav"
                                                className="w-full pl-10 pr-4 py-3 bg-[#0B1A2C] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/40 transition-all text-sm font-medium"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Email Address</label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="email"
                                                value={user.email}
                                                disabled
                                                className="w-full pl-10 pr-4 py-3 bg-[#0B1A2C]/50 border border-white/[0.06] rounded-xl text-slate-400 text-sm font-medium cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone Number */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Contact Phone</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="tel"
                                                value={user.phone}
                                                onChange={e => setUser({ ...user, phone: e.target.value })}
                                                placeholder="+1 (555) 000-0000"
                                                className="w-full pl-10 pr-4 py-3 bg-[#0B1A2C] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/40 transition-all text-sm font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Date of Birth & Age */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Date of Birth</label>
                                            <div className="relative">
                                                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="date"
                                                    value={user.dob}
                                                    onChange={handleDobChange}
                                                    className="w-full pl-10 pr-3 py-3 bg-[#0B1A2C] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/40 transition-all text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Age</label>
                                            <input
                                                type="number"
                                                value={user.age}
                                                onChange={e => setUser({ ...user, age: e.target.value })}
                                                placeholder="Yrs"
                                                className="w-full px-3 py-3 bg-[#0B1A2C] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/40 transition-all text-sm font-medium text-center"
                                            />
                                        </div>
                                    </div>

                                    {/* Gender */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Biological Gender</label>
                                        <select
                                            value={user.gender}
                                            onChange={e => setUser({ ...user, gender: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#0B1A2C] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/40 transition-all text-sm font-medium"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                    </div>

                                    {/* Blood Group */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Blood Group</label>
                                        <select
                                            value={user.blood_group}
                                            onChange={e => setUser({ ...user, blood_group: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#0B1A2C] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/40 transition-all text-sm font-medium"
                                        >
                                            <option value="Unknown">Unknown</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                    </div>

                                    {/* Location / City */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">City / Region</label>
                                        <div className="relative">
                                            <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="text"
                                                value={user.location}
                                                onChange={e => setUser({ ...user, location: e.target.value })}
                                                placeholder="e.g. San Francisco, CA"
                                                className="w-full pl-10 pr-4 py-3 bg-[#0B1A2C] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/40 transition-all text-sm font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Country */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Country</label>
                                        <input
                                            type="text"
                                            value={user.country}
                                            onChange={e => setUser({ ...user, country: e.target.value })}
                                            placeholder="e.g. United States"
                                            className="w-full px-4 py-3 bg-[#0B1A2C] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/40 transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                {/* EMERGENCY CONTACT SECTION */}
                                <div className="pt-4 border-t border-white/[0.08]">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-emerald-400" /> Emergency Contact
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs text-slate-400">Contact Person Name</label>
                                            <input
                                                type="text"
                                                value={user.emergency_contact?.name || ''}
                                                onChange={e => setUser({
                                                    ...user,
                                                    emergency_contact: { ...user.emergency_contact, name: e.target.value }
                                                })}
                                                placeholder="Next of Kin / Spouse"
                                                className="w-full px-4 py-3 bg-[#0B1A2C] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] transition-all text-sm font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-slate-400">Contact Emergency Phone</label>
                                            <input
                                                type="tel"
                                                value={user.emergency_contact?.phone || ''}
                                                onChange={e => setUser({
                                                    ...user,
                                                    emergency_contact: { ...user.emergency_contact, phone: e.target.value }
                                                })}
                                                placeholder="+1 (555) 999-9999"
                                                className="w-full px-4 py-3 bg-[#0B1A2C] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] transition-all text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#00E5FF] hover:to-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {isSaving ? 'Updating...' : 'Save Demographics'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* TAB 2: DERMATOLOGY & CLINICAL PROFILE */}
                    {activeTab === 'clinical' && (
                        <motion.div
                            key="clinical"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-[#0A1626]/75 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-xl space-y-8"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    <HeartPulse className="w-5 h-5 text-[#00E5FF]" /> Dermatology & Clinical Skin Profile
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    This data optimizes AI scan sensitivity and provides critical background for consulting dermatologists.
                                </p>
                            </div>

                            {/* FITZPATRICK SKIN PHOTOTYPE SELECTOR */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                                    Fitzpatrick Skin Phototype (Select One)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {FITZPATRICK_TYPES.map(item => {
                                        const isSelected = clinical.skin_type.startsWith(item.type);
                                        return (
                                            <div
                                                key={item.type}
                                                onClick={() => setClinical({ ...clinical, skin_type: `${item.type} - ${item.label}` })}
                                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                                                    isSelected
                                                        ? 'bg-[#00E5FF]/10 border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.2)]'
                                                        : 'bg-[#0B1A2C]/60 border-white/[0.06] hover:border-white/[0.2] hover:bg-[#0B1A2C]'
                                                }`}
                                            >
                                                <div
                                                    className="w-7 h-7 rounded-full border border-white/30 shrink-0 shadow-sm mt-0.5"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-sm text-white">{item.type}: {item.label}</span>
                                                        {isSelected && <Check className="w-4 h-4 text-[#00E5FF]" />}
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* PRIMARY SKIN CONCERNS MULTI-SELECT CHIPS */}
                            <div className="space-y-3 pt-2">
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                                    Primary Skin Concerns & Goals
                                </label>
                                <div className="flex flex-wrap gap-2.5">
                                    {COMMON_CONCERNS.map((concern, idx) => {
                                        const active = clinical.primary_concern.includes(concern);
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleToggleConcern(concern)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                    active
                                                        ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)] scale-105'
                                                        : 'bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.08] hover:border-white/[0.2]'
                                                }`}
                                            >
                                                {active && <Check className="w-3.5 h-3.5" />}
                                                {concern}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* SKIN CANCER HISTORY SWITCH */}
                            <div className="p-5 rounded-2xl bg-[#0B1A2C] border border-white/[0.08] flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        Personal or Family History of Skin Cancer
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                        Includes Melanoma, Basal Cell Carcinoma (BCC), or Squamous Cell Carcinoma (SCC).
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setClinical({ ...clinical, had_skin_cancer: !clinical.had_skin_cancer })}
                                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 shrink-0 ${
                                        clinical.had_skin_cancer ? 'bg-rose-500' : 'bg-slate-700'
                                    }`}
                                >
                                    <div
                                        className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                                            clinical.had_skin_cancer ? 'translate-x-8' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {clinical.had_skin_cancer && (
                                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
                                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>High Vigilance Flagged:</strong> Given prior family/personal history, we recommend scheduling bi-annual clinical dermatological full-body checks in addition to regular AI scans.
                                    </span>
                                </div>
                            )}

                            {/* KNOWN ALLERGIES & SENSITIVITIES */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                                    Known Allergies & Drug Sensitivities
                                </label>
                                <textarea
                                    value={clinical.allergies}
                                    onChange={e => setClinical({ ...clinical, allergies: e.target.value })}
                                    placeholder="e.g. Latex, Sunscreen Avobenzone, Topical Retinoids, Penicillin, Neomycin"
                                    rows={2}
                                    className="w-full p-3.5 bg-[#0B1A2C] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] transition-all text-sm font-medium resize-none"
                                />
                            </div>

                            {/* CURRENT SKINCARE ROUTINE & NOTES */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                                    Current Skincare Routine / Prescriptions
                                </label>
                                <textarea
                                    value={clinical.skincare_notes}
                                    onChange={e => setClinical({ ...clinical, skincare_notes: e.target.value })}
                                    placeholder="e.g. SPF 50 daily, Tretinoin 0.05% nightly, Benzoyl peroxide cleanser"
                                    rows={3}
                                    className="w-full p-3.5 bg-[#0B1A2C] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] transition-all text-sm font-medium resize-none"
                                />
                            </div>

                            <div className="flex justify-end pt-4 border-t border-white/[0.08]">
                                <button
                                    type="button"
                                    onClick={() => handleSubmit()}
                                    disabled={isSaving}
                                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#00E5FF] hover:to-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Updating...' : 'Save Dermatology Profile'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 3: SECURITY & PREFERENCES */}
                    {activeTab === 'security' && (
                        <motion.div
                            key="security"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-[#0A1626]/75 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-xl space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    <Lock className="w-5 h-5 text-[#00E5FF]" /> Security & Account Preferences
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Manage access security, privacy, and clinical export options.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* 2FA Toggle */}
                                <div className="p-5 rounded-2xl bg-[#0B1A2C] border border-white/[0.08] flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-white">Two-Factor Authentication (2FA)</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                                twoFactorEnabled
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-slate-700 text-slate-300'
                                            }`}>
                                                {twoFactorEnabled ? 'Active' : 'Disabled'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            Adds an extra security layer verifying logins with temporary one-time passwords.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isUpdating2FA}
                                        onClick={handleToggle2FA}
                                        aria-label="Toggle Two-Factor Authentication"
                                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 shrink-0 ${
                                            isUpdating2FA ? 'opacity-70 cursor-wait' : 'cursor-pointer'
                                        } ${
                                            twoFactorEnabled ? 'bg-[#00E5FF]' : 'bg-slate-700'
                                        }`}
                                    >
                                        <div
                                            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                                                twoFactorEnabled ? 'translate-x-8' : 'translate-x-1'
                                            }`}
                                        >
                                            {isUpdating2FA && (
                                                <div className="w-2.5 h-2.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                                            )}
                                        </div>
                                    </button>
                                </div>

                                {/* Change Password Shortcut */}
                                <div className="p-5 rounded-2xl bg-[#0B1A2C] border border-white/[0.08] flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-white">Change Account Password</h4>
                                        <p className="text-xs text-slate-400">
                                            Update your portal login password in account settings.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/settings')}
                                        className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1] text-xs font-bold transition-all flex items-center gap-1.5"
                                    >
                                        Settings <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Export Full Record */}
                                <div className="p-5 rounded-2xl bg-[#0B1A2C] border border-white/[0.08] flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-white">Download Clinical Medical Summary</h4>
                                        <p className="text-xs text-slate-400">
                                            Export a structured digital copy of your dermatological history and scans.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleExportData}
                                        className="px-4 py-2.5 rounded-xl bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 text-xs font-bold transition-all flex items-center gap-1.5"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Export JSON
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Profile;
