import { useState, useEffect, useCallback, type FC, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Stethoscope, ScanLine, MessageSquare,
  AlertTriangle, ArrowRight, LayoutDashboard,
  ScanSearch, CheckCircle, Clock, Activity, ScrollText, Loader2
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Stats { totalPatients: number; totalDoctors: number; pendingDoctors: number; totalScans: number; totalConsultations: number; }
interface Log { _id: string; type: string; message: string; actor_name: string; created_at: string; }

const LOG_ICONS: Record<string, ReactNode> = {
  scan:         <ScanSearch className="w-4 h-4 text-[#00E5FF]" />,
  doctor:       <Stethoscope className="w-4 h-4 text-blue-400" />,
  alert:        <AlertTriangle className="w-4 h-4 text-amber-400" />,
  user:         <Users className="w-4 h-4 text-purple-400" />,
  subscription: <CheckCircle className="w-4 h-4 text-green-400" />,
};

const LOG_COLORS: Record<string, string> = {
  scan: 'bg-[#00E5FF]/10 border-[#00E5FF]/20', doctor: 'bg-blue-500/10 border-blue-500/20',
  alert: 'bg-amber-500/10 border-amber-500/20', user: 'bg-purple-500/10 border-purple-500/20',
  subscription: 'bg-green-500/10 border-green-500/20',
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const AdminDashboard: FC = () => {
  const navigate = useNavigate();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [logs, setLogs]     = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const token = localStorage.getItem('token');

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    setError('');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_BASE}/api/admin/stats`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/api/admin/activity-logs?limit=10`, { headers }).then(r => r.json()),
    ])
      .then(([statsRes, logsRes]) => {
        if (statsRes.success) setStats(statsRes.data);
        if (logsRes.success !== false) setLogs(logsRes.logs || []);
      })
      .catch((err) => {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data. Check your connection.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const statCards = stats ? [
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10', border: 'border-[#00E5FF]/20', action: () => navigate('/admin/users') },
    { label: 'Total Doctors', value: stats.totalDoctors,  icon: Stethoscope, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', sub: stats.pendingDoctors > 0 ? `${stats.pendingDoctors} pending approval` : 'All approved', subColor: stats.pendingDoctors > 0 ? 'text-amber-400' : 'text-green-400', action: () => navigate('/admin/doctors') },
    { label: 'Total Scans',   value: stats.totalScans,    icon: ScanLine, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { label: 'Consultations', value: stats.totalConsultations, icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  ] : [];

  return (
    <div className="flex h-screen bg-[#060f1a] text-white overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(0,229,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.2) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <AdminSidebar pendingDoctorCount={stats?.pendingDoctors || 0} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <AdminHeader title="Dashboard" subtitle="Platform overview at a glance" icon={<LayoutDashboard className="w-6 h-6" />} />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-[#00E5FF] animate-spin mx-auto mb-3" />
                <p className="text-gray-400">Loading dashboard...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-red-400">{error}</p>
              <button onClick={fetchDashboard} className="ml-auto text-sm text-red-400 hover:underline">Retry</button>
            </div>
          )}

          {!loading && !error && stats && (
            <>
              {/* Pending Doctors Alert */}
              {stats.pendingDoctors > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 bg-amber-400/10 border border-amber-400/30 rounded-xl px-5 py-4">
                  <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-amber-300">{stats.pendingDoctors} doctor{stats.pendingDoctors > 1 ? 's' : ''} awaiting approval</p>
                    <p className="text-xs text-amber-400/70 mt-0.5">Review their credentials and approve or reject their registration.</p>
                  </div>
                  <button onClick={() => navigate('/admin/doctors')}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-black text-sm font-bold rounded-lg hover:bg-amber-300 transition-colors shrink-0">
                    Review Now <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    onClick={card.action}
                    role={card.action ? 'button' : undefined}
                    tabIndex={card.action ? 0 : undefined}
                    onKeyDown={(e) => { if (card.action && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); card.action(); } }}
                    className={`p-6 rounded-2xl bg-[#0a1622]/80 border ${card.border} flex items-start justify-between hover:-translate-y-1 transition-all duration-200 ${card.action ? 'cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]' : ''}`}>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">{card.label}</p>
                      <p className="text-4xl font-bold text-white">{card.value}</p>
                      {card.sub && <p className={`text-xs mt-1.5 font-semibold ${card.subColor}`}>{card.sub}</p>}
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center shrink-0`}>
                      <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions + Recent Logs */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6">
                  <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#00E5FF]" /> Quick Actions
                  </h2>
                  <div className="space-y-2">
                    {[
                      { label: 'Review Pending Doctors', icon: Stethoscope, color: 'text-blue-400', path: '/admin/doctors', badge: stats.pendingDoctors },
                      { label: 'Manage Users',           icon: Users,       color: 'text-[#00E5FF]', path: '/admin/users' },
                      { label: 'View Activity Logs',     icon: ScrollText,  color: 'text-purple-400', path: '/admin/logs' },
                    ].map((item, i) => (
                      <button key={i} onClick={() => navigate(item.path)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group">
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge != null && item.badge > 0 && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">{item.badge}</span>
                          )}
                          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="xl:col-span-2 bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#00E5FF]" /> Recent Activity
                    </h2>
                    <button onClick={() => navigate('/admin/logs')} className="text-xs text-[#00E5FF] hover:underline">View all →</button>
                  </div>
                  {logs.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-gray-500">
                      <ScrollText className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No activity yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log, i) => (
                        <motion.div key={log._id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.03 }}
                          className={`flex items-start gap-3 p-3 rounded-xl border ${LOG_COLORS[log.type] || 'bg-white/5 border-white/10'}`}>
                          <div className="mt-0.5 shrink-0">{LOG_ICONS[log.type] || <Activity className="w-4 h-4 text-gray-400" />}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white leading-snug">{log.message}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{log.actor_name} · {timeAgo(log.created_at)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
