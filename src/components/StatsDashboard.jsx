import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { ArrowLeft, RefreshCw, AlertTriangle, FileText, CheckCircle2, TrendingUp, Users, AlertCircle, Clock, Calendar, BarChart3, Brain, Zap, Cpu, Loader2, XCircle } from 'lucide-react';
import { hasPermission, getCurrentAdmin } from '../utils/permissions';

const CountUp = ({ end, duration = 2000, decimals = 0, separator = ',' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Easing function for smooth effect
            const easeOutQuart = 1 - Math.pow(1 - percentage, 4);

            setCount(easeOutQuart * end);

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return <>{count.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })}</>;
};

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
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-blue-500 flex items-center gap-3">
                            Statistics Dashboard
                            {currentAdmin && (
                                <span className={`text-xs px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700 capitalize`}>
                                    Role: {currentAdmin.role?.replace('_', ' ')}
                                </span>
                            )}
                        </h1>
                        <p className="text-gray-400 mt-2">Overview of system performance and metrics</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={fetchStats}
                        className="ml-3 p-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all border border-gray-700 hover:border-gray-600 hover:text-white"
                        title="Refresh Stats"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Debug Info for User */}
                {currentAdmin?.role === 'super_admin' && !stats?.financials && (
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6 text-red-300">
                        ⚠️ You are Super Admin, but financial data is missing from the server response. Check backend logs.
                    </div>
                )}
                {/* 🟢 ADVANCED SYSTEM ANALYSIS (SUPER ADMIN) */}
                {stats.financials && stats.ai_performance && (
                    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                                <Cpu className="w-5 h-5 text-amber-500" />
                            </div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
                                Advanced System Analysis
                            </h2>
                            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                                SUPER ADMIN
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                            {/* 1. Model Info - Large Card */}
                            <div className="md:col-span-2 bg-gradient-to-br from-gray-900 to-amber-950/30 border border-amber-500/20 rounded-xl p-5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Brain className="w-24 h-24 text-amber-500" />
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-amber-400 text-sm font-semibold tracking-wider mb-1">ACTIVE MODEL</h3>
                                    <div className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                        {stats.ai_performance.provider} {stats.ai_performance.model_name}
                                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1">
                                            <Zap className="w-3 h-3 fill-current" /> Active
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase">Architecture</p>
                                            <p className="text-gray-300 font-mono text-sm">{stats.ai_performance.architecture}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase">Context Window</p>
                                            <p className="text-gray-300 font-mono text-sm">{stats.ai_performance.context_window}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Performance Metrics */}
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
                                <div>
                                    <p className="text-gray-400 text-xs font-semibold mb-1">AVG CONFIDENCE</p>
                                    <div className="text-3xl font-bold text-white">
                                        <CountUp end={stats.ai_performance.avg_confidence} decimals={1} duration={2} />%
                                    </div>
                                </div>
                                <div className="mt-2 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full" style={{ width: `${stats.ai_performance.avg_confidence}%` }}></div>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
                                <div>
                                    <p className="text-gray-400 text-xs font-semibold mb-1">AVG RESPONSE TIME</p>
                                    <div className="text-3xl font-bold text-white">
                                        <CountUp end={stats.ai_performance.avg_latency_ms} duration={2} separator="," /> <span className="text-sm font-normal text-gray-500">ms</span>
                                    </div>
                                </div>
                                <p className="text-xs text-green-400 flex items-center gap-1 mt-2">
                                    <Zap className="w-3 h-3" /> Optimized
                                </p>
                            </div>

                            {/* 3. Financial Row - Spanning Full Width underneath */}

                            {/* Total Reports */}
                            <div className="bg-black/40 border border-gray-800 rounded-xl p-4 flex flex-col justify-center">
                                <p className="text-gray-500 text-xs uppercase">Total Processed Reports</p>
                                <p className="text-2xl font-bold text-white"><CountUp end={stats.financials.total_ai_reports} duration={2} /></p>
                            </div>

                            {/* Cost Per Query */}
                            <div className="bg-black/40 border border-gray-800 rounded-xl p-4 flex flex-col justify-center">
                                <p className="text-gray-500 text-xs uppercase">Cost Per Query</p>
                                <p className="text-2xl font-bold text-white">${stats.financials.cost_per_report}</p>
                            </div>

                            {/* Total Spend */}
                            <div className="md:col-span-2 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-amber-500 text-xs font-bold uppercase mb-1">Total System Spend (Lifetime)</p>
                                    <p className="text-3xl font-bold text-white mb-1">
                                        $<CountUp end={Math.floor(stats.financials.total_cost_usd)} duration={2} />
                                        <span className="text-lg text-gray-400">{(stats.financials.total_cost_usd % 1).toFixed(4).substring(1)}</span>
                                    </p>
                                    <p className="text-[10px] text-gray-500">Currency: {stats.financials.currency}</p>
                                </div>
                                <div className="absolute right-0 bottom-0 opacity-10">
                                    <TrendingUp className="w-24 h-24 text-amber-500" />
                                </div>
                            </div>

                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Issues"
                        value={<CountUp end={stats.total_issues || 0} />}
                        icon={<FileText className="w-8 h-8" />}
                        color="blue"
                    />
                    <StatCard
                        title="Pending Review"
                        value={<CountUp end={stats.pending_review || 0} />}
                        icon={<Clock className="w-8 h-8" />}
                        color="yellow"
                    />
                    <StatCard
                        title="Approved"
                        value={<CountUp end={stats.approved || 0} />}
                        icon={<CheckCircle2 className="w-8 h-8" />}
                        color="green"
                    />
                    <StatCard
                        title="Declined"
                        value={<CountUp end={stats.declined || 0} />}
                        icon={<XCircle className="w-8 h-8" />}
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
                                    <span className="text-gray-300 capitalize">{type.replace(/_/g, ' ')}</span>
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
        </div >
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
