import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, Lock, Unlock, CheckCircle2,
  AlertTriangle, User, RefreshCw, ShieldAlert,
  ChevronLeft, ChevronRight, Check, X, Sparkles, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DoctorSidebar from './DoctorSidebar';
import DoctorHeaderProfile from './DoctorHeaderProfile';

interface BookingDetails {
  consultationId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  status: string;
  message: string;
}

interface SlotItem {
  time: string;
  period: 'morning' | 'afternoon';
  status: 'available' | 'locked' | 'booked' | 'past';
  isBooked: boolean;
  isLocked: boolean;
  isPast: boolean;
  lockId: string | null;
  lockReason: string | null;
  bookingDetails: BookingDetails | null;
}

interface ScheduleResponse {
  date: string;
  doctorId: string;
  isFullDayLocked: boolean;
  fullDayReason: string | null;
  slots: SlotItem[];
  totalSlots: number;
  bookedCount: number;
  lockedCount: number;
}

const REASON_PRESETS = [
  { label: 'Hospital Surgery / Rounds', icon: '🏥' },
  { label: 'Lunch / Rest Break', icon: '☕' },
  { label: 'Personal Time Off', icon: '🏖️' },
  { label: 'Emergency Leave', icon: '🚨' },
  { label: 'Clinical Meeting / Conference', icon: '📋' },
];

