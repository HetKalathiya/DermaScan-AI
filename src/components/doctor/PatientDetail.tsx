import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Calendar, Phone, Mail, Activity, FileText,
  MessageSquare, ArrowLeft, Clock, CheckCircle, BrainCircuit,
  AlertTriangle, Stethoscope
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DoctorSidebar from './DoctorSidebar';
import DoctorHeaderProfile from './DoctorHeaderProfile';

interface Consultation {
  _id: string;
  id: string;
  status: string;
  ai_condition?: string;
  ai_result?: string;
  ai_confidence?: number;
  diagnosis?: string;
  treatment?: string;
  created_at: string;
  image_data?: string;
}

interface PatientUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  gender?: string;
}

interface Scan {
  _id: string;
  image_url?: string;
  ai_condition?: string;
  ai_result?: string;
  created_at: string;
}

const PatientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [patientUser, setPatientUser] = useState<PatientUser | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConsult, setSelectedConsult] = useState<Consultation | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { navigate('/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'doctor') { navigate('/dashboard'); return; }
    setCurrentUser(parsed);

    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/patients/${id}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setPatientUser(data.data.user || data.data.patient || null);
          setConsultations(data.data.consultations || []);
          setScans(data.data.scans || []);
        } else {
          setError(data.error || 'Failed to load patient data.');
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
      active: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      pending_appointment: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };
    return map[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  return (
    <div className="flex h-screen bg-[#0B1C2C] text-white overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(0,229,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.2) 1px,transparent 1px)`, backgroundSize: '40px 40px' }} />
      <DoctorSidebar activeItem="history" />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <header className="h-20 bg-[#0B1C2C]/50 backdrop-blur-lg border-b border-[#00E5FF]/10 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/doctor/history')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <div className="h-5 w-px bg-white/10" />
            <User className="w-5 h-5 text-[#00E5FF]" />
            <h1 className="text-xl font-bold tracking-wide">Patient Profile</h1>
          </div>
          <DoctorHeaderProfile userName={currentUser?.name} userEmail={currentUser?.email} />
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <BrainCircuit className="w-10 h-10 text-[#00E5FF] animate-pulse" />
              <p className="text-gray-400">Loading patient data...</p>
            </div>
          ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-red-400">
              <AlertTriangle className="w-10 h-10" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Patient Header Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-blue-600/20 border-2 border-[#00E5FF]/30 flex items-center justify-center text-3xl font-bold text-[#00E5FF] shrink-0">
                    {patientUser?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">{patientUser?.name || 'Unknown Patient'}</h2>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {patientUser?.email && (
                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                          <Mail className="w-4 h-4 text-[#00E5FF]/60" />{patientUser.email}
                        </span>
                      )}
                      {patientUser?.phone && (
                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                          <Phone className="w-4 h-4 text-[#00E5FF]/60" />{patientUser.phone}
                        </span>
                      )}
                      {patientUser?.age && (
                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                          <Calendar className="w-4 h-4 text-[#00E5FF]/60" />Age: {patientUser.age}
                        </span>
                      )}
                      {patientUser?.gender && (
                        <span className="flex items-center gap-1.5 text-sm text-gray-400 capitalize">
                          <User className="w-4 h-4 text-[#00E5FF]/60" />{patientUser.gender}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => navigate('/doctor/messages')}
                      className="flex items-center gap-2 px-4 py-2 bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] rounded-xl text-sm font-semibold hover:bg-[#00E5FF]/20 transition-colors">
                      <MessageSquare className="w-4 h-4" /> Message
                    </button>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/10">
                  {[
                    { label: 'Total Consultations', value: consultations.length, icon: FileText, color: 'text-blue-400' },
                    { label: 'Completed', value: consultations.filter(c => c.status === 'completed').length, icon: CheckCircle, color: 'text-green-400' },
                    { label: 'Total Scans', value: scans.length, icon: Activity, color: 'text-[#00E5FF]' },
                  ].map((s, i) => (
                    <div key={i} className="bg-black/30 rounded-xl p-3 border border-white/5 text-center">
                      <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                      <p className="text-xl font-bold text-white">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Consultation Timeline */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-white flex items-center gap-2 mb-5">
                  <Stethoscope className="w-5 h-5 text-[#00E5FF]" /> Consultation History
                </h3>
                {consultations.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-gray-500 text-sm">No consultations found.</div>
                ) : (
                  <div className="space-y-3">
                    {consultations.map((c, i) => (
                      <motion.div key={c._id || c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedConsult(selectedConsult?._id === c._id ? null : c)}
                        className="p-4 bg-black/30 rounded-xl border border-white/5 hover:border-[#00E5FF]/20 cursor-pointer transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center text-xs font-bold text-[#00E5FF]">{i + 1}</div>
                            <div>
                              <p className="font-semibold text-white text-sm">{c.ai_condition || 'Consultation'}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(c.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border capitalize ${statusBadge(c.status)}`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </div>
                        {selectedConsult?._id === c._id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {c.image_data && (
                              <div className="sm:col-span-2">
                                <img src={c.image_data} alt="Scan" className="w-32 h-32 object-contain rounded-lg border border-white/10" />
                              </div>
                            )}
                            <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Diagnosis</p>
                              <p className="text-sm text-white">{c.diagnosis && !c.diagnosis.startsWith('AI Analysis') ? c.diagnosis : 'Not recorded'}</p>
                            </div>
                            <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Treatment</p>
                              <p className="text-sm text-white">{c.treatment || 'Not recorded'}</p>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Scan Grid */}
              {scans.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-bold text-white flex items-center gap-2 mb-5">
                    <Activity className="w-5 h-5 text-[#00E5FF]" /> Scan History ({scans.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {scans.map((scan) => (
                      <div key={scan._id} className="bg-black/30 rounded-xl border border-white/5 overflow-hidden">
                        {scan.image_url
                          ? <img src={scan.image_url} alt="Scan" className="w-full aspect-square object-cover" />
                          : <div className="w-full aspect-square flex items-center justify-center text-gray-600"><Activity className="w-8 h-8" /></div>}
                        <div className="p-2">
                          <p className="text-xs text-gray-400 truncate">{scan.ai_condition || 'Unknown'}</p>
                          <p className="text-[10px] text-gray-600">{new Date(scan.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientDetail;
