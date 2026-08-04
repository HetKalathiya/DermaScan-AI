import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, AlertTriangle, ChevronLeft, ChevronRight, Loader2,
  Calendar, Mail, FileText, Trash2, ShieldAlert, UserCheck
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface Patient {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  created_at: string;
  scanCount: number;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search, pagination & filtering
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'active' | 'suspended'>('all');

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'suspend' | 'activate' | 'delete';
    userId: string;
    userName: string;
    userEmail: string;
  } | null>(null);

  const [actionInProgress, setActionInProgress] = useState(false);
  const token = localStorage.getItem('token');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300000); // Wait, 300000ms is 5 mins! Oh, let's make it 300ms so it's snappy but avoids too many requests.
    return () => clearTimeout(timer);
  }, [search]);

  // Actually let's use 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        filter: filterType,
        search: debouncedSearch
      });
      const response = await fetch(`http://localhost:5000/api/admin/users?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await response.json();
      if (resData.success) {
        setUsers(resData.data);
        setTotalPages(resData.totalPages || 1);
        setTotalUsers(resData.total || 0);
      } else {
        setError(resData.message || 'Failed to fetch users list.');
      }
    } catch {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  }, [token, page, filterType, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async () => {
    if (!confirmModal) return;
    const { type, userId } = confirmModal;
    setActionInProgress(true);
    try {
      let response;
      let url = '';
      let method = 'PATCH';

      if (type === 'suspend' || type === 'activate') {
        url = `http://localhost:5000/api/admin/users/${userId}/suspend`;
      } else if (type === 'delete') {
        url = `http://localhost:5000/api/admin/users/${userId}`;
        method = 'DELETE';
      }

      if (url) {
        response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        const resData = await response.json();
        if (resData.success) {
          fetchUsers();
          setConfirmModal(null);
        } else {
          alert(resData.message || 'Action failed.');
        }
      }
    } catch {
      alert('Network error. Failed to execute action.');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#060f1a] text-white overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(0,229,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.2) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <AdminSidebar pendingDoctorCount={0} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <AdminHeader title="User Management" subtitle="Manage registered patients and accounts" icon={<Users className="w-6 h-6 text-[#00E5FF]" />} />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" /> Patient Registry
              {!loading && totalUsers > 0 && (
                <span className="text-xs bg-[#00E5FF]/20 text-[#00E5FF] font-bold px-2.5 py-0.5 rounded-full border border-[#00E5FF]/20">
                  {totalUsers} Total
                </span>
              )}
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-[#0a1622]/60 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/40 w-64 transition-all"
                />
              </div>

              {/* Filter tabs */}
              <div className="flex bg-[#0a1622]/80 border border-white/10 rounded-lg p-0.5">
                {([
                  { label: 'All', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Suspended', value: 'suspended' }
                ] as const).map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => { setFilterType(tab.value); setPage(1); }}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterType === tab.value ? 'bg-[#00E5FF] text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="h-6 w-full bg-white/5 animate-pulse rounded-md" />
              <div className="h-12 w-full bg-white/5 animate-pulse rounded-md" />
              <div className="h-12 w-full bg-white/5 animate-pulse rounded-md" />
              <div className="h-12 w-full bg-white/5 animate-pulse rounded-md" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
              <button onClick={fetchUsers} className="text-[#00E5FF] font-semibold text-sm hover:underline ml-auto">Retry</button>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-12 text-center text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-gray-300">No users found</p>
              <p className="text-xs mt-1">Try modifying your search or filter options.</p>
            </div>
          ) : (
            <div className="bg-[#0a1622]/80 border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase tracking-wider font-semibold bg-white/5">
                      <th className="py-4 px-6">Name / Contact</th>
                      <th className="py-4 px-6">Joined Date</th>
                      <th className="py-4 px-6">Scans Done</th>
                      <th className="py-4 px-6">Account Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {users.map(user => (
                      <tr key={user._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-white">{user.name}</p>
                          <p className="text-gray-500 text-[11px] mt-0.5 flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{user.email}</p>
                        </td>
                        <td className="py-4 px-6 text-gray-300">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-500" />{new Date(user.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="flex items-center gap-1.5 font-semibold text-gray-200">
                            <FileText className="w-3.5 h-3.5 text-[#00E5FF]" />
                            {user.scanCount} scan{user.scanCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {user.isActive !== false ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded">Active</span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 border border-red-500/20 px-2 py-0.5 rounded">Suspended</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setConfirmModal({
                                show: true,
                                type: user.isActive !== false ? 'suspend' : 'activate',
                                userId: user._id,
                                userName: user.name,
                                userEmail: user.email
                              })}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                                user.isActive !== false
                                  ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                                  : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              {user.isActive !== false ? 'Suspend' : 'Reactivate'}
                            </button>
                            
                            <button
                              onClick={() => setConfirmModal({
                                show: true,
                                type: 'delete',
                                userId: user._id,
                                userName: user.name,
                                userEmail: user.email
                              })}
                              className="p-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Permanently Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/2">
                  <p className="text-gray-500 text-xs">
                    Showing page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span> ({totalUsers} total patients)
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

      {/* CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {confirmModal && confirmModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0a1622] border border-white/10 rounded-2xl p-6 shadow-2xl z-10 overflow-hidden"
            >
              {/* Alert Stripe */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                confirmModal.type === 'delete' || confirmModal.type === 'suspend' ? 'bg-red-500' : 'bg-emerald-500'
              }`} />

              <div className="flex items-start gap-4 mt-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmModal.type === 'delete' || confirmModal.type === 'suspend'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {confirmModal.type === 'delete' ? <Trash2 className="w-5 h-5" /> : (confirmModal.type === 'suspend' ? <ShieldAlert className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {confirmModal.type === 'suspend' && 'Suspend User Account'}
                    {confirmModal.type === 'activate' && 'Reactivate User Account'}
                    {confirmModal.type === 'delete' && 'Permanently Delete User'}
                  </h3>
                  <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                    {confirmModal.type === 'suspend' && `Are you sure you want to suspend ${confirmModal.userName} (${confirmModal.userEmail})? They will be immediately blocked from accessing their account and scans.`}
                    {confirmModal.type === 'activate' && `Are you sure you want to reactivate ${confirmModal.userName} (${confirmModal.userEmail})? They will immediately regain access to their account.`}
                    {confirmModal.type === 'delete' && `CRITICAL WARNING: This will permanently DELETE the patient account for ${confirmModal.userName} (${confirmModal.userEmail}) from the database. All related scans and details will be orphaned or removed. This action is absolutely IRREVERSIBLE.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 border-t border-white/5 pt-4">
                <button
                  onClick={() => setConfirmModal(null)}
                  disabled={actionInProgress}
                  className="px-4 py-2 border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionInProgress}
                  className={`px-4 py-2 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    confirmModal.type === 'delete' || confirmModal.type === 'suspend'
                      ? 'bg-red-500 hover:bg-red-400 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-400'
                  }`}
                >
                  {actionInProgress && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {confirmModal.type === 'suspend' && 'Suspend'}
                  {confirmModal.type === 'activate' && 'Reactivate'}
                  {confirmModal.type === 'delete' && 'Permanently Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
