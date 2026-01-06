import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  User, Mail, Lock, Bell, Shield, LogOut, ArrowLeft,
  Settings, Camera, Activity, Save, CheckCircle
} from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Settings States
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    updates: true
  });

  useEffect(() => {
    const loadUserData = () => {
      const storedUser = localStorage.getItem('userData') || localStorage.getItem('user');
      if (storedUser) {
        try {
          setUserInfo(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user data", e);
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    };
    loadUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const handleSave = () => {
    setIsEditing(false);
    // Simulate API save
    alert('Settings saved successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-yellow-500">
        <Activity className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!userInfo) return null;

  // Sidebar Menu Items
  const menuItems = [
    { id: 'general', label: 'General Info', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white selection:bg-yellow-500/30">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">

        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-yellow-500" />
              Account Settings
            </h1>
            <p className="text-gray-400 mt-1">Manage your profile, security, and preferences</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Navigation */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sticky top-28">

              {/* Mini Profile Summary */}
              <div className="flex flex-col items-center p-6 border-b border-white/5 mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl font-bold text-yellow-500 mb-3 border-2 border-yellow-500 overflow-hidden">
                    {userInfo.avatar ? (
                      <img src={userInfo.avatar} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      userInfo.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <button className="absolute bottom-2 -right-1 bg-zinc-800 p-1.5 rounded-full border border-zinc-700 hover:bg-zinc-700 transition">
                    <Camera className="w-3 h-3 text-white" />
                  </button>
                </div>
                <h3 className="text-lg font-bold">{userInfo.name}</h3>
                <p className="text-xs text-gray-500 truncate max-w-full">{userInfo.email}</p>
                <div className="mt-2 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20 uppercase tracking-wide font-bold">
                  {userInfo.role || 'Member'}
                </div>
              </div>

              {/* Menu */}
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === item.id
                          ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8 pt-4 border-t border-white/5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 min-h-[600px] relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

              {/* TAB: GENERAL */}
              {activeTab === 'general' && (
                <div className="animate-fade-in space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">General Information</h2>
                    <p className="text-gray-500 text-sm">Update your public profile and personal details.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Full Name</label>
                      <input
                        disabled={!isEditing}
                        type="text"
                        defaultValue={userInfo.name}
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500/50 transition-colors disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Email Address</label>
                      <input
                        disabled={!isEditing}
                        type="email"
                        defaultValue={userInfo.email}
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500/50 transition-colors disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Account ID</label>
                      <div className="w-full bg-black/20 border border-zinc-800 rounded-xl px-4 py-3 text-gray-500 font-mono text-sm">
                        {userInfo._id || 'USER-ID-12345'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Role</label>
                      <div className="w-full bg-black/20 border border-zinc-800 rounded-xl px-4 py-3 text-gray-500">
                        {userInfo.role || 'User'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4 border-t border-white/5">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSave}
                          className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-2 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: SECURITY */}
              {activeTab === 'security' && (
                <div className="animate-fade-in space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Security Settings</h2>
                    <p className="text-gray-500 text-sm">Manage your password and account security.</p>
                  </div>

                  <div className="space-y-6 max-w-xl">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-4 items-start">
                      <Shield className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-yellow-500">Password is secure</h4>
                        <p className="text-sm text-yellow-200/60 mt-1">Your password was last changed 3 months ago. We recommend updating it regularly.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Current Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Confirm New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3" />
                      </div>
                    </div>

                    <button className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition">
                      Update Password
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="animate-fade-in space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Notifications</h2>
                    <p className="text-gray-500 text-sm">Choose how you want to be notified.</p>
                  </div>

                  <div className="space-y-4 divide-y divide-white/5">
                    {[
                      { id: 'email', label: 'Email Notifications', desc: 'Receive updates about your reports via email.' },
                      { id: 'push', label: 'Push Notifications', desc: 'Get real-time alerts on your device.' },
                      { id: 'updates', label: 'Product Updates', desc: 'Stay informed about new features and improvements.' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-4">
                        <div>
                          <h4 className="font-medium text-white">{item.label}</h4>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => setNotifications(p => ({ ...p, [item.id]: !p[item.id] }))}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${notifications[item.id] ? 'bg-yellow-500' : 'bg-zinc-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${notifications[item.id] ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: ACTIVITY */}
              {activeTab === 'activity' && (
                <div className="animate-fade-in space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Recent Activity</h2>
                    <p className="text-gray-500 text-sm">Track your recent login sessions and actions.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { action: 'Login Successful', device: 'Chrome on Windows', time: 'Just now', ip: '192.168.1.1', status: 'success' },
                      { action: 'Password Changed', device: 'Chrome on Windows', time: '3 months ago', ip: '192.168.1.1', status: 'warning' },
                      { action: 'Login Successful', device: 'Safari on iPhone', time: '4 months ago', ip: '10.0.0.4', status: 'success' },
                    ].map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{log.action}</h4>
                            <p className="text-xs text-gray-500">{log.device} • {log.ip}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-400">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
