import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope, CheckCircle, XCircle, Search, AlertTriangle,
  ChevronLeft, ChevronRight, Loader2, Award, Home, Mail, ShieldAlert
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  created_at: string;
}

interface Doctor {
  _id: string;
  user_id: UserDetail | null;
  specialization: string;
  license_number: string;
  hospital_name: string;
  verified: boolean;
  created_at: string;
}

const AdminDoctors: React.FC = () => {
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [pendingError, setPendingError] = useState('');
  const [allError, setAllError] = useState('');
  
  // Search, pagination & filtering
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'approved' | 'pending'>('all');

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'approve' | 'reject' | 'suspend' | 'activate';
    doctorId: string;
    doctorName: string;
    userId?: string;
  } | null>(null);

  const [actionInProgress, setActionInProgress] = useState(false);
  const token = localStorage.getItem('token');

  const fetchPendingDoctors = useCallback(async () => {
    setLoadingPending(true);
    setPendingError('');
    try {
      const response = await fetch('http://localhost:5000/api/admin/doctors/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await response.json();
      if (resData.success) {
        setPendingDoctors(resData.data);
      } else {
        setPendingError(resData.message || 'Failed to fetch pending doctors.');
      }
    } catch {
      setPendingError('Failed to connect to server.');
    } finally {
      setLoadingPending(false);
    }
  }, [token]);

  const fetchAllDoctors = useCallback(async () => {
    setLoadingAll(true);
    setAllError('');
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        filter: filterType
      });
      const response = await fetch(`http://localhost:5000/api/admin/doctors?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await response.json();
      if (resData.success) {
        setAllDoctors(resData.data);
        setTotalPages(resData.totalPages || 1);
        setTotalDoctors(resData.total || 0);
      } else {
        setAllError(resData.message || 'Failed to fetch doctors list.');
      }
    } catch {
      setAllError('Failed to connect to server.');
    } finally {
      setLoadingAll(false);
    }
  }, [token, page, filterType]);

  useEffect(() => {
    fetchPendingDoctors();
  }, [fetchPendingDoctors]);

  useEffect(() => {
    fetchAllDoctors();
  }, [fetchAllDoctors]);

  const handleAction = async () => {
    if (!confirmModal) return;
    const { type, doctorId, userId } = confirmModal;
    setActionInProgress(true);
    try {
      let response;
      let url = '';
      const method = 'PATCH';

      if (type === 'approve') {
        url = `http://localhost:5000/api/admin/doctors/${doctorId}/approve`;
      } else if (type === 'reject') {
        url = `http://localhost:5000/api/admin/doctors/${doctorId}/reject`;
      } else if ((type === 'suspend' || type === 'activate') && userId) {
        url = `http://localhost:5000/api/admin/users/${userId}/suspend`;
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
          // Refresh data
          fetchPendingDoctors();
          fetchAllDoctors();
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

  // Filter approved doctors by search client-side (backend does filter.approved, frontend does local name search)
  const filteredApprovedDoctors = allDoctors.filter(doc => {
    const name = doc.user_id?.name || '';
    const email = doc.user_id?.email || '';
    const spec = doc.specialization || '';
    const hosp = doc.hospital_name || '';
    const searchLower = search.toLowerCase();
    return (
      name.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower) ||
      spec.toLowerCase().includes(searchLower) ||
      hosp.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex h-screen bg-[#060f1a] text-white overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(0,229,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.2) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <AdminSidebar pendingDoctorCount={pendingDoctors.length} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <AdminHeader title="Doctors" subtitle="Verify licenses and manage doctor accounts" icon={<Stethoscope className="w-6 h-6 text-[#00E5FF]" />} />

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* SECTION 1: PENDING APPROVAL QUEUE */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Pending Approvals
              {pendingDoctors.length > 0 && (
                <span className="text-xs bg-amber-400/20 text-amber-400 font-bold px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  {pendingDoctors.length} Awaiting Verification
                </span>
              )}
            </h2>

            {loadingPending ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(n => (
                  <div key={n} className="bg-[#0a1622]/60 border border-white/5 rounded-2xl p-6 animate-pulse space-y-4 h-48" />
                ))}
              </div>
            ) : pendingError ? (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{pendingError}</p>
                <button onClick={fetchPendingDoctors} className="text-[#00E5FF] font-semibold text-sm hover:underline ml-auto">Retry</button>
              </div>
            ) : pendingDoctors.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0a1622]/40 border border-dashed border-white/10 rounded-2xl p-8 text-center text-gray-400">
                <CheckCircle className="w-10 h-10 text-emerald-400/60 mx-auto mb-2" />
                <p className="font-semibold text-gray-300">All caught up!</p>
                <p className="text-xs mt-1 text-gray-500">There are no pending doctor registration applications to review.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingDoctors.map(doctor => (
                  <motion.div
                    key={doctor._id}
                    layoutId={doctor._id}
                    className="bg-[#0a1622]/80 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-white text-base">{doctor.user_id?.name || 'Unknown Doctor'}</h3>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Mail className="w-3.5 h-3.5" />{doctor.user_id?.email}</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">Pending</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-white/5 pt-3 text-xs">
                        <div>
                          <p className="text-gray-500 uppercase text-[9px] tracking-wider">Specialization</p>
                          <p className="text-gray-200 mt-0.5 font-medium">{doctor.specialization}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase text-[9px] tracking-wider">License Number</p>
                          <p className="text-gray-200 mt-0.5 font-medium">{doctor.license_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase text-[9px] tracking-wider">Hospital Name</p>
                          <p className="text-gray-200 mt-0.5 font-medium flex items-center gap-1"><Home className="w-3.5 h-3.5 text-gray-400" />{doctor.hospital_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase text-[9px] tracking-wider">Registered On</p>
                          <p className="text-gray-200 mt-0.5 font-medium">
                            {doctor.user_id?.created_at ? new Date(doctor.user_id.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t border-white/5 pt-4 mt-4">
                      <button
                        onClick={() => setConfirmModal({
                          show: true,
                          type: 'reject',
                          doctorId: doctor._id,
                          doctorName: doctor.user_id?.name || 'Unknown Doctor'
                        })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-bold rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Reject & Delete
                      </button>
                      <button
                        onClick={() => setConfirmModal({
                          show: true,
                          type: 'approve',
                          doctorId: doctor._id,
                          doctorName: doctor.user_id?.name || 'Unknown Doctor'
                        })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 text-black hover:bg-emerald-400 text-xs font-bold rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve Doctor
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 2: APPROVED DOCTORS TABLE */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#00E5FF]" /> Approved Specialists
              </h2>

              <div className="flex items-center gap-3">
                {/* Local search bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search approved doctors..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="bg-[#0a1622]/60 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/40 w-64 transition-all"
                  />
                </div>

                {/* Filter tab toggles */}
                <div className="flex bg-[#0a1622]/80 border border-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => { setFilterType('all'); setPage(1); }}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterType === 'all' ? 'bg-[#00E5FF] text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setFilterType('approved'); setPage(1); }}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterType === 'approved' ? 'bg-[#00E5FF] text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => { setFilterType('pending'); setPage(1); }}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterType === 'pending' ? 'bg-[#00E5FF] text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    Pending
                  </button>
                </div>
              </div>
            </div>

            {loadingAll ? (
              <div className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="h-6 w-full bg-white/5 animate-pulse rounded-md" />
                <div className="h-12 w-full bg-white/5 animate-pulse rounded-md" />
                <div className="h-12 w-full bg-white/5 animate-pulse rounded-md" />
              </div>
            ) : allError ? (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{allError}</p>
                <button onClick={fetchAllDoctors} className="text-[#00E5FF] font-semibold text-sm hover:underline ml-auto">Retry</button>
              </div>
            ) : filteredApprovedDoctors.length === 0 ? (
              <div className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-12 text-center text-gray-500">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-semibold text-gray-300">No doctors match your criteria</p>
                <p className="text-xs mt-1">Try adjusting your filters or search keywords.</p>
              </div>
            ) : (
              <div className="bg-[#0a1622]/80 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase tracking-wider font-semibold bg-white/5">
                        <th className="py-4 px-6">Doctor details</th>
                        <th className="py-4 px-6">Credentials</th>
                        <th className="py-4 px-6">Hospital</th>
                        <th className="py-4 px-6">Verification</th>
                        <th className="py-4 px-6">User Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredApprovedDoctors.map((doc) => (
                        <tr key={doc._id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-bold text-white">{doc.user_id?.name || 'N/A'}</p>
                            <p className="text-gray-500 text-[11px] mt-0.5">{doc.user_id?.email || 'N/A'}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-semibold text-gray-200">{doc.specialization}</p>
                            <p className="text-gray-500 text-[11px] mt-0.5">Lic: {doc.license_number}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-gray-300">{doc.hospital_name}</span>
                          </td>
                          <td className="py-4 px-6">
                            {doc.verified ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded">Verified</span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">Pending</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {doc.user_id?.isActive !== false ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded">Active</span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 border border-red-500/20 px-2 py-0.5 rounded">Suspended</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {doc.user_id && (
                              <button
                                onClick={() => setConfirmModal({
                                  show: true,
                                  type: doc.user_id?.isActive !== false ? 'suspend' : 'activate',
                                  doctorId: doc._id,
                                  doctorName: doc.user_id?.name || 'Unknown Doctor',
                                  userId: doc.user_id?._id
                                })}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                                  doc.user_id.isActive !== false
                                    ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                                    : 'border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10'
                                }`}
                              >
                                {doc.user_id.isActive !== false ? 'Suspend Account' : 'Reactivate Account'}
                              </button>
                            )}
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
                      Showing page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span> ({totalDoctors} total doctors)
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
          </section>
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
                confirmModal.type === 'reject' || confirmModal.type === 'suspend' ? 'bg-red-500' : 'bg-emerald-500'
              }`} />

              <div className="flex items-start gap-4 mt-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmModal.type === 'reject' || confirmModal.type === 'suspend'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {confirmModal.type === 'reject' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {confirmModal.type === 'approve' && 'Approve Doctor Registration'}
                    {confirmModal.type === 'reject' && 'Reject & Delete Doctor'}
                    {confirmModal.type === 'suspend' && 'Suspend Doctor Account'}
                    {confirmModal.type === 'activate' && 'Reactivate Doctor Account'}
                  </h3>
                  <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                    {confirmModal.type === 'approve' && `Are you sure you want to approve ${confirmModal.doctorName}? They will be notified and granted immediate credentials to consult patients.`}
                    {confirmModal.type === 'reject' && `Warning: This will permanently reject ${confirmModal.doctorName} and completely DELETE their user and doctor accounts. This action is permanent.`}
                    {confirmModal.type === 'suspend' && `Are you sure you want to suspend ${confirmModal.doctorName}? They will be immediately logged out and blocked from logging back in.`}
                    {confirmModal.type === 'activate' && `Are you sure you want to reactivate ${confirmModal.doctorName}? They will regain access to their doctor account immediately.`}
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
                    confirmModal.type === 'reject' || confirmModal.type === 'suspend'
                      ? 'bg-red-500 hover:bg-red-400 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-400'
                  }`}
                >
                  {actionInProgress && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {confirmModal.type === 'approve' && 'Approve'}
                  {confirmModal.type === 'reject' && 'Reject & Delete'}
                  {confirmModal.type === 'suspend' && 'Suspend'}
                  {confirmModal.type === 'activate' && 'Activate'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDoctors;
