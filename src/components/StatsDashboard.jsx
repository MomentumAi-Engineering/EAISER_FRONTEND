import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { BarChart3, TrendingUp, Users, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { hasPermission, getCurrentAdmin } from '../utils/permissions';

export default function StatsDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const currentAdmin = getCurrentAdmin();

    useEffect(() => {
        if (!hasPermission('view_stats')) {
            navigate('/admin/dashboard', { replace: true });
            return;
        }
        fetchStats();
    }, [navigate]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            // Fetch stats from backend
            const data = await apiClient.getAdminStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading statistics...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-blue-500">
                            Statistics Dashboard
                        </h1>
                        <p className="text-gray-400 mt-2">Overview of system performance and metrics</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
                    >
                        ← Back
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={<AlertCircle className="w-8 h-8" />}
                        title="Total Issues"
                        value={stats?.total_issues || 0}
                        color="blue"
                    />
                    <StatCard
                        icon={<Clock className="w-8 h-8" />}
                        title="Pending Review"
                        value={stats?.pending_review || 0}
                        color="yellow"
                    />
                    <StatCard
                        icon={<CheckCircle className="w-8 h-8" />}
                        title="Approved"
                        value={stats?.approved || 0}
                        color="green"
                    />
                    <StatCard
                        icon={<XCircle className="w-8 h-8" />}
                        title="Declined"
                        value={stats?.declined || 0}
                        color="red"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Issue Types */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                            Issues by Type
                        </h3>
                        <div className="space-y-3">
                            {stats?.by_type && Object.entries(stats.by_type).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between">
                                    <span className="text-gray-300 capitalize">{type}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{ width: `${(count / stats.total_issues) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-white font-semibold w-12 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Team Performance */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-400" />
                            Team Performance
                        </h3>
                        <div className="space-y-3">
                            {stats?.team_performance && stats.team_performance.map((member) => (
                                <div key={member.email} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">{member.name}</p>
                                        <p className="text-gray-500 text-xs">{member.role}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-green-400 font-semibold">{member.resolved} resolved</p>
                                        <p className="text-gray-500 text-xs">{member.assigned} assigned</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        Recent Activity
                    </h3>
                    <div className="space-y-2">
                        {stats?.recent_activity && stats.recent_activity.map((activity, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <div className="flex-1">
                                    <p className="text-gray-300">{activity.description}</p>
                                    <p className="text-gray-500 text-xs">{new Date(activity.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, title, value, color }) {
    const colorClasses = {
        blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
        yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400',
        green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
        red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
        purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400'
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm rounded-xl p-6`}>
            <div className="flex items-center justify-between mb-4">
                <div className={colorClasses[color]}>{icon}</div>
            </div>
            <div>
                <p className="text-gray-400 text-sm mb-1">{title}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
}
