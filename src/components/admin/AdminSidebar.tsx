import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BrainCircuit, LayoutDashboard, Stethoscope,
  Users, ScrollText, LogOut, ShieldCheck
} from 'lucide-react';

interface AdminSidebarProps {
  pendingDoctorCount?: number;
}

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard',     path: '/admin/dashboard' },
  { key: 'doctors',   icon: Stethoscope,     label: 'Doctors',        path: '/admin/doctors' },
  { key: 'users',     icon: Users,           label: 'Users',          path: '/admin/users' },
  { key: 'logs',      icon: ScrollText,      label: 'Activity Log',   path: '/admin/logs' },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ pendingDoctorCount = 0 }) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/admin/login');
  };

  return (
    <aside className="w-20 lg:w-64 bg-[#060f1a]/95 backdrop-blur-xl border-r border-[#00E5FF]/10 flex flex-col items-center lg:items-start py-6 z-20 shrink-0 transition-all duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 lg:px-6 mb-10">
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2.5 }} className="relative">
          <div className="absolute inset-0 bg-[#00E5FF] blur-[12px] opacity-40 rounded-full" />
          <BrainCircuit className="w-9 h-9 text-[#00E5FF] relative z-10" />
        </motion.div>
        <div className="hidden lg:block">
          <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00E5FF] to-blue-400">
            DermaScan AI
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <div className="w-full flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                isActive
                  ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.12)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[#00E5FF] shadow-[0_0_10px_#00E5FF] rounded-r-full" />}
              <div className="relative">
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#00E5FF]' : 'group-hover:text-[#00E5FF] transition-colors'}`} />
                {item.key === 'doctors' && pendingDoctorCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center shadow-[0_0_6px_rgba(251,191,36,0.6)]">
                    {pendingDoctorCount > 9 ? '9+' : pendingDoctorCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:block font-medium truncate">{item.label}</span>
              {item.key === 'doctors' && pendingDoctorCount > 0 && (
                <span className="hidden lg:block ml-auto text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                  {pendingDoctorCount} pending
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="w-full px-3 mt-4 border-t border-white/5 pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
          <span className="hidden lg:block font-medium">Sign Out</span>
        </button>
        <p className="hidden lg:block text-[10px] text-gray-700 font-mono tracking-widest text-center mt-3">v1.0.0 ADMIN</p>
      </div>
    </aside>
  );
};

export default AdminSidebar;
