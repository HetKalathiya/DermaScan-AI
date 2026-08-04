import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, LogOut, ChevronDown } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title, subtitle, icon }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;
  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'AD';

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-20 bg-[#060f1a]/60 backdrop-blur-lg border-b border-[#00E5FF]/10 flex items-center justify-between px-6 shrink-0 relative z-[100]">
      {/* Left — Page Title */}
      <div className="flex items-center gap-3">
        {icon && <div className="text-[#00E5FF]">{icon}</div>}
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">{title}</h1>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Right — Bell + Profile */}
      <div className="flex items-center gap-4">
        {/* Admin Badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Admin</span>
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2.5 p-1 pl-1 pr-3 rounded-full border border-white/10 hover:border-[#00E5FF]/40 bg-[#0a1622] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black">
              {initials}
            </div>
            <span className="text-sm font-semibold text-white hidden sm:block">{user?.name || 'Admin'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-56 bg-[#060f1a]/95 border border-[#00E5FF]/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden z-[9999] backdrop-blur-xl"
              >
                {/* User Info Header */}
                <div className="px-4 py-3 bg-gradient-to-br from-amber-400/10 to-transparent border-b border-white/10">
                  <p className="font-bold text-white text-sm">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-amber-400/80">{user?.email || ''}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-[10px] text-green-400 font-semibold">Online</span>
                  </div>
                </div>
                {/* Sign Out */}
                <div className="p-2">
                  <button
                    onClick={() => { localStorage.clear(); navigate('/admin/login'); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center gap-3 transition-all"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
