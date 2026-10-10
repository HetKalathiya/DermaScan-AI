import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Search, Filter, User, Clock, CheckCircle,
  ChevronRight, X, Stethoscope, BrainCircuit, LogOut, Bell,
  FileText, Calendar, Pill
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DoctorSidebar from './DoctorSidebar';
import DoctorHeaderProfile from './DoctorHeaderProfile';

interface Consultation {
  _id: string;
  id: string;
  patient_name: string;
  patient_email?: string;
  patient_age?: number;
  patient_gender?: string;
  image_data?: string;
  status: string;
  diagnosis?: string;
  treatment?: string;
  follow_up?: string;
  created_at: string;
  ai_condition?: string;
  ai_confidence?: number;
  ai_result?: 'benign' | 'malignant' | 'pending' | 'unknown';
}

const ConsultationHistory: React.FC = () => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'benign' | 'malignant'>('all');
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !stored) { navigate('/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role === 'admin') { navigate('/admin/dashboard', { replace: true }); return; }
    if (parsed.role !== 'doctor') { navigate('/dashboard', { replace: true }); return; }
    setUser(parsed);
    fetch('http://localhost:5000/api/doctor/consultations', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      const completed = (Array.isArray(data) ? data : []).filter((c: Consultation) => c.status === 'completed');
      setConsultations(completed);
    }).catch(console.error).finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const filtered = consultations.filter(c => {
    const matchSearch = (c.patient_name || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.ai_result === filter;
    return matchSearch && matchFilter;
  });

  const resultColor = (r?: string) => {
    if (r === 'malignant') return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (r === 'benign') return 'text-green-400 bg-green-500/10 border-green-500/20';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  };

  return (
    <div className="flex h-screen bg-[#0B1C2C] text-white overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(0,229,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.2) 1px,transparent 1px)`, backgroundSize: '40px 40px' }} />
      <DoctorSidebar activeItem="history" />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 bg-[#0B1C2C]/50 backdrop-blur-lg border-b border-[#00E5FF]/10 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-[#00E5FF]" />
            <h1 className="text-xl font-bold tracking-wide">Consultation History</h1>
            <span className="text-xs bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF] px-2 py-0.5 rounded-full font-mono">
              {consultations.length} completed
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/notifications')} className="relative p-2 text-gray-400 hover:text-[#00E5FF] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#00E5FF] rounded-full" />
            </button>
            <DoctorHeaderProfile userName={user?.name} userEmail={user?.email} />
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
          {/* Search + Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by patient name..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#0a1622] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              {(['all', 'benign', 'malignant'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f
                    ? 'bg-[#00E5FF] text-black shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* List + Detail Layout */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* List */}
            <div className="xl:col-span-1 overflow-y-auto space-y-3 pr-1">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <BrainCircuit className="w-8 h-8 text-[#00E5FF] animate-pulse" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500 text-center">
                  <History className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">{search ? 'No results found.' : 'No completed consultations yet.'}</p>
                </div>
              ) : (
                filtered.map((c, i) => (
                  <motion.div key={c._id || c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => setSelected(c)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${selected?._id === c._id
                      ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 shadow-[0_0_12px_rgba(0,229,255,0.1)]'
                      : 'bg-[#0a1622]/60 border-white/5 hover:border-[#00E5FF]/20 hover:bg-[#00E5FF]/5'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-blue-600/20 border border-[#00E5FF]/20 flex items-center justify-center text-sm font-bold text-[#00E5FF]">
                          {c.patient_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{c.patient_name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(c.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 mt-1" />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border capitalize ${resultColor(c.ai_result)}`}>
                        {c.ai_condition || c.ai_result || 'Unknown'}
                      </span>
                      {c.ai_confidence != null && c.ai_confidence > 0 && (
                        <span className="text-[10px] text-gray-500">{c.ai_confidence}% confidence</span>
                      )}
                      <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> Completed
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Detail Panel */}
            <div className="xl:col-span-2 bg-[#0a1622]/60 border border-white/10 rounded-2xl overflow-hidden relative">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div key={selected._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="h-full overflow-y-auto">
                    {/* Patient Header */}
                    <div className="p-6 bg-gradient-to-r from-[#0B1C2C] to-[#0a1622] border-b border-white/10 flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-blue-600/20 border border-[#00E5FF]/30 flex items-center justify-center text-xl font-bold text-[#00E5FF]">
                          {selected.patient_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">{selected.patient_name}</h2>
                          <div className="flex items-center gap-3 text-sm text-gray-400 mt-0.5">
                            {selected.patient_age && <span>Age: {selected.patient_age}</span>}
                            {selected.patient_gender && <><span>•</span><span className="capitalize">{selected.patient_gender}</span></>}
                            <span>•</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(selected.created_at).toLocaleDateString()}</span>
                          </div>
                          {selected.patient_email && <p className="text-xs text-gray-500 mt-0.5">{selected.patient_email}</p>}
                        </div>
                      </div>
                      <button onClick={() => setSelected(null)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Scan Image + AI */}
                      <div className="space-y-4">
                        {selected.image_data && (
                          <div className="aspect-square rounded-xl overflow-hidden bg-black/50 border border-white/10">
                            <img src={selected.image_data} alt="Scan" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className="bg-[#0B1C2C]/80 rounded-xl p-4 border border-[#00E5FF]/10">
                          <h3 className="text-xs font-semibold text-[#00E5FF] mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <BrainCircuit className="w-4 h-4" /> AI Analysis
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Condition</p>
                              <p className="text-sm font-bold text-white">{selected.ai_condition || 'Unknown'}</p>
                            </div>
                            <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Confidence</p>
                              <p className={`text-sm font-bold ${selected.ai_result === 'malignant' ? 'text-red-400' : 'text-green-400'}`}>
                                {selected.ai_confidence ? `${selected.ai_confidence}%` : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${selected.ai_result === 'malignant' ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-green-400 to-emerald-500'}`}
                                style={{ width: `${selected.ai_confidence || 0}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Doctor Notes */}
                      <div className="space-y-4">
                        <div className="bg-[#0B1C2C]/50 rounded-xl p-4 border border-white/10">
                          <h3 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider border-b border-white/5 pb-2">
                            <Stethoscope className="w-4 h-4" /> Final Diagnosis
                          </h3>
                          <p className="text-sm text-white leading-relaxed">
                            {selected.diagnosis && !selected.diagnosis.startsWith('AI Analysis')
                              ? selected.diagnosis
                              : <span className="text-gray-500 italic">No diagnosis recorded.</span>}
                          </p>
                        </div>
                        <div className="bg-[#0B1C2C]/50 rounded-xl p-4 border border-white/10">
                          <h3 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider border-b border-white/5 pb-2">
                            <Pill className="w-4 h-4" /> Treatment
                          </h3>
                          <p className="text-sm text-white leading-relaxed">
                            {selected.treatment || <span className="text-gray-500 italic">No treatment recorded.</span>}
                          </p>
                        </div>
                        <div className="bg-[#0B1C2C]/50 rounded-xl p-4 border border-white/10">
                          <h3 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider border-b border-white/5 pb-2">
                            <Calendar className="w-4 h-4" /> Follow-up
                          </h3>
                          <p className="text-sm text-white">{selected.follow_up || 'None specified'}</p>
                        </div>
                        <button onClick={() => navigate(`/doctor/patient/${(selected as any).patient_id?._id || (selected as any).patient_id || selected._id}`)}
                          className="w-full py-2.5 border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                          <FileText className="w-4 h-4" /> View Full Patient Profile
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 rounded-full bg-[#00E5FF]/5 border border-[#00E5FF]/10 flex items-center justify-center mb-4">
                      <History className="w-10 h-10 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400 mb-2">Select a Record</h3>
                    <p className="text-gray-600 text-sm max-w-xs">Click any consultation from the left to view full diagnosis details and treatment notes.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConsultationHistory;
