import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, TrendingUp, Users, CheckCircle, Clock, Activity,
  BrainCircuit, AlertTriangle, LogOut, User, Bell, ChevronUp, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import DoctorSidebar from './DoctorSidebar';
import DoctorHeaderProfile from './DoctorHeaderProfile';

interface MonthlyItem { _id: { month: number; year: number }; count: number; benign: number; malignant: number; }
interface StatsData { total: number; pending: number; completed: number; active: number; monthly: MonthlyItem[]; }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !stored) { navigate('/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'doctor') { navigate('/dashboard'); return; }
    setUser(parsed);
    fetch('http://localhost:5000/api/doctor/consultations/stats', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => { if (d.success) setStats(d.data); }).catch(console.error).finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const chartData = (stats?.monthly || []).map(m => ({
    name: MONTHS[m._id.month - 1],
    Benign: m.benign,
    Malignant: m.malignant,
  }));
  const totalBenign = (stats?.monthly || []).reduce((a, m) => a + m.benign, 0);
  const totalMalignant = (stats?.monthly || []).reduce((a, m) => a + m.malignant, 0);
  const donutData = [{ name: 'Benign', value: totalBenign }, { name: 'Malignant', value: totalMalignant }];
  const COLORS = ['#22d3ee', '#f87171'];

  const cards = [
    { label: 'Total', value: stats?.total ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', trend: '+12%', up: true },
    { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', trend: '-5%', up: false },
    { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', trend: '+18%', up: true },
    { label: 'Active', value: stats?.active ?? 0, icon: Activity, color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10', border: 'border-[#00E5FF]/20', trend: '+3', up: true },
  ];

  return (
    <div className="flex h-screen bg-[#0B1C2C] text-white overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(0,229,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.2) 1px,transparent 1px)`, backgroundSize: '40px 40px' }} />
      <DoctorSidebar activeItem="analytics" />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 bg-[#0B1C2C]/50 backdrop-blur-lg border-b border-[#00E5FF]/10 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-[#00E5FF]" />
            <h1 className="text-xl font-bold tracking-wide">Analytics Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/notifications')} className="relative p-2 text-gray-400 hover:text-[#00E5FF] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#00E5FF] rounded-full" />
            </button>
            <DoctorHeaderProfile userName={user?.name} userEmail={user?.email} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BrainCircuit className="w-10 h-10 text-[#00E5FF] animate-pulse mx-auto mb-3" />
                <p className="text-gray-400">Loading analytics...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className={`p-5 rounded-2xl bg-[#0a1622]/80 border ${c.border} flex items-center justify-between hover:-translate-y-1 transition-transform`}>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{c.label}</p>
                      <p className="text-3xl font-bold">{c.value}</p>
                      <div className={`flex items-center gap-0.5 mt-1 text-xs ${c.up ? 'text-green-400' : 'text-red-400'}`}>
                        {c.up ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {c.trend}
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-full ${c.bg} flex items-center justify-center`}>
                      <c.icon className={`w-6 h-6 ${c.color}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="xl:col-span-2 bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6">
                  <h2 className="font-semibold flex items-center gap-2 mb-5">
                    <TrendingUp className="w-5 h-5 text-[#00E5FF]" /> Monthly Consultations
                  </h2>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0a1622', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 12, color: '#fff' }} cursor={{ fill: 'rgba(0,229,255,0.05)' }} />
                        <Bar dataKey="Benign" fill="#22d3ee" radius={[4,4,0,0]} />
                        <Bar dataKey="Malignant" fill="#f87171" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-56 flex flex-col items-center justify-center text-gray-500">
                      <BarChart2 className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm">No monthly data yet.</p>
                    </div>
                  )}
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                  className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6">
                  <h2 className="font-semibold flex items-center gap-2 mb-5">
                    <Activity className="w-5 h-5 text-[#00E5FF]" /> AI Result Split
                  </h2>
                  {totalBenign + totalMalignant > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                            {donutData.map((_e, idx) => <Cell key={idx} fill={COLORS[idx]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0a1622', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 12, color: '#fff' }} />
                          <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{v}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />Benign</span><span className="font-bold">{totalBenign}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Malignant</span><span className="font-bold">{totalMalignant}</span></div>
                      </div>
                    </>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-gray-500">
                      <AlertTriangle className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm text-center">No scan results yet.</p>
                    </div>
                  )}
                </motion.div>
              </div>
              {/* Quick Insights */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6">
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                  <BrainCircuit className="w-5 h-5 text-[#00E5FF]" /> Quick Insights
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Completion Rate', value: stats && stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%', color: 'from-green-400 to-emerald-500', pct: stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0 },
                    { label: 'Malignant Rate', value: totalBenign + totalMalignant > 0 ? `${Math.round((totalMalignant / (totalBenign + totalMalignant)) * 100)}%` : '0%', color: 'from-red-500 to-orange-500', pct: totalBenign + totalMalignant > 0 ? Math.round((totalMalignant / (totalBenign + totalMalignant)) * 100) : 0 },
                    { label: 'Active Cases', value: String(stats?.active ?? 0), color: 'from-[#00E5FF] to-blue-500', pct: stats && stats.total > 0 ? Math.round(((stats.active ?? 0) / stats.total) * 100) : 0 },
                  ].map((item, i) => (
                    <div key={i} className="bg-black/30 rounded-xl p-4 border border-white/5">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="text-2xl font-bold text-white">{item.value}</p>
                      <div className="mt-2 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 1.2, delay: 0.7 + i * 0.1 }}
                          className={`h-full bg-gradient-to-r ${item.color} rounded-full`} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
