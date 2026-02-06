
import React, { useState, useEffect } from 'react';
import { Save, Bell, Shield, User, Lock, Trash2, Mail, Globe, Monitor, LogOut } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import apiClient from '../services/apiClient';

export default function AdminSettings() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');

    const [profile, setProfile] = useState({
        name: 'Admin User',
        email: 'admin@eaiser.com',
        role: 'Administrator',
        avatar: ''
    });

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        newReportAlerts: true,
        weeklyDigest: false,
        securityAlerts: true
    });

    const [system, setSystem] = useState({
        maintenanceMode: false,
        debugLogs: true
    });

    useEffect(() => {
        // Load current admin data
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        if (adminData) {
            setProfile(prev => ({
                ...prev,
                name: adminData.name || prev.name,
                email: adminData.email || prev.email,
                role: adminData.role || prev.role
            }));
        }
    }, []);

    const handleSave = async () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setSuccess('Settings saved successfully');
            setTimeout(() => setSuccess(null), 3000);
        }, 1000);
    };

    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
        >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
            {activeTab === id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_#3b82f6]"></div>
            )}
        </button>
    );

    const Toggle = ({ checked, onChange, label, desc }) => (
        <div className="flex items-center justify-between py-4 border-b border-gray-800 last:border-0">
            <div>
                <div className="text-white font-medium mb-1">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${checked ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-gray-700'
                    }`}
            >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 transform ${checked ? 'translate-x-6' : 'translate-x-0'
                    }`} />
            </button>
        </div>
    );

    return (
        <DashboardLayout currentPage="settings">
            <div className="max-w-6xl mx-auto animate-in fade-in duration-500">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        System Settings
                    </h1>
                    <p className="text-gray-500 mt-2">Manage your account preferences and system configuration</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1 space-y-2">
                        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-4">
                            <TabButton id="profile" icon={User} label="My Profile" />
                            <TabButton id="notifications" icon={Bell} label="Notifications" />
                            <TabButton id="security" icon={Lock} label="Security" />
                            <TabButton id="system" icon={Monitor} label="System" />
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8 relative overflow-hidden">

                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            {success && (
                                <div className="absolute top-6 right-6 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                                    <Shield className="w-4 h-4" /> {success}
                                </div>
                            )}

                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-500" /> Professional Profile
                                    </h2>

                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-xl shadow-blue-500/20">
                                            <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
                                                <span className="text-3xl font-bold text-white">{profile.name.charAt(0)}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700/50 border border-gray-700 text-white rounded-lg text-sm transition-all">
                                                Change Avatar
                                            </button>
                                            <p className="text-xs text-gray-500 mt-2">Recommended: 400x400px</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                disabled
                                                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Role</label>
                                            <input
                                                type="text"
                                                value={profile.role}
                                                disabled
                                                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-blue-500" /> Notification Preferences
                                    </h2>
                                    <Toggle
                                        label="Email Alerts"
                                        desc="Receive email notifications for critical system events"
                                        checked={notifications.emailAlerts}
                                        onChange={(v) => setNotifications({ ...notifications, emailAlerts: v })}
                                    />
                                    <Toggle
                                        label="New Report Alerts"
                                        desc="Get notified instantly when a new citizen report is filed"
                                        checked={notifications.newReportAlerts}
                                        onChange={(v) => setNotifications({ ...notifications, newReportAlerts: v })}
                                    />
                                    <Toggle
                                        label="Weekly Digest"
                                        desc="Receive a weekly summary of resolved issues and system stats"
                                        checked={notifications.weeklyDigest}
                                        onChange={(v) => setNotifications({ ...notifications, weeklyDigest: v })}
                                    />
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-blue-500" /> Security & Access
                                    </h2>

                                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-6">
                                        <h3 className="text-yellow-400 font-semibold mb-1 flex items-center gap-2">
                                            <Shield className="w-4 h-4" /> Two-Factor Authentication
                                        </h3>
                                        <p className="text-sm text-yellow-200/60 mb-3">Add an extra layer of security to your admin account.</p>
                                        <button className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-500/30 transition-all">
                                            Enable 2FA
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white mb-4" />

                                        <label className="block text-sm text-gray-400 mb-2">New Password</label>
                                        <input type="password" placeholder="Min 8 characters" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white mb-4" />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end gap-4">
                                <button className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                >
                                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
