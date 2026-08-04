import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Loader2 } from 'lucide-react';

interface Message {
  _id?: string;
  senderId: string;
  text: string;
  createdAt: string;
}

interface ChatProps {
  consultationId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
}

const ConsultationChat: React.FC<ChatProps> = ({ consultationId, currentUserId, otherUserId, otherUserName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/doctor/consultations/${consultationId}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setIsLoadingHistory(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
      }
    };
    loadHistory();
  }, [consultationId]);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000/chat');
    socketRef.current.emit('joinConsultation', consultationId);

    socketRef.current.on('receiveMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
      setTimeout(scrollToBottom, 50);
    });

    socketRef.current.on('typing', ({ senderId }: { senderId: string }) => {
      if (senderId !== currentUserId) setIsTyping(true);
    });

    socketRef.current.on('stopTyping', ({ senderId }: { senderId: string }) => {
      if (senderId !== currentUserId) setIsTyping(false);
    });

    return () => { socketRef.current?.disconnect(); };
  }, [consultationId, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (socketRef.current) {
      socketRef.current.emit('typing', { consultationId, senderId: currentUserId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('stopTyping', { consultationId, senderId: currentUserId });
      }, 1000);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('sendMessage', { consultationId, senderId: currentUserId, text: input.trim() });
    socketRef.current.emit('stopTyping', { consultationId, senderId: currentUserId });
    setInput('');
  };

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a1622] rounded-xl border border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#0B1C2C] rounded-t-xl">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00E5FF] to-blue-600 flex items-center justify-center text-sm font-bold text-black">
          {otherUserName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">{otherUserName}</h3>
          {isTyping && <p className="text-xs text-[#00E5FF] animate-pulse">typing...</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoadingHistory ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#00E5FF] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No messages yet. Start the conversation.
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isMe
                    ? 'bg-gradient-to-br from-[#00E5FF] to-blue-600 text-black rounded-tr-sm'
                    : 'bg-white/10 border border-white/10 text-white rounded-tl-sm'
                }`}>
                  <p className="text-sm font-medium">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-black/60' : 'text-gray-400'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10 bg-[#0B1C2C] rounded-b-xl">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleTyping}
            placeholder="Type your message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-[#00E5FF] text-black p-2.5 rounded-xl hover:bg-cyan-300 disabled:opacity-40 transition-colors shadow-[0_0_10px_rgba(0,229,255,0.3)]"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConsultationChat;
