import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, ShieldCheck, LogOut, User, FileText, Activity, Settings, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
}

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) { navigate('/login'); return; }
        setUser(JSON.parse(stored));
        fetchNotifications();
    }, [navigate]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load notifications:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
    };

    const markAllRead = async () => {
        const token = localStorage.getItem('token');
        await fetch('http://localhost:5000/api/notifications/read-all', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const deleteNotification = async (id: string) => {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/notifications/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.filter(n => n._id !== id));
    };

    const handleNotificationClick = (n: Notification) => {
        if (!n.is_read) markAsRead(n._id);
        navigate(n.link || '/dashboard');
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'Just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    const typeIcon = (type: string) => {
        switch (type) {
            case 'consultation_completed': return '🩺';
            case 'appointment_confirmed': return '📅';
            case 'new_message': return '💬';
            default: return '🔔';
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="min-h-screen bg-[#0B1C2C] text-white font-sans">
            {/* Background */}
            <div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: `linear-gradient(rgba(0,229,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.2) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

            {/* Header */}
            <header className="relative z-10 border-b border-white/10 bg-[#0B1C2C]/80 backdrop-blur-xl px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-[#00E5FF] transition-colors">
                        <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Bell className="w-6 h-6 text-[#00E5FF]" />
                        <h1 className="text-xl font-bold">Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="bg-[#00E5FF] text-black text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                        <button onClick={markAllRead}
                            className="flex items-center gap-2 text-sm text-[#00E5FF] hover:text-white border border-[#00E5FF]/30 hover:bg-[#00E5FF]/10 px-3 py-2 rounded-lg transition-all">
                            <CheckCheck className="w-4 h-4" /> Mark all read
                        </button>
                    )}
                    <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}
                        className="text-gray-400 hover:text-red-400 transition-colors p-2">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 py-10">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 rounded-full bg-[#00E5FF]/5 border border-[#00E5FF]/10 flex items-center justify-center mb-6">
                            <Bell className="w-10 h-10 text-[#00E5FF]/30" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">You're all caught up!</h2>
                        <p className="text-gray-400 text-sm max-w-xs">No notifications yet. When doctors review your scans or confirm appointments, you'll see alerts here.</p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {notifications.map((n, i) => (
                                <motion.div
                                    key={n._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -40 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all group
                                        ${n.is_read
                                            ? 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                                            : 'bg-[#00E5FF]/5 border-[#00E5FF]/20 hover:bg-[#00E5FF]/10 shadow-[0_0_20px_rgba(0,229,255,0.05)]'}`}
                                >
                                    {/* Unread dot */}
                                    {!n.is_read && (
                                        <div className="absolute top-4 right-12 w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
                                    )}

                                    {/* Icon */}
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-xl
                                        ${n.is_read ? 'bg-white/5' : 'bg-[#00E5FF]/10'}`}>
                                        {typeIcon(n.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm mb-0.5 ${n.is_read ? 'text-gray-300' : 'text-white'}`}>{n.title}</p>
                                        <p className="text-xs text-gray-400 leading-relaxed">{n.message}</p>
                                        <p className="text-xs text-[#00E5FF]/60 mt-1">{timeAgo(n.created_at)}</p>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1 shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Notifications;
