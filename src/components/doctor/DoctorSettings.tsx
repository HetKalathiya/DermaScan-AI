import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, Lock, Bell, Wifi, WifiOff, Eye, EyeOff,
  Save, CheckCircle, AlertCircle, LogOut, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DoctorSidebar from './DoctorSidebar';
import DoctorHeaderProfile from './DoctorHeaderProfile';

type Tab = 'profile' | 'security' | 'availability' | 'notifications';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  hospital_name: string;
  license_number: string;
  experience_years: string;
}

const DoctorSettings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    name: '', email: '', phone: '',
    specialization: '', hospital_name: '', license_number: '', experience_years: ''
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [isOnline, setIsOnline] = useState(true);
  const [notifyNewPatient, setNotifyNewPatient] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !stored) { navigate('/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'doctor') { navigate('/dashboard'); return; }
    setUser(parsed);

    // Fetch user profile + doctor record in parallel
    Promise.all([
      fetch('http://localhost:5000/api/user/profile', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('http://localhost:5000/api/doctors', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
    ]).then(([profileRes, doctorsRes]) => {
      // Profile response: { success: true, data: { ...user } }
      const u = profileRes?.data || profileRes?.user || profileRes || {};
      // Try to find this doctor's record from the doctors list
      const doctorRecord = Array.isArray(doctorsRes)
        ? doctorsRes.find((d: { user_id?: string }) => d.user_id === (u._id || u.id))
        : null;
      setProfile({
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        specialization: doctorRecord?.specialization || '',
        hospital_name: doctorRecord?.hospital_name || '',
        license_number: doctorRecord?.license_number || '',
        experience_years: String(doctorRecord?.experience_years || ''),
      });
    }).catch(console.error).finally(() => setLoadingProfile(false));

    const savedOnline = localStorage.getItem('doctor_online');
    if (savedOnline !== null) setIsOnline(savedOnline === 'true');
  }, [navigate]);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      // Save user-level fields (name, phone) and doctor-level fields in parallel
      const [userRes, doctorRes] = await Promise.all([
        fetch('http://localhost:5000/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: profile.name, phone: profile.phone }),
        }).then(r => r.json()),
        fetch('http://localhost:5000/api/user/update-doctor', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            specialization: profile.specialization,
            hospital_name: profile.hospital_name,
            license_number: profile.license_number,
            experience_years: profile.experience_years,
          }),
        }).then(r => r.json()).catch(() => ({ success: false })),
      ]);

      if (userRes.success || doctorRes.success) {
        showToast('success', 'Profile updated successfully!');
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, name: profile.name }));
        setUser(prev => prev ? { ...prev, name: profile.name } : prev);
      } else {
        showToast('error', userRes.error || 'Failed to update profile.');
      }
    } catch { showToast('error', 'Network error. Please try again.'); }
    finally { setSavingProfile(false); }
  };

  const savePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) { showToast('error', 'All password fields are required.'); return; }
    if (newPwd !== confirmPwd) { showToast('error', 'New passwords do not match.'); return; }
    if (newPwd.length < 6) { showToast('error', 'Password must be at least 6 characters.'); return; }
    setSavingPwd(true);
    try {
      const token = localStorage.getItem('token');
      // Correct endpoint: PUT /api/user/change-password
      const res = await fetch('http://localhost:5000/api/user/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const d = await res.json();
      if (d.success || res.ok) {
        showToast('success', 'Password changed successfully!');
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      } else {
        showToast('error', d.error || 'Failed to change password. Check your current password.');
      }
    } catch { showToast('error', 'Network error. Please try again.'); }
    finally { setSavingPwd(false); }
  };

  const toggleAvailability = () => {
    const next = !isOnline;
    setIsOnline(next);
    localStorage.setItem('doctor_online', String(next));
    showToast('success', `You are now ${next ? 'Online' : 'Offline'}.`);
  };

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'availability', label: 'Availability', icon: Wifi },
    { key: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const inputCls = "w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/20 transition-all";
  const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="flex h-screen bg-[#0B1C2C] text-white overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(0,229,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.2) 1px,transparent 1px)`, backgroundSize: '40px 40px' }} />
      <DoctorSidebar activeItem="settings" />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 bg-[#0B1C2C]/50 backdrop-blur-lg border-b border-[#00E5FF]/10 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#00E5FF]" />
            <h1 className="text-xl font-bold tracking-wide">Doctor Settings</h1>
          </div>
          <div className="flex items-center gap-4">
            <DoctorHeaderProfile userName={user?.name} userEmail={user?.email} />
          </div>
        </header>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={`absolute top-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Tab Nav */}
            <div className="flex gap-1 bg-black/30 border border-white/10 rounded-xl p-1 mb-6">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key
                    ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:block">{tab.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6 space-y-5">
                  <h2 className="font-bold text-white flex items-center gap-2 pb-3 border-b border-white/10">
                    <User className="w-5 h-5 text-[#00E5FF]" /> Professional Profile
                  </h2>
                  {loadingProfile ? (
                    <div className="h-48 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] rounded-full animate-spin" /></div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Dr. John Smith' },
                          { label: 'Email Address', key: 'email', type: 'email', placeholder: 'doctor@hospital.com', disabled: true },
                          { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+1 234 567 8900' },
                          { label: 'Specialization', key: 'specialization', type: 'text', placeholder: 'Dermatology' },
                          { label: 'Hospital / Clinic', key: 'hospital_name', type: 'text', placeholder: 'City General Hospital' },
                          { label: 'License Number', key: 'license_number', type: 'text', placeholder: 'MED-12345' },
                          { label: 'Years of Experience', key: 'experience_years', type: 'number', placeholder: '10' },
                        ].map(field => (
                          <div key={field.key}>
                            <label className={labelCls}>{field.label}</label>
                            <input
                              type={field.type}
                              value={(profile as Record<string, string>)[field.key]}
                              onChange={e => setProfile(prev => ({ ...prev, [field.key]: e.target.value }))}
                              placeholder={field.placeholder}
                              disabled={field.disabled}
                              className={`${inputCls} ${field.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t border-white/10">
                        <button onClick={saveProfile} disabled={savingProfile}
                          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50">
                          {savingProfile ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                          {savingProfile ? 'Saving...' : 'Save Profile'}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6 space-y-5">
                  <h2 className="font-bold text-white flex items-center gap-2 pb-3 border-b border-white/10">
                    <Lock className="w-5 h-5 text-[#00E5FF]" /> Change Password
                  </h2>
                  <div className="max-w-md space-y-4">
                    {[
                      { label: 'Current Password', value: currentPwd, setter: setCurrentPwd, show: showCurrent, toggleShow: () => setShowCurrent(!showCurrent) },
                      { label: 'New Password', value: newPwd, setter: setNewPwd, show: showNew, toggleShow: () => setShowNew(!showNew) },
                      { label: 'Confirm New Password', value: confirmPwd, setter: setConfirmPwd, show: showNew, toggleShow: () => setShowNew(!showNew) },
                    ].map((f, i) => (
                      <div key={i}>
                        <label className={labelCls}>{f.label}</label>
                        <div className="relative">
                          <input
                            type={f.show ? 'text' : 'password'}
                            value={f.value}
                            onChange={e => f.setter(e.target.value)}
                            placeholder="••••••••"
                            className={inputCls + ' pr-10'}
                          />
                          <button type="button" onClick={f.toggleShow}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                            {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    {newPwd && confirmPwd && newPwd !== confirmPwd && (
                      <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Passwords do not match</p>
                    )}
                    <button onClick={savePassword} disabled={savingPwd}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50">
                      {savingPwd ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                      {savingPwd ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Availability Tab */}
              {activeTab === 'availability' && (
                <motion.div key="availability" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6 space-y-5">
                  <h2 className="font-bold text-white flex items-center gap-2 pb-3 border-b border-white/10">
                    <Wifi className="w-5 h-5 text-[#00E5FF]" /> Availability Status
                  </h2>
                  <div className="flex flex-col items-center gap-6 py-6">
                    <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 transition-all ${isOnline ? 'border-green-400 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-gray-600 bg-gray-500/10'}`}>
                      {isOnline ? <Wifi className="w-12 h-12 text-green-400" /> : <WifiOff className="w-12 h-12 text-gray-500" />}
                      <span className={`text-sm font-bold mt-1 ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <p className="text-gray-400 text-sm text-center max-w-sm">
                      {isOnline
                        ? 'You are currently accepting new patient consultation requests.'
                        : 'You are offline. New consultation requests will not be assigned to you.'}
                    </p>
                    <button onClick={toggleAvailability}
                      className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${isOnline
                        ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                        : 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20'}`}>
                      {isOnline ? <><WifiOff className="w-4 h-4" /> Go Offline</> : <><Wifi className="w-4 h-4" /> Go Online</>}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-[#0a1622]/80 border border-white/10 rounded-2xl p-6 space-y-5">
                  <h2 className="font-bold text-white flex items-center gap-2 pb-3 border-b border-white/10">
                    <Bell className="w-5 h-5 text-[#00E5FF]" /> Notification Preferences
                  </h2>
                  <div className="space-y-3">
                    {[
                      { label: 'New Patient Requests', desc: 'Get notified when a new patient submits a consultation request', value: notifyNewPatient, setter: setNotifyNewPatient },
                      { label: 'Email Notifications', desc: 'Receive email summaries for new consultations and messages', value: notifyEmail, setter: setNotifyEmail },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                        <div className="flex-1 mr-4">
                          <p className="font-semibold text-white text-sm">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                        <button onClick={() => item.setter(!item.value)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${item.value ? 'bg-[#00E5FF]' : 'bg-gray-700'}`}>
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${item.value ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <button onClick={() => showToast('success', 'Notification preferences saved!')}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all">
                      <Save className="w-4 h-4" /> Save Preferences
                    </button>
                  </div>
                  <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-red-400 text-sm">Sign Out</p>
                        <p className="text-xs text-gray-500 mt-0.5">Sign out from this device</p>
                      </div>
                      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
                        <LogOut className="w-4 h-4" /> <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorSettings;
