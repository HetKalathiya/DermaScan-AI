import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ScrollText, Clock, AlertTriangle, ChevronLeft, ChevronRight,
  ScanSearch, Users, Stethoscope, CheckCircle, RefreshCw
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface LogActor {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Log {
  _id: string;
  type: string;
  message: string;
  actor: LogActor | null;
  actor_name: string;
  created_at: string;
}

const LOG_ICONS: Record<string, React.ReactNode> = {
  scan:         <ScanSearch className="w-4 h-4 text-[#00E5FF]" />,
  doctor:       <Stethoscope className="w-4 h-4 text-blue-400" />,
  alert:        <AlertTriangle className="w-4 h-4 text-amber-400" />,
  user:         <Users className="w-4 h-4 text-purple-400" />,
  subscription: <CheckCircle className="w-4 h-4 text-emerald-400" />,
};

const LOG_COLORS: Record<string, string> = {
  scan:         'border-[#00E5FF]/20 bg-[#00E5FF]/5 hover:bg-[#00E5FF]/10',
  doctor:       'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10',
  alert:        'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10',
  user:         'border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10',
  subscription: 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10',
};

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filterType, setFilterType] = useState<string>('all');

  const token = localStorage.getItem('token');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        type: filterType
      });
      const response = await fetch(`${API_BASE}/api/admin/activity-logs?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await response.json();
      if (resData.success !== false) {
        // Handle both logs array formats from server
        setLogs(resData.logs || resData.data || []);
        setTotalPages(resData.totalPages || 1);
        setTotalLogs(resData.total || 0);
      } else {
        setError(resData.message || 'Failed to fetch activity logs.');
      }
    } catch {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  }, [token, page, filterType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActorDisplay = (log: Log) => {
    if (log.actor && log.actor.name) {
      return (
        <span className="flex items-center gap-1">
          <span className="font-semibold text-white">{log.actor.name}</span>
          <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.2 rounded capitalize">
            {log.actor.role}
          </span>
        </span>
      );
    }
    return <span className="font-semibold text-gray-400">{log.actor_name || 'System'}</span>;
  };

  return (
    <div className="flex h-screen bg-[#060f1a] text-white overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(0,229,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.2) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <AdminSidebar pendingDoctorCount={0} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <AdminHeader title="Activity Logs" subtitle="Audit trails and security logs for the entire platform" icon={<ScrollText className="w-6 h-6 text-[#00E5FF]" />} />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" /> Platform Security Log
              {!loading && totalLogs > 0 && (
                <span className="text-xs bg-[#00E5FF]/20 text-[#00E5FF] font-bold px-2.5 py-0.5 rounded-full border border-[#00E5FF]/20">
                  {totalLogs} Events
                </span>
              )}
            </h2>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchLogs}
                className="p-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Refresh Logs"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00E5FF]' : ''}`} />
              </button>

              {/* Filter Tabs */}
              <div
                role="tablist"
                aria-label="Filter log events by type"
                className="flex bg-[#0a1622]/80 border border-white/10 rounded-lg p-0.5 overflow-x-auto max-w-full"
              >
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Scans', value: 'scan' },
                  { label: 'Doctors', value: 'doctor' },
                  { label: 'Users', value: 'user' },
                  { label: 'Alerts', value: 'alert' }
                ].map(tab => (
                  <button
                    key={tab.value}
                    role="tab"
                    aria-selected={filterType === tab.value}
                    onClick={() => { setFilterType(tab.value); setPage(1); }}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all shrink-0 ${filterType === tab.value ? 'bg-[#00E5FF] text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="h-16 w-full bg-[#0a1622]/60 border border-white/5 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
              <button onClick={fetchLogs} className="text-[#00E5FF] font-semibold text-sm hover:underline ml-auto">Retry</button>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-12 text-center text-gray-500">
              <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-gray-300">No logs found</p>
              <p className="text-xs mt-1">There are no matching audit records for this filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                      LOG_COLORS[log.type] || 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
                      {LOG_ICONS[log.type] || <ScrollText className="w-4 h-4 text-gray-400" />}
                    </div>
                    
                    <div className="flex-1 min-w-0 md:flex md:items-center md:justify-between md:gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-white font-medium leading-snug">{log.message}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                          <span>Actor:</span>
                          {getActorDisplay(log)}
                          {log.actor && log.actor.email && (
                            <span className="text-[10px] text-gray-600">({log.actor.email})</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0 mt-2 md:mt-0">
                        <p className="text-xs text-gray-400 font-semibold">
                          {new Date(log.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border border-white/10 rounded-2xl bg-[#0a1622]/80">
                  <p className="text-gray-500 text-xs">
                    Showing page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span> ({totalLogs} total events)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminLogs;
