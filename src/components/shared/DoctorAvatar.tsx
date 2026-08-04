import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Doctor {
    name: string;
    email: string;
    avatarUrl?: string;
}

interface DoctorAvatarProps {
    size?: 'sm' | 'md' | 'lg';
    showDropdown?: boolean;
    doctor: Doctor | null;
}

const getInitials = (name: string) => {
    if (!name) return 'DR';
    const parts = name.replace(/^Dr\.?\s*/i, '').split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const getGradient = (name: string) => {
    if (!name) return 'from-[#00E5FF] to-blue-600';
    const parts = name.replace(/^Dr\.?\s*/i, '').split(' ');
    const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    const firstChar = lastName.charAt(0).toUpperCase();
    
    // Deterministic based on char code
    const charCode = firstChar.charCodeAt(0);
    const mod = charCode % 3;
    
    if (mod === 0) return 'from-[#00E5FF] to-teal-500'; // teal
    if (mod === 1) return 'from-purple-500 to-indigo-600'; // purple
    return 'from-blue-500 to-cyan-500'; // blue
};

const DoctorAvatar: React.FC<DoctorAvatarProps> = ({ size = 'md', showDropdown = false, doctor }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-xl'
    };

    const statusDotClasses = {
        sm: 'w-2 h-2 bottom-0 right-0',
        md: 'w-2.5 h-2.5 bottom-0 right-0',
        lg: 'w-3.5 h-3.5 bottom-1 right-1'
    };

    const initials = doctor ? getInitials(doctor.name) : 'DR';
    const gradient = doctor ? getGradient(doctor.name) : 'from-[#00E5FF] to-blue-600';

    // Click outside hook logic
    useEffect(() => {
        if (!showDropdown || !isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown, isOpen]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const toggleDropdown = () => {
        if (showDropdown) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button 
                onClick={toggleDropdown}
                className={`relative rounded-full flex items-center justify-center border-2 border-[#00E5FF]/30 transition-transform ${showDropdown ? 'hover:scale-105 cursor-pointer' : 'cursor-default'} ${sizeClasses[size]} bg-gradient-to-tr ${gradient}`}
            >
                {doctor?.avatarUrl ? (
                    <img src={doctor.avatarUrl} alt={doctor.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                    <span className="font-bold text-white tracking-wider">{initials}</span>
                )}
                
                {/* Online Status Dot */}
                <span className={`absolute ${statusDotClasses[size]} bg-green-500 border border-[#0a1622] rounded-full`} />
            </button>

            <AnimatePresence>
                {showDropdown && isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-56 bg-[#0B1C2C]/95 border border-[#00E5FF]/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl z-[9999]"
                    >
                        <div className="p-4 border-b border-white/10 bg-gradient-to-br from-[#00E5FF]/10 to-transparent">
                            <p className="font-bold text-white tracking-wide">{doctor?.name || 'Dr. Smith'}</p>
                            <p className="text-xs text-[#00E5FF] mt-0.5 truncate">{doctor?.email || 'doctor@dermascan.com'}</p>
                        </div>
                        <div className="p-2 space-y-1">
                            <button onClick={() => navigate('/profile')} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#00E5FF]/15 hover:shadow-[inset_0_0_10px_rgba(0,229,255,0.2)] rounded-lg flex items-center gap-3 transition-all group">
                                <User className="w-4 h-4 group-hover:text-[#00E5FF] transition-colors" /> View Profile
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#00E5FF]/15 hover:shadow-[inset_0_0_10px_rgba(0,229,255,0.2)] rounded-lg flex items-center gap-3 transition-all group">
                                <Bell className="w-4 h-4 group-hover:text-[#00E5FF] transition-colors" /> Notifications
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#00E5FF]/15 hover:shadow-[inset_0_0_10px_rgba(0,229,255,0.2)] rounded-lg flex items-center gap-3 transition-all group">
                                <Settings className="w-4 h-4 group-hover:text-[#00E5FF] transition-colors" /> Settings
                            </button>
                        </div>
                        <div className="p-2 border-t border-white/10">
                            <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg flex items-center gap-3 transition-all group">
                                <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" /> Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DoctorAvatar;
