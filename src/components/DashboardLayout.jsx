import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    FileText,
    Users,
    BarChart3,
    Settings,
    Shield,
    MapPin,
    Building2,
    ChevronLeft,
    ChevronRight,
    Bell,
    Search,
    LogOut,
    Menu,
    X,
    UserCircle,
    CheckCircle2,
    Globe,
    History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

/**
 * DashboardLayout Component
 * 
 * Enterprise-grade dashboard layout with:
 * - Collapsible sidebar
 * - Top header with search
 * - Role-based navigation
 * - Real-time Notifications
 * - Professional design
 */
export default function DashboardLayout({ children, currentPage = 'dashboard' }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState(0);
    const [recentAlert, setRecentAlert] = useState(null); // { message, type }
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [notificationList, setNotificationList] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();

    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const adminName = adminData.name || 'Admin';
    const adminRole = adminData.role || 'admin';

    // Navigation items
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        { id: 'warroom', label: 'Live War Room', icon: Globe, path: '/admin/warroom', badge: 'LIVE' },
        { id: 'reviews', label: 'Reviews', icon: FileText, path: '/admin/dashboard', badge: notifications > 99 ? '99+' : (notifications > 0 ? notifications : null) },
        { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
        { id: 'team', label: 'Team', icon: Shield, path: '/admin/team' },
        { id: 'stats', label: 'Analytics', icon: BarChart3, path: '/admin/stats' }, // Added Team here
        { id: 'audit', label: 'Audit Log', icon: History, path: '/admin/audit' },
        { id: 'mapping', label: 'Mapping', icon: MapPin, path: '/admin/mapping' },
        { id: 'authorities', label: 'Authorities', icon: Building2, path: '/admin/authorities' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
    ];

    // Sound helper
    const playNotificationSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;

            // Channel 1: High alert sawtooth
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.connect(gain1); gain1.connect(audioCtx.destination);
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(900, now);
            gain1.gain.setValueAtTime(0.4, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

            // Channel 2: Contrast beep
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2); gain2.connect(audioCtx.destination);
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(1200, now + 0.25);
            gain2.gain.setValueAtTime(0, now);
            gain2.gain.setValueAtTime(0.3, now + 0.25);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

            osc1.start(now); osc1.stop(now + 0.2);
            osc2.start(now + 0.25); osc2.stop(now + 0.5);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        checkNotifications();
        const interval = setInterval(checkNotifications, 45000); // 45s polling
        return () => clearInterval(interval);
    }, []);

    const checkNotifications = async () => {
        try {
            const reviews = await apiClient.getPendingReviews();
            const count = reviews.length;

            setNotifications(prev => {
                if (count > prev && prev !== 0) {
                    playNotificationSound();
                    const newItems = reviews.slice(0, count - prev).map(r => ({
                        id: r._id || r.issue_id,
                        title: `New ${r.issue_type || 'Issue'}`,
                        desc: r.address || 'Unknown Location',
                        time: 'Just now',
                        type: r.severity?.toLowerCase() === 'high' ? 'critical' : 'info'
                    }));
                    setNotificationList(prevList => [...newItems, ...prevList].slice(0, 10));
                    showToast(`System: ${newItems.length} new reports pending`, 'info');
                }
                return count;
            });

            // Initial population
            if (notificationList.length === 0 && reviews.length > 0) {
                setNotificationList(reviews.slice(0, 5).map(r => ({
                    id: r._id || r.issue_id,
                    title: r.issue_type || 'Infrastructure Issue',
                    desc: r.address || 'Pending review',
                    time: 'Recent',
                    type: 'info'
                })));
            }
        } catch (error) { console.error(error); }
    };

    const showToast = (message, type = 'info') => {
        setRecentAlert({ message, type });
        setTimeout(() => setRecentAlert(null), 5000);
    };

    const handleLogout = (e) => {
        e.stopPropagation();
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        navigate('/admin');
    };

    const handleProfileClick = () => {
        navigate('/admin/settings');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex overflow-hidden">

            {/* Toast Notification */}
            {recentAlert && (
                <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
                    <div className="bg-blue-600/90 backdrop-blur text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-blue-400/30">
                        <div className="bg-white/20 p-2 rounded-full">
                            <Bell className="w-5 h-5 animate-bounce" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider">System Alert</h4>
                            <p className="text-sm">{recentAlert.message}</p>
                        </div>
                        <button onClick={() => setRecentAlert(null)} className="ml-2 hover:bg-white/10 p-1 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full bg-gray-900/80 backdrop-blur-xl border-r border-gray-800/50 transition-all duration-300 z-40 flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-64'
                    } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                {/* Sidebar Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800/50 flex-shrink-0 bg-black/20">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-wide">
                                EAiSER <span className="text-xs font-normal text-gray-500 block -mt-1 tracking-widest">ADMIN</span>
                            </span>
                        </div>
                    )}

                    {/* Toggle Button for Desktop */}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 hover:bg-gray-800/50 text-gray-400 hover:text-white rounded-lg transition-colors hidden md:block ml-auto"
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>

                    {/* Close Button for Mobile */}
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors md:hidden ml-auto text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    navigate(item.path);
                                    setMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                    : 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                {!sidebarCollapsed && (
                                    <>
                                        <span className="flex-1 text-left text-sm font-medium tracking-wide">{item.label}</span>
                                        {item.badge && (
                                            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-red-500/40 animate-pulse">
                                                {item.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-3 border-t border-gray-800/50 bg-black/20">
                    <div
                        onClick={handleProfileClick}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer transition-all border border-transparent hover:border-gray-700/50 ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-purple-500/20 border border-white/10">
                            {adminName.charAt(0).toUpperCase()}
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{adminName}</p>
                                <p className="text-[11px] text-blue-400 capitalize tracking-wide font-medium">{adminRole.replace('_', ' ')}</p>
                            </div>
                        )}
                        {!sidebarCollapsed && (
                            <LogOut
                                onClick={handleLogout}
                                className="w-4 h-4 text-gray-500 hover:text-red-400 transition-colors"
                            />
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col h-screen transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                {/* Top Header */}
                <header className="h-16 bg-gray-900/50 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between px-6 sticky top-0 z-30">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors md:hidden text-gray-400"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-xl mx-4 hidden md:block">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search issues, users, reports..."
                                className="w-full pl-10 pr-4 py-2 bg-black/20 border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all hover:bg-black/30"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* Environment Badge */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/5 border border-green-500/20 rounded-lg">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-green-500">System Online</span>
                        </div>

                        <div className="h-6 w-px bg-gray-800"></div>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'}`}
                            >
                                <Bell className={`w-5 h-5 ${notifications > 0 ? 'animate-pulse' : ''}`} />
                                {notifications > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold flex items-center justify-center rounded-full border border-gray-900">
                                        {notifications > 9 ? '9+' : notifications}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in slide-in-from-top-2">
                                    <div className="p-4 border-b border-gray-800 bg-gray-800/30 flex justify-between items-center">
                                        <h4 className="font-bold text-sm">System Notifications</h4>
                                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Real-time</span>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                        {notificationList.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500 italic text-sm">
                                                No active alerts
                                            </div>
                                        ) : (
                                            notificationList.map((item, idx) => (
                                                <div
                                                    key={item.id + idx}
                                                    className={`p-4 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer group`}
                                                    onClick={() => navigate('/admin/dashboard')}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                            {item.type === 'critical' ? <Shield className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate capitalize">{item.title}</p>
                                                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.desc}</p>
                                                            <p className="text-[10px] text-gray-600 mt-1 uppercase font-semibold">{item.time}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <button
                                        onClick={() => navigate('/admin/dashboard')}
                                        className="w-full py-3 text-center text-[11px] text-gray-500 hover:text-white hover:bg-gray-800/50 font-bold uppercase tracking-tighter"
                                    >
                                        View All Reports
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content Scrollable Area */}
                <main className="flex-1 overflow-auto p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 to-black">
                    {children}
                </main>
            </div>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                ></div>
            )}
            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                <LogOut className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Confirm Logout?</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Are you sure you want to end your secure session? You will be redirected to the login screen.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-lg shadow-red-900/20 transition-all"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
