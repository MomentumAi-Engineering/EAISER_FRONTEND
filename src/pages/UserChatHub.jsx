import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    Send,
    Shield,
    Image as ImageIcon,
    Video,
    Loader2,
    ArrowLeft,
    Lock,
    User,
    Search,
    MapPin,
    Clock,
    CheckCircle,
    Paperclip,
    X,
    Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';

export default function UserChatHub() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetIssueId = searchParams.get('issueId');

    const [loading, setLoading] = useState(true);
    const [issues, setIssues] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    // Check auth & fetch user issues
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchUserIssues();
    }, []);

    // Chat Polling Effect
    useEffect(() => {
        let interval;
        if (selectedIssue) {
            const issueId = selectedIssue._id || selectedIssue.id;
            // Initial fetch
            fetchChatHistory(issueId);
            // Setup interval
            interval = setInterval(() => {
                apiClient.getChatHistory(issueId).then(chatRes => {
                    if (chatRes.messages) {
                        setMessages(prev => {
                            if (chatRes.messages.length > prev.length) {
                                return chatRes.messages;
                            }
                            // Also check if content of last message changed (as a fallback)
                            if (prev.length > 0 && chatRes.messages.length > 0 && chatRes.messages.length === prev.length) {
                                const lastPrev = prev[prev.length - 1];
                                const lastNew = chatRes.messages[chatRes.messages.length - 1];
                                if (lastPrev.text !== lastNew.text && lastNew.sender !== 'user') {
                                    return chatRes.messages;
                                }
                            }
                            return prev;
                        });
                    }
                }).catch(err => console.error("Polling error:", err));
            }, 2000); // 2 second polling for better real-time feel
        }
        return () => clearInterval(interval);
    }, [selectedIssue]);

    const fetchUserIssues = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getMyIssues();
            setIssues(res || []);

            if (res && res.length > 0) {
                // If we have a target issue ID from params, select it
                if (targetIssueId) {
                    const found = res.find(i => (i._id || i.id) === targetIssueId);
                    if (found) {
                        setSelectedIssue(found);
                    } else {
                        setSelectedIssue(res[0]);
                    }
                } else {
                    setSelectedIssue(res[0]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch issues:", err);
            toast.error("Failed to load your reports.");
        } finally {
            setLoading(false);
        }
    };

    const fetchChatHistory = async (issueId) => {
        try {
            const res = await apiClient.getChatHistory(issueId);
            if (res.messages) setMessages(res.messages);
        } catch (err) {
            console.error("Failed to fetch chat:", err);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size exceeds 10MB limit.");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !selectedFile) || !selectedIssue || sending) return;
        setSending(true);
        try {
            const issueId = selectedIssue._id || selectedIssue.id;
            let mediaUrl = null;
            let mediaType = null;

            if (selectedFile) {
                setIsUploading(true);
                try {
                    const uploadRes = await apiClient.uploadChatMedia(selectedFile);
                    mediaUrl = uploadRes.url;
                    mediaType = uploadRes.type;
                } catch (uploadErr) {
                    toast.error("Media upload failed.");
                    setIsUploading(false);
                    setSending(false);
                    return;
                }
                setIsUploading(false);
            }

            await apiClient.sendUserChat(issueId, newMessage, mediaUrl, mediaType);

            const newMsg = {
                sender: 'user',
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
            toast.error("Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    const filteredIssues = issues.filter(iss =>
        (iss.issue_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (iss.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (iss.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-screen bg-[#050505] flex flex-col items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-16 h-16 border-b-2 border-yellow-500 rounded-full mb-8 shadow-[0_0_40px_rgba(234,179,8,0.2)]"
                />
                <h2 className="text-sm font-black tracking-[0.5em] text-yellow-500 uppercase animate-pulse">Syncing Secure Messages</h2>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#020617] text-white flex flex-col overflow-hidden font-sans">
            {/* --- Technical Grid Background --- */}
            <div className="fixed inset-0 pointer-events-none opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
            </div>

            {/* --- Premium Header --- */}
            <header className="h-20 border-b border-cyan-500/10 bg-slate-950/60 backdrop-blur-3xl flex items-center justify-between px-6 md:px-10 z-50">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-10 h-10 hover:bg-cyan-500/10 rounded-xl flex items-center justify-center border border-white/5 transition-all md:hidden"
                    >
                        <ArrowLeft className="w-5 h-5 text-cyan-400" />
                    </button>
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] border border-cyan-400/30">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <span className="text-zinc-100 uppercase tracking-tighter text-base md:text-xl">Authority</span>
                            <span className="text-cyan-400 font-mono tracking-[0.2em] font-light text-base md:text-xl">LINE</span>
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
                        </h1>
                        <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase flex items-center gap-2">
                            <Wifi size={10} className="text-cyan-500/50" />
                            Multi-Layer Handshake Verified
                        </p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-6">
                    <div className="flex flex-col items-end border-r border-white/10 pr-6">
                        <span className="text-[9px] font-black text-cyan-500/50 uppercase tracking-[0.2em]">Transmission Status</span>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                            <span className="text-xs font-black text-zinc-100 uppercase tracking-widest">Active Relay</span>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:border-cyan-500/30 hover:text-cyan-400"
                    >
                        Terminal Overview
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative z-10">
                {/* --- Left Issues Sidebar --- */}
                <aside className="hidden md:flex w-[22rem] bg-slate-950/40 border-r border-white/5 flex-col overflow-hidden backdrop-blur-md">
                    <div className="p-5 border-b border-white/5">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-cyan-500/5 blur-lg group-focus-within:bg-cyan-500/10 transition-all rounded-full" />
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-500/50">
                                    <Search size={14} />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="SEARCH INTEL CORE..."
                                    className="w-full bg-black/60 border border-white/5 rounded-full py-3 pl-11 pr-4 text-[10px] font-black tracking-widest focus:outline-none focus:border-cyan-500/30 transition-all placeholder:text-zinc-700 text-cyan-400 focus:bg-black/80 shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                        <div className="flex items-center justify-between px-2 mb-4">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest text-xs">Available Logs</p>
                            <span className="text-[8px] font-mono text-cyan-500/40">{filteredIssues.length} DETECTED</span>
                        </div>
                        {filteredIssues.map((iss) => (
                            <motion.div
                                key={iss._id || iss.id}
                                onClick={() => setSelectedIssue(iss)}
                                whileHover={{ x: 8 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-5 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${(selectedIssue?._id === (iss._id || iss.id) || selectedIssue?.id === (iss._id || iss.id))
                                    ? 'bg-gradient-to-br from-slate-900 to-zinc-950 border-cyan-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.6)]'
                                    : 'bg-transparent border-white/5 hover:border-white/10'
                                    }`}
                            >
                                {(selectedIssue?._id === (iss._id || iss.id) || selectedIssue?.id === (iss._id || iss.id)) && (
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-all" />
                                )}
                                <div className="flex justify-between items-center mb-3 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${iss.status === 'resolved' ? 'bg-green-500' : 'bg-amber-500'} shadow-[0_0_8px_currentColor]`} />
                                        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">LG-{iss.id?.slice(-5).toUpperCase() || 'UNA-01'}</span>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${iss.status === 'resolved' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-amber-500 border-amber-500/20 bg-amber-500/5'
                                        }`}>{iss.status}</div>
                                </div>
                                <h4 className={`text-xs font-black uppercase tracking-tight transition-colors mb-1.5 ${(selectedIssue?._id === (iss._id || iss.id) || selectedIssue?.id === (iss._id || iss.id)) ? 'text-cyan-400' : 'text-zinc-300 group-hover:text-white'
                                    }`}>{iss.issue_type}</h4>
                                <div className="flex items-center gap-2.5 mt-4 opacity-40 relative z-10">
                                    <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center">
                                        <MapPin size={10} className="text-zinc-400" />
                                    </div>
                                    <p className="text-[9px] font-bold text-zinc-400 truncate tracking-tight uppercase">{iss.address || 'Geo-Location Undefined'}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </aside>

                {/* --- Chat Content --- */}
                <section className="flex-1 flex flex-col bg-slate-950/20 overflow-hidden relative">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

                    {selectedIssue ? (
                        <>
                            {/* --- Message List --- */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar scroll-smooth relative z-10">
                                <div className="flex flex-col items-center py-6">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4 shadow-xl">
                                        <Lock className="w-5 h-5 text-cyan-500" />
                                    </div>
                                    <div className="px-6 py-2 rounded-full border border-cyan-500/10 bg-cyan-500/5 text-[10px] text-cyan-400 font-black tracking-[0.4em] uppercase shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                                        P2P Encrypted Handshake Established
                                    </div>
                                    <p className="mt-4 text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-bold">
                                        Mission Log Reference: <span className="text-zinc-400">#{selectedIssue.id || selectedIssue._id}</span>
                                    </p>
                                </div>

                                <AnimatePresence initial={false}>
                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className="max-w-[90%] md:max-w-[75%] relative group">
                                                <div className={`px-5 py-3.5 rounded-2xl shadow-xl relative overflow-hidden border ${msg.sender === 'user'
                                                    ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white font-medium rounded-tr-sm border-cyan-400/30'
                                                    : 'bg-zinc-900/80 backdrop-blur-2xl text-zinc-200 rounded-tl-sm border-white/10'
                                                    }`}>

                                                    {/* Internal Glow Effects */}
                                                    {msg.sender === 'user' ? (
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                                                    ) : (
                                                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full -ml-16 -mb-16 blur-3xl pointer-events-none" />
                                                    )}

                                                    {msg.media_url && (
                                                        <div className="mb-5 rounded-3xl overflow-hidden border border-black/20 shadow-2xl group-hover:scale-[1.02] transition-transform duration-500">
                                                            {msg.media_type === 'video' ? (
                                                                <video
                                                                    src={msg.media_url.startsWith('http') ? msg.media_url : apiClient.url(msg.media_url)}
                                                                    controls
                                                                    className="max-w-full h-auto aspect-video object-cover"
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={msg.media_url.startsWith('http') ? msg.media_url : apiClient.url(msg.media_url)}
                                                                    alt="Secure Evidence"
                                                                    className="max-w-full h-auto cursor-zoom-in hover:brightness-110 transition-all duration-300"
                                                                    onClick={() => window.open(msg.media_url.startsWith('http') ? msg.media_url : apiClient.url(msg.media_url), '_blank')}
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    <p className="text-[13px] md:text-sm leading-relaxed tracking-normal font-sans">
                                                        {msg.sender !== 'user' && <span className="block text-[8px] font-black tracking-widest text-cyan-500/60 uppercase mb-1.5 opacity-80">OFFICIAL RESPONSE</span>}
                                                        {msg.text}
                                                    </p>

                                                    <div className={`mt-2 flex items-center gap-1.5 text-[8px] uppercase font-mono font-bold tracking-wider ${msg.sender === 'user' ? 'text-white/60' : 'text-zinc-500'}`}>
                                                        <Clock size={10} className={msg.sender === 'user' ? 'text-white/40' : 'text-cyan-500/40'} />
                                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'JUST NOW'}
                                                        <span className="mx-1.5 opacity-30">|</span>
                                                        <span className="opacity-90">{msg.sender === 'user' ? 'SENT' : 'RECEIVED'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>

                            {/* --- Input Area --- */}
                            <div className="p-3 bg-slate-950/80 backdrop-blur-3xl border-t border-white/5 relative z-20">
                                <div className="max-w-4xl mx-auto">
                                    <AnimatePresence>
                                        {selectedFile && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="mb-3 p-2 bg-zinc-900/80 border border-cyan-500/20 rounded-xl flex items-center justify-between backdrop-blur-xl"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/10 shadow-lg shadow-cyan-500/10">
                                                        {selectedFile.type.startsWith('video/') ? <Video size={16} /> : <ImageIcon size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-zinc-100 truncate max-w-[200px]">{selectedFile.name}</p>
                                                        <p className="text-[9px] text-zinc-500 uppercase font-bold">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setSelectedFile(null)} className="w-6 h-6 hover:bg-red-500/10 rounded-full text-zinc-500 hover:text-red-400 transition-all flex items-center justify-center"><X size={14} /></button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex items-end gap-2 w-full">
                                        <div className="flex-1 relative group w-full">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-10 transition-opacity duration-500" />

                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                accept="image/*,video/*"
                                                className="hidden"
                                            />

                                            <div className="relative z-10 w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-[1.5rem] flex items-end shadow-xl transition-all focus-within:border-cyan-500/30 pl-2 pr-2 py-1.5">

                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={sending || isUploading}
                                                    className="w-10 h-10 shrink-0 text-zinc-400 hover:text-cyan-400 hover:bg-white/5 rounded-full transition-all disabled:opacity-30 flex items-center justify-center mb-0.5"
                                                    title="Attach Media"
                                                >
                                                    <Paperclip className="w-5 h-5" />
                                                </button>

                                                <textarea
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                                    placeholder={isUploading ? "BYPASSING FIREWALL..." : "TYPE SECURE TRANSMISSION..."}
                                                    className="flex-1 bg-transparent py-2.5 px-3 text-[13px] focus:outline-none resize-none min-h-[44px] max-h-32 custom-scrollbar placeholder:text-zinc-600 text-zinc-100 mb-0.5 leading-relaxed"
                                                    disabled={isUploading}
                                                    autoFocus
                                                />

                                                <button
                                                    onClick={handleSendMessage}
                                                    disabled={(!newMessage.trim() && !selectedFile) || sending || isUploading}
                                                    className="w-10 h-10 shrink-0 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-black rounded-full shadow-lg transition-all flex items-center justify-center mb-0.5 ml-1"
                                                >
                                                    {sending || isUploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="translate-x-0.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-6 text-[9px] font-black text-zinc-600 mt-3 uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_#06b6d4]" />
                                            <span>BUREAU STANDARD ENCRYPTION</span>
                                        </div>
                                        <div className="hidden md:flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                                            <span>INTERNAL RELAY 08-X</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", damping: 15 }}
                                className="relative mb-12"
                            >
                                <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-[80px] animate-pulse" />
                                <div className="relative w-48 h-48 bg-slate-900 border border-cyan-500/10 rounded-[3rem] flex items-center justify-center shadow-3xl overflow-hidden group">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)]" />
                                    <MessageSquare className="w-20 h-20 text-cyan-500 relative z-10 group-hover:scale-110 transition-transform duration-700" />
                                </div>
                            </motion.div>
                            <h2 className="text-2xl font-black uppercase tracking-[0.4em] mb-4 text-zinc-100">Sync Required</h2>
                            <p className="text-[10px] text-cyan-500/40 uppercase tracking-[0.3em] max-w-sm leading-loose font-black px-12">
                                PLEASE SELECT AN ACTIVE MISSION LOG FROM THE TERMINAL SIDEBAR TO INITIATE SECURE COMMUNICATION.
                            </p>

                            {/* Decorative Lines */}
                            <div className="mt-12 flex items-center gap-4">
                                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-cyan-500/20" />
                                <div className="w-2 h-2 rounded-full border border-cyan-500/20" />
                                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-cyan-500/20" />
                            </div>
                        </div>
                    )}
                </section>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.4); }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            `}</style>
        </div>
    );
}
