import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Loader2, AlertTriangle, CheckCircle2, MapPin, Save, ArrowRight, List, Edit2, Search, X, BarChart3, Activity, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MappingReview = () => {
    const [entries, setEntries] = useState([]);
    const [allMappings, setAllMappings] = useState({});
    const [statsData, setStatsData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ count: 0, total_unmapped: 0 });
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'review', 'editor'
    const [searchTerm, setSearchTerm] = useState('');

    // Mapping Editor State
    const [editingMapping, setEditingMapping] = useState(null); // { issue_type: '', departments: [] }
    const [editorSaving, setEditorSaving] = useState(false);

    // Map departments options
    const departments = [
        "public_works", "sanitation", "parks_recreation", "transportation",
        "police", "fire_department", "animal_control", "water_department",
        "power_utility", "health_department", "environmental_protection",
        "housing_authority", "general", "building_inspection", "emergency", "code_enforcement",
        "property_management"
    ];

    const [resolving, setResolving] = useState({}); // { id: status }
    const [resolutionData, setResolutionData] = useState({}); // { id: { selection: '' } }

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'dashboard') {
                const data = await apiClient.getMappingStats();
                setStatsData(data);
                // Also fetch unmapped count for sidebar/badge
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

    // Review Tab Handlers
    const handleResolve = async (entry) => {
        const selection = resolutionData[entry.id]?.selection;
        if (!selection) return alert("Please select a department");

        setResolving(prev => ({ ...prev, [entry.id]: 'loading' }));
        try {
            await apiClient.resolveMapping(entry.id, entry.issue_type, selection);
            setEntries(prev => prev.filter(e => e.id !== entry.id));
            setStats(prev => ({ ...prev, count: prev.count - 1, total_unmapped: prev.total_unmapped - 1 }));
        } catch (err) {
            alert("Failed to resolve: " + err.message);
            setResolving(prev => ({ ...prev, [entry.id]: 'error' }));
        }
    };

    const handleSelectionChange = (id, value) => {
        setResolutionData(prev => ({
            ...prev,
            [id]: { selection: value }
        }));
    };

    // Editor Tab Handlers
    const handleEditMapping = (type, depts) => {
        setEditingMapping({ issue_type: type, departments: depts });
    };

    const handleSaveMapping = async () => {
        if (!editingMapping) return;
        setEditorSaving(true);
        try {
            await apiClient.updateMapping(editingMapping.issue_type, editingMapping.departments);
            setAllMappings(prev => ({ ...prev, [editingMapping.issue_type]: editingMapping.departments }));
            setEditingMapping(null);
            alert("Mapping updated successfully!");
        } catch (err) {
            alert("Failed to save: " + err.message);
        } finally {
            setEditorSaving(false);
        }
    };

    const toggleDepartment = (dept) => {
        if (!editingMapping) return;
        const current = new Set(editingMapping.departments);
        if (current.has(dept)) current.delete(dept);
        else current.add(dept);
        setEditingMapping({ ...editingMapping, departments: Array.from(current) });
    };

    const filteredMappings = Object.keys(allMappings).filter(key =>
        key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-orange-500 flex items-center gap-2">
                            <MapPin className="w-8 h-8" /> Authority Mappings
                        </h1>
                        <p className="text-gray-400 mt-2">Manage routing rules and unknown issue reviews</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin')}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition-all"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-gray-900/50 p-1 rounded-lg w-fit overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-6 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'dashboard'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Status Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('review')}
                        className={`px-6 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'review'
                            ? 'bg-orange-500 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Unmapped Review {stats.total_unmapped > 0 && `(${stats.total_unmapped})`}
                    </button>
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`px-6 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'editor'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <List className="w-4 h-4" />
                        All Mappings
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'history'
                            ? 'bg-gray-100/10 text-white border border-gray-500/50'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <History className="w-4 h-4" />
                        Audit History
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl text-red-200">
                        Error: {error}
                    </div>
                ) : activeTab === 'dashboard' ? (
                    // --- DASHBOARD VIEW ---
                    statsData && (
                        <div className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-gray-400 text-sm">Mapping Coverage</h3>
                                        <Activity className="w-4 h-4 text-green-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-white">{statsData.coverage_percent}%</p>
                                    <p className="text-xs text-gray-500 mt-1">Operational Efficiency</p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-gray-400 text-sm">Mapped Types</h3>
                                        <List className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-white">{statsData.mapped_types}</p>
                                    <p className="text-xs text-gray-500 mt-1">Total Issue Types Defined</p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-gray-400 text-sm">Pending Reviews</h3>
                                        <AlertTriangle className={`w-4 h-4 ${statsData.pending_reviews > 0 ? 'text-red-500' : 'text-gray-500'}`} />
                                    </div>
                                    <p className="text-3xl font-bold text-white">{statsData.pending_reviews}</p>
                                    <p className="text-xs text-gray-500 mt-1">Unmapped Issues needing Action</p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-gray-400 text-sm">Active Zip Codes</h3>
                                        <MapPin className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-white">{statsData.zip_codes_configured}</p>
                                    <p className="text-xs text-gray-500 mt-1">Authorities Configured</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">System Health</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Zip Code Database</span>
                                            <span className="text-green-400 flex items-center gap-1 text-sm"><CheckCircle2 className="w-3 h-3" /> Loaded</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Department Maps</span>
                                            <span className="text-green-400 flex items-center gap-1 text-sm"><CheckCircle2 className="w-3 h-3" /> Loaded</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Unmapped Detection</span>
                                            <span className="text-green-400 flex items-center gap-1 text-sm"><CheckCircle2 className="w-3 h-3" /> Active</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-center items-center text-center">
                                    <Activity className="w-12 h-12 text-gray-700 mb-4" />
                                    <h3 className="text-lg font-bold text-white">Audit Log</h3>
                                    <p className="text-gray-400 text-sm mb-4">View recent changes to authorities and mappings.</p>
                                    <button
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded-lg transition-colors border border-gray-700"
                                        onClick={() => setActiveTab('history')}
                                    >
                                        View Full History
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                ) : activeTab === 'review' ? (
                    // --- REVIEW VIEW ---
                    entries.length === 0 ? (
                        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold">No Unmapped Issues</h3>
                            <p className="text-gray-400">All issue types are currently mapped.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {entries.map(entry => (
                                <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 animate-in fade-in">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-xl font-bold text-white capitalize">{entry.issue_type}</h3>
                                            <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded border border-orange-500/30">
                                                {new Date(entry.flagged_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 mb-2 italic">"{entry.submitted_description}"</p>
                                        <div className="text-sm text-gray-500">
                                            Currently Routed To: <span className="text-white">{entry.current_routed_to}</span>
                                        </div>
                                    </div>

                                    <div className="md:w-1/3 flex flex-col gap-3">
                                        <label className="text-xs text-gray-400">Map to Department:</label>
                                        <div className="flex gap-2">
                                            <select
                                                className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 focus:border-orange-500 outline-none"
                                                onChange={(e) => handleSelectionChange(entry.id, e.target.value)}
                                                value={resolutionData[entry.id]?.selection || ""}
                                            >
                                                <option value="">-- Select --</option>
                                                {departments.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                                <option value="other">Other (Custom)</option>
                                            </select>
                                            <button
                                                onClick={() => handleResolve(entry)}
                                                disabled={resolving[entry.id] === 'loading'}
                                                className="bg-orange-600 hover:bg-orange-500 text-white px-4 rounded-lg flex items-center justify-center disabled:opacity-50"
                                            >
                                                {resolving[entry.id] === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : activeTab === 'history' ? (
                    // --- HISTORY VIEW ---
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
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-blue-400">
                                                    {log.admin_email}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs border ${log.action === 'resolve_review' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        log.action === 'update_mapping' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-gray-700 text-gray-300 border-gray-600'
                                                        }`}>
                                                        {log.action.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-gray-300">
                                                    {log.target}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                                                    {JSON.stringify(log.details)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    // --- EDITOR VIEW (All Mappings) ---
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
                                        <button
                                            onClick={() => handleEditMapping(type, allMappings[type])}
                                            className="text-gray-400 hover:text-white p-1 bg-gray-800 rounded"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {allMappings[type].map(dept => (
                                            <span key={dept} className="text-xs bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                                                {dept}
                                            </span>
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
                                <button onClick={() => setEditingMapping(null)} className="text-gray-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <p className="text-gray-400 mb-4 text-sm">Select departments responsible for this issue type:</p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                                {departments.map(dept => {
                                    const isSelected = editingMapping.departments.includes(dept);
                                    return (
                                        <button
                                            key={dept}
                                            onClick={() => toggleDepartment(dept)}
                                            className={`px-3 py-2 rounded text-sm text-center border transition-all ${isSelected
                                                ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {dept.replace(/_/g, ' ')}
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingMapping(null)}
                                    className="px-4 py-2 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
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
            </div>
        </div>
    );
};

export default MappingReview;