export const DoctorScheduleManager: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Date selection (default today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Lock Modal State
  const [lockModalOpen, setLockModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'single' | 'morning' | 'afternoon' | 'full_day'>('single');
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('Unavailable');
  const [customReason, setCustomReason] = useState<string>('');

  // Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Check Doctor Authentication
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !stored) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    if (parsed.role !== 'doctor') {
      navigate('/dashboard', { replace: true });
      return;
    }
    setUser(parsed);
  }, [navigate]);

  // Fetch Doctor Schedule for selected date
  const fetchSchedule = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/doctor/schedule?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSchedule(data);
      } else {
        showToast('error', data.error || 'Failed to load schedule');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error loading schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchSchedule(selectedDate);
    }
  }, [selectedDate, fetchSchedule]);

  // Handle Locking Single Slot or Batch
  const handleLockSubmit = async () => {
    const finalReason = customReason.trim() || selectedReason;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (modalMode === 'single' && selectedSlotTime) {
        const res = await fetch('http://localhost:5000/api/doctor/schedule/lock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            date: selectedDate,
            time: selectedSlotTime,
            reason: finalReason,
            is_full_day: false
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('success', `Locked ${selectedSlotTime}`);
          setLockModalOpen(false);
          fetchSchedule(selectedDate);
        } else {
          showToast('error', data.error || 'Failed to lock slot');
        }
      } else if (modalMode === 'full_day') {
        const res = await fetch('http://localhost:5000/api/doctor/schedule/lock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            date: selectedDate,
            reason: finalReason,
            is_full_day: true
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('success', 'Full day locked for bookings');
          if (data.warning) showToast('warning', data.warning);
          setLockModalOpen(false);
          fetchSchedule(selectedDate);
        } else {
          showToast('error', data.error || 'Failed to lock full day');
        }
      } else if (modalMode === 'morning' || modalMode === 'afternoon') {
        const res = await fetch('http://localhost:5000/api/doctor/schedule/bulk-lock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            date: selectedDate,
            period: modalMode,
            reason: finalReason
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('success', data.message || `Locked ${modalMode} slots`);
          setLockModalOpen(false);
          fetchSchedule(selectedDate);
        } else {
          showToast('error', data.error || `Failed to lock ${modalMode} slots`);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error executing lock');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Unlocking Single Slot
  const handleUnlockSlot = async (slot: SlotItem) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/doctor/schedule/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: selectedDate,
          time: slot.time,
          lockId: slot.lockId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', `Unlocked ${slot.time}`);
        fetchSchedule(selectedDate);
      } else {
        showToast('error', data.error || 'Failed to unlock slot');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error unlocking slot');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Unlock Full Day
  const handleUnlockAll = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/doctor/schedule/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: selectedDate,
          is_full_day: true
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'All slots unlocked for this date');
        fetchSchedule(selectedDate);
      } else {
        showToast('error', data.error || 'Failed to unlock date');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error unlocking date');
    } finally {
      setActionLoading(false);
    }
  };

  // Open lock modal helpers
  const openSingleLockModal = (time: string) => {
    setModalMode('single');
    setSelectedSlotTime(time);
    setSelectedReason('Unavailable');
    setCustomReason('');
    setLockModalOpen(true);
  };

  const openBatchLockModal = (mode: 'morning' | 'afternoon' | 'full_day') => {
    setModalMode(mode);
    setSelectedSlotTime(null);
    setSelectedReason(mode === 'full_day' ? 'Full Day Leave' : 'Unavailable');
    setCustomReason('');
    setLockModalOpen(true);
  };

  // Quick date change helpers
  const getFutureDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const adjustDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const morningSlots = schedule?.slots.filter(s => s.period === 'morning') || [];
  const afternoonSlots = schedule?.slots.filter(s => s.period === 'afternoon') || [];
  const availableCount = schedule?.slots.filter(s => s.status === 'available').length || 0;

  return (
    <div className="flex h-screen bg-[#07131F] text-white overflow-hidden font-sans">
      {/* Background ambient grid */}
      <div
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,229,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.15) 1px,transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      <DoctorSidebar activeItem="schedule" />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 bg-[#0a1622]/80 backdrop-blur-xl border-b border-[#00E5FF]/10 flex items-center justify-between px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                Schedule & Slot Management
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                  Doctor Portal
                </span>
              </h1>
              <p className="text-xs text-gray-400">Lock, unlock, and manage patient consultation hours</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchSchedule(selectedDate)}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-[#00E5FF]/30 transition-all"
              title="Refresh Schedule"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00E5FF]' : ''}`} />
            </button>
            <DoctorHeaderProfile userName={user?.name} userEmail={user?.email} />
          </div>
        </header>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`absolute top-24 right-8 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-xl text-sm font-medium ${
                toast.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-300 shadow-[0_0_25px_rgba(34,197,94,0.2)]'
                  : toast.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                  : 'bg-red-500/10 border-red-500/30 text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.2)]'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
              <span>{toast.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {/* Top Bar: Date Controls & Quick Actions */}
          <div className="bg-[#0c1b2a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Date Selector */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustDate(-1)}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/30 transition-all"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/30 transition-all cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => adjustDate(1)}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/30 transition-all"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Quick Date Pills */}
                <div className="hidden sm:flex items-center gap-1.5 ml-2">
                  {[
                    { label: 'Today', date: getFutureDate(0) },
                    { label: 'Tomorrow', date: getFutureDate(1) },
                    { label: 'In 2 Days', date: getFutureDate(2) },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setSelectedDate(p.date)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedDate === p.date
                          ? 'bg-[#00E5FF] text-black shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk Lock / Unlock Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openBatchLockModal('morning')}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 hover:border-amber-500/40 transition-all"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Lock Morning
                </button>

                <button
                  onClick={() => openBatchLockModal('afternoon')}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 hover:border-amber-500/40 transition-all"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Lock Afternoon
                </button>

                {schedule?.isFullDayLocked ? (
                  <button
                    onClick={handleUnlockAll}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-xs font-bold text-green-400 hover:bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)] transition-all"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Unlock Full Day
                  </button>
                ) : (
                  <button
                    onClick={() => openBatchLockModal('full_day')}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-400 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Lock Full Day
                  </button>
                )}

                {schedule && (schedule.lockedCount > 0 || schedule.isFullDayLocked) && (
                  <button
                    onClick={handleUnlockAll}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Clear all locks for this date"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Unlock All
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Overview Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/5">
              <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Slots</p>
                  <p className="text-lg font-bold text-white mt-0.5">{schedule?.totalSlots || 14}</p>
                </div>
                <Clock className="w-5 h-5 text-gray-500" />
              </div>

              <div className="bg-green-500/5 rounded-xl p-3 border border-green-500/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-green-400 uppercase tracking-wider">Open for Patients</p>
                  <p className="text-lg font-bold text-green-400 mt-0.5">{availableCount}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>

              <div className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Locked by You</p>
                  <p className="text-lg font-bold text-amber-400 mt-0.5">{schedule?.lockedCount || 0}</p>
                </div>
                <Lock className="w-5 h-5 text-amber-400" />
              </div>

              <div className="bg-[#00E5FF]/5 rounded-xl p-3 border border-[#00E5FF]/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#00E5FF] uppercase tracking-wider">Booked Consultations</p>
                  <p className="text-lg font-bold text-[#00E5FF] mt-0.5">{schedule?.bookedCount || 0}</p>
                </div>
                <User className="w-5 h-5 text-[#00E5FF]" />
              </div>
            </div>
          </div>

          {/* Full Day Lock Alert Banner if active */}
          {schedule?.isFullDayLocked && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.15)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-red-300 text-sm">Full Day is Locked</h3>
                  <p className="text-xs text-red-400/80 mt-0.5">
                    Reason: <span className="font-semibold text-white">{schedule.fullDayReason || 'Full Day Off'}</span>. Patients cannot book any appointments on {selectedDate}.
                  </p>
                </div>
              </div>
              <button
                onClick={handleUnlockAll}
                className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-xs font-bold transition-all"
              >
                Unlock Day
              </button>
            </motion.div>
          )}

          {/* Slots View: Morning & Afternoon Grids */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 bg-[#0c1b2a]/50 rounded-2xl border border-white/5">
              <div className="w-8 h-8 border-2 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
              <p className="text-xs text-gray-400 font-medium">Loading schedule slots...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Morning Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Morning Slots (09:00 AM – 12:00 PM)
                  </h2>
                  <span className="text-xs text-gray-500">
                    {morningSlots.filter(s => s.status === 'available').length} of {morningSlots.length} open
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {morningSlots.map((slot) => (
                    <SlotCard
                      key={slot.time}
                      slot={slot}
                      onLock={() => openSingleLockModal(slot.time)}
                      onUnlock={() => handleUnlockSlot(slot)}
                      actionLoading={actionLoading}
                      onViewBooking={(booking) => {
                        navigate('/doctor-dashboard');
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Afternoon Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                    Afternoon Slots (02:00 PM – 05:00 PM)
                  </h2>
                  <span className="text-xs text-gray-500">
                    {afternoonSlots.filter(s => s.status === 'available').length} of {afternoonSlots.length} open
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {afternoonSlots.map((slot) => (
                    <SlotCard
                      key={slot.time}
                      slot={slot}
                      onLock={() => openSingleLockModal(slot.time)}
                      onUnlock={() => handleUnlockSlot(slot)}
                      actionLoading={actionLoading}
                      onViewBooking={(booking) => {
                        navigate('/doctor-dashboard');
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lock Modal */}
        <AnimatePresence>
          {lockModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLockModalOpen(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-[#0c1b2a] border border-[#00E5FF]/20 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 space-y-5"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {modalMode === 'single' && `Lock Slot: ${selectedSlotTime}`}
                        {modalMode === 'morning' && 'Lock Morning Slots'}
                        {modalMode === 'afternoon' && 'Lock Afternoon Slots'}
                        {modalMode === 'full_day' && 'Lock Entire Day'}
                      </h3>
                      <p className="text-xs text-gray-400">Date: {selectedDate}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLockModalOpen(false)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Reason Presets */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Select Reason (Doctor Internal Tag)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {REASON_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setSelectedReason(preset.label);
                          setCustomReason('');
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                          selectedReason === preset.label && !customReason
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-black/30 border-white/5 text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-base">{preset.icon}</span>
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Reason Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Or Enter Custom Reason
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="e.g. Attending Dermatology Symposium"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/60 focus:ring-1 focus:ring-[#00E5FF]/30 transition-all"
                  />
                </div>

                {/* Patient Notice info */}
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400">
                    Patients will see this slot as <span className="text-white font-medium">"Doctor Unavailable"</span> and cannot book it. Your specific reason notes remain private to you.
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setLockModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleLockSubmit}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    Confirm & Lock Slot
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// ─── Slot Card Component ──────────────────────────────────────────────────
interface SlotCardProps {
  slot: SlotItem;
  onLock: () => void;
  onUnlock: () => void;
  actionLoading: boolean;
  onViewBooking: (details: BookingDetails) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  onLock,
  onUnlock,
  actionLoading,
  onViewBooking
}) => {
  // Available State
  if (slot.status === 'available') {
    return (
      <div className="group relative bg-[#0c1b2a]/80 hover:bg-[#0e2235] border border-green-500/20 hover:border-green-400/50 rounded-2xl p-4 transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-bold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-green-400" />
              {slot.time}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
              Open
            </span>
          </div>
          <p className="text-xs text-gray-400">Available for patient consultations</p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">30 min session</span>
          <button
            onClick={onLock}
            disabled={actionLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-all group-hover:scale-105"
            title="Lock this slot"
          >
            <Lock className="w-3 h-3" />
            Lock Slot
          </button>
        </div>
      </div>
    );
  }

  // Locked State
  if (slot.status === 'locked') {
    return (
      <div className="bg-[#181512]/90 border border-amber-500/30 rounded-2xl p-4 transition-all duration-300 shadow-md shadow-[0_0_15px_rgba(245,158,11,0.1)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-bold text-amber-200 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              {slot.time}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/40">
              Locked
            </span>
          </div>
          <p className="text-xs text-amber-300/80 font-medium truncate">
            {slot.lockReason || 'Unavailable'}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Blocked from patient booking</p>
        </div>

        <div className="mt-4 pt-3 border-t border-amber-500/10 flex items-center justify-between">
          <span className="text-[11px] text-amber-400/60 font-medium">Off-Duty</span>
          <button
            onClick={onUnlock}
            disabled={actionLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20 text-xs font-semibold transition-all hover:scale-105"
            title="Unlock this slot"
          >
            <Unlock className="w-3 h-3" />
            Unlock
          </button>
        </div>
      </div>
    );
  }

  // Booked State
  if (slot.status === 'booked') {
    return (
      <div className="bg-[#0a1b2a]/95 border border-[#00E5FF]/30 rounded-2xl p-4 transition-all duration-300 shadow-md shadow-[0_0_20px_rgba(0,229,255,0.12)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-bold text-[#00E5FF] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#00E5FF]" />
              {slot.time}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
              Booked
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-6 h-6 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] text-xs font-bold shrink-0">
              {slot.bookingDetails?.patientName.charAt(0).toUpperCase() || 'P'}
            </div>
            <p className="text-xs font-bold text-white truncate">
              {slot.bookingDetails?.patientName || 'Patient Consultation'}
            </p>
          </div>
          {slot.bookingDetails?.patientPhone && (
            <p className="text-[10px] text-gray-400 mt-1 pl-8">
              Tel: {slot.bookingDetails.patientPhone}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[#00E5FF]/10 flex items-center justify-between">
          <span className="text-[11px] text-[#00E5FF]/70 capitalize font-medium">
            {slot.bookingDetails?.status.replace('_', ' ') || 'Active'}
          </span>
          <button
            onClick={() => slot.bookingDetails && onViewBooking(slot.bookingDetails)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/25 text-xs font-semibold transition-all hover:scale-105"
          >
            View Consultation
          </button>
        </div>
      </div>
    );
  }

  // Past State
  return (
    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 opacity-50 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-medium text-gray-500 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-600" />
            {slot.time}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-gray-500">
            Passed
          </span>
        </div>
        <p className="text-xs text-gray-600">Past time slot</p>
      </div>
      <div className="mt-4 pt-3 border-t border-white/5 text-right">
        <span className="text-[11px] text-gray-600">Unavailable</span>
      </div>
    </div>
  );
};

export default DoctorScheduleManager;
