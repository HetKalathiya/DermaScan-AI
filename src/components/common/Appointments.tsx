import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, User, Stethoscope, Building2, XCircle, CheckCircle, FileText, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Appointment {
    _id: string;
    id?: string;
    image_data?: string;
    status: 'pending_appointment' | 'active' | 'completed' | 'cancelled';
    appointment_date?: string;
    appointment_time?: string;
    message?: string;
    doctor_specialization?: string;
    doctor_hospital?: string;
    diagnosis?: string;
    treatment?: string;
    follow_up?: string;
    created_at: string;
}

const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pending_appointment: { label: 'Upcoming', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    active: { label: 'In Progress', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
};

const Appointments: React.FC = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [cancelId, setCancelId] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!localStorage.getItem('user')) { navigate('/login'); return; }
        (async () => {
            try {
                const res = await fetch('http://localhost:5000/api/appointments', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) { const d = await res.json(); setAppointments(d.data || []); }
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        })();
    }, [navigate]);

    useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

    const handleCancel = async () => {
        if (!cancelId) return;
        setIsCancelling(true);
        try {
            const res = await fetch(`http://localhost:5000/api/appointments/${cancelId}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setAppointments(prev => prev.map(a => (a._id === cancelId || a.id === cancelId) ? { ...a, status: 'cancelled' } : a));
                setToast({ type: 'success', text: 'Appointment cancelled' });
            } else { const e = await res.json(); setToast({ type: 'error', text: e.error || 'Failed' }); }
        } catch { setToast({ type: 'error', text: 'Network error' }); }
        finally { setIsCancelling(false); setCancelId(null); }
    };

    const filtered = appointments.filter(a => {
        if (filter === 'All') return true;
        if (filter === 'Upcoming') return ['pending_appointment', 'active'].includes(a.status);
        if (filter === 'Completed') return a.status === 'completed';
        if (filter === 'Cancelled') return a.status === 'cancelled';
        return true;
    });

    return (
        <div className="min-h-screen bg-[#0B1C2C] text-white font-sans">
            <div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: `linear-gradient(rgba(0,229,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.2) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`fixed top-6 right-6 z-[9999] px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl ${toast.type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'}`}>
                        {toast.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {cancelId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-[#0B1C2C] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center">
                            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">Cancel Appointment?</h3>
                            <p className="text-gray-400 text-sm mb-6">This cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setCancelId(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 font-semibold">Keep It</button>
                                <button onClick={handleCancel} disabled={isCancelling} className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 font-semibold disabled:opacity-50">
                                    {isCancelling ? 'Cancelling...' : 'Cancel It'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="relative z-10 border-b border-white/10 bg-[#0B1C2C]/80 backdrop-blur-xl px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-[#00E5FF] transition-colors"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                    <div className="flex items-center gap-2"><Calendar className="w-6 h-6 text-[#00E5FF]" /><h1 className="text-xl font-bold">My Appointments</h1></div>
                </div>
                <button onClick={() => navigate('/dermatologists')} className="px-4 py-2 bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] rounded-xl text-sm font-bold hover:bg-[#00E5FF]/20 transition-all">+ Book New</button>
            </header>

            <main className="relative z-10 max-w-3xl mx-auto px-4 py-8">
                <div className="flex gap-2 mb-6 flex-wrap">
                    {['All', 'Upcoming', 'Completed', 'Cancelled'].map(tab => (
                        <button key={tab} onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === tab ? 'bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF]' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)}</div>
                ) : filtered.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-[#00E5FF]/5 border border-[#00E5FF]/10 flex items-center justify-center mb-5">
                            <Calendar className="w-9 h-9 text-[#00E5FF]/30" />
                        </div>
                        <h2 className="text-lg font-bold mb-2">No appointments found</h2>
                        <p className="text-gray-400 text-sm mb-6">Book a consultation with a dermatologist to get started.</p>
                        <button onClick={() => navigate('/dermatologists')} className="px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-blue-600 rounded-xl font-bold text-black">Find Dermatologists</button>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((appt, i) => {
                            const cfg = STATUS[appt.status] || STATUS.pending_appointment;
                            const id = appt._id || appt.id || '';
                            return (
                                <motion.div key={id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className="bg-[#0a1622]/70 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-[#00E5FF]/20 transition-all">
                                    <div className="p-5 flex gap-4">
                                        <div className="w-20 h-20 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0">
                                            {appt.image_data ? <img src={appt.image_data} alt="Scan" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-gray-600" /></div>}
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                                <div>
                                                    <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-[#00E5FF]" /><span className="font-semibold text-sm">{appt.doctor_specialization || 'Dermatologist'}</span></div>
                                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5"><Building2 className="w-3 h-3" />{appt.doctor_hospital || 'Clinic'}</div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
                                            </div>
                                            {(appt.appointment_date || appt.appointment_time) && (
                                                <div className="flex gap-3 text-xs text-gray-400">
                                                    {appt.appointment_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(appt.appointment_date).toLocaleDateString()}</span>}
                                                    {appt.appointment_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{appt.appointment_time}</span>}
                                                </div>
                                            )}
                                            {appt.message && <p className="text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2 border border-white/5">"{appt.message}"</p>}
                                        </div>
                                    </div>
                                    {appt.status === 'completed' && appt.diagnosis && (
                                        <div className="px-5 pb-4 border-t border-white/10 space-y-1 pt-3">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Doctor's Response</p>
                                            <p className="text-sm text-gray-200">{appt.diagnosis}</p>
                                            {appt.treatment && <p className="text-xs text-gray-400"><span className="text-gray-300 font-semibold">Treatment:</span> {appt.treatment}</p>}
                                            {appt.follow_up && <p className="text-xs text-[#00E5FF] font-semibold">Follow-up: {appt.follow_up}</p>}
                                        </div>
                                    )}
                                    <div className="px-5 pb-4 flex gap-2">
                                        {appt.status === 'completed' && <button onClick={() => navigate('/my-reports')} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/20"><FileText className="w-3 h-3" />View Report</button>}
                                        {appt.status === 'pending_appointment' && <button onClick={() => setCancelId(id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20"><XCircle className="w-3 h-3" />Cancel</button>}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Appointments;
