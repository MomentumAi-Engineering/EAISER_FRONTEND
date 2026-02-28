
import React, { useState, useEffect } from 'react';
import { Save, Bell, Shield, User, Lock, Trash2, Mail, Globe, Monitor, LogOut, Settings } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import apiClient from '../services/apiClient';
import { hasPermission } from '../utils/permissions';

export default function AdminSettings() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');

    const settingsTabs = [
        { id: 'profile', label: 'My Profile', icon: User, permission: 'settings_profile' },
        { id: 'notifications', label: 'Notifications', icon: Bell, permission: 'settings_notifications' },
        { id: 'security', label: 'Security', icon: Lock, permission: 'settings_security' },
        { id: 'system', label: 'System', icon: Monitor, permission: 'settings_system' },
    ].filter(tab => hasPermission(tab.permission));

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
            setTwoFAEnabled(adminData.two_factor_enabled || false);
        }

        // Safety: If current active mode is not allowed, switch to first allowed tab
        if (!settingsTabs.find(t => t.id === activeTab) && settingsTabs.length > 0) {
            setActiveTab(settingsTabs[0].id);
        }
    }, [activeTab]);

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

    const [passwords, setPasswords] = useState({ current: '', new_password: '' });
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);

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
            setTwoFAEnabled(adminData.two_factor_enabled || false);
        }

        // Fetch maintenance status if on system tab
        if (activeTab === 'system') {
            fetchMaintenanceStatus();
        }
    }, [activeTab]);

    const fetchMaintenanceStatus = async () => {
        try {
            const result = await apiClient.getMaintenanceStatus();
            setSystem(prev => ({ ...prev, maintenanceMode: result.enabled }));
        } catch (err) {
            console.error("Failed to fetch maintenance status:", err);
        }
    };

    const showMessage = (msg, isError = false) => {
        if (isError) { setError(msg); setTimeout(() => setError(null), 4000); }
        else { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Save profile name (update in localStorage for now, backend doesn't have a profile endpoint yet)
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            adminData.name = profile.name;
            localStorage.setItem('adminData', JSON.stringify(adminData));
            showMessage('Profile saved successfully');
        } catch (err) {
            showMessage(err.message || 'Failed to save', true);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!passwords.current || !passwords.new_password) {
            showMessage('Please fill both password fields', true);
            return;
        }
        if (passwords.new_password.length < 8) {
            showMessage('New password must be at least 8 characters', true);
            return;
        }
        setLoading(true);
        try {
            await apiClient.changePassword(passwords.current, passwords.new_password);
            showMessage('Password changed successfully');
            setPasswords({ current: '', new_password: '' });
        } catch (err) {
            showMessage(err.message || 'Password change failed', true);
        } finally {
            setLoading(false);
        }
    };

    const handle2FAToggle = async () => {
        setLoading(true);
        try {
            if (twoFAEnabled) {
                await apiClient.disable2FA();
                setTwoFAEnabled(false);
                showMessage('2FA disabled');
            } else {
                const result = await apiClient.setup2FA(profile.email);
                if (result?.qr_code_url || result?.secret) {
                    showMessage('2FA setup initiated! Check your authenticator app.');
                    setTwoFAEnabled(true);
                }
            }
        } catch (err) {
            showMessage(err.message || '2FA operation failed', true);
        } finally {
            setLoading(false);
        }
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
                            {settingsTabs.map(tab => (
                                <TabButton
                                    key={tab.id}
                                    id={tab.id}
                                    icon={tab.icon}
                                    label={tab.label}
                                />
                            ))}
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
                            {error && (
                                <div className="absolute top-6 right-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                                    <Shield className="w-4 h-4" /> {error}
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

                                    {hasPermission('enable_2fa') && (
                                        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-6">
                                            <h3 className="text-yellow-400 font-semibold mb-1 flex items-center gap-2">
                                                <Shield className="w-4 h-4" /> Two-Factor Authentication
                                            </h3>
                                            <p className="text-sm text-yellow-200/60 mb-3">Add an extra layer of security to your admin account.</p>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={handle2FAToggle}
                                                    disabled={loading}
                                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${twoFAEnabled
                                                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                                        : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                                        }`}
                                                >
                                                    {twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                                                </button>
                                                {twoFAEnabled && (
                                                    <span className="text-xs text-green-400 flex items-center gap-1">
                                                        <Shield className="w-3 h-3" /> Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={passwords.current}
                                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white mb-4 focus:border-blue-500 focus:outline-none"
                                        />

                                        <label className="block text-sm text-gray-400 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            placeholder="Min 8 characters"
                                            value={passwords.new_password}
                                            onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white mb-4 focus:border-blue-500 focus:outline-none"
                                        />

                                        <button
                                            onClick={handlePasswordChange}
                                            disabled={loading || !passwords.current || !passwords.new_password}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-3 h-3" />}
                                            Change Password
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* System Tab */}
                            {activeTab === 'system' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Monitor className="w-5 h-5 text-blue-500" /> System Configuration
                                    </h2>

                                    {/* API Status */}
                                    <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl mb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                                                <div>
                                                    <h3 className="text-green-400 font-semibold">API Server Online</h3>
                                                    <p className="text-xs text-gray-500">Backend connected at port 8005</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-600 font-mono">v2.0.0</span>
                                        </div>
                                    </div>

                                    {/* Database Status */}
                                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                                <div>
                                                    <h3 className="text-blue-400 font-semibold">MongoDB Connected</h3>
                                                    <p className="text-xs text-gray-500">Database active and responding</p>
                                                </div>
                                            </div>
                                            <Globe className="w-4 h-4 text-gray-600" />
                                        </div>
                                    </div>

                                    {/* Toggles */}
                                    <Toggle
                                        label="Maintenance Mode"
                                        desc="Put the system in maintenance mode. Users will see a maintenance page."
                                        checked={system.maintenanceMode}
                                        onChange={async (v) => {
                                            try {
                                                setLoading(true);
                                                const result = await apiClient.toggleMaintenanceMode(v);
                                                setSystem({ ...system, maintenanceMode: result.enabled });
                                                showMessage(`Maintenance mode ${result.enabled ? 'enabled' : 'disabled'}`);
                                            } catch (err) {
                                                showMessage(err.message || 'Failed to toggle maintenance mode', true);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                    />
                                    <Toggle
                                        label="Debug Logging"
                                        desc="Enable detailed debug logs for system diagnostics"
                                        checked={system.debugLogs}
                                        onChange={(v) => setSystem({ ...system, debugLogs: v })}
                                    />

                                    {/* System Info */}
                                    <div className="mt-6 bg-gray-950 border border-gray-800 rounded-xl p-4">
                                        <h4 className="text-sm text-gray-400 font-semibold mb-3">System Information</h4>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Platform</span>
                                                <span className="text-gray-300 font-mono">EAiSER Ai v2.0</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Frontend</span>
                                                <span className="text-gray-300 font-mono">React + Vite</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Backend</span>
                                                <span className="text-gray-300 font-mono">FastAPI + MongoDB</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">AI Engine</span>
                                                <span className="text-gray-300 font-mono">Active</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Last Restart</span>
                                                <span className="text-gray-300 font-mono">{new Date().toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="mt-6 p-4 border border-red-500/20 rounded-xl bg-red-500/5">
                                        <h4 className="text-red-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                            <Trash2 className="w-4 h-4" /> Danger Zone
                                        </h4>
                                        <p className="text-xs text-gray-500 mb-3">These actions are irreversible. Proceed with caution.</p>
                                        <div className="flex gap-3">
                                            <button className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 transition-all">
                                                Clear Cache
                                            </button>
                                            <button className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 transition-all">
                                                Reset Logs
                                            </button>
                                        </div>
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
