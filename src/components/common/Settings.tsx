import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Bell, Shield, Trash2, Eye, EyeOff, ChevronRight, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PatientNavbar from './PatientNavbar';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [emailNotif, setEmailNotif] = useState(true);
    const [apptReminder, setApptReminder] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5000/api/user/account', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Failed to delete account from server:', err);
        } finally {
            setIsDeleting(false);
            localStorage.clear();
            navigate('/');
        }
    };

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3500);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPwd !== confirmPwd) { showToast('error', 'New passwords do not match'); return; }
        if (newPwd.length < 6) { showToast('error', 'Password must be at least 6 characters'); return; }
        setIsSaving(true);
        try {
            const res = await fetch('http://localhost:5000/api/user/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd })
            });
            const data = await res.json();
            if (res.ok) {
                showToast('success', 'Password changed successfully!');
                setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
            } else {
                showToast('error', data.error || 'Failed to change password');
            }
        } catch { showToast('error', 'Network error. Please try again.'); }
        finally { setIsSaving(false); }
    };

    const Toggle: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
        <button onClick={onToggle}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${on ? 'bg-[#00E5FF]' : 'bg-gray-600'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${on ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
    );

    return (
        <div className="min-h-screen bg-[#0B1C2C] text-white font-sans">
            <div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: `linear-gradient(rgba(0,229,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.2) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`fixed top-6 right-6 z-[9999] flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl
                            ${toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                        {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {toast.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-[#0B1C2C] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center">
                            <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">Delete Account?</h3>
                            <p className="text-gray-400 text-sm mb-6">All your scans, reports and appointments will be permanently deleted. This cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 font-semibold">Cancel</button>
                                <button 
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 font-semibold disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete Forever'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* UNIFIED PATIENT PORTAL NAVBAR */}
            <PatientNavbar currentPath="/settings" />

            <div className="pt-24 relative z-10 border-b border-white/10 bg-[#0B1C2C]/50 backdrop-blur-xl px-6 py-4">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-[#00E5FF]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Account Settings</h1>
                            <p className="text-xs text-gray-400">Security preferences & notification options</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="relative z-10 max-w-xl mx-auto px-4 py-8 space-y-6">

                {/* Change Password */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0a1622]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h2 className="text-base font-bold flex items-center gap-2 mb-5 pb-3 border-b border-white/10">
                        <Lock className="w-4 h-4 text-[#00E5FF]" /> Change Password
                    </h2>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        {[
                            { label: 'Current Password', val: currentPwd, set: setCurrentPwd, show: showCurrent, toggle: () => setShowCurrent(p => !p) },
                            { label: 'New Password', val: newPwd, set: setNewPwd, show: showNew, toggle: () => setShowNew(p => !p) },
                            { label: 'Confirm New Password', val: confirmPwd, set: setConfirmPwd, show: showConfirm, toggle: () => setShowConfirm(p => !p) }
                        ].map(({ label, val, set, show, toggle }) => (
                            <div key={label}>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                                <div className="relative">
                                    <input
                                        type={show ? 'text' : 'password'}
                                        value={val}
                                        onChange={e => set(e.target.value)}
                                        className="w-full pr-10 px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/40 transition-all text-sm"
                                        required
                                    />
                                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00E5FF]">
                                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button type="submit" disabled={isSaving}
                            className="w-full py-3 bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-wait mt-2">
                            {isSaving ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </motion.div>

                {/* Notification Preferences */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-[#0a1622]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h2 className="text-base font-bold flex items-center gap-2 mb-5 pb-3 border-b border-white/10">
                        <Bell className="w-4 h-4 text-[#00E5FF]" /> Notification Preferences
                    </h2>
                    <div className="space-y-4">
                        {[
                            { label: 'Email when doctor reviews scan', sub: 'Get notified when a diagnosis is ready', val: emailNotif, set: setEmailNotif },
                            { label: 'Appointment reminders', sub: 'Receive reminders 24h before your appointment', val: apptReminder, set: setApptReminder }
                        ].map(({ label, sub, val, set }) => (
                            <div key={label} className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-white">{label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                                </div>
                                <Toggle on={val} onToggle={() => set(p => !p)} />
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Danger Zone */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-red-500/5 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
                    <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-red-400">
                        <AlertTriangle className="w-4 h-4" /> Danger Zone
                    </h2>
                    <p className="text-sm text-gray-400 mb-4">Permanently delete your account and all associated data. This action is irreversible.</p>
                    <button onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-all">
                        <Trash2 className="w-4 h-4" /> Delete My Account
                    </button>
                </motion.div>
            </main>
        </div>
    );
};

export default Settings;
