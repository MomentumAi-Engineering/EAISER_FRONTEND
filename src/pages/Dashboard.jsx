import { useEffect, useState } from 'react';
import { FiBarChart2, FiCheckCircle, FiClock, FiX, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { API_BASE_URL } from '../config';

function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/issues`);
      const data = await res.json();
      setIssues(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      // Fallback demo data if API not available
      setIssues([
        { id: 1, title: 'Streetlight outage', status: 'in-progress', priority: 'high', location: 'Main St', date: new Date().toISOString() },
        { id: 2, title: 'Pothole near school', status: 'resolved', priority: 'medium', location: 'Maple Ave', date: new Date(Date.now() - 86400000).toISOString() },
        { id: 3, title: 'Broken bench in park', status: 'rejected', priority: 'low', location: 'Central Park', date: new Date(Date.now() - 2 * 86400000).toISOString() },
        { id: 4, title: 'Overflowing trash can', status: 'in-progress', priority: 'high', location: '5th Ave', date: new Date(Date.now() - 3 * 86400000).toISOString() },
      ]);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const total = issues.length;
  const resolved = issues.filter(i => i.status?.toLowerCase() === 'resolved').length;
  const inProgress = issues.filter(i => i.status?.toLowerCase() === 'in-progress').length;
  const rejected = issues.filter(i => i.status?.toLowerCase() === 'rejected').length;
  const recentIssues = [...issues].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <div className="text-xs md:text-sm text-slate-400">
            {lastUpdated ? `Last updated ${lastUpdated.toLocaleString()}` : 'Loading...'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Issues" value={total} icon={<FiBarChart2 />} color="from-indigo-500 to-purple-500" />
          <StatCard title="Resolved" value={resolved} icon={<FiCheckCircle />} color="from-green-500 to-emerald-500" />
          <StatCard title="In Progress" value={inProgress} icon={<FiClock />} color="from-blue-500 to-indigo-500" />
          <StatCard title="Rejected" value={rejected} icon={<FiX />} color="from-red-500 to-pink-500" />
        </div>

        <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FiTrendingUp /> Recent Issues
            </h2>
            <span className="text-xs text-slate-400">Showing latest {recentIssues.length}</span>
          </div>
          <ul className="divide-y divide-white/10">
            {loading && (
              <li className="px-4 py-6 text-slate-400">Fetching latest issues…</li>
            )}
            {!loading && recentIssues.length === 0 && (
              <li className="px-4 py-6 text-slate-400">No issues found.</li>
            )}
            {!loading && recentIssues.map((issue) => (
              <li key={issue.id || issue._id} className="px-4 py-4 flex items-start gap-4 hover:bg-white/5 transition">
                <StatusBadge status={issue.status} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm md:text-base font-semibold">{issue.title}</h3>
                    <span className="text-xs text-slate-400">{new Date(issue.date).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{issue.location}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur border border-white/10 shadow">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">{title}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  if (s === 'resolved') return (
    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs bg-green-500/15 text-green-300 border border-green-500/20">
      <FiCheckCircle /> Resolved
    </span>
  );
  if (s === 'in-progress') return (
    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs bg-blue-500/15 text-blue-300 border border-blue-500/20">
      <FiClock /> In Progress
    </span>
  );
  if (s === 'rejected') return (
    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs bg-red-500/15 text-red-300 border border-red-500/20">
      <FiX /> Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs bg-yellow-500/15 text-yellow-200 border border-yellow-500/20">
      <FiAlertCircle /> Pending
    </span>
  );
}

export default Dashboard;