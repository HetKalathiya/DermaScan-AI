import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, ArrowLeft, Save, Stethoscope, FileBadge, Building2, Phone, MapPin, Award, Lock, ShieldCheck, Camera, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        return {
            name: parsed?.name || '',
            email: parsed?.email || '',
            role: parsed?.role || 'patient',
            specialization: 'Dermatologist',
            license: 'LIC-123456',
            hospital: 'City General Hospital',
            experience: '8 Years',
            phone: '+1 234 567 8900',
            location: 'New York, USA',
            bio: parsed?.role === 'doctor' ? 'Board-certified dermatologist specializing in AI-assisted early melanoma detection and comprehensive skin care.' : 'No known allergies or previous dermatological conditions.'
        };
    });

    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // @ts-ignore
                const response = await import('../../services/api').then(module => module.default.get('/user/profile'));
                setUser(prev => ({
                    ...prev,
                    ...response.data,
                    role: response.data.role || prev.role
                }));
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // @ts-ignore
            await import('../../services/api').then(module => module.default.put('/user/profile', { name: user.name, email: user.email }));
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Failed to update profile:', error);
            setMessage('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const isDoctor = user.role === 'doctor';

    return (
        <div className="min-h-screen bg-[#071A2E] bg-gradient-to-br from-[#071A2E] to-[#0B2A44] text-white font-sans selection:bg-[#00E5FF]/30 pb-16 pt-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

            {/* Subtle Medical Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(circle at center, #00E5FF 2px, transparent 2.5px)`, backgroundSize: '40px 40px' }}
            />
            {/* Glowing Orbs */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#00E5FF]/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <button
                    onClick={() => navigate(isDoctor ? '/doctor-dashboard' : '/dashboard')}
                    className="flex items-center text-gray-400 hover:text-[#00E5FF] mb-8 transition-colors group w-fit"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Top Section / Left Column: Profile Header Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0a1622]/60 backdrop-blur-xl rounded-2xl p-8 border border-[#00E5FF]/20 shadow-[0_0_30px_rgba(0,229,255,0.05)] flex flex-col items-center text-center relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00E5FF] to-blue-500" />

                            <div className="relative group cursor-pointer mb-6">
                                <div className="absolute inset-0 bg-[#00E5FF] blur-[20px] opacity-20 rounded-full group-hover:opacity-40 transition-opacity" />
                                <div className="w-32 h-32 rounded-full border-2 border-[#00E5FF]/50 bg-gradient-to-br from-gray-800 to-[#0a1622] flex items-center justify-center relative z-10 overflow-hidden group-hover:border-[#00E5FF] transition-colors shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                                    <User className="w-16 h-16 text-[#00E5FF] mb-2" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-20 backdrop-blur-sm">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                                {user.name || (isDoctor ? 'Dr. Unknown' : 'Unknown User')} <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
                            </h2>
                            <p className="text-[#00E5FF] font-medium mb-1">
                                {isDoctor ? user.specialization : 'Patient'}
                            </p>

                            {isDoctor ? (
                                <p className="text-sm text-gray-400 mb-6 flex items-center justify-center gap-1"><Building2 className="w-3.5 h-3.5" /> {user.hospital}</p>
                            ) : (
                                <p className="text-sm text-gray-400 mb-6 flex items-center justify-center gap-1"><MapPin className="w-3.5 h-3.5" /> {user.location}</p>
                            )}

                            <button className="w-full py-2.5 px-4 rounded-xl border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-all font-medium text-sm flex items-center justify-center gap-2 group">
                                <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Change Photo
                            </button>
                        </motion.div>

                        <div className="bg-[#0a1622]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-lg">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-gray-500" /> Security
                            </h3>
                            <button className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all text-sm font-medium text-left flex items-center justify-between group">
                                <span>Change Password</span>
                                <ArrowLeft className="w-4 h-4 rotate-180 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>
                            <button className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all text-sm font-medium text-left flex items-center justify-between mt-3 group">
                                <span>2-Factor Authentication</span>
                                <span className="bg-gray-700 text-xs px-2 py-1 rounded text-gray-300">Off</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Information & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0a1622]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-8 shadow-xl">
                            <form onSubmit={handleSubmit}>
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                                    <h3 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                                        <User className="w-5 h-5 text-[#00E5FF]" /> Personal Configuration
                                    </h3>
                                    {message && (
                                        <AnimatePresence>
                                            <motion.span initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-sm text-green-400 font-medium px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                                                {message}
                                            </motion.span>
                                        </AnimatePresence>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                    {/* Left Column Fields */}
                                    <div className="space-y-5">
                                        <div className="group">
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-[#00E5FF]">Full Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User className="h-4 w-4 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" /></div>
                                                <input type="text" name="name" value={user.name} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#0B1C2C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all font-medium" />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-[#00E5FF]">Email Address</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" /></div>
                                                <input type="email" name="email" value={user.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#0B1C2C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all font-medium" />
                                            </div>
                                        </div>

                                        {isDoctor && (
                                            <>
                                                <div className="group">
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-[#00E5FF]">Specialization</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Stethoscope className="h-4 w-4 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" /></div>
                                                        <input type="text" name="specialization" value={user.specialization} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#0B1C2C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all font-medium" />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-[#00E5FF]">License Number</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><FileBadge className="h-4 w-4 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" /></div>
                                                        <input type="text" name="license" value={user.license} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#0B1C2C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all font-medium" />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {!isDoctor && (
                                            <div className="group">
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-[#00E5FF]">Contact Number</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" /></div>
                                                    <input type="text" name="phone" value={user.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#0B1C2C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all font-medium" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column Fields */}
                                    <div className="space-y-5">
                                        {isDoctor && (
                                            <>
                                                <div className="group">
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-[#00E5FF]">Hospital / Clinic</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Building2 className="h-4 w-4 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" /></div>
                                                        <input type="text" name="hospital" value={user.hospital} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#0B1C2C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all font-medium" />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-[#00E5FF]">Years of Experience</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Award className="h-4 w-4 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" /></div>
                                                        <input type="text" name="experience" value={user.experience} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#0B1C2C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all font-medium" />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-[#00E5FF]">Contact Number</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" /></div>
                                                        <input type="text" name="phone" value={user.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#0B1C2C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all font-medium" />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        <div className="group">
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-[#00E5FF]">Location</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><MapPin className="h-4 w-4 text-gray-500 group-focus-within:text-[#00E5FF] transition-colors" /></div>
                                                <input type="text" name="location" value={user.location} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#0B1C2C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all font-medium" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="py-3 px-8 bg-gradient-to-r from-[var(--color-cyan, #00E5FF)] to-blue-600 hover:from-[#00E5FF] hover:to-blue-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all flex items-center gap-2 group w-full sm:w-auto justify-center disabled:opacity-70 disabled:cursor-wait"
                                        style={{ '--color-cyan': '#00E5FF' } as React.CSSProperties}
                                    >
                                        <Save className={`w-5 h-5 ${isSaving ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform`} />
                                        {isSaving ? 'Updating...' : 'Save Configuration'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#0a1622]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-8 shadow-xl">
                            {isDoctor ? (
                                <>
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-6 pb-4 border-b border-white/10 font-['Syne']">
                                        <Award className="w-5 h-5 text-blue-400" /> Professional Details
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="group">
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-[#00E5FF]">Doctor Bio</label>
                                            <textarea
                                                name="bio"
                                                value={user.bio}
                                                onChange={handleChange}
                                                className="w-full p-4 bg-[#0B1C2C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all font-medium resize-none h-32"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Core Competencies</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Skin Cancer Detection', 'Teledermatology', 'AI Diagnostics', 'Pediatric Dermatology', 'Cosmetic Procedures'].map((tag, idx) => (
                                                    <span key={idx} className="bg-white/5 border border-white/10 text-gray-300 px-3 py-1.5 rounded-full text-sm hover:border-[#00E5FF]/50 hover:text-[#00E5FF] transition-colors cursor-pointer">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-6 pb-4 border-b border-white/10 font-['Syne']">
                                        <Activity className="w-5 h-5 text-[#00E5FF]" /> Medical Profile
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="group">
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-[#00E5FF]">Known Allergies & Conditions</label>
                                            <textarea
                                                name="bio"
                                                value={user.bio}
                                                onChange={handleChange}
                                                placeholder="None reported"
                                                className="w-full p-4 bg-[#0B1C2C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all font-medium resize-none h-32"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
