import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Shield,
    MapPin,
    MessageSquare,
    Clock,
    CheckCircle,
    AlertCircle,
    Search,
    Filter,
    Maximize2,
    MoreVertical,
    Send,
    User as UserIcon,
    ChevronRight,
    Loader2,
    X,
    RefreshCw,
    LayoutDashboard,
    Navigation,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../services/apiClient';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Marker Component to handle centering
function ChangeView({ center, zoom }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

export default function AuthorityDashboard() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [issues, setIssues] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        if (showChat) {
            scrollToBottom();
        }
    }, [messages, showChat]);

    // Chat Polling Effect
    useEffect(() => {
        let interval;
        if (showChat && selectedIssue) {
            const issueId = selectedIssue._id || selectedIssue.id;
            // Initial fetch
            fetchChatHistory(issueId);
            // Setup interval
            interval = setInterval(() => {
                apiClient.getChatHistory(issueId).then(res => {
                    if (res.messages) {
                        setMessages(prev => {
                            if (prev.length !== res.messages.length) {
                                return res.messages;
                            }
                            return prev;
                        });
                    }
                }).catch(err => console.error("Chat poll error:", err));
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [showChat, selectedIssue]);

    // Stats
    const [stats, setStats] = useState({
        pending: 0,
        in_progress: 0,
        resolved: 0
    });

    useEffect(() => {
        if (!token) {
            // In a real app, we might redirect to a login, 
            // but for this demo/token-based flow, we show an error.
            setError("Secure Access Token required. Please check your official email.");
            setLoading(false);
            return;
        }
        fetchAuthorityDashboard();
    }, [token]);

    const fetchAuthorityDashboard = async () => {
        setLoading(true);
        try {
            // We'll use getAuthorityIssue but we want a LIST. 
            // If the backend doesn't support list yet, we might have to mock it or update backend.
            // For now, let's assume getAuthorityIssue with token can return multiple if the token is an 'Authority Account' token.

            // Let's check what the backend currently returns
            const res = await apiClient.getAuthorityDashboard(token);
            if (res.valid) {
                // If the backend only returns ONE issue (legacy), we wrap it in an array
                // In the future, the backend will return all issues for this authority
                const issueList = res.issues || [res.issue];
                setIssues(issueList);

                // Calculate stats
                const newStats = {
                    pending: issueList.filter(i => i.status === 'pending' || i.status === 'needs_review').length,
                    in_progress: issueList.filter(i => i.status === 'in_progress').length,
                    resolved: issueList.filter(i => i.status === 'resolved' || i.status === 'completed').length,
                };
                setStats(newStats);

                if (issueList.length > 0) {
                    setSelectedIssue(issueList[0]);
                }
            } else {
                setError("Session expired or invalid token.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to coordinate with central servers.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (issueId, newStatus) => {
        try {
            await apiClient.updateAuthorityIssue(token, newStatus, "Status updated via Dashboard");
            setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
            if (selectedIssue?.id === issueId) {
                setSelectedIssue(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            alert("Failed to update status: " + err.message);
        }
    };

    const fetchChatHistory = async (issueId) => {
        try {
            const res = await apiClient.getChatHistory(issueId || (selectedIssue?._id || selectedIssue?.id));
            if (res.messages) setMessages(res.messages);
        } catch (err) {
            console.error("Failed to fetch chat:", err);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedIssue) return;
        setSendingMessage(true);
        try {
            const issueId = selectedIssue._id || selectedIssue.id;
            await apiClient.sendAuthorityChat(token, issueId, newMessage);

            const msg = {
                id: Date.now(),
                sender: 'authority',
                text: newMessage,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, msg]);
            setNewMessage('');
        } catch (err) {
            alert("Failed to send message: " + err.message);
        } finally {
            setSendingMessage(false);
        }
    };

    const filteredIssues = issues.filter(i => {
        const matchesSearch = (i.issue_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (i.address || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || i.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                />
                <h2 className="text-xl font-bold tracking-widest uppercase opacity-80 animate-pulse">Syncing Secure Intel...</h2>
                <p className="text-blue-500/60 text-xs mt-2 font-mono">ENCRYPTED NODE HANDSHAKE IN PROGRESS</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-zinc-900 border border-red-500/20 rounded-3xl p-8 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 underline decoration-red-500/30">Access Denied</h2>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold transition-all border border-white/5"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#070707] text-white flex overflow-hidden font-sans">

            {/* --- Sidebar (Tasks List) --- */}
            <div className="w-full max-w-sm md:max-w-md border-r border-white/5 bg-zinc-900/10 flex flex-col relative z-20">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight uppercase">Control Center</h1>
                            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Official Authority ID: {token?.slice(-8) || 'Unknown'}</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search Intelligence..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Stats Filter Row */}
                <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${filterStatus === 'all' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500'}`}
                    >
                        All {issues.length}
                    </button>
                    <button
                        onClick={() => setFilterStatus('pending')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${filterStatus === 'pending' ? 'bg-orange-500 text-white' : 'bg-orange-500/10 text-orange-400'}`}
                    >
                        Pending {stats.pending}
                    </button>
                    <button
                        onClick={() => setFilterStatus('resolved')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${filterStatus === 'resolved' ? 'bg-green-600 text-white' : 'bg-green-600/10 text-green-400'}`}
                    >
                        Solved {stats.resolved}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {filteredIssues.map((issue) => (
                        <motion.div
                            key={issue.id}
                            onClick={() => {
                                setSelectedIssue(issue);
                                if (showChat) fetchChatHistory(issue.id);
                            }}
                            whileHover={{ x: 4 }}
                            className={`p-4 rounded-3xl border transition-all cursor-pointer group ${selectedIssue?.id === issue.id ? 'bg-zinc-800 border-blue-500/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]' : 'bg-zinc-900/30 border-white/5 hover:border-white/10'}`}
                        >
                            <div className="flex justify-between items-start mb-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                                <span>#{issue.id?.slice(-6) || 'N/A'}</span>
                                <span className={issue.status === 'resolved' ? 'text-green-500' : 'text-orange-500'}>{issue.status?.replace('_', ' ')}</span>
                            </div>
                            <h3 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors uppercase truncate">{issue.issue_type}</h3>
                            <p className="text-zinc-500 text-xs line-clamp-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {issue.address}
                            </p>

                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-black flex items-center justify-center text-[10px] font-bold text-blue-400">
                                        U
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {issue.status === 'pending' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
                                    <ChevronRight className={`w-4 h-4 text-zinc-700 transition-transform ${selectedIssue?.id === issue.id ? 'rotate-90 text-blue-500' : ''}`} />
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {filteredIssues.length === 0 && (
                        <div className="py-20 text-center opacity-30">
                            <Search className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">No Intelligence Found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Main Content (Map & Details) --- */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-black">

                {/* Interactive Map Background */}
                <div className="absolute inset-0 z-0">
                    {selectedIssue && (
                        <MapContainer
                            center={[selectedIssue.latitude || 20.5937, selectedIssue.longitude || 78.9629]}
                            zoom={15}
                            style={{ height: '100%', width: '100%', filter: 'invert(100%) hue-rotate(180deg) brightness(0.4) contrast(1.2)' }}
                            zoomControl={false}
                        >
                            <ChangeView center={[selectedIssue.latitude || 20.5937, selectedIssue.longitude || 78.9629]} zoom={15} />
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[selectedIssue.latitude || 20.5937, selectedIssue.longitude || 78.9629]}>
                                <Popup>
                                    <div className="text-black font-bold uppercase text-xs">{selectedIssue.issue_type}</div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 pointer-events-none" />
                </div>

                {/* Selected Issue Info Overlay */}
                <AnimatePresence mode='wait'>
                    {selectedIssue && (
                        <motion.div
                            key={selectedIssue.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative z-10 flex-1 flex flex-col p-6 md:p-10 pointer-events-none"
                        >
                            <div className="mt-auto flex flex-col lg:flex-row gap-8 items-end w-full max-w-6xl mx-auto pointer-events-auto">
                                {/* Detail Card */}
                                <div className="flex-1 w-full bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-[10px] rounded-full tracking-widest uppercase">Target Objective</span>
                                                <span className="text-zinc-500 font-mono text-[10px]">VERIFIED AS {selectedIssue.severity || 'MAJOR'}</span>
                                            </div>
                                            <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">{selectedIssue.issue_type}</h2>
                                            <p className="text-zinc-400 flex items-center gap-2 text-sm">
                                                <MapPin className="w-4 h-4 text-blue-500" /> {selectedIssue.address}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setShowChat(true); fetchChatHistory(selectedIssue.id); }}
                                                className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl border border-white/5 transition-all text-white relative"
                                            >
                                                <MessageSquare className="w-6 h-6" />
                                                <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 border-2 border-zinc-800 rounded-full" />
                                            </button>
                                            <button className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl border border-white/5 transition-all text-white">
                                                <Maximize2 className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8 mb-10">
                                        <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Field Report</h4>
                                            <p className="text-zinc-300 text-sm leading-relaxed">{selectedIssue.description || "No manual evidence reported. Visual AI has confirmed the structural damage."}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-zinc-500" />
                                                    <span className="text-xs text-zinc-300">Reporting Time</span>
                                                </div>
                                                <span className="text-xs font-bold">{issue.timestamp_formatted || '2 hours ago'}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <UserIcon className="w-4 h-4 text-zinc-500" />
                                                    <span className="text-xs text-zinc-300">Identity Guard</span>
                                                </div>
                                                <span className="text-sm font-black text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">USER_{selectedIssue.id?.slice(-4) || 'ABCD'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Controls */}
                                    <div className="pt-8 border-t border-white/10 flex flex-wrap gap-4">
                                        <button
                                            onClick={() => handleStatusUpdate(selectedIssue.id, 'in_progress')}
                                            disabled={selectedIssue.status === 'in_progress'}
                                            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${selectedIssue.status === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                                        >
                                            Initialize Deployment
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(selectedIssue.id, 'resolved')}
                                            disabled={selectedIssue.status === 'resolved'}
                                            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${selectedIssue.status === 'resolved' ? 'bg-green-600 text-white' : 'bg-transparent border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white'}`}
                                        >
                                            Confirm Clearance
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(selectedIssue.id, 'rejected')}
                                            disabled={selectedIssue.status === 'rejected'}
                                            className="px-8 py-4 bg-transparent border-2 border-red-600/30 text-red-600/60 hover:bg-red-600 hover:text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                                        >
                                            Abort Task
                                        </button>
                                    </div>
                                </div>

                                {/* Visual Evidence Card - Small */}
                                {selectedIssue.image_id && (
                                    <div className="w-full lg:w-72 aspect-square lg:aspect-auto lg:h-[400px] bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative group">
                                        <img
                                            src={`${apiClient.baseURL}/api/issues/image/${selectedIssue.image_id}`}
                                            alt="Intel"
                                            className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-in-out cursor-zoom-in"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none" />
                                        <div className="absolute bottom-6 left-6 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Live Evidence</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- Overlay Chat Sidebar --- */}
            <AnimatePresence>
                {showChat && selectedIssue && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-sm md:max-w-md bg-zinc-900 border-l border-white/10 z-[100] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-800/50">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-blue-500" />
                                <h3 className="font-black text-sm uppercase tracking-widest">Operations Chat</h3>
                            </div>
                            <button
                                onClick={() => setShowChat(false)}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 bg-zinc-800/30 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-black text-blue-500">U</div>
                                <div>
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">User #{selectedIssue.id?.slice(-4)}</h4>
                                    <p className="text-[10px] text-zinc-500">Citizen Identity Anonymized</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === 'authority' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.sender === 'authority' ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' : 'bg-zinc-800 text-zinc-300 rounded-tl-none border border-white/5'}`}>
                                        {msg.media_url && (
                                            <div className="mb-2 rounded-lg overflow-hidden border border-white/10 bg-black/50">
                                                {msg.media_type === 'video' ? (
                                                    <video
                                                        src={msg.media_url.startsWith('http') ? msg.media_url : apiClient.url(msg.media_url)}
                                                        controls
                                                        className="max-w-full"
                                                        style={{ maxHeight: '200px' }}
                                                    />
                                                ) : (
                                                    <img
                                                        src={msg.media_url.startsWith('http') ? msg.media_url : apiClient.url(msg.media_url)}
                                                        alt="Attachment"
                                                        className="max-w-full h-auto cursor-zoom-in hover:opacity-90 transition-opacity"
                                                        style={{ maxHeight: '200px' }}
                                                        onClick={() => window.open(msg.media_url.startsWith('http') ? msg.media_url : apiClient.url(msg.media_url), '_blank')}
                                                    />
                                                )}
                                            </div>
                                        )}
                                        {msg.text}
                                        <div className="mt-1 text-[9px] opacity-40 uppercase font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                            ))}
                            <div className="py-2 text-center text-[10px] text-zinc-600 uppercase font-bold tracking-[0.2em]">End of Transmission</div>
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-6 bg-zinc-900 border-t border-white/10">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Send Instructions..."
                                    className="w-full bg-zinc-800 border-2 border-white/5 rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={sendingMessage || !newMessage.trim()}
                                    className="absolute right-3 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-30"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-[9px] text-center text-zinc-600 mt-4 uppercase tracking-widest">Satellite Link Protocol 4.2 Enabled</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}
