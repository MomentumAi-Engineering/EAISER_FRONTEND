import React, { useState, useEffect, memo } from 'react';
import { Activity, CheckCircle, Clock, AlertCircle, TrendingUp, BarChart3, Filter, Calendar, Download, RefreshCw, Bell, Search, Home, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import apiClient from '../services/apiClient';
import API_BASE_URL from '../config';

// Memoized StatCard moved outside to prevent re-creation
const StatCard = memo(({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: delay }}
    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-yellow-500/10 p-4 cursor-pointer group will-change-transform"
  >
    <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors pointer-events-none"></div>

    <div className="relative z-10 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-yellow-400" />
      </div>

      <div>
        <p className="text-gray-400 text-[10px] md:text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl md:text-2xl font-bold text-white">{value}</p>
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

  const cleanAIReportText = (text) => {
    if (!text) return '';
    let cleaned = text
      .split('\n')[0] // Take only the first paragraph if there are multiple
      .replace(/AI Analysis:/gi, '')
      .replace(/\*\*.*?\*\*/g, '') // Remove bold markers
      .replace(/has been reported at.*$/i, '.') // Remove location suffixes
      .replace(/Zip:.*$/i, '.')
      .replace(/priority:.*$/i, '.')
      .replace(/confidence:.*$/i, '.')
      .replace(/(\.){2,}/g, '.') // Fix double dots
      .trim();

    // Ensure it ends with a dot if it's a sentence
    if (cleaned && !cleaned.endsWith('.')) cleaned += '.';
    return cleaned;
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
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-12 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Impact <span className="text-yellow-400">Hub</span>
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Tracking your community contributions</p>
          </div>
          <div className="flex items-center gap-3 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-zinc-900 rounded-lg text-yellow-400 hover:bg-zinc-800 transition-all border border-yellow-500/20 relative"
              >
                <Bell className="w-5 h-5" />
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
                    className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-yellow-500/20 rounded-xl shadow-2xl z-50 overflow-hidden"
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
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => navigate('/report')} className="px-5 py-2.5 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all flex items-center gap-2 text-sm shadow-lg shadow-yellow-500/10">
              <Activity className="w-4 h-4" /> New Report
            </button>
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
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon={Activity} label="Total Reports" value={stats.totalReported} color="bg-blue-500/10" delay={0.1} />
                <StatCard icon={Clock} label="Under Review" value={stats.pending} color="bg-orange-500/10" delay={0.2} />
                <StatCard icon={CheckCircle} label="Routed" value={stats.resolved} color="bg-green-500/10" delay={0.3} />
              </div>

              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-400" /> Recent Issues
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {zipCodes.length > 1 && (
                      <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="bg-zinc-800 border border-white/5 text-gray-400 text-xs rounded-lg px-2 py-1.5 outline-none hover:text-white hover:border-white/10 transition-colors cursor-pointer mr-2"
                      >
                        {zipCodes.map(zip => (
                          <option key={zip} value={zip}>{zip}</option>
                        ))}
                      </select>
                    )}

                    {['all', 'routed', 'in review'].map((t) => (
                      <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs transition-all capitalize font-bold ${filter === t ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/10' : 'bg-zinc-800 text-gray-500 hover:text-white'}`}>
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
                          className="bg-zinc-800/30 border border-white/5 rounded-xl p-4 hover:border-yellow-500/40 transition-all cursor-pointer group will-change-transform"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-white font-bold text-sm tracking-wide group-hover:text-yellow-400 transition-colors uppercase">
                                {formatIssueType(issue.issue_type)}
                              </h3>
                              <p className="text-gray-500 text-xs mt-1 line-clamp-1">{issue.address || 'Location analyzing...'}</p>
                              <div className="flex items-center gap-3 mt-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${['resolved', 'completed', 'accepted', 'submitted', 'approved', 'dispatched'].includes(issue.status?.toLowerCase()) ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                  {issue.status}
                                </span>
                                <span className="text-[10px] text-zinc-600 font-bold">{timeAgo(issue.timestamp)}</span>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-yellow-500 transition-all group-hover:translate-x-1" />
                          </div>
                        </motion.div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-zinc-900 to-black p-6 rounded-2xl border border-yellow-500/10">
                <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-yellow-400" /> Clearance Performance
                </h3>
                <div className="space-y-4">
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
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
              onClick={() => setSelectedIssue(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-zinc-900 border border-yellow-500/20 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh]"
                onClick={e => e.stopPropagation()}
              >
                <div className="h-60 md:h-auto md:w-1/2 bg-black relative">
                  <img
                    src={selectedIssue.image_url ?
                      (selectedIssue.image_url.startsWith('http') ? selectedIssue.image_url : `${API_BASE_URL.replace('/api', '')}${selectedIssue.image_url.startsWith('/') ? '' : '/'}${selectedIssue.image_url}`)
                      : (selectedIssue.image_id ? `${API_BASE_URL}/issues/${selectedIssue._id || selectedIssue.id}/image` : `https://placehold.co/600x800/18181b/FFF?text=Digital+Evidence`)}
                    className="w-full h-full object-cover opacity-80"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://placehold.co/600x800/18181b/FFF?text=Evidence+Feed+Error`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">{formatIssueType(selectedIssue.issue_type)}</h2>
                    <p className="text-yellow-400/80 text-[10px] font-bold uppercase tracking-widest">{selectedIssue.category || 'Environmental'}</p>
                  </div>
                </div>
                <div className="p-6 md:w-1/2 overflow-y-auto custom-scrollbar bg-zinc-900/50">
                  <div className="mb-6">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Status Report</h3>
                    <span className="text-sm font-black text-white uppercase bg-zinc-800 px-3 py-1 rounded-lg border border-white/5">{selectedIssue.status}</span>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Intel Summary</h3>
                    <p className="text-gray-400 text-xs leading-relaxed italic">
                      "Our AI analyzed the image and identified a potential <span className="text-yellow-400/80">{formatIssueType(selectedIssue.issue_type)}</span> showing <span className="text-white/90">{cleanAIReportText(selectedIssue.description || selectedIssue.report?.summary || 'an identified civic concern')}</span>. This issue is located at <span className="text-white/70">{selectedIssue.address?.split(',')[1]?.trim() || selectedIssue.address?.split(',')[0] || 'Unknown City'}</span> (ZIP {selectedIssue.zip_code || selectedIssue.location?.zip_code || 'N/A'})."
                    </p>
                  </div>

                  {/* Authorities Section */}
                  {(selectedIssue.report?.responsible_authorities_or_parties?.length > 0 || selectedIssue.report?.report?.responsible_authorities_or_parties?.length > 0) && (
                    <div className="mb-6">
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
                  <button onClick={() => setSelectedIssue(null)} className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-white/5">Close File</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fbbf24; border-radius: 10px; }
      `}</style>
    </div>
  );
}