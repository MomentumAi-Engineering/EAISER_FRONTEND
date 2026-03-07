import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Shield,
    MessageSquare,
    Send,
    User,
    ArrowLeft,
    Loader2,
    ShieldCheck,
    Lock,
    Image as ImageIcon,
    Video,
    RefreshCw,
    X,
    Maximize2,
    Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../services/apiClient';

export default function AuthorityChatHub() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [issue, setIssue] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [authorityName, setAuthorityName] = useState('Official Authority');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);


    useEffect(() => {
        if (!token) {
            setError("Secure handshake failed: Token missing.");
            setLoading(false);
            return;
        }
        initializeHub();

        // Setup polling for new messages
        const pollInterval = setInterval(() => {
            if (issue?.id) {
                apiClient.getChatHistory(issue.id).then(chatRes => {
                    if (chatRes.messages) {
                        setMessages(prev => {
                            // Update if length changed or if it's the first time
                            if (prev.length !== chatRes.messages.length) {
                                return chatRes.messages;
                            }
                            // Also check if content of last message changed (e.g. status)
                            if (prev.length > 0 && chatRes.messages.length > 0) {
                                const lastPrev = prev[prev.length - 1];
                                const lastNew = chatRes.messages[chatRes.messages.length - 1];
                                if (lastPrev.text !== lastNew.text || lastPrev.timestamp !== lastNew.timestamp) {
                                    return chatRes.messages;
                                }
                            }
                            return prev;
                        });
                    }
                }).catch(err => console.error("Polling error:", err));
            }
        }, 2000); // Poll every 2 seconds for smoother experience

        return () => clearInterval(pollInterval);
    }, [token, issue?.id]);


    const initializeHub = async () => {
        try {
            // First validate token and get issue basic details
            const res = await apiClient.getAuthorityIssue(token);
            if (res.valid) {
                setIssue(res.issue);
                // Fetch chat history
                const chatRes = await apiClient.getChatHistory(res.issue.id);
                setMessages(chatRes.messages || []);

                // Decode token to get authority name (client-side decode is fine for display)
                try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const payload = JSON.parse(jsonPayload);
                    if (payload.authority_name) setAuthorityName(payload.authority_name);
                } catch (e) {
                    console.error("Token decode failed", e);
                }
            } else {
                setError("Cryptographic verification failed: Session expired.");
            }
        } catch (err) {
            setError("Network disruption: Unable to sync with secure hub.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert("File size exceeds 10MB limit.");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !selectedFile) || sending) return;
        setSending(true);
        try {
            let mediaUrl = null;
            let mediaType = null;

            if (selectedFile) {
                setIsUploading(true);
                try {
                    const uploadRes = await apiClient.uploadChatMedia(selectedFile);
                    mediaUrl = uploadRes.url;
                    mediaType = uploadRes.type;
                } catch (uploadErr) {
                    alert("Failed to upload media: " + uploadErr.message);
                    setIsUploading(false);
                    setSending(true);
                    return;
                }
                setIsUploading(false);
            }

            await apiClient.sendAuthorityChat(token, issue.id, newMessage, mediaUrl, mediaType);

            const newMsg = {
                sender: 'authority',
                text: newMessage,
                media_url: mediaUrl,
                media_type: mediaType,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, newMsg]);
            setNewMessage('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const requestMedia = (type) => {
        const text = `The authority has requested ${type === 'image' ? 'additional photos' : 'a video clip'} to better verify the situation. Please upload them through your dashboard.`;
        setNewMessage(text);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-16 h-16 border-b-2 border-amber-500 rounded-full mb-8 shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                />
                <h2 className="text-sm font-black tracking-[0.5em] text-amber-500 uppercase animate-pulse">Establishing Secure Uplink</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-zinc-900/50 border border-red-500/20 rounded-[2.5rem] p-10 text-center backdrop-blur-3xl shadow-2xl">
                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Access Forbidden</h2>
                    <p className="text-zinc-500 text-sm mb-8 leading-relaxed">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black text-sm uppercase transition-all"
                    >
                        Try Re-Auth
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#070707] text-white flex flex-col overflow-hidden font-sans">
            {/* --- Premium Header --- */}
            <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-6 md:px-10 z-50">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.4)] border border-white/10">
                        <Shield className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                            Secure Chat Hub
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </h1>
                        <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase flex items-center gap-2">
                            <Wifi className="w-3 h-3 text-amber-500" /> {authorityName} • Encrypted Connection
                        </p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Target Incident</span>
                        <span className="text-sm font-bold text-white tracking-tight">#{issue?.id?.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10 mx-2" />
                    <button
                        onClick={() => window.close()}
                        className="p-3 hover:bg-white/5 rounded-xl transition-all border border-white/5"
                    >
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* --- Left Info Panel (Desktop Only) --- */}
                <aside className="hidden lg:flex w-80 bg-zinc-900/10 border-r border-white/5 flex-col p-8 overflow-y-auto">
                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-8">Intelligence Briefing</h3>

                    <div className="space-y-8">
                        <div>
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Subject Issue</label>
                            <p className="text-lg font-black uppercase tracking-tight text-white leading-tight">{issue?.issue_type}</p>
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Operational Status</label>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-orange-500 uppercase">{issue?.status?.replace('_', ' ')}</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Deployed To</label>
                            <p className="text-xs text-zinc-400 leading-relaxed font-medium">{issue?.address}</p>
                        </div>

                        <div className="pt-8 border-t border-white/5 space-y-4">
                            <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Inquiry Shortcuts</h4>
                            <button
                                onClick={() => requestMedia('image')}
                                className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl border border-white/5 flex items-center gap-3 transition-all text-left group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Request Photos</span>
                            </button>
                            <button
                                onClick={() => requestMedia('video')}
                                className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl border border-white/5 flex items-center gap-3 transition-all text-left group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                    <Video className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Request Video</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto pt-10">
                        <div className="p-5 bg-amber-600/5 border border-amber-500/20 rounded-3xl">
                            <ShieldCheck className="w-8 h-8 text-amber-500 mb-3" />
                            <h5 className="text-[10px] font-black text-white uppercase mb-1">Anonymity Guard</h5>
                            <p className="text-[9px] text-zinc-500 leading-relaxed uppercase tracking-widest">Citizen PII is scrubbed. Displaying only User ID: {issue?.id?.slice(-4)}</p>
                        </div>
                    </div>
                </aside>

                {/* --- Chat Content --- */}
                <section className="flex-1 flex flex-col bg-black/20 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth">
                        <div className="text-center py-6 opacity-20">
                            <Lock className="w-8 h-8 mx-auto mb-3" />
                            <div className="py-1 text-center text-[10px] text-zinc-600 uppercase font-bold tracking-[0.4em]">Secure Encryption Log</div>
                        </div>

                        <AnimatePresence initial={false}>
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${msg.sender === 'authority' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[90%] md:max-w-[75%] group`}>
                                        <div className={`flex items-center gap-2 mb-2 ${msg.sender === 'authority' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${msg.sender === 'authority' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                                                {msg.sender === 'authority' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                            </div>
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                                {msg.sender === 'authority' ? 'Me' : `User_${issue?.id?.slice(-4)}`} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`px-5 py-3.5 rounded-2xl leading-relaxed text-[13px] md:text-sm ${msg.sender === 'authority'
                                            ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-black shadow-[0_10px_30px_rgba(245,158,11,0.2)] rounded-tr-sm font-medium'
                                            : 'bg-zinc-900 border border-white/5 text-zinc-200 rounded-tl-sm shadow-xl'
                                            }`}>
                                            {msg.media_url && (
                                                <div className="mb-3 rounded-xl overflow-hidden border border-white/10 bg-black/50">
                                                    {msg.media_type === 'video' ? (
                                                        <video
                                                            src={msg.media_url.startsWith('http') ? msg.media_url : apiClient.url(msg.media_url)}
                                                            controls
                                                            className="max-w-full rounded-lg"
                                                            style={{ maxHeight: '300px' }}
                                                        />
                                                    ) : (
                                                        <img
                                                            src={msg.media_url.startsWith('http') ? msg.media_url : apiClient.url(msg.media_url)}
                                                            alt="Attachment"
                                                            className="max-w-full h-auto cursor-zoom-in hover:opacity-90 transition-opacity rounded-lg"
                                                            style={{ maxHeight: '300px' }}
                                                            onClick={() => window.open(msg.media_url.startsWith('http') ? msg.media_url : apiClient.url(msg.media_url), '_blank')}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            {msg.text}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>

                    {/* --- Input Area --- */}
                    <div className="p-4 md:p-6 bg-black/40 backdrop-blur-3xl border-t border-white/5">
                        <div className="max-w-4xl mx-auto">
                            {selectedFile && (
                                <div className="mb-3 p-3 bg-zinc-900 border border-amber-500/20 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            {selectedFile.type.startsWith('video/') ? (
                                                <Video className="w-5 h-5" />
                                            ) : (
                                                <ImageIcon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-zinc-300 truncate max-w-[200px]">{selectedFile.name}</p>
                                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                        className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-end gap-2 w-full">
                                <div className="flex-1 relative group w-full">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept="image/*,video/*"
                                        className="hidden"
                                    />

                                    <div className="relative z-10 w-full bg-zinc-900/50 border-2 border-white/5 rounded-[1.5rem] flex items-end shadow-xl transition-all focus-within:border-amber-500/50 pl-2 pr-2 py-1.5 focus-within:bg-zinc-900/80">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={sending || isUploading}
                                            className="w-10 h-10 shrink-0 text-zinc-400 hover:text-amber-400 hover:bg-white/5 rounded-full transition-all disabled:opacity-30 flex items-center justify-center mb-0.5"
                                            title="Attach Media"
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                        </button>

                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                            placeholder={isUploading ? "Uploading Secure Media..." : "Type instructions or inquiries..."}
                                            className="flex-1 bg-transparent py-2.5 px-3 text-[13px] focus:outline-none resize-none min-h-[44px] max-h-32 custom-scrollbar placeholder:text-zinc-600 text-zinc-100 mb-0.5 leading-relaxed"
                                            disabled={isUploading}
                                        />

                                        <button
                                            onClick={handleSendMessage}
                                            disabled={(!newMessage.trim() && !selectedFile) || sending || isUploading}
                                            className="w-10 h-10 shrink-0 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-black rounded-full shadow-lg transition-all flex items-center justify-center mb-0.5 ml-1"
                                        >
                                            {sending || isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 translate-x-0.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="max-w-4xl mx-auto mt-4 px-6 flex items-center justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                            <span className="flex items-center gap-2 italic">
                                <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                Citizen will receive an instant push notification
                            </span>
                            <span>Shift + Enter for new line</span>
                        </div>
                    </div>
                </section>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.3); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245, 158, 11, 0.5); }
            `}</style>
        </div>
    );
}
