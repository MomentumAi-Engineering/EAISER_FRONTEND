import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import {
    Users, Search, ShieldAlert, CheckCircle2,
    XCircle, Ban, AlertTriangle, Loader2
} from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterMode, setFilterMode] = useState('all'); // 'all', 'high_risk'
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, [filterMode, searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterMode === 'high_risk') params.filter_risk = 'high_risk';
            if (searchTerm) params.search = searchTerm;

            const data = await apiClient.getUsers(params);
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            if (err.message && err.message.includes('403')) {
                navigate('/admin');
            }
        } finally {
            setLoading(false);
        }
    };
    const handleDelete = async (user) => {
        const confirmMsg = `WARNING: PERMANENTLY DELETE USER?\n\nThis will remove ${user.email} and ALL their submitted reports from the database.\n\nThis action cannot be undone. Type "DELETE" to confirm.`;
        const input = prompt(confirmMsg);

        if (input !== 'DELETE') return;

        setProcessingId(user.id);
        try {
            await apiClient.deleteUser(user.id);
            setUsers(users.filter(u => u.id !== user.id));
            alert("User permanently deleted.");
        } catch (err) {
            alert("Failed to delete user: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleToggleStatus = async (user) => {
        const newStatus = !user.is_active;
        const action = newStatus ? "Unblock" : "Block";

        // Setup reason prompt if blocking
        let reason = '';
        if (!newStatus) {
            reason = prompt(`Why are you blocking ${user.email}?`, "Repeated Fake Reports");
            if (reason === null) return; // Cancelled
        }

        // if (!window.confirm(`Are you sure you want to ${action} ${user.email}?`)) return; // Removed redundant confirm

        setProcessingId(user.id);
        try {
            await apiClient.toggleUserStatus(user.id, newStatus, reason);
            // Update local state
            setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
        } catch (err) {
            alert(`Failed to ${action} user: ` + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 relative">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Users className="text-blue-500" />
                            User Management
                        </h1>
                        <p className="text-gray-400 mt-2">Monitor user activity, reports, and manage access.</p>
                    </div>

                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition"
                    >
                        Back to Dashboard
                    </button>
                </header>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                    <div className="flex bg-gray-900 p-1 rounded-lg w-fit">
                        <button
                            onClick={() => setFilterMode('all')}
                            className={`px-4 py-2 rounded-md transition ${filterMode === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            All Users
                        </button>
                        <button
                            onClick={() => setFilterMode('high_risk')}
                            className={`px-4 py-2 rounded-md transition flex items-center gap-2 ${filterMode === 'high_risk' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <AlertTriangle className="w-4 h-4" /> High Risk
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search email or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-blue-500 w-full md:w-64"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center text-gray-500">
                            <Loader2 className="animate-spin w-8 h-8" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No users found.
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900 border-b border-gray-800 text-gray-400 text-sm uppercase">
                                    <th className="p-4 font-semibold">User / Email</th>
                                    <th className="p-4 font-semibold">Activity & Reputation</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-800/30 transition">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{user.name}</div>
                                            <div className="text-blue-400 text-sm font-mono">{user.email}</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>

                                        <td className="p-4 align-top">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className="text-sm text-gray-300 font-medium">
                                                    {user.rejected_reports_count} <span className="text-gray-500">Total Reports Submitted</span>
                                                </span>
                                                {/* Risk Badge */}
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${user.risk_score === 'Critical' ? 'bg-red-900/40 text-red-500 border-red-900' :
                                                        user.risk_score === 'High' ? 'bg-orange-900/40 text-orange-500 border-orange-900' :
                                                            user.risk_score === 'Medium' ? 'bg-yellow-900/40 text-yellow-500 border-yellow-900' :
                                                                'bg-green-900/40 text-green-500 border-green-900'
                                                    }`}>
                                                    {user.risk_score} Risk Level
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            {user.is_active ? (
                                                <span className="flex items-center gap-1 text-green-400 text-sm">
                                                    <CheckCircle2 className="w-4 h-4" /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-500 text-sm font-bold">
                                                    <Ban className="w-4 h-4" /> Banned
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    disabled={processingId === user.id}
                                                    className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-2 ${user.is_active
                                                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                                                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'
                                                        }`}
                                                >
                                                    {user.is_active ? (
                                                        <><Ban className="w-3 h-3" /> Block</>
                                                    ) : (
                                                        <><CheckCircle2 className="w-3 h-3" /> Unblock</>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    disabled={processingId === user.id}
                                                    className="px-3 py-1.5 rounded text-xs font-medium bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-900 transition"
                                                    title="Permanently Delete User"
                                                >
                                                    <XCircle className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
