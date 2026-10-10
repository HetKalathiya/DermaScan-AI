import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BrainCircuit, LayoutDashboard, Users, Activity,
  History, MessageSquare, Settings, BarChart2, Calendar
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface DoctorSidebarProps {
  activeItem: 'dashboard' | 'requests' | 'scans' | 'history' | 'messages' | 'settings' | 'analytics' | 'schedule';
  unreadCount?: number;
}

const NAV_ITEMS: (NavItem & { key: DoctorSidebarProps['activeItem'] })[] = [
  { key: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard',           path: '/doctor-dashboard' },
  { key: 'schedule',   icon: Calendar,        label: 'Schedule & Slots',    path: '/doctor/schedule' },
  { key: 'requests',   icon: Users,           label: 'Patient Requests',    path: '/doctor-dashboard' },
  { key: 'scans',      icon: Activity,        label: 'AI Scan Results',     path: '/doctor/scans' },
  { key: 'history',    icon: History,         label: 'Consultation History', path: '/doctor/history' },
  { key: 'messages',   icon: MessageSquare,   label: 'Messages',            path: '/doctor/messages' },
  { key: 'analytics',  icon: BarChart2,       label: 'Analytics',           path: '/doctor/analytics' },
  { key: 'settings',   icon: Settings,        label: 'Settings',            path: '/doctor/settings' },
];

const DoctorSidebar: React.FC<DoctorSidebarProps> = ({ activeItem, unreadCount = 0 }) => {
  const navigate = useNavigate();

  return (
    <aside className="w-20 lg:w-64 bg-[#0a1622]/90 backdrop-blur-xl border-r border-[#00E5FF]/10 flex flex-col items-center lg:items-start py-6 z-20 shrink-0 transition-all duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 lg:px-6 mb-12">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-[#00E5FF] blur-[10px] opacity-40 rounded-full" />
          <BrainCircuit className="w-10 h-10 text-[#00E5FF] relative z-10" />
        </motion.div>
        <span className="hidden lg:block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00E5FF] to-blue-400">
          DermaScan AI
        </span>
      </div>

      {/* Nav Items */}
      <div className="w-full flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = activeItem === item.key;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                isActive
                  ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute inset-y-0 left-0 w-1 bg-[#00E5FF] shadow-[0_0_10px_#00E5FF] rounded-r-full" />
              )}
              <div className="relative">
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#00E5FF]' : 'group-hover:text-[#00E5FF] transition-colors'}`} />
                {/* Unread badge on Messages */}
                {item.key === 'messages' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#00E5FF] text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:block font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom DermaScan version tag */}
      <div className="hidden lg:flex items-center gap-2 px-6 mt-4">
        <span className="text-[10px] text-gray-600 font-mono tracking-widest">v1.0.0 BETA</span>
      </div>
    </aside>
  );
};

export default DoctorSidebar;
