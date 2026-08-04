import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Search, User, LogOut, Bell, Circle, Send, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import DoctorSidebar from './DoctorSidebar';
import DoctorHeaderProfile from './DoctorHeaderProfile';

interface Consultation {
  _id: string;
  id: string;
  patient_name: string;
  patient_email?: string;
  status: string;
  created_at: string;
}

interface Message {
  _id?: string;
  senderId: string;
  text: string;
  createdAt: string;
}

const MessagesInbox: React.FC = () => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState<{ id?: string; _id?: string; name: string; email: string } | null>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !stored) { navigate('/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'doctor') { navigate('/dashboard'); return; }
    setUser(parsed);
    fetch('http://localhost:5000/api/doctor/consultations', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      const list = (Array.isArray(data) ? data : []).filter(
        (c: Consultation) => c.status === 'active' || c.status === 'pending_appointment' || c.status === 'completed'
      );
      setConsultations(list);
    }).catch(console.error).finally(() => setLoadingList(false));
  }, [navigate]);

  useEffect(() => {
    if (!selected) return;
    const token = localStorage.getItem('token');
    setLoadingHistory(true);
    setMessages([]);

    fetch(`http://localhost:5000/api/doctor/consultations/${selected._id || selected.id}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      setMessages(d.data || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
    }).catch(console.error).finally(() => setLoadingHistory(false));

    socketRef.current?.disconnect();
    socketRef.current = io('http://localhost:5000/chat');
    socketRef.current.emit('joinConsultation', selected._id || selected.id);
    socketRef.current.on('receiveMessage', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    socketRef.current.on('typing', ({ senderId }: { senderId: string }) => {
      if (senderId !== (user?.id || user?._id)) setIsTyping(true);
    });
    socketRef.current.on('stopTyping', ({ senderId }: { senderId: string }) => {
      if (senderId !== (user?.id || user?._id)) setIsTyping(false);
    });
    return () => { socketRef.current?.disconnect(); };
  }, [selected, user]);   

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current || !selected) return;
    const consultId = selected._id || selected.id;
    socketRef.current.emit('sendMessage', { consultationId: consultId, senderId: user?.id || user?._id, text: input.trim() });
    socketRef.current.emit('stopTyping', { consultationId: consultId, senderId: user?.id || user?._id });
    setInput('');
  };

  const handleTypingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!selected || !socketRef.current) return;
    const consultId = selected._id || selected.id;
    socketRef.current.emit('typing', { consultationId: consultId, senderId: user?.id || user?._id });
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  };

  const filtered = consultations.filter(c =>
    (c.patient_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const currentUserId = user?.id || user?._id || '';

  return (
    <div className="flex h-screen bg-[#0B1C2C] text-white overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(0,229,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.2) 1px,transparent 1px)`, backgroundSize: '40px 40px' }} />
      <DoctorSidebar activeItem="messages" unreadCount={0} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 bg-[#0B1C2C]/50 backdrop-blur-lg border-b border-[#00E5FF]/10 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-[#00E5FF]" />
            <h1 className="text-xl font-bold tracking-wide">Messages Inbox</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/notifications')} className="relative p-2 text-gray-400 hover:text-[#00E5FF] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#00E5FF] rounded-full" />
            </button>
            <DoctorHeaderProfile userName={user?.name} userEmail={user?.email} />
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Conversation List */}
          <div className="w-72 lg:w-80 border-r border-white/10 flex flex-col bg-[#0a1622]/40">
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/40 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingList ? (
                <div className="h-32 flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#00E5FF] animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-gray-600 text-sm">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                  <p>No conversations yet.</p>
                </div>
              ) : (
                filtered.map(c => {
                  const isActive = selected?._id === c._id || selected?.id === c.id;
                  const statusColor = c.status === 'active' ? 'text-green-400' : c.status === 'completed' ? 'text-gray-500' : 'text-yellow-400';
                  return (
                    <button key={c._id || c.id} onClick={() => setSelected(c)}
                      className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all border-b border-white/5 ${isActive ? 'bg-[#00E5FF]/10 border-l-2 border-l-[#00E5FF]' : 'hover:bg-white/5'}`}>
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-blue-600/20 border border-[#00E5FF]/20 flex items-center justify-center text-sm font-bold text-[#00E5FF]">
                          {c.patient_name?.charAt(0).toUpperCase()}
                        </div>
                        <Circle className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-current ${statusColor} drop-shadow`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{c.patient_name}</p>
                        <p className="text-xs text-gray-500 truncate capitalize">{c.status.replace('_', ' ')}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Thread */}
          <div className="flex-1 flex flex-col bg-[#0B1C2C]/30">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                  {/* Chat Header */}
                  <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-3 bg-[#0B1C2C]/50">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-blue-600/20 border border-[#00E5FF]/20 flex items-center justify-center text-sm font-bold text-[#00E5FF]">
                      {selected.patient_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{selected.patient_name}</p>
                      {isTyping && <p className="text-xs text-[#00E5FF] animate-pulse">typing...</p>}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {loadingHistory ? (
                      <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#00E5FF] animate-spin" /></div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
                        <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
                        <p>No messages yet. Start the conversation.</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                          <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${isMe
                              ? 'bg-gradient-to-br from-[#00E5FF] to-blue-600 text-black rounded-tr-sm'
                              : 'bg-white/10 border border-white/10 text-white rounded-tl-sm'}`}>
                              <p className="text-sm font-medium">{msg.text}</p>
                              <p className={`text-[10px] mt-0.5 ${isMe ? 'text-black/60' : 'text-gray-400'}`}>{formatTime(msg.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-white/10 bg-[#0B1C2C]/50">
                    <form onSubmit={handleSend} className="flex gap-3">
                      <input
                        type="text" value={input} onChange={handleTypingInput}
                        placeholder={`Message ${selected.patient_name}...`}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition-colors"
                      />
                      <button type="submit" disabled={!input.trim()}
                        className="bg-[#00E5FF] text-black p-2.5 rounded-xl hover:bg-cyan-300 disabled:opacity-40 transition-colors shadow-[0_0_10px_rgba(0,229,255,0.3)]">
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-[#00E5FF]/5 border border-[#00E5FF]/10 flex items-center justify-center mb-4">
                    <MessageSquare className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-400 mb-2">Select a Conversation</h3>
                  <p className="text-gray-600 text-sm max-w-xs">Choose a patient conversation from the left panel to view and send messages.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesInbox;
