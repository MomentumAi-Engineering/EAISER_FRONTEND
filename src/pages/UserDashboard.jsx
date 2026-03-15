import React, { useState, useEffect, memo, useRef } from 'react';
import { Activity, CheckCircle, Clock, AlertCircle, TrendingUp, BarChart3, Filter, Calendar, Download, RefreshCw, Bell, Search, Home, X, ArrowRight, MessageSquare, Send, Shield, Paperclip, Image, Video, File as FileIcon, AlertTriangle, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import apiClient from '../services/apiClient';
import API_BASE_URL from '../config';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

// Memoized StatCard moved outside to prevent re-creation
const StatCard = memo(({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: delay }}
    className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-yellow-500/10 p-2.5 sm:p-4 cursor-pointer group will-change-transform"
  >
    <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors pointer-events-none"></div>

    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3">
      <div className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg ${color}`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
      </div>

      <div className="text-center sm:text-left">
        <p className="text-gray-400 text-[8px] sm:text-[10px] md:text-xs font-medium uppercase tracking-wider leading-tight">{label}</p>
        <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </motion.div>
));

export default function UserDashboard() {
  const [stats, setStats] = useState(() => {
    const cached = localStorage.getItem('dashboard_stats');
    return cached ? JSON.parse(cached) : { totalReported: 0, resolved: 0, pending: 0, activeRate: 0 };
  });

  const [filter, setFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [notifications, setNotifications] = useState(0);
  // Only show full page loader if we have NO data
  const [loading, setLoading] = useState(() => !localStorage.getItem('dashboard_issues'));
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [issues, setIssues] = useState(() => {
    const cached = localStorage.getItem('dashboard_issues');
    return cached ? JSON.parse(cached) : [];
  });

  const [notificationList, setNotificationList] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [emailVerified, setEmailVerified] = useState(true);

  // Check verification status
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const data = await apiClient.getMe();
        setEmailVerified(data.email_verified !== false);
      } catch (e) { /* ignore */ }
    };
    checkVerification();
  }, []);

  // Chat State

  // Check and update stats when issues change
  useEffect(() => {
    if (issues.length > 0) {
      const resolved = issues.filter(i =>
        ['resolved', 'completed', 'accepted', 'submitted', 'approved', 'dispatched'].includes(i.status?.toLowerCase())
      ).length;
      const pending = issues.filter(i =>
        ['needs_review', 'under_review', 'pending'].includes(i.status?.toLowerCase())
      ).length;
      const total = issues.length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      setStats({ totalReported: total, resolved, pending, activeRate: rate });
    }
  }, [issues]);

  const handleStatusUpdate = async (status) => {
    if (!selectedIssue) return;
    const issueId = selectedIssue._id || selectedIssue.id;

    try {
      await apiClient.updateUserStatusFeedback(issueId, status);

      if (status === 'resolved') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#ffffff']
        });
        toast.success("Issue marked as resolved! Thank you for your feedback.");
      } else {
        toast.success("Authority notified that the issue is still persistent.");
      }

      // Update local state
      setIssues(prev => prev.map(i =>
        (i._id === issueId || i.id === issueId) ? { ...i, user_feedback_status: status } : i
      ));

      // Close modal or update stats if needed
      setTimeout(() => setSelectedIssue(null), 2000);

      // Refresh issues in background
      fetchIssues();
    } catch (err) {
      toast.error("Failed to update status: " + err.message);
    }
  };


  const zipCodes = React.useMemo(() => {
    const zips = new Set();
    issues.forEach(i => {
      const zip = i.zip_code || i.location?.zip_code;
      if (zip) zips.add(zip);
    });
    return ['All Locations', ...Array.from(zips).sort()];
  }, [issues]);

  const previousIssuesRef = React.useRef(issues);
  const navigate = useNavigate();

  // ... (Sound and TimeAgo functions remain the same) ...
  // Simple notification sound
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
    } catch (e) {
      console.warn("Audio Context blocked or failed", e);
    }
  };

  // Time ago helper
  const timeAgo = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const seconds = Math.floor((new Date() - date) / 1000);
      if (seconds < 30) return 'Just now';
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + "y ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + "mo ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + "d ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + "h ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + "m ago";
      return Math.floor(seconds) + "s ago";
    } catch (e) { return dateStr; }
  };

  const formatIssueType = (type) => {
    if (!type || String(type).toLowerCase() === 'manual report') return type || 'Civic Issue';
    return String(type)
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };


  const fetchIssues = async (isBackground = false) => {
    // Only show full loader if we have NO data (cached or otherwise)
    if (!isBackground && issues.length === 0) setLoading(true);

    // Always show refreshing indicator for transparency
    setIsRefreshing(true);

    if (!isBackground) setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const data = await apiClient.getMyIssues();

      if (Array.isArray(data)) {
        // Notification Logic
        if (previousIssuesRef.current.length > 0) {
          data.forEach(newIssue => {
            const oldIssue = previousIssuesRef.current.find(i => (i._id || i.id) === (newIssue._id || newIssue.id));
            if (oldIssue && oldIssue.status?.toLowerCase() !== newIssue.status?.toLowerCase()) {
              playNotificationSound();
              const note = {
                id: Date.now() + Math.random(),
                text: `Update: ${newIssue.issue_type || 'Issue'} is now ${newIssue.status}`,
                time: 'Just now',
                read: false
              };
              setNotificationList(prev => [note, ...prev]);
              setNotifications(prev => prev + 1);
            }
          });
        }

        // Filter out failed reports
        const validData = data.filter(i => !['failed', 'error', 'rejected_invalid'].includes(i.status?.toLowerCase()));

        previousIssuesRef.current = validData;
        setIssues(validData);

        // Cache Statistics & Data for Instant Load next time
        // Resolved: Dispatched to authority or completed
        const resolved = validData.filter(i =>
          ['resolved', 'completed', 'accepted', 'submitted', 'approved', 'dispatched'].includes(i.status?.toLowerCase())
        ).length;

        // Pending: Only those waiting for manual admin review
        const pending = validData.filter(i =>
          ['needs_review', 'under_review', 'pending'].includes(i.status?.toLowerCase())
        ).length;

        const total = validData.length;
        const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        const newStats = { totalReported: total, resolved, pending, activeRate: rate };
        setStats(newStats);

        // Update LocalStorage Cache
        localStorage.setItem('dashboard_issues', JSON.stringify(data));
        localStorage.setItem('dashboard_stats', JSON.stringify(newStats));

        setError(null);
      }
    } catch (err) {
      console.error(err);
      if (err.status === 401) { navigate('/login'); return; }
      if (!isBackground && issues.length === 0) setError(`Failed to load reports.`);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    // If we have cached data, do a background fetch (silent update)
    // If no cache, do a full foreground fetch
    const hasCache = issues.length > 0;
    fetchIssues(hasCache);

    const interval = setInterval(() => fetchIssues(true), 60000); // 60s is plenty
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black relative font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-20 sm:pt-24 pb-8 sm:pb-12 relative z-10">
        {/* Unverified User Banner */}
        <AnimatePresence>
          {!emailVerified && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-red-500/[0.08] to-orange-500/[0.06] border border-red-500/20 backdrop-blur-sm"
                style={{ boxShadow: '0 0 20px rgba(239,68,68,0.06)' }}
              >
                <div className="p-2 bg-red-500/10 rounded-xl flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-300">Unverified Account</p>
                  <p className="text-xs text-red-400/60 mt-0.5">Please verify your email to unlock full features.</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await apiClient.resendVerification();
                      toast.success('Verification email sent! Please check your inbox.');
                    } catch (e) {
                      toast.error(e.message || 'Failed to resend verification email.');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold text-red-300 transition-all whitespace-nowrap w-full sm:w-auto justify-center sm:justify-start"
                >
                  <Mail className="w-3.5 h-3.5" /> Resend email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                Impact <span className="text-yellow-400">Hub</span>
              </h1>
              <p className="text-gray-500 mt-0.5 sm:mt-1 text-xs sm:text-sm">Tracking your community contributions</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 relative">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 bg-zinc-900 rounded-lg text-yellow-400 hover:bg-zinc-800 transition-all border border-yellow-500/20 relative"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">
                      {notifications}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-zinc-900 border border-yellow-500/20 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">Notifications</h3>
                          <button onClick={() => { setNotifications(0); setNotificationList([]); }} className="text-[10px] text-gray-500 hover:text-white ml-2">Clear all</button>
                        </div>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {notificationList.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-xs">No new alerts</div>
                        ) : (
                          notificationList.map((note) => (
                            <div key={note.id} className="p-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors">
                              <p className="text-xs text-gray-300">{note.text}</p>
                              <span className="text-[10px] text-gray-600 mt-1 block">{note.time}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={() => fetchIssues(false)} className="p-2 bg-zinc-900 rounded-lg text-yellow-400 hover:bg-zinc-800 transition-all border border-yellow-500/20">
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => navigate('/report')} className="px-3 sm:px-5 py-2 sm:py-2.5 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm shadow-lg shadow-yellow-500/10">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">New</span> Report
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">Syncing satellite data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white font-bold">{error}</p>
            <button onClick={() => fetchIssues(false)} className="mt-4 px-6 py-2 bg-zinc-900 rounded-xl text-white">Retry Connection</button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <StatCard icon={Activity} label="Total Reports" value={stats.totalReported} color="bg-blue-500/10" delay={0.1} />
                <StatCard icon={Clock} label="Under Review" value={stats.pending} color="bg-orange-500/10" delay={0.2} />
                <StatCard icon={CheckCircle} label="Routed" value={stats.resolved} color="bg-green-500/10" delay={0.3} />
              </div>

              <div className="bg-zinc-900/40 p-3 sm:p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" /> Recent Issues
                  </h2>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 scrollbar-hide">
                    {zipCodes.length > 1 && (
                      <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="bg-zinc-800 border border-white/5 text-gray-400 text-xs rounded-lg px-2 py-1.5 outline-none hover:text-white hover:border-white/10 transition-colors cursor-pointer mr-1 sm:mr-2 flex-shrink-0"
                      >
                        {zipCodes.map(zip => (
                          <option key={zip} value={zip}>{zip}</option>
                        ))}
                      </select>
                    )}

                    {['all', 'in review', 'routed'].map((t) => (
                      <button key={t} onClick={() => setFilter(t)} className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs transition-all capitalize font-bold flex-shrink-0 ${filter === t ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/10' : 'bg-zinc-800 text-gray-500 hover:text-white'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {issues.length === 0 ? (
                    <div className="text-gray-600 text-center py-12 text-sm italic">Satellite link ready. Waiting for first report...</div>
                  ) : (
                    issues
                      .filter(i => {
                        let statusMatch = true;
                        if (filter !== 'all') {
                          const s = i.status?.toLowerCase();
                          const isResolved = ['resolved', 'completed', 'accepted', 'submitted', 'approved', 'dispatched'].includes(s);
                          const isPending = ['needs_review', 'under_review', 'pending'].includes(s);
                          statusMatch = filter === 'routed' ? isResolved : isPending;
                        }

                        let locationMatch = true;
                        if (locationFilter !== 'All Locations') {
                          const zip = i.zip_code || i.location?.zip_code;
                          locationMatch = zip === locationFilter;
                        }

                        return statusMatch && locationMatch;
                      })
                      .map((issue, idx) => (
                        <motion.div
                          key={issue._id || idx}
                          onClick={() => setSelectedIssue(issue)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx < 10 ? idx * 0.05 : 0 }}
                          className="bg-zinc-800/30 border border-white/5 rounded-xl p-3 sm:p-4 hover:border-yellow-500/40 transition-all cursor-pointer group will-change-transform"
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            {/* Thumbnail preview */}
                            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-zinc-900 overflow-hidden border border-white/5 flex-shrink-0 group-hover:border-yellow-500/30 transition-all">
                              <img
                                src={issue.image_url ? (issue.image_url.startsWith('http') ? issue.image_url : apiClient.url(issue.image_url)) : `https://placehold.co/100x100/18181b/FFD700?text=${issue.issue_type?.[0] || 'E'}`}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                onError={(e) => { e.target.src = 'https://placehold.co/100x100/18181b/444/white?text=EA'; }}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-white font-bold text-xs sm:text-sm tracking-wide group-hover:text-yellow-400 transition-colors uppercase truncate">
                                    {formatIssueType(issue.issue_type)}
                                  </h3>
                                  <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">{issue.address || 'Location analyzing...'}</p>
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-2 sm:mt-3">
                                    <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase ${['resolved', 'completed', 'accepted', 'submitted', 'approved', 'dispatched'].includes(issue.status?.toLowerCase()) ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                      {issue.status}
                                    </span>
                                    {issue.severity && (
                                      <span className={`flex items-center gap-1 text-[8px] sm:text-[9px] font-black tracking-wider sm:tracking-widest uppercase ${(() => {
                                        const sev = String(issue.severity).toLowerCase();
                                        if (sev === 'critical') return 'text-red-500';
                                        if (sev === 'high') return 'text-orange-500';
                                        if (sev === 'medium') return 'text-yellow-400';
                                        if (sev === 'low') return 'text-blue-400';
                                        return 'text-zinc-500';
                                      })()}`}>
                                        <div className={`w-1 h-1 rounded-full ${(() => {
                                          const sev = String(issue.severity).toLowerCase();
                                          if (sev === 'critical') return 'bg-red-500';
                                          if (sev === 'high') return 'bg-orange-500';
                                          if (sev === 'medium') return 'bg-yellow-400';
                                          if (sev === 'low') return 'bg-blue-400';
                                          return 'bg-zinc-500';
                                        })()}`} />
                                        {issue.severity === 'critical' ? 'HIGH' :
                                          issue.severity === 'high' ? 'HIGH' :
                                            issue.severity === 'medium' ? 'MEDIUM' :
                                              issue.severity === 'low' ? 'LOW' :
                                                issue.severity}
                                      </span>
                                    )}
                                    <span className="text-[9px] sm:text-[10px] text-zinc-600 font-bold">{timeAgo(issue.timestamp)}</span>
                                    {issue.chat_active && (
                                      <div className="flex items-center gap-1 sm:ml-auto">
                                        <Mail className="w-3 h-3 text-blue-400" />
                                        <span className="text-[8px] sm:text-[9px] text-blue-400 font-black uppercase hidden sm:inline">Email Routing Active</span>
                                        <span className="text-[8px] text-blue-400 font-black uppercase sm:hidden">Active</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-700 group-hover:text-yellow-500 transition-all group-hover:translate-x-1 flex-shrink-0 ml-1 sm:ml-2 mt-1" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-zinc-900 to-black p-4 sm:p-6 rounded-2xl border border-yellow-500/10">
                <h3 className="text-white font-black text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-yellow-400" /> Clearance Performance
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${stats.activeRate}%` }} className="h-full bg-yellow-400 shadow-[0_0_10px_#fbbf24]" />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold">CLEARANCE RATE</span>
                    <span className="text-yellow-400 font-black">{stats.activeRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {selectedIssue && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm sm:p-4"
              onClick={() => setSelectedIssue(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-zinc-900 border border-yellow-500/20 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[92vh] sm:max-h-[90vh]"
                onClick={e => e.stopPropagation()}
              >
                {/* Close button - always visible on mobile */}
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="absolute top-3 right-3 z-30 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white/70 hover:text-white border border-white/10 sm:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="h-44 sm:h-60 md:h-auto md:w-1/2 bg-black relative flex-shrink-0">
                  <img
                    src={(() => {
                      if (selectedIssue.image_url) {
                        return selectedIssue.image_url.startsWith('http')
                          ? selectedIssue.image_url
                          : apiClient.url(selectedIssue.image_url);
                      }
                      const id = selectedIssue._id || selectedIssue.id;
                      if (selectedIssue.image_id) {
                        return apiClient.url(`/api/issues/${id}/image`);
                      }
                      return `https://placehold.co/600x800/18181b/FFD700?text=No+Visual+Evidence&font=playfair`;
                    })()}
                    className="w-full h-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://placehold.co/600x800/18181b/FFD700?text=Evidence+Access+Error`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4">
                    <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">{formatIssueType(selectedIssue.issue_type)}</h2>
                    <p className="text-yellow-400/80 text-[10px] font-bold uppercase tracking-widest">{selectedIssue.category || 'Environmental'}</p>
                  </div>
                </div>
                <div className="p-4 sm:p-6 md:w-1/2 flex flex-col bg-zinc-900/50 overflow-hidden flex-1 min-h-0">
                  <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                    <div className="mb-4 sm:mb-6">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Impact Intelligence</h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                        <span className="text-xs sm:text-sm font-black text-white uppercase bg-zinc-800 px-2.5 sm:px-3 py-1 rounded-lg border border-white/5">{selectedIssue.status}</span>
                        {selectedIssue.severity && (
                          <span className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${(() => {
                            const sev = String(selectedIssue.severity).toLowerCase();
                            if (sev === 'critical') return 'bg-red-500/10 text-red-500 border-red-500/20';
                            if (sev === 'high') return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
                            if (sev === 'medium') return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
                            if (sev === 'low') return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
                            return 'bg-zinc-800 text-zinc-400 border-white/5';
                          })()}`}>
                            {(() => {
                              const sev = String(selectedIssue.severity).toLowerCase();
                              if (sev === 'critical') return 'HIGH';
                              if (sev === 'high') return 'HIGH';
                              if (sev === 'medium') return 'MEDIUM';
                              if (sev === 'low') return 'LOW';
                              return selectedIssue.severity;
                            })()}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed italic">
                        {selectedIssue.description || selectedIssue.report?.summary || selectedIssue.report?.report?.issue_overview?.summary_explanation || 'No detailed analysis provided.'}
                      </p>
                    </div>

                    {/* Authorities Section */}
                    {(selectedIssue.report?.responsible_authorities_or_parties?.length > 0 || selectedIssue.report?.report?.responsible_authorities_or_parties?.length > 0) && (
                      <div className="mb-4 sm:mb-6">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Dispatched Authorities</h3>
                        <div className="space-y-2">
                          {(selectedIssue.report?.responsible_authorities_or_parties || selectedIssue.report?.report?.responsible_authorities_or_parties).map((auth, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                              <span className="text-[11px] text-gray-300 font-bold uppercase tracking-wider">{auth.name || auth.department || auth}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedIssue.admin_note && (
                      <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                        <h3 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Admin Feedback</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">{selectedIssue.admin_note}</p>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer - Explicitly pinned to bottom */}
                  <div className="mt-auto pt-4 sm:pt-6 border-t border-white/5 bg-zinc-900/50 backdrop-blur-xl relative z-20">
                    <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="flex-1 py-3 sm:py-4 bg-zinc-800 text-yellow-400 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 sm:gap-3 border border-yellow-500/20 uppercase tracking-wider sm:tracking-widest text-[9px] sm:text-[10px]">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Email Routing Active
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedIssue(null)}
                        className="px-4 sm:px-6 py-3 sm:py-4 bg-white/5 text-white/50 hover:text-white rounded-xl sm:rounded-2xl transition-all border border-white/10 backdrop-blur-md hidden sm:flex"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <p className="text-center text-[8px] sm:text-[9px] text-zinc-600 uppercase tracking-[0.2em] sm:tracking-[0.3em] font-black pb-1">Official EAiSER Digital Evidence Access</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fbbf24; border-radius: 10px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
