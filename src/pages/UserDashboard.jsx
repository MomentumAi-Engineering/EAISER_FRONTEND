import React, { useState } from 'react';
import { Activity, CheckCircle, Clock, AlertCircle, TrendingUp, BarChart3, Filter, Calendar, Download, RefreshCw, Bell, Search, Home } from 'lucide-react';

export default function UserDashboard() {
  const [stats] = useState({
    totalReported: 47,
    resolved: 32,
    pending: 15,
    activeRate: 68
  });

  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState(3);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const recentIssues = [
    { id: 1, title: 'Login page not responsive', status: 'resolved', date: '2 days ago', category: 'UI/UX' },
    { id: 2, title: 'Payment gateway error', status: 'pending', date: '5 hours ago', category: 'Payment' },
    { id: 3, title: 'Email notification bug', status: 'resolved', date: '1 week ago', category: 'Backend' },
    { id: 4, title: 'Dashboard loading slow', status: 'pending', date: '3 days ago', category: 'Performance' },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-yellow-500/20 p-4 hover:border-yellow-500/40 transition-all duration-300 hover:scale-105 cursor-pointer">
      <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full blur-2xl"></div>
      
      <div className="relative z-10 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-yellow-400" />
        </div>
        
        <div>
          <p className="text-gray-400 text-xs font-medium">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.location.href = '/'}
              className="w-10 h-10 rounded-lg bg-zinc-800 border border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/10 flex items-center justify-center transition-all"
              title="Back to Home"
            >
              <Home className="w-5 h-5 text-yellow-400" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 text-sm">Welcome back, User</p>
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
            <button className="relative p-2 bg-zinc-800 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

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
          />
          
          <StatCard
            icon={CheckCircle}
            label="Resolved"
            value={stats.resolved}
            color="bg-green-500/10"
          />
          
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pending}
            color="bg-orange-500/10"
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-3 gap-6">
          {/* Recent Issues List */}
          <div className="col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl border border-yellow-500/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Issues</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${filter === 'all' ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-gray-400'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${filter === 'pending' ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-gray-400'}`}
                >
                  Pending
                </button>
                <button 
                  onClick={() => setFilter('resolved')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${filter === 'resolved' ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-gray-400'}`}
                >
                  Resolved
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {recentIssues
                .filter(issue => filter === 'all' || issue.status === filter)
                .map((issue) => (
                <div 
                  key={issue.id}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-yellow-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium group-hover:text-yellow-400 transition-colors">
                        {issue.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          issue.status === 'resolved' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {issue.status}
                        </span>
                        <span className="text-gray-500 text-xs">{issue.category}</span>
                        <span className="text-gray-500 text-xs">{issue.date}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl border border-yellow-500/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-bold">Resolution Rate</h3>
              </div>
              
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-yellow-400">{stats.activeRate}%</p>
                <p className="text-gray-400 text-sm mt-1">Success Rate</p>
              </div>

              <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-1000"
                  style={{ width: `${stats.activeRate}%` }}
                ></div>
              </div>
            </div>

            {/* Activity */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl border border-yellow-500/20 p-5">
              <h3 className="text-white font-bold mb-4">This Week</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Issues Reported</span>
                  <span className="text-white font-semibold">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Response</span>
                  <span className="text-white font-semibold">2.4h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Days</span>
                  <span className="text-white font-semibold">5/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}