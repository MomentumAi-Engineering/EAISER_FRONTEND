
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Clock, Brain, MapPin, Flame, Activity } from 'lucide-react';
import apiClient from '../services/apiClient';

const Card = ({ title, children, className = '' }) => (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-5 flex flex-col ${className}`}>
        <h3 className="text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wider flex items-center gap-2">
            {title}
        </h3>
        <div className="flex-1 min-h-[200px] flex flex-col w-full h-full">
            {children}
        </div>
    </div>
);

export default function DashboardAnalytics({ reviews }) {
    const [analytics, setAnalytics] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const data = await apiClient.getDashboardAnalytics();
                setAnalytics(data);
            } catch (err) {
                console.error("Analytics fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
        // Refresh every 2 minutes
        const interval = setInterval(fetchAnalytics, 120000);
        return () => clearInterval(interval);
    }, []);

    // Use REAL data from backend, fallback to computed from reviews prop
    const counts = analytics?.counts || {};
    const chartData = analytics?.chart_data || [];
    const trendPct = analytics?.trend_percentage || 0;
    const trendDir = analytics?.trend_direction || 'up';
    const avgResolution = analytics?.avg_resolution_hours || 0;
    const systemLoad = analytics?.system_load || 0;
    const hotspots = analytics?.hotspots || [];
    const recentSubmissions = analytics?.recent_submissions_1h || 0;

    // Pie chart from REAL counts
    const distributionData = [
        { name: 'Pending', value: counts.pending || reviews.filter(r => r.status === 'pending_review' || r.status === 'needs_review' || r.status === 'pending').length, color: '#f59e0b' },
        { name: 'Approved', value: counts.approved || reviews.filter(r => ['approved', 'submitted'].includes(r.status)).length, color: '#10b981' },
        { name: 'Rejected', value: counts.rejected || reviews.filter(r => ['rejected', 'declined'].includes(r.status)).length, color: '#ef4444' },
    ];

    // Format resolution time nicely
    const formatResolution = (hours) => {
        if (hours === 0) return 'N/A';
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        if (hours < 24) return `${hours}h`;
        return `${Math.round(hours / 24)}d`;
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-xl p-5 h-[280px] animate-pulse" />
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 h-[280px] animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 h-[200px] animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Row: AI Prediction + Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title={<><Brain className="w-4 h-4 text-purple-500" /> AI Issue Forecast</>} className="lg:col-span-2">
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorPredicted)" name="AI Prediction" />
                                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Actual Reports" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 text-center">
                        AI Model v2.1 predicts <span className={trendDir === 'up' ? "text-purple-400 font-bold" : "text-green-400 font-bold"}>
                            {trendDir === 'up' ? '+' : ''}{trendPct}% {trendDir === 'up' ? 'surge' : 'drop'}
                        </span> in reports this week.
                    </div>
                </Card>

                <Card title="Issue Status">
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-3 mt-4 flex-wrap">
                        {distributionData.map((item, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-[10px] uppercase font-bold text-gray-400">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Bottom Row: Real Metrics + Hotspots */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Avg Resolution Time - REAL */}
                <Card title="Avg Resolution Time">
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <Clock className="w-10 h-10 text-blue-500 animate-pulse" />
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="#1f2937" strokeWidth="8" fill="none" />
                                <circle cx="64" cy="64" r="56" stroke="#3b82f6" strokeWidth="8" fill="none"
                                    strokeDasharray="351"
                                    strokeDashoffset={351 - (351 * Math.min(avgResolution / 48, 1))}
                                    strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="mt-4 text-center">
                            <span className="text-3xl font-bold text-white">{formatResolution(avgResolution)}</span>
                            <p className="text-xs text-gray-500 mt-1">From real resolved issues</p>
                        </div>
                    </div>
                </Card>

                {/* System Activity - REAL */}
                <Card title="System Activity">
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <Activity className="w-10 h-10 text-amber-500" />
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="#1f2937" strokeWidth="8" fill="none" />
                                <circle cx="64" cy="64" r="56" stroke="#f59e0b" strokeWidth="8" fill="none"
                                    strokeDasharray="351"
                                    strokeDashoffset={351 - (351 * systemLoad / 100)}
                                    strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="mt-4 text-center">
                            <span className="text-3xl font-bold text-amber-500">{systemLoad}%</span>
                            <p className="text-xs text-gray-500 mt-1">{recentSubmissions} submissions last hour</p>
                        </div>
                    </div>
                </Card>

                {/* Top Hotspot Locations - REAL */}
                <Card title={<><MapPin className="w-4 h-4 text-red-500" /> Top Hotspots</>} className="lg:col-span-2">
                    <div className="space-y-2 overflow-y-auto max-h-[220px] pr-2">
                        {hotspots.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No hotspot data yet</p>
                            </div>
                        ) : (
                            hotspots.map((spot, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2 group hover:bg-gray-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                            ${i === 0 ? 'bg-red-500/20 text-red-400' : i === 1 ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700 text-gray-300'}`}>
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white truncate max-w-[200px]">{spot.location}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Flame className={`w-3 h-3 ${spot.count >= 5 ? 'text-red-500' : 'text-orange-400'}`} />
                                        <span className="text-sm font-bold text-white">{spot.count}</span>
                                        <span className="text-xs text-gray-500">reports</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
