import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Calendar, MapPin, Search, ArrowLeft, Clock, X, CheckCircle, User, Sun, Sunrise, AlertCircle, Loader2, Sparkles, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Doctor {
    id: string;
    name: string;
    specialization: string;
    hospital_name: string;
    experience?: string;
    location?: string;
}

interface TimeSlot {
    time: string;
    period: 'morning' | 'afternoon';
    isBooked: boolean;
    isLocked?: boolean;
    isPast: boolean;
    available: boolean;
}

const Dermatologists = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    
    // Booking Form States
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [bookingMessage, setBookingMessage] = useState<string>('');
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [isFullDayOff, setIsFullDayOff] = useState<boolean>(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);

    const [isBookingLoading, setIsBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [patientName, setPatientName] = useState('');

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const userStr = localStorage.getItem('user');
                if (userStr) setPatientName(JSON.parse(userStr).name || '');

                const response = await fetch('http://localhost:5000/api/doctors', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const responseData = await response.json();
                    const doctorsList = Array.isArray(responseData) ? responseData : (responseData.data || []);
                    const dermatologists = doctorsList.filter((d: any) => 
                        d.specialization?.toLowerCase() === 'dermatologist' || 
                        d.specialization?.toLowerCase().includes('derma') ||
                        !d.specialization
                    ).map((d: any) => ({
                        ...d,
                        id: d._id || d.id,
                        name: d.user_id?.name || d.name || 'Unknown Doctor',
                        experience: d.experience || '8 years',
                        location: d.location || 'New York'
                    }));
                    setDoctors(dermatologists);
                }
            } catch (err) {
                console.error("Error fetching doctors", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, [navigate]);

    // Fetch time slots for selected doctor and date
    const fetchSlots = useCallback(async (doctorId: string, date: string) => {
        setLoadingSlots(true);
        setSlotsError(null);
        setSelectedSlot(null);
        setIsFullDayOff(false);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/appointments/slots/${doctorId}?date=${date}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSlots(data.slots || []);
                setIsFullDayOff(Boolean(data.isFullDayLocked));
            } else {
                setSlotsError(data.error || 'Failed to load time slots');
                setSlots([]);
            }
        } catch (err) {
            console.error('Error fetching slots:', err);
            setSlotsError('Network error loading slots');
            setSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    }, []);

    // Trigger slot fetch whenever selected doctor or date changes
    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            fetchSlots(selectedDoctor.id, selectedDate);
        }
    }, [selectedDoctor, selectedDate, fetchSlots]);

    const handleSelectDoctor = (doc: Doctor) => {
        setSelectedDoctor(doc);
        setSelectedDate(todayStr);
        setSelectedSlot(null);
        setBookingMessage('');
        setBookingError(null);
    };

    const handleBookAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot) {
            setBookingError('Please choose an available time slot.');
            return;
        }

        setIsBookingLoading(true);
        setBookingError(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    doctor_id: selectedDoctor?.id,
                    appointment_date: selectedDate,
                    appointment_time: selectedSlot,
                    message: bookingMessage,
                    image_data: location.state?.image || undefined
                })
            });

            const resData = await res.json();

            if (res.ok && resData.success) {
                setBookingSuccess(true);
                setTimeout(() => {
                    setBookingSuccess(false);
                    setSelectedDoctor(null);
                    navigate('/appointments');
                }, 2500);
            } else {
                setBookingError(resData.error || resData.message || 'Failed to book appointment.');
                // Refresh slots in case someone just took it
                if (selectedDoctor && selectedDate) {
                    fetchSlots(selectedDoctor.id, selectedDate);
                }
            }
        } catch (err) {
            console.error(err);
            setBookingError('Error booking appointment. Please check your connection.');
        } finally {
            setIsBookingLoading(false);
        }
    };

    // Quick date helper
    const getFutureDate = (daysAhead: number) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        return d.toISOString().split('T')[0];
    };

    const quickDates = [
        { label: 'Today', date: getFutureDate(0) },
        { label: 'Tomorrow', date: getFutureDate(1) },
        { label: 'In 2 Days', date: getFutureDate(2) },
    ];

    const filteredDoctors = doctors.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.hospital_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const morningSlots = slots.filter(s => s.period === 'morning');
    const afternoonSlots = slots.filter(s => s.period === 'afternoon');

    return (
        <div className="min-h-screen bg-[#0F172A] text-white selection:bg-[#06B6D4]/30 overflow-x-hidden font-sans relative">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#06B6D4] blur-[200px] mix-blend-screen opacity-10 animate-[pulse_10s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#3B82F6] blur-[200px] mix-blend-screen opacity-10 animate-[pulse_12s_ease-in-out_infinite_alternate]" />
            </div>

            {/* TOP NAVIGATION BAR */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0A101C]/80 backdrop-blur-xl border-b border-white/[0.05] h-20 flex items-center justify-between px-6 lg:px-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                        DermaScan <span className="text-[#06B6D4]">AI</span>
                    </span>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                            Dermatologist Directory
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            Connect with verified dermatologists and choose a convenient time slot for your clinical consultation.
                        </p>
                    </div>

                    <div className="relative w-full md:w-[350px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search doctors, hospitals..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0D1526]/80 border border-white/10 rounded-full py-3.5 pl-12 pr-6 text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/50 transition-all font-medium"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 font-medium">Finding available dermatologists...</p>
                    </div>
                ) : filteredDoctors.length === 0 ? (
                    <div className="bg-[#0B1425]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-16 text-center max-w-2xl mx-auto mt-10 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-slate-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>No dermatologists available at the moment.</h3>
                        <p className="text-slate-400 text-lg">We couldn't find any specialists matching your criteria. Please try again later or adjust your search.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDoctors.map((doc, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: idx * 0.1 }}
                                key={doc.id}
                                className="bg-[#0B1425]/90 backdrop-blur-xl rounded-[24px] border border-white/[0.08] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-[#06B6D4]/40 hover:-translate-y-1 transition-all group overflow-hidden relative flex flex-col justify-between"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#06B6D4]/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div>
                                    <div className="flex items-start gap-4 mb-6 relative z-10">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#06B6D4]/20 to-[#3B82F6]/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                                            <User className="w-8 h-8 text-[#06B6D4]" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                                                Dr. {doc.name}
                                            </h3>
                                            <p className="text-[#06B6D4] font-medium text-sm flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> {doc.specialization || 'Dermatologist'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-8 relative z-10">
                                        <div className="flex items-center gap-3 text-slate-300 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Clock className="w-4 h-4 text-slate-400" /></div>
                                            <span>Experience: <strong className="text-white font-medium">{doc.experience}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-300 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-slate-400" /></div>
                                            <span>Clinic: <strong className="text-white font-medium">{doc.hospital_name || 'General Hospital'}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-300 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><MapPin className="w-4 h-4 text-slate-400" /></div>
                                            <span>Location: <strong className="text-white font-medium">{doc.location}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleSelectDoctor(doc)}
                                    className="w-full py-3.5 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-[#06B6D4] hover:border-[#06B6D4] hover:text-[#0A101C] transition-all flex justify-center items-center gap-2 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] relative z-10"
                                >
                                    <Calendar className="w-4 h-4" /> Book Appointment
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* DYNAMIC TIME SLOT BOOKING MODAL */}
            <AnimatePresence>
                {selectedDoctor && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0B1425] border border-white/10 rounded-[32px] w-full max-w-xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.7)] relative my-8"
                        >
                            {bookingSuccess ? (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce">
                                        <CheckCircle className="w-10 h-10 text-[#10B981]" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Booking Confirmed!</h2>
                                    <p className="text-slate-300 mb-2">Your appointment with <strong>Dr. {selectedDoctor.name}</strong> is scheduled for:</p>
                                    <div className="px-5 py-2.5 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-full text-[#06B6D4] font-bold text-sm tracking-wide">
                                        📅 {selectedDate} at ⏰ {selectedSlot}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-4">Redirecting to your appointments...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Modal Header */}
                                    <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between bg-black/20">
                                        <div>
                                            <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                                                <Calendar className="w-5 h-5 text-[#06B6D4]" /> Book Consultation
                                            </h2>
                                            <p className="text-xs text-slate-400">Select an available time slot</p>
                                        </div>
                                        <button onClick={() => setSelectedDoctor(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleBookAppointment} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                                        {/* Doctor Badge */}
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#06B6D4]/10 rounded-full blur-[20px]" />
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#06B6D4]/20 to-[#3B82F6]/20 border border-white/10 flex items-center justify-center relative z-10 shrink-0">
                                                <User className="w-6 h-6 text-[#06B6D4]" />
                                            </div>
                                            <div className="relative z-10 min-w-0">
                                                <h4 className="text-white font-bold text-base truncate">Dr. {selectedDoctor.name}</h4>
                                                <p className="text-xs text-[#06B6D4] font-medium">{selectedDoctor.specialization || 'Dermatologist'} • {selectedDoctor.hospital_name || 'General Hospital'}</p>
                                            </div>
                                        </div>

                                        {/* Date Selection & Quick Filters */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-bold text-slate-300">1. Select Consultation Date</label>
                                                <span className="text-xs text-[#06B6D4] font-medium">Standard 30-min slots</span>
                                            </div>
                                            
                                            {/* Quick Date Chips */}
                                            <div className="flex gap-2 mb-3">
                                                {quickDates.map((q) => (
                                                    <button
                                                        key={q.label}
                                                        type="button"
                                                        onClick={() => setSelectedDate(q.date)}
                                                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                                                            selectedDate === q.date
                                                                ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4] shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                                                : 'bg-[#0D1526] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                                        }`}
                                                    >
                                                        {q.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <input 
                                                required 
                                                type="date" 
                                                min={todayStr} 
                                                value={selectedDate} 
                                                onChange={(e) => setSelectedDate(e.target.value)} 
                                                className="w-full bg-[#0D1526] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#06B6D4] transition-all" 
                                            />
                                        </div>

                                        {/* Time Slots Section */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="block text-sm font-bold text-slate-300">2. Select Time Slot</label>
                                                {selectedSlot && (
                                                    <span className="text-xs bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 px-2.5 py-0.5 rounded-full font-bold">
                                                        Selected: {selectedSlot}
                                                    </span>
                                                )}
                                            </div>

                                            {loadingSlots ? (
                                                <div className="py-8 flex flex-col items-center justify-center bg-[#0D1526]/50 rounded-2xl border border-white/5">
                                                    <Loader2 className="w-6 h-6 text-[#06B6D4] animate-spin mb-2" />
                                                    <p className="text-xs text-slate-400 font-medium">Checking doctor availability...</p>
                                                </div>
                                            ) : slotsError ? (
                                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
                                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                                    <span>{slotsError}</span>
                                                    <button type="button" onClick={() => fetchSlots(selectedDoctor.id, selectedDate)} className="underline ml-auto font-bold">Retry</button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* Full Day Off Notice */}
                                                    {isFullDayOff && (
                                                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-300 text-xs shadow-sm">
                                                            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                                                            <div>
                                                                <p className="font-bold">Doctor is unavailable on this date</p>
                                                                <p className="text-slate-400 text-[11px] mt-0.5">All time slots for {selectedDate} are locked. Please choose a different date above.</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Morning Slots */}
                                                    {morningSlots.length > 0 && (
                                                        <div className="p-3.5 bg-[#0D1526]/60 rounded-2xl border border-white/5">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                                                                <Sunrise className="w-3.5 h-3.5" /> Morning (09:00 AM – 12:00 PM)
                                                            </div>
                                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                                {morningSlots.map((slot) => {
                                                                    const isSelected = selectedSlot === slot.time;
                                                                    const isUnavailable = !slot.available;
                                                                    return (
                                                                        <button
                                                                            key={slot.time}
                                                                            type="button"
                                                                            disabled={isUnavailable}
                                                                            onClick={() => setSelectedSlot(slot.time)}
                                                                            className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-0.5 relative ${
                                                                                isSelected
                                                                                    ? 'bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] text-[#0A101C] font-extrabold border-[#06B6D4] shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-[1.02]'
                                                                                    : isUnavailable
                                                                                    ? slot.isLocked
                                                                                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-300/40 cursor-not-allowed'
                                                                                        : slot.isBooked
                                                                                        ? 'bg-red-500/5 border-red-500/10 text-red-400/40 cursor-not-allowed line-through'
                                                                                        : 'bg-white/[0.02] border-white/5 text-slate-600 cursor-not-allowed'
                                                                                    : 'bg-[#0F172A] border-white/10 text-slate-300 hover:text-white hover:border-[#06B6D4]/50 hover:bg-[#06B6D4]/10'
                                                                            }`}
                                                                        >
                                                                            <span>{slot.time}</span>
                                                                            {slot.isLocked && (
                                                                                <span className="text-[9px] text-amber-400/90 font-medium flex items-center gap-0.5">
                                                                                    <Lock className="w-2 h-2" /> Off-duty
                                                                                </span>
                                                                            )}
                                                                            {slot.isBooked && !slot.isLocked && (
                                                                                <span className="text-[9px] text-red-400/70 font-normal no-underline">Booked</span>
                                                                            )}
                                                                            {slot.isPast && !slot.isBooked && !slot.isLocked && (
                                                                                <span className="text-[9px] text-slate-500 font-normal">Past</span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Afternoon Slots */}
                                                    {afternoonSlots.length > 0 && (
                                                        <div className="p-3.5 bg-[#0D1526]/60 rounded-2xl border border-white/5">
                                                             <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
                                                                <Sun className="w-3.5 h-3.5" /> Afternoon & Evening (02:00 PM – 05:00 PM)
                                                            </div>
                                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                                {afternoonSlots.map((slot) => {
                                                                    const isSelected = selectedSlot === slot.time;
                                                                    const isUnavailable = !slot.available;
                                                                    return (
                                                                        <button
                                                                            key={slot.time}
                                                                            type="button"
                                                                            disabled={isUnavailable}
                                                                            onClick={() => setSelectedSlot(slot.time)}
                                                                            className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-0.5 relative ${
                                                                                isSelected
                                                                                    ? 'bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] text-[#0A101C] font-extrabold border-[#06B6D4] shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-[1.02]'
                                                                                    : isUnavailable
                                                                                    ? slot.isLocked
                                                                                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-300/40 cursor-not-allowed'
                                                                                        : slot.isBooked
                                                                                        ? 'bg-red-500/5 border-red-500/10 text-red-400/40 cursor-not-allowed line-through'
                                                                                        : 'bg-white/[0.02] border-white/5 text-slate-600 cursor-not-allowed'
                                                                                    : 'bg-[#0F172A] border-white/10 text-slate-300 hover:text-white hover:border-[#06B6D4]/50 hover:bg-[#06B6D4]/10'
                                                                            }`}
                                                                        >
                                                                            <span>{slot.time}</span>
                                                                            {slot.isLocked && (
                                                                                <span className="text-[9px] text-amber-400/90 font-medium flex items-center gap-0.5">
                                                                                    <Lock className="w-2 h-2" /> Off-duty
                                                                                </span>
                                                                            )}
                                                                            {slot.isBooked && !slot.isLocked && (
                                                                                <span className="text-[9px] text-red-400/70 font-normal no-underline">Booked</span>
                                                                            )}
                                                                            {slot.isPast && !slot.isBooked && !slot.isLocked && (
                                                                                <span className="text-[9px] text-slate-500 font-normal">Past</span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Legend */}
                                                    <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
                                                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" /> Available</div>
                                                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#3B82F6]" /> Selected</div>
                                                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500/40" /> Booked</div>
                                                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" /> Off-Duty</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Optional Message */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-300 mb-2">3. Reason or Note (Optional)</label>
                                            <textarea 
                                                rows={2} 
                                                value={bookingMessage} 
                                                onChange={(e) => setBookingMessage(e.target.value)} 
                                                className="w-full bg-[#0D1526] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#06B6D4] resize-none" 
                                                placeholder="Describe skin symptoms, lesion location, or questions..."
                                            />
                                        </div>

                                        {bookingError && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                <span>{bookingError}</span>
                                            </div>
                                        )}

                                        {/* Confirm Button */}
                                        <div className="pt-2">
                                            <button 
                                                disabled={isBookingLoading || !selectedSlot} 
                                                type="submit" 
                                                className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] text-[#0A101C] shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.55)] transition-all flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                {isBookingLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-[#0A101C]" />
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-5 h-5 text-[#0A101C]" />
                                                        {selectedSlot ? `Confirm Booking for ${selectedSlot}` : 'Select a Time Slot to Continue'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dermatologists;

