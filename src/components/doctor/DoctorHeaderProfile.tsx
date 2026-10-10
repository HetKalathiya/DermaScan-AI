import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DoctorHeaderProfileProps {
  userName?: string;
  userEmail?: string;
}

const DoctorHeaderProfile: React.FC<DoctorHeaderProfileProps> = ({ userName, userEmail }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userName) {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setName(parsed.name || 'Doctor');
        setEmail(parsed.email || '');
      }
    }
  }, [userName]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const displayName = userName || name || 'Doctor';
  const displayEmail = userEmail || email;
  const initials = displayName.charAt(0).toUpperCase();

  const menuItems = [
    {
      label: 'View Profile',
      icon: User,
      onClick: () => { navigate('/doctor/settings'); setOpen(false); },
      className: 'text-gray-300 hover:text-white hover:bg-[#00E5FF]/10',
    },
    {
      label: 'Notifications',
      icon: Bell,
      onClick: () => { navigate('/notifications'); setOpen(false); },
      className: 'text-gray-300 hover:text-white hover:bg-[#00E5FF]/10',
    },
    {
      label: 'Settings',
      icon: Settings,
      onClick: () => { navigate('/doctor/settings'); setOpen(false); },
      className: 'text-gray-300 hover:text-white hover:bg-[#00E5FF]/10',
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-white/10 hover:border-[#00E5FF]/40 bg-[#0a1622] transition-all hover:shadow-[0_0_12px_rgba(0,229,255,0.15)]"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00E5FF] to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-[0_0_8px_rgba(0,229,255,0.3)]">
          {initials}
        </div>
        <span className="text-sm font-medium text-white max-w-[120px] truncate">{displayName}</span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-56 bg-[#0B1C2C]/95 border border-[#00E5FF]/25 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl z-[9999] overflow-hidden"
          >
            {/* User Info Header */}
            <div className="px-4 py-3.5 bg-gradient-to-br from-[#00E5FF]/10 to-transparent border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00E5FF] to-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{displayName}</p>
                  {displayEmail && (
                    <p className="text-xs text-[#00E5FF]/80 truncate">{displayEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-0.5">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-all ${item.className} group`}
                >
                  <item.icon className="w-4 h-4 text-[#00E5FF]/60 group-hover:text-[#00E5FF] transition-colors shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Sign Out */}
            <div className="p-2 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/15 flex items-center gap-3 transition-all group"
              >
                <LogOut className="w-4 h-4 group-hover:text-red-300 transition-colors shrink-0" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorHeaderProfile;
