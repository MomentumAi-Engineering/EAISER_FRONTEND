import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Loader2, AlertTriangle, CheckCircle2, MapPin, Save, List, Edit2, Search, X, BarChart3, Activity, History, Check, XCircle, Send } from 'lucide-react';
import Warning from './Warning';
import { useNavigate } from 'react-router-dom';
import { adminPath } from '../utils/adminPaths';

const MappingReview = () => {
    const [entries, setEntries] = useState([]);
    const [allMappings, setAllMappings] = useState({});
    const [statsData, setStatsData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ count: 0, total_unmapped: 0 });
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    // Mapping Editor State
    const [editingMapping, setEditingMapping] = useState(null);
    const [editorSaving, setEditorSaving] = useState(false);

    // Per-entry action state
    const [entryAction, setEntryAction] = useState({});  // { [id]: 'approve' | 'reject' | null }
    const [entryDept, setEntryDept] = useState({});       // { [id]: 'dept_name' }
    const [entryReason, setEntryReason] = useState({});   // { [id]: 'reason text' }
    const [processing, setProcessing] = useState({});     // { [id]: true/false }
    const [actionResult, setActionResult] = useState({}); // { [id]: { ok, msg } }

    const departments = [
        "public_works", "sanitation", "parks_recreation", "transportation",
        "police", "fire_department", "animal_control", "water_department",
        "power_utility", "health_department", "environmental_protection",
        "housing_authority", "general", "building_inspection", "emergency",
        "code_enforcement", "property_management"
    ];

    useEffect(() => { fetchData(); }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'dashboard') {
                const data = await apiClient.getMappingStats();
                setStatsData(data);
                const unmappedData = await apiClient.getUnmappedIssues(false, 1);
                setStats({ count: unmappedData.count, total_unmapped: unmappedData.total_unmapped });
            } else if (activeTab === 'review') {
                const data = await apiClient.getUnmappedIssues();
                setEntries(data.entries || []);
                setStats({ count: data.count, total_unmapped: data.total_unmapped });
            } else if (activeTab === 'history') {
                const data = await apiClient.getMappingHistory();
                setHistoryData(data || []);
            } else {
                const data = await apiClient.getAllMappings();
                setAllMappings(data || {});
            }
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── APPROVE ──────────────────────────────────────────────
    const handleApprove = async (entry) => {
        const dept = entryDept[entry.id];
        if (!dept) return alert('Please select a department first.');
        setProcessing(p => ({ ...p, [entry.id]: true }));
        try {
            const res = await apiClient.resolveMapping(entry.id, entry.issue_type, dept);
            setActionResult(r => ({
                ...r,
                [entry.id]: {
                    ok: true,
                    msg: res.dispatched
                        ? '✅ Approved & dispatched to authority!'
                        : '✅ Approved! Email dispatch may have failed — check backend logs.'
                }
            }));
            setTimeout(() => setEntries(prev => prev.filter(e => e.id !== entry.id)), 2500);
            setStats(prev => ({ ...prev, total_unmapped: Math.max(0, prev.total_unmapped - 1) }));
        } catch (err) {
            setActionResult(r => ({ ...r, [entry.id]: { ok: false, msg: `❌ Failed: ${err.message}` } }));
        } finally {
            setProcessing(p => ({ ...p, [entry.id]: false }));
        }
    };

    // ── REJECT ───────────────────────────────────────────────
    const handleReject = async (entry) => {
        const reason = entryReason[entry.id] || 'Issue could not be verified by admin.';
        setProcessing(p => ({ ...p, [entry.id]: true }));
        try {
            await apiClient.rejectMapping(entry.id, reason);
            setActionResult(r => ({ ...r, [entry.id]: { ok: true, msg: '🚫 Issue rejected & screened out.' } }));
            setTimeout(() => setEntries(prev => prev.filter(e => e.id !== entry.id)), 2500);
            setStats(prev => ({ ...prev, total_unmapped: Math.max(0, prev.total_unmapped - 1) }));
        } catch (err) {
            setActionResult(r => ({ ...r, [entry.id]: { ok: false, msg: `❌ Failed: ${err.message}` } }));
        } finally {
            setProcessing(p => ({ ...p, [entry.id]: false }));
        }
    };

    // ── EDITOR ───────────────────────────────────────────────
    const handleEditMapping = (type, depts) => setEditingMapping({ issue_type: type, departments: depts });

    const handleSaveMapping = async () => {
        if (!editingMapping) return;
        setEditorSaving(true);
        try {
            await apiClient.updateMapping(editingMapping.issue_type, editingMapping.departments);
            setAllMappings(prev => ({ ...prev, [editingMapping.issue_type]: editingMapping.departments }));
            setEditingMapping(null);
            alert('Mapping updated successfully!');
        } catch (err) {
            alert('Failed to save: ' + err.message);
        } finally {
            setEditorSaving(false);
        }
    };

    const toggleDepartment = (dept) => {
        if (!editingMapping) return;
        const current = new Set(editingMapping.departments);
        if (current.has(dept)) current.delete(dept); else current.add(dept);
        setEditingMapping({ ...editingMapping, departments: Array.from(current) });
    };

    const filteredMappings = Object.keys(allMappings).filter(key =>
        key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-orange-500 flex items-center gap-2">
                            <MapPin className="w-8 h-8" /> Authority Mappings
                        </h1>
                        <p className="text-gray-400 mt-2">Manage routing rules and unknown issue reviews</p>
                    </div>
                    <button
                        onClick={() => navigate(adminPath('/dashboard'))}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition-all"
                    >
                        Back to Dashboard
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-gray-900/50 p-1 rounded-lg w-fit overflow-x-auto">
                    {[
                        { key: 'dashboard', label: 'Status Dashboard', icon: <BarChart3 className="w-4 h-4" />, color: 'bg-purple-600' },
                        { key: 'review', label: `Unmapped Review${stats.total_unmapped > 0 ? ` (${stats.total_unmapped})` : ''}`, icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-orange-500' },
                        { key: 'editor', label: 'All Mappings', icon: <List className="w-4 h-4" />, color: 'bg-blue-500' },
                        { key: 'history', label: 'Audit History', icon: <History className="w-4 h-4" />, color: 'bg-gray-700' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap text-sm font-medium ${activeTab === tab.key ? `${tab.color} text-white` : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl text-red-200">Error: {error}</div>

                ) : activeTab === 'dashboard' ? (
                    // ── DASHBOARD ────────────────────────────────────────────
                    statsData && (
                        <div className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Mapping Coverage', value: `${statsData.coverage_percent}%`, sub: 'Operational Efficiency', icon: <Activity className="w-4 h-4 text-green-500" /> },
                                    { label: 'Mapped Types', value: statsData.mapped_types, sub: 'Total Issue Types Defined', icon: <List className="w-4 h-4 text-blue-500" /> },
                                    { label: 'Pending Reviews', value: statsData.pending_reviews, sub: 'Unmapped Issues needing Action', icon: <AlertTriangle className={`w-4 h-4 ${statsData.pending_reviews > 0 ? 'text-red-500' : 'text-gray-500'}`} /> },
                                    { label: 'Active Zip Codes', value: statsData.zip_codes_configured, sub: 'Authorities Configured', icon: <MapPin className="w-4 h-4 text-purple-500" /> },
                                ].map(card => (
                                    <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-gray-400 text-sm">{card.label}</h3>
                                            {card.icon}
                                        </div>
                                        <p className="text-3xl font-bold text-white">{card.value}</p>
                                        <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">System Health</h3>
                                    <div className="space-y-3">
                                        {['Zip Code Database', 'Department Maps', 'Unmapped Detection'].map(item => (
                                            <div key={item} className="flex justify-between items-center">
                                                <span className="text-gray-400">{item}</span>
                                                <span className="text-green-400 flex items-center gap-1 text-sm"><CheckCircle2 className="w-3 h-3" /> Active</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-center items-center text-center">
                                    <Activity className="w-12 h-12 text-gray-700 mb-4" />
                                    <h3 className="text-lg font-bold text-white">Audit Log</h3>
                                    <p className="text-gray-400 text-sm mb-4">View recent mapping changes & actions.</p>
                                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded-lg transition-colors border border-gray-700" onClick={() => setActiveTab('history')}>
                                        View Full History
                                    </button>
                                </div>
                            </div>
                        </div>
                    )

                ) : activeTab === 'review' ? (
                    // ── UNMAPPED REVIEW ──────────────────────────────────────
                    entries.length === 0 ? (
                        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold">No Unmapped Issues</h3>
                            <p className="text-gray-400">All issue types are currently mapped.</p>
                        </div>
                    ) : (
                        <div className="grid gap-5">
                            {entries.map(entry => {
                                const action = entryAction[entry.id];
                                const result = actionResult[entry.id];
                                const busy = processing[entry.id];

                                return (
                                    <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

                                        {/* Card Header */}
                                        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-800">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/30 uppercase tracking-wider">
                                                    {entry.issue_type || 'unknown'}
                                                </span>
                                                {entry.confidence > 0 && (
                                                    <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                                        Confidence: <span className="text-white font-semibold">{entry.confidence}%</span>
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-600">
                                                    {new Date(entry.flagged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded whitespace-nowrap">
                                                Admin Review Required
                                            </span>
                                        </div>

                                        {/* Card Body */}
                                        <div className="px-6 py-4">

                                            {/* Image verification area */}
                                            <div className="mb-4 bg-black/40 rounded-xl overflow-hidden border border-gray-800/50 flex items-center justify-center min-h-[220px] group relative">
                                                <img
                                                    src={apiClient.url(`/api/issues/${entry.issue_id}/image`)}
                                                    alt="Issue verification"
                                                    className="max-h-[300px] w-full object-contain hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://placehold.co/600x400/1a1a1a/666666?text=Image+Not+Available";
                                                    }}
                                                />
                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-gray-400 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Original Evidence
                                                </div>
                                            </div>

                                            {entry.address && (
                                                <div className="flex items-center gap-2 mb-3">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                                    <span className="text-sm text-gray-300">{entry.address}</span>
                                                    {entry.zip_code && <span className="text-xs text-gray-500">• ZIP {entry.zip_code}</span>}
                                                </div>
                                            )}
                                            <p className="text-sm text-gray-400 italic leading-relaxed mb-4 line-clamp-3">
                                                "{entry.submitted_description || 'No description available.'}"
                                            </p>

                                            {/* Result feedback */}
                                            {result && (
                                                <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${result.ok ? 'bg-green-500/10 border border-green-500/30 text-green-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
                                                    {result.msg}
                                                </div>
                                            )}

                                            {/* Action panels */}
                                            {!result && (
                                                <>
                                                    {/* APPROVE PANEL */}
                                                    {action === 'approve' && (
                                                        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 mb-3">
                                                            <p className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                                                                <Check className="w-4 h-4" /> Select Department to Route This Issue
                                                            </p>
                                                            <div className="flex gap-2 flex-wrap">
                                                                <select
                                                                    className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] focus:border-green-500 outline-none"
                                                                    value={entryDept[entry.id] || ''}
                                                                    onChange={e => setEntryDept(d => ({ ...d, [entry.id]: e.target.value }))}
                                                                >
                                                                    <option value="">-- Select Department --</option>
                                                                    {departments.map(d => (
                                                                        <option key={d} value={d}>{d.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    onClick={() => handleApprove(entry)}
                                                                    disabled={busy || !entryDept[entry.id]}
                                                                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all"
                                                                >
                                                                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                                    Approve & Dispatch
                                                                </button>
                                                                <button onClick={() => setEntryAction(a => ({ ...a, [entry.id]: null }))} className="text-gray-500 hover:text-white px-3 rounded-lg border border-gray-700 transition-all">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* REJECT PANEL */}
                                                    {action === 'reject' && (
                                                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-3">
                                                            <p className="text-sm font-semibold text-red-300 mb-3 flex items-center gap-2">
                                                                <XCircle className="w-4 h-4" /> Reason for Rejection (Optional)
                                                            </p>
                                                            <div className="flex gap-2 flex-wrap">
                                                                <input
                                                                    type="text"
                                                                    className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:border-red-500 outline-none text-white"
                                                                    placeholder="e.g. Image not clear, not a real issue..."
                                                                    value={entryReason[entry.id] || ''}
                                                                    onChange={e => setEntryReason(r => ({ ...r, [entry.id]: e.target.value }))}
                                                                />
                                                                <button
                                                                    onClick={() => handleReject(entry)}
                                                                    disabled={busy}
                                                                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all"
                                                                >
                                                                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                                    Confirm Reject
                                                                </button>
                                                                <button onClick={() => setEntryAction(a => ({ ...a, [entry.id]: null }))} className="text-gray-500 hover:text-white px-3 rounded-lg border border-gray-700 transition-all">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* DEFAULT BUTTONS */}
                                                    {!action && (
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => setEntryAction(a => ({ ...a, [entry.id]: 'approve' }))}
                                                                className="flex-1 py-2.5 bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 text-green-400 hover:text-green-300 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                                                            >
                                                                <Check className="w-4 h-4" /> Approve & Route
                                                            </button>
                                                            <button
                                                                onClick={() => setEntryAction(a => ({ ...a, [entry.id]: 'reject' }))}
                                                                className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                                                            >
                                                                <XCircle className="w-4 h-4" /> Reject Issue
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )

                ) : activeTab === 'history' ? (
                    // ── HISTORY ──────────────────────────────────────────────
                    historyData.length === 0 ? (
                        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800">
                            <History className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold">No History Found</h3>
                            <p className="text-gray-400">No audit logs available yet.</p>
                        </div>
                    ) : (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-800 text-gray-400 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="px-6 py-3">Time</th>
                                            <th className="px-6 py-3">Admin</th>
                                            <th className="px-6 py-3">Action</th>
                                            <th className="px-6 py-3">Target</th>
                                            <th className="px-6 py-3">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {historyData.map((log) => (
                                            <tr key={log._id || log.id} className="hover:bg-gray-800/50">
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-blue-400">{log.admin_email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs border ${log.action === 'resolve_review' ? 'bg-green-500/10 text-green-400 border-green-500/20' : log.action === 'update_mapping' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                                                        {log.action.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-gray-300">{log.target}</td>
                                                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{JSON.stringify(log.details)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )

                ) : (
                    // ── ALL MAPPINGS EDITOR ───────────────────────────────────
                    <div>
                        <div className="flex mb-6">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search issue types..."
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-blue-500 outline-none text-white"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredMappings.map(type => (
                                <div key={type} className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-blue-500/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white capitalize">{type.replace(/_/g, ' ')}</h4>
                                        <button onClick={() => handleEditMapping(type, allMappings[type])} className="text-gray-400 hover:text-white p-1 bg-gray-800 rounded">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {allMappings[type].map(dept => (
                                            <span key={dept} className="text-xs bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">{dept}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Editor Modal */}
                {editingMapping && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white capitalize">Edit "{editingMapping.issue_type}"</h2>
                                <button onClick={() => setEditingMapping(null)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                            </div>
                            <p className="text-gray-400 mb-4 text-sm">Select departments responsible for this issue type:</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                                {departments.map(dept => {
                                    const isSelected = editingMapping.departments.includes(dept);
                                    return (
                                        <button
                                            key={dept}
                                            onClick={() => toggleDepartment(dept)}
                                            className={`px-3 py-2 rounded text-sm text-center border transition-all ${isSelected ? 'bg-blue-600 border-blue-500 text-white font-semibold' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                                        >
                                            {dept.replace(/_/g, ' ')}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setEditingMapping(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                                <button
                                    onClick={handleSaveMapping}
                                    disabled={editorSaving}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    {editorSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-12 pb-8">
                    <Warning />
                </div>
            </div>
        </div>
    );
};

export default MappingReview;
