import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ShieldCheck, Bell, User, Activity, FileText,
    Calendar, Settings, HelpCircle, LogOut, ChevronRight,
    Zap, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface PatientNavbarProps {
    currentPath?: string;
}

const PatientNavbar: React.FC<PatientNavbarProps> = ({ currentPath }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const activeRoute = currentPath || location.pathname;

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<{ id?: string; _id?: string; name?: string; email?: string; role?: string; avatar?: string } | null>(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    // Close menu when clicking anywhere outside without needing a screen-blurring backdrop
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        if (showProfileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu]);

    // Listen to storage sync so name/avatar updates in real time
    useEffect(() => {
        const syncUser = () => {
            try {
                const stored = localStorage.getItem('user');
                setUser(stored ? JSON.parse(stored) : null);
            } catch {
                setUser(null);
            }
        };

        window.addEventListener('storage', syncUser);
        return () => window.removeEventListener('storage', syncUser);
    }, []);

    // Fetch unread notifications
    useEffect(() => {
        let isMounted = true;
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications');
                const list = res.data?.data || res.data || [];
                const unread = list.filter((n: any) => !n.read && !n.is_read).length;
                if (isMounted) setUnreadCount(unread);
            } catch {
                // Ignore silent error
            }
        };

        fetchNotifications();
        return () => { isMounted = false; };
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const getInitials = (nameStr?: string) => {
        if (!nameStr) return 'PT';
        const parts = nameStr.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const navLinks = [
        { label: 'Scan & AI', path: '/dashboard', icon: Zap },
        { label: 'History', path: '/scan-history', icon: Activity },
        { label: 'Reports', path: '/my-reports', icon: FileText },
        { label: 'Appointments', path: '/appointments', icon: Calendar },
        { label: 'My Profile', path: '/profile', icon: User },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0A101C]/85 backdrop-blur-xl border-b border-white/[0.06] h-20 flex items-center justify-between px-4 sm:px-6 lg:px-10">
                {/* BRAND LOGO */}
                <div
                    className="flex items-center gap-3 cursor-pointer group shrink-0"
                    onClick={() => navigate('/dashboard')}
                >
                    <div className="relative flex items-center justify-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] relative overflow-hidden z-10 transition-transform group-hover:scale-105">
                            <div className="absolute inset-0 bg-white/20" />
                            <ShieldCheck className="w-6 h-6 text-white relative z-10" />
                        </div>
                    </div>
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                        DermaScan <span className="text-[#06B6D4]">AI</span>
                    </span>
                </div>

                {/* CENTER PORTAL NAV LINKS (DESKTOP) */}
                <div className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] p-1.5 rounded-2xl shadow-inner">
                    {navLinks.map(link => {
                        const isActive = activeRoute === link.path || (link.path === '/profile' && (activeRoute === '/my-profile' || activeRoute === '/patient/profile'));
                        return (
                            <button
                                key={link.path}
                                onClick={() => navigate(link.path)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
                                    isActive
                                        ? 'text-[#00E5FF] bg-[#00E5FF]/15 border border-[#00E5FF]/30 shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                                }`}
                            >
                                <link.icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00E5FF]' : 'text-slate-500'}`} />
                                <span>{link.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex items-center gap-3 sm:gap-5">
                    {/* Notifications Button */}
                    <button
                        onClick={() => navigate('/notifications')}
                        className="relative text-slate-400 hover:text-[#06B6D4] transition-colors p-2"
                        title="Notifications"
                    >
                        <Bell className="w-6 h-6 hover:scale-110 transition-transform" />
                        {unreadCount > 0 ? (
                            <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-[#06B6D4] text-black text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 shadow-[0_0_8px_#06B6D4]">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        ) : (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#06B6D4] rounded-full shadow-[0_0_8px_#06B6D4]" />
                        )}
                    </button>

                    {/* Avatar Menu Trigger */}
                    <div className="relative" ref={profileMenuRef}>
                        <div
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="relative w-[40px] h-[40px] rounded-full cursor-pointer group flex items-center justify-center transition-transform hover:scale-105"
                        >
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] p-[2px] animate-[spin_4s_linear_infinite] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                                <div className="w-full h-full bg-[#0F172A] rounded-full" />
                            </div>
                            <span className="relative z-10 text-white text-[13px] font-bold tracking-wider" style={{ fontFamily: "'Syne', sans-serif" }}>
                                {getInitials(user?.name)}
                            </span>
                            <div className="absolute top-0.5 right-0.5 w-[9px] h-[9px] bg-[#10B981] rounded-full border-[1.5px] border-[#0F172A] z-20">
                                <div className="absolute inset-0 bg-[#10B981] rounded-full animate-ping opacity-75" />
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                                    transition={{ duration: 0.18 }}
                                    className="absolute right-0 mt-3 w-[260px] rounded-[18px] overflow-hidden z-[9999]"
                                    style={{
                                        backgroundColor: 'rgba(13, 21, 40, 0.96)',
                                        backdropFilter: 'blur(25px)',
                                        boxShadow: '0 0 25px rgba(6,182,212,0.2), 0 15px 40px rgba(0,0,0,0.7)',
                                        border: '1px solid rgba(6,182,212,0.25)'
                                    }}
                                >
                                    {/* Header: Clickable to go to Profile */}
                                    <div
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            navigate('/profile');
                                        }}
                                        className="p-5 flex flex-col items-center border-b border-white/[0.06] hover:bg-white/[0.02] cursor-pointer group transition-colors"
                                    >
                                        <div className="relative w-[56px] h-[56px] rounded-full mb-2.5 flex items-center justify-center">
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] p-[2px]">
                                                <div className="w-full h-full bg-[#0D1528] rounded-full" />
                                            </div>
                                            <span className="relative z-10 text-white text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
                                                {getInitials(user?.name)}
                                            </span>
                                        </div>
                                        <h3 className="text-white text-[15px] font-bold mb-0.5 truncate max-w-[210px] group-hover:text-[#00E5FF] transition-colors" style={{ fontFamily: "'Syne', sans-serif" }}>
                                            {user?.name || 'Patient'}
                                        </h3>
                                        <div className="flex items-center gap-1.5 bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-0.5 rounded-full mb-1">
                                            <span className="text-[10px] uppercase font-bold text-[#10B981] tracking-wider">
                                                {user?.role || 'Patient'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-2 truncate max-w-[210px]">
                                            {user?.email || 'patient@dermascan.com'}
                                        </p>
                                        <div className="flex items-center gap-1.5 bg-[#10B981]/10 px-2.5 py-0.5 rounded-full border border-[#10B981]/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                            <span className="text-[10px] text-[#10B981] font-bold tracking-widest uppercase">Online</span>
                                        </div>
                                    </div>

                                    {/* Links */}
                                    <div className="p-2 space-y-0.5">
                                        {[
                                            { icon: User, label: 'My Profile', path: '/profile' },
                                            { icon: Zap, label: 'Skin Analysis Dashboard', path: '/dashboard' },
                                            { icon: Activity, label: 'My Scan History', path: '/scan-history' },
                                            { icon: FileText, label: 'My Reports', path: '/my-reports' },
                                            { icon: Calendar, label: 'My Appointments', path: '/appointments' },
                                            { icon: Settings, label: 'Settings', path: '/settings' },
                                            { icon: HelpCircle, label: 'Help & Support', path: '/help' }
                                        ].map((item, idx) => {
                                            const isCurr = activeRoute === item.path;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        setShowProfileMenu(false);
                                                        navigate(item.path);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                                        isCurr
                                                            ? 'bg-[#06B6D4]/15 text-[#00E5FF] font-bold'
                                                            : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <item.icon className="w-4 h-4" />
                                                        <span>{item.label}</span>
                                                    </div>
                                                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="h-px w-full bg-white/[0.06]" />

                                    {/* Sign Out */}
                                    <div className="p-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </nav>
    );
};

export default PatientNavbar;
