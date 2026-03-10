import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  User, Mail, Lock, Bell, Shield, LogOut, ArrowLeft,
  Settings, Camera, Activity, Save, CheckCircle, AlertTriangle, Loader2, X, Eye, EyeOff, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../services/apiClient';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [recentIssues, setRecentIssues] = useState([]);

  // Form States
  const [generalForm, setGeneralForm] = useState({
    firstName: '',
    lastName: '',
    username: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    updates: true
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await apiClient.getMe();
        setUserInfo(data);
        setGeneralForm({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          username: data.username || ''
        });
        setNotifications(data.notifications || { email: true, push: false, updates: true });

        // Fetch recent issues for activity log
        try {
          const issues = await apiClient.getMyIssues();
          setRecentIssues(issues.slice(0, 5));
        } catch (e) {
          console.error("Failed to fetch issues", e);
        }

      } catch (err) {
        console.error("Failed to load profile", err);
        if (err.status === 401) navigate('/login');
        showStatus('error', err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [navigate]);

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const handleGeneralSave = async () => {
    setSaving(true);
    try {
      await apiClient.updateProfile(generalForm);
      const updatedUser = {
        ...userInfo,
        first_name: generalForm.firstName,
        last_name: generalForm.lastName,
        username: generalForm.username
      };
      setUserInfo(updatedUser);

      // Update localStorage so Navbar picks up new name immediately
      try {
        const stored = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
        const merged = {
          ...stored,
          first_name: generalForm.firstName,
          last_name: generalForm.lastName,
          name: `${generalForm.firstName} ${generalForm.lastName}`.trim(),
          username: generalForm.username
        };
        localStorage.setItem('userData', JSON.stringify(merged));
        localStorage.setItem('user', JSON.stringify(merged));
        // Trigger storage event so Navbar re-renders
        window.dispatchEvent(new Event('storage'));
      } catch (e) { /* ignore localStorage errors */ }

      setIsEditing(false);
      showStatus('success', 'Profile updated successfully');
    } catch (err) {
      showStatus('error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showStatus('error', 'New passwords do not match');
    }
    if (passwordForm.newPassword.length < 6) {
      return showStatus('error', 'Password must be at least 6 characters');
    }

    setSaving(true);
    try {
      await apiClient.changeUserPassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showStatus('success', 'Password updated successfully');
    } catch (err) {
      showStatus('error', err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async (id) => {
    const updated = { ...notifications, [id]: !notifications[id] };
    setNotifications(updated);
    try {
      await apiClient.updateNotifications(updated);
    } catch (err) {
      showStatus('error', 'Failed to update notification settings');
      // Revert if failed
      setNotifications(notifications);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-yellow-500" />
        </motion.div>
        <p className="text-zinc-500 font-medium animate-pulse">Initializing Secure Profile...</p>
      </div>
    );
  }

  if (!userInfo) return null;

  const menuItems = [
    { id: 'general', label: 'General Info', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-yellow-500/30 font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-12">
        {/* Status Messages */}
        <AnimatePresence>
          {status.message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-3 ${status.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
            >
              {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="font-semibold">{status.message}</span>
              <button onClick={() => setStatus({ type: '', message: '' })} className="ml-2 hover:opacity-70 transition">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter"
            >
              <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                <Settings className="w-8 h-8 text-yellow-500" />
              </div>
              ACCOUNT SETTINGS
            </motion.h1>
            <p className="text-zinc-500 mt-2 font-medium">Configure your global identity, security layers, and preferences.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex items-center gap-2 px-5 py-2.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-sm font-bold text-zinc-400 hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK TO HUB
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/50 rounded-[2rem] p-4 sticky top-28 overflow-hidden">
              {/* Decorative Gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Profile Card */}
              <div className="relative flex flex-col items-center p-8 bg-zinc-950/50 border border-zinc-800/50 rounded-[1.5rem] mb-6 shadow-inner">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      showStatus('error', 'Image must be under 2MB');
                      return;
                    }
                    try {
                      setSaving(true);
                      const res = await apiClient.uploadAvatar(file);
                      setUserInfo({ ...userInfo, avatar: res.avatar_url });
                      // Update localStorage
                      try {
                        const stored = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
                        stored.avatar = res.avatar_url;
                        localStorage.setItem('userData', JSON.stringify(stored));
                        localStorage.setItem('user', JSON.stringify(stored));
                        window.dispatchEvent(new Event('storage'));
                      } catch (_) { }
                      showStatus('success', 'Profile photo updated!');
                    } catch (err) {
                      showStatus('error', err.message || 'Failed to upload photo');
                    } finally {
                      setSaving(false);
                      e.target.value = '';
                    }
                  }}
                />
                <div
                  className="relative group cursor-pointer"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 p-1 flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-300 shadow-xl shadow-yellow-500/10">
                    <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-3xl font-black text-white overflow-hidden uppercase">
                      {userInfo.avatar ? (
                        <img src={userInfo.avatar} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        userInfo.first_name?.charAt(0) || 'U'
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-0 bg-yellow-500 p-2 rounded-full border-4 border-zinc-950 text-black shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-xl font-black tracking-tight">{userInfo.first_name} {userInfo.last_name}</h3>
                <p className="text-sm text-zinc-500 mt-1 font-mono">@{userInfo.username}</p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] rounded-full border border-yellow-500/20 uppercase tracking-widest font-black">
                    {userInfo.role || 'Member'}
                  </div>
                  {userInfo.email_verified ? (
                    <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] rounded-full border border-green-500/20 uppercase tracking-widest font-black flex items-center gap-1">
                      <CheckCircle className="w-2.5 h-2.5" /> Verified User
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] rounded-full border border-red-500/20 uppercase tracking-widest font-black flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5" /> Unverified
                    </div>
                  )}
                </div>
                {!userInfo.email_verified && (
                  <div className="mt-3 px-4 py-2 bg-red-500/5 border border-red-500/15 rounded-xl text-center">
                    <p className="text-[10px] text-red-400/80 font-medium">Please verify your email to unlock full access.</p>
                  </div>
                )}
              </div>

              {/* Menu Tabs */}
              <nav className="space-y-2 px-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm group relative overflow-hidden ${isActive
                        ? 'bg-yellow-500 text-black shadow-2xl shadow-yellow-500/20'
                        : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-tab-bar"
                          className="absolute left-0 w-1.5 h-full bg-black/20"
                        />
                      )}
                      <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-yellow-500'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8 pt-4 border-t border-zinc-800/50 px-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500/80 hover:bg-red-500/5 transition-all duration-300 font-bold text-sm hover:text-red-500 group"
                >
                  <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  SIGN OUT
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/50 rounded-[2.5rem] p-8 md:p-12 min-h-[650px] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

              {/* TAB: GENERAL */}
              {activeTab === 'general' && (
                <div className="space-y-10 relative">
                  <div>
                    <h2 className="text-3xl font-black mb-2 tracking-tight">GENERAL INFORMATION</h2>
                    <p className="text-zinc-500 font-medium">Identity management and account synchronization</p>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          First Name
                        </label>
                        <input
                          disabled={!isEditing}
                          type="text"
                          value={generalForm.firstName}
                          onChange={e => setGeneralForm({ ...generalForm, firstName: e.target.value })}
                          className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-500/5 transition-all disabled:opacity-50 font-medium text-white placeholder-zinc-700"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Last Name</label>
                        <input
                          disabled={!isEditing}
                          type="text"
                          value={generalForm.lastName}
                          onChange={e => setGeneralForm({ ...generalForm, lastName: e.target.value })}
                          className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-500/5 transition-all disabled:opacity-50 font-medium text-white"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Username</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-mono">@</span>
                          <input
                            disabled={!isEditing}
                            type="text"
                            value={generalForm.username}
                            onChange={e => setGeneralForm({ ...generalForm, username: e.target.value })}
                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-10 pr-5 py-4 focus:outline-none focus:border-yellow-500/50 transition-all disabled:opacity-50 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                          <input
                            disabled
                            type="email"
                            value={userInfo.email}
                            className="w-full bg-zinc-950/20 border border-zinc-900 rounded-2xl pl-12 pr-5 py-4 text-zinc-500 font-medium opacity-60 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      <div className="group bg-zinc-950/30 border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Unique Identifier</p>
                        <p className="text-sm font-mono text-zinc-400 select-all">{userInfo.id}</p>
                      </div>
                      <div className="bg-zinc-950/30 border border-zinc-800/50 rounded-2xl p-5">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Legacy Role</p>
                        <p className="text-sm font-bold text-yellow-500/80 uppercase">{userInfo.role || 'Citizen'}</p>
                      </div>
                    </div>

                    <div className="pt-10 flex flex-col sm:flex-row gap-4">
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="group relative px-10 py-4 bg-white text-black font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          EDIT PROFILE DATA
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleGeneralSave}
                            disabled={saving}
                            className="px-10 py-4 bg-yellow-500 text-black font-black rounded-2xl hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 group"
                          >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                            SAVE CHANGES
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-10 py-4 bg-zinc-900 text-zinc-400 font-black rounded-2xl hover:bg-zinc-800 hover:text-white transition-all"
                          >
                            DISCARD CHANGES
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SECURITY */}
              {activeTab === 'security' && (
                <div className="space-y-10 relative">
                  <div>
                    <h2 className="text-3xl font-black mb-2 tracking-tight uppercase">Security Infrastructure</h2>
                    <p className="text-zinc-500 font-medium">Encryption keys and authentication protocols</p>
                  </div>

                  <form onSubmit={handlePasswordSave} className="space-y-8 max-w-2xl">
                    <div className="p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-3xl flex gap-6 items-start">
                      <div className="p-3 bg-yellow-500/10 rounded-2xl">
                        <Shield className="w-8 h-8 text-yellow-500" />
                      </div>
                      <div>
                        <h4 className="font-black text-yellow-500 text-lg uppercase tracking-tight">ENCRYPTION ACTIVE</h4>
                        <p className="text-sm text-yellow-200/50 mt-1 leading-relaxed font-medium">Your credentials are protected with industry-standard bcrypt hashing. Multi-factor authentication is recommended for maximum security.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                          Current Security Key
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                          <input
                            type={showPassword.current ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            placeholder="Enter current password"
                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-yellow-500/50 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                          >
                            {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">New Security Key</label>
                          <div className="relative">
                            <input
                              type={showPassword.new ? "text" : "password"}
                              value={passwordForm.newPassword}
                              onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                              placeholder="New password"
                              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-yellow-500/50 transition-all font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                              className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                            >
                              {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Verify New Key</label>
                          <div className="relative">
                            <input
                              type={showPassword.confirm ? "text" : "password"}
                              value={passwordForm.confirmPassword}
                              onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                              placeholder="Confirm new password"
                              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-yellow-500/50 transition-all font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                              className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                            >
                              {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}
                      className="group px-10 py-4 bg-white text-black font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                      UPDATE SECURITY CREDENTIALS
                    </button>
                  </form>
                </div>
              )}

              {/* TAB: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="space-y-10 relative">
                  <div>
                    <h2 className="text-3xl font-black mb-2 tracking-tight uppercase">Control Center</h2>
                    <p className="text-zinc-500 font-medium">Automated alert routing and broadcast preferences</p>
                  </div>

                  <div className="space-y-1 px-2 border border-zinc-800/50 rounded-3xl bg-zinc-950/20 overflow-hidden">
                    {[
                      { id: 'email', label: 'EMAIL PROTOCOL', desc: 'Secure transmission of incident reports to your registered email.', icon: Mail },
                      { id: 'push', label: 'REAL-TIME BROADCAST', desc: 'Instant satellite-linked alerts directly to your mobile interface.', icon: Activity },
                      { id: 'updates', label: 'SYSTEM UPGRADES', desc: 'Announcements regarding new AI modules and feature expansions.', icon: TrendingUp },
                    ].map((item, idx) => (
                      <div key={item.id} className={`flex items-center justify-between p-8 group transition-colors duration-300 ${idx !== 2 ? 'border-b border-zinc-800/50' : ''}`}>
                        <div className="flex items-center gap-6">
                          <div className={`p-4 rounded-2xl border transition-all duration-300 ${notifications[item.id] ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-zinc-900 border-zinc-800 group-hover:bg-zinc-800'}`}>
                            {React.createElement(item.icon, { className: `w-6 h-6 ${notifications[item.id] ? 'text-yellow-500' : 'text-zinc-600'}` })}
                          </div>
                          <div>
                            <h4 className={`font-black text-sm tracking-widest ${notifications[item.id] ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{item.label}</h4>
                            <p className="text-sm text-zinc-500 mt-1 max-w-md font-medium">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle(item.id)}
                          className={`relative w-16 h-8 rounded-full transition-all duration-500 p-1.5 flex items-center ${notifications[item.id] ? 'bg-yellow-500 shadow-lg shadow-yellow-500/20' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                        >
                          <motion.div
                            animate={{ x: notifications[item.id] ? 32 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="w-5 h-5 bg-white rounded-full shadow-md"
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: ACTIVITY */}
              {activeTab === 'activity' && (
                <div className="space-y-10 relative">
                  <div>
                    <h2 className="text-3xl font-black mb-2 tracking-tight uppercase">Incident Log</h2>
                    <p className="text-zinc-500 font-medium">Audit trail of your recent civic engagement and reports</p>
                  </div>

                  <div className="space-y-4">
                    {recentIssues.length > 0 ? (
                      recentIssues.map((issue, i) => (
                        <motion.div
                          key={issue._id || i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center justify-between p-6 bg-zinc-950/30 border border-zinc-800/50 rounded-3xl hover:border-zinc-700 transition-all group"
                        >
                          <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${issue.status === 'dispatched' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                              issue.status === 'needs_review' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                'bg-zinc-900 border-zinc-800 text-zinc-400'
                              }`}>
                              <Activity className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="font-black text-sm tracking-wide uppercase">{issue.issue_type?.replace('_', ' ')}</h4>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${(() => {
                                  const sev = (issue.severity || '').toLowerCase();
                                  if (sev === 'critical') return 'bg-red-500/10 border-red-500/20 text-red-500';
                                  if (sev === 'high') return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
                                  if (sev === 'medium') return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
                                  if (sev === 'low') return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
                                  return 'bg-zinc-800 border-zinc-700 text-zinc-500';
                                })()}`}>
                                  {(() => {
                                    const sev = (issue.severity || '').toLowerCase();
                                    if (sev === 'critical') return 'HIGH PRIORITY';
                                    if (sev === 'high') return 'MEDIUM HIGH PRIORITY';
                                    if (sev === 'medium') return 'MEDIUM PRIORITY';
                                    if (sev === 'low') return 'LOW PRIORITY';
                                    return issue.severity || 'MEDIUM PRIORITY';
                                  })()}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 mt-1 font-mono">{issue.address || 'Location Hidden'} • {issue.report_id || issue.id?.slice(-8)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${issue.status === 'dispatched' ? 'text-green-500' : 'text-zinc-400'
                              }`}>
                              {issue.status?.replace('_', ' ')}
                            </div>
                            <span className="text-[10px] text-zinc-600 font-mono">{new Date(issue.timestamp).toLocaleDateString()}</span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 bg-zinc-950/20 rounded-[2rem] border border-zinc-800/30 border-dashed">
                        <Activity className="w-12 h-12 text-zinc-800 mb-4" />
                        <p className="text-zinc-600 font-black tracking-tight uppercase">No recent activity detected</p>
                        <button onClick={() => navigate('/dashboard')} className="mt-4 text-yellow-500 text-sm font-bold hover:underline">Start reporting issues</button>
                      </div>
                    )}

                    {recentIssues.length > 0 && (
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-4 border border-zinc-800/50 rounded-2xl text-xs font-black text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all uppercase tracking-[0.2em]"
                      >
                        View Full Database History
                      </button>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </div>

      {/* Background Polish */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(circle_at_50%_0%,_#18181b_0%,_#09090b_100%)]" />
    </div>
  );
};

export default ProfilePage;
