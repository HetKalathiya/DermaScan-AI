import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Calendar, MapPin, Search, ArrowLeft, Clock, X, CheckCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Doctor {
    id: string;
    name: string;
    specialization: string;
    hospital_name: string;
    experience?: string;
    location?: string;
}

const Dermatologists = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [bookingDetails, setBookingDetails] = useState({ date: '', time: '', message: '' });
    const [isBookingLoading, setIsBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
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
                        !d.specialization // If missing, just show them as fallbacks
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

    const handleBookAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsBookingLoading(true);

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
                    appointment_date: bookingDetails.date,
                    appointment_time: bookingDetails.time,
                    message: bookingDetails.message,
                    image_data: location.state?.image || undefined
                })
            });

            if (res.ok) {
                setBookingSuccess(true);
                setTimeout(() => {
                    setBookingSuccess(false);
                    setSelectedDoctor(null);
                    navigate('/dashboard'); // Go back to dashboard after success
                }, 3000);
            } else {
                const errData = await res.json();
                alert(`Booking Failed: ${errData.message || errData.error || 'Unknown error'}`);
                console.error("Booking failed:", errData);
            }
        } catch (err) {
            console.error(err);
            alert("Error booking appointment. Please try again.");
        } finally {
            setIsBookingLoading(false);
        }
    };

    const filteredDoctors = doctors.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.hospital_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                            Connect with top-rated dermatologists and skin specialists for professional medical consultation.
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
                                className="bg-[#0B1425]/90 backdrop-blur-xl rounded-[24px] border border-white/[0.08] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-[#06B6D4]/40 hover:-translate-y-1 transition-all group overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#06B6D4]/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                
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

                                <button 
                                    onClick={() => setSelectedDoctor(doc)}
                                    className="w-full py-3.5 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-[#06B6D4] hover:border-[#06B6D4] hover:text-[#0A101C] transition-all flex justify-center items-center gap-2 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] relative z-10"
                                >
                                    <Calendar className="w-4 h-4" /> Book Appointment
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* BOOKING MODAL */}
            <AnimatePresence>
                {selectedDoctor && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0B1425] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative"
                        >
                            {bookingSuccess ? (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full bg-[#10B981]/20 flex items-center justify-center mb-6">
                                        <CheckCircle className="w-10 h-10 text-[#10B981]" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Booking Confirmed!</h2>
                                    <p className="text-slate-400">Your appointment with Dr. {selectedDoctor.name} has been successfully scheduled.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Book Consultation</h2>
                                        <button onClick={() => setSelectedDoctor(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleBookAppointment} className="p-8 space-y-5">
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex gap-4 mb-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-[#06B6D4]/10 rounded-full blur-[20px]" />
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-[#06B6D4]/20 to-[#3B82F6]/20 flex items-center justify-center relative z-10">
                                                <User className="w-6 h-6 text-[#06B6D4]" />
                                            </div>
                                            <div className="relative z-10">
                                                <h4 className="text-white font-bold">Dr. {selectedDoctor.name}</h4>
                                                <p className="text-sm text-slate-400">{selectedDoctor.specialization || 'Dermatologist'} • {selectedDoctor.hospital_name || 'General Hospital'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Patient Name</label>
                                            <input type="text" value={patientName} readOnly className="w-full bg-[#0D1526] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none opacity-80 cursor-not-allowed" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-2">Date</label>
                                                <input required type="date" value={bookingDetails.date} onChange={(e) => setBookingDetails({...bookingDetails, date: e.target.value})} className="w-full bg-[#0D1526] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#06B6D4]" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-2">Time</label>
                                                <input required type="time" value={bookingDetails.time} onChange={(e) => setBookingDetails({...bookingDetails, time: e.target.value})} className="w-full bg-[#0D1526] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#06B6D4]" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Message or Reason (Optional)</label>
                                            <textarea rows={3} value={bookingDetails.message} onChange={(e) => setBookingDetails({...bookingDetails, message: e.target.value})} className="w-full bg-[#0D1526] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#06B6D4] resize-none" placeholder="Describe your skin concern..."></textarea>
                                        </div>

                                        <div className="pt-4">
                                            <button disabled={isBookingLoading} type="submit" className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex justify-center items-center gap-2">
                                                {isBookingLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Appointment'}
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
