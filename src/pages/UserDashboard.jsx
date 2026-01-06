import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, Clock, AlertCircle, TrendingUp, BarChart3, Filter, Calendar, Download, RefreshCw, Bell, Search, Home, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Navbar from '../components/Navbar';
import apiClient from '../services/apiClient';

export default function UserDashboard() {
  const [stats, setStats] = useState({
    totalReported: 0,
    resolved: 0,
    pending: 0,
    activeRate: 0
  });

  /* Restoring missing state variables */
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [issues, setIssues] = useState([]);

  /* New states for enhanced features */
  const [notificationList, setNotificationList] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const previousIssuesRef = React.useRef([]);

  // Simple notification sound (short beep/ding)
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // Time ago helper
  const timeAgo = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const seconds = Math.floor((new Date() - date) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " years ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " months ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " days ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hours ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " mins ago";
      return Math.floor(seconds) + " seconds ago";
    } catch (e) {
      return dateStr;
    }
  };

  const fetchIssues = async () => {
    setIsRefreshing(true);
    try {
      const data = await apiClient.getMyIssues();
      if (Array.isArray(data)) {
        // Filter out 'pending' status completely from the dashboard
        const validData = data.filter(i => i.status?.toLowerCase() !== 'pending');

        // Check for status changes to trigger notification
        if (previousIssuesRef.current.length > 0) {
          validData.forEach(newIssue => {
            const oldIssue = previousIssuesRef.current.find(i => (i._id || i.id) === (newIssue._id || newIssue.id));
            if (oldIssue && oldIssue.status !== newIssue.status) {
              // Status changed!
              playNotificationSound();
              // Add to notification list
              const note = {
                id: Date.now() + Math.random(),
                text: `Update: Status for "${newIssue.issue_type || 'Issue'}" changed to ${newIssue.status}`,
                time: 'Just now',
                read: false
              };
              setNotificationList(prev => [note, ...prev]);
              setNotifications(prev => prev + 1);
            }
          });
        }
        previousIssuesRef.current = validData; // Update ref for next compare

        setIssues(validData);

        // Calculate Stats based on validData
        const total = validData.length;

        // Include 'rejected' and 'declined' in resolved/closed count
        const resolved = validData.filter(i => ['resolved', 'completed', 'accepted', 'rejected', 'declined'].includes(i.status?.toLowerCase())).length;

        // Strictly filter "Pending" to only statuses waiting for Admin action (Excluding 'submitted' as per user request)
        const pending = validData.filter(i => ['needs_review', 'under_review', 'under_admin_review'].includes(i.status?.toLowerCase())).length;

        const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        setStats({
          totalReported: total,
          resolved: resolved,
          pending: pending,
          activeRate: rate
        });
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchIssues();
  };

  const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-yellow-500/20 p-4 cursor-pointer group"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors"></div>

      <div className="relative z-10 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-yellow-400" />
        </div>

        <div>
          <p className="text-gray-400 text-xs font-medium">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 pt-24">
        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 text-sm">
                Welcome back, {(() => {
                  try {
                    const user = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
                    return user.name || 'User';
                  } catch { return 'User'; }
                })()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search issues..."
                className="bg-zinc-800 border border-yellow-500/20 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/40 transition-colors w-48"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) setNotifications(0); // clear badge on open
                }}
                className="relative p-2 bg-zinc-800 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-400" />
                {notifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {notifications}
                  </motion.span>
                )}
              </button>

              {/* Notification Dropdown with Animation */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-3 w-80 bg-zinc-900 border border-yellow-500/20 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md"
                  >
                    <div className="p-3 border-b border-white/10 bg-white/5">
                      <h4 className="text-white font-semibold text-sm">Notifications</h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notificationList.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-xs">
                          No new notifications
                        </div>
                      ) : (
                        notificationList.map((note) => (
                          <div key={note.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <p className="text-sm text-gray-300">{note.text}</p>
                            <p className="text-xs text-yellow-500 mt-1">{note.time}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="p-2 bg-zinc-800 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Download Report */}
            <button className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={AlertCircle}
            label="Total Reported"
            value={stats.totalReported}
            color="bg-yellow-500/10"
            delay={0.1}
          />

          <StatCard
            icon={CheckCircle}
            label="Resolved"
            value={stats.resolved}
            color="bg-green-500/10"
            delay={0.2}
          />

          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pending}
            color="bg-orange-500/10"
            delay={0.3}
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-3 gap-6">
          {/* Recent Issues List */}
          <div className="col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl border border-yellow-500/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Issues</h2>
              <div className="flex items-center gap-2">
                {['all', 'pending', 'resolved'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors capitalize ${filter === t ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-gray-400'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {issues.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No issues reported yet.
                </div>
              ) : (
                issues
                  .filter(issue => filter === 'all' ||
                    (filter === 'resolved' && ['resolved', 'completed', 'accepted', 'rejected', 'declined'].includes(issue.status?.toLowerCase())) ||
                    (filter === 'pending' && ['needs_review', 'under_review', 'under_admin_review'].includes(issue.status?.toLowerCase()))
                  )
                  .slice(0, 10) // Show last 10
                  .map((issue, index) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={issue._id || issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 hover:border-yellow-500/30 transition-all cursor-pointer group hover:bg-zinc-800/80 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-medium group-hover:text-yellow-400 transition-colors capitalize">
                            {issue.issue_type?.replace(/_/g, ' ') || 'Issue'}
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${['resolved', 'completed', 'accepted', 'rejected'].includes(issue.status?.toLowerCase())
                              ? issue.status?.toLowerCase() === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                              : 'bg-orange-500/20 text-orange-400'
                              }`}>
                              {issue.status}
                            </span>
                            <span className="text-gray-500 text-xs">{issue.category || 'Public'}</span>
                            <span className="text-gray-500 text-xs">{timeAgo(issue.timestamp)}</span>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                          <TrendingUp className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl border border-yellow-500/20 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-bold">Resolution Rate</h3>
              </div>

              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-yellow-400">{stats.activeRate}%</p>
                <p className="text-gray-400 text-sm mt-1">Success Rate</p>
              </div>

              <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.activeRate}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full"
                ></motion.div>
              </div>
            </motion.div>

            {/* Activity */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl border border-yellow-500/20 p-5"
            >
              <h3 className="text-white font-bold mb-4">Activity Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Issues Reported</span>
                  <span className="text-white font-semibold">{stats.totalReported}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pending Action</span>
                  <span className="text-white font-semibold">{stats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resolved</span>
                  <span className="text-white font-semibold">{stats.resolved}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Selected Issue Modal */}
      <AnimatePresence>
        {selectedIssue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-yellow-500/20 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[85vh]"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedIssue(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left: Image */}
              <div className="h-64 md:h-auto md:w-1/2 bg-black relative shrink-0">
                <img
                  src={
                    selectedIssue.image_url ||
                    selectedIssue.imageUrl ||
                    (selectedIssue._id ? `${apiClient.baseURL}/api/issues/image/${selectedIssue._id}` : "") ||
                    "https://placehold.co/600x800/18181b/FFF?text=No+Image"
                  }
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/600x800/18181b/FFF?text=No+Image";
                  }}
                  alt="Issue"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white capitalize drop-shadow-md">
                      {selectedIssue.issue_type?.replace(/_/g, ' ') || 'Issue Report'}
                    </h2>
                    <p className="text-gray-300 text-sm mt-1 drop-shadow-md">{timeAgo(selectedIssue.timestamp)}</p>
                  </div>
                </div>
              </div>

              {/* Right: Details */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto md:w-1/2 custom-scrollbar">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Status</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold capitalize ${['resolved', 'completed', 'accepted'].includes(selectedIssue.status?.toLowerCase())
                    ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                    : selectedIssue.status?.toLowerCase() === 'rejected'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                    }`}>
                    {selectedIssue.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-yellow-500/20 pl-3">
                    {selectedIssue.summary || selectedIssue.description || "No detailed description provided."}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location</h3>
                  <div className="flex items-start gap-2 text-gray-400 text-sm bg-zinc-800/50 p-3 rounded-lg border border-white/5">
                    <div className="mt-1 min-w-4"><div className="w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500 animate-pulse" /></div>
                    <p>{selectedIssue.address || "Location data not available"}</p>
                  </div>
                </div>

                {selectedIssue.admin_note && (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-1">Admin Note</h3>
                    <p className="text-gray-300 text-sm italic">"{selectedIssue.admin_note}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}