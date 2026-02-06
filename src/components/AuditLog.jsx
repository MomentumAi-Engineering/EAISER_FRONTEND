
import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import DashboardLayout from './DashboardLayout';
import { History, Search, Filter, Shield, AlertTriangle, Monitor, Globe } from 'lucide-react';

export default function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const data = await apiClient.getMappingHistory(); // Reusing the unified history endpoint
            setLogs(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to load audit logs", err);
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        if (action.includes('login')) return <Monitor className="w-4 h-4 text-blue-400" />;
        if (action.includes('approve')) return <Shield className="w-4 h-4 text-green-400" />;
        if (action.includes('decline')) return <AlertTriangle className="w-4 h-4 text-red-400" />;
        if (action.includes('mapping')) return <Globe className="w-4 h-4 text-orange-400" />;
        return <History className="w-4 h-4 text-gray-400" />;
    };

    const filteredLogs = logs.filter(log =>
        log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout currentPage="security">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            System Audit Logs
                        </h1>
                        <p className="text-gray-500 mt-1">Immutable record of all admin actions and security events</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-4 mb-8 flex items-center">
                    <Search className="w-5 h-5 text-gray-500 mr-3" />
                    <input
                        type="text"
                        placeholder="Search by admin email, action type..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none text-white w-full focus:outline-none placeholder-gray-600"
                    />
                </div>

                {/* Table */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-black/40 border-b border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-gray-400 font-medium text-sm">Timestamp</th>
                                    <th className="px-6 py-4 text-gray-400 font-medium text-sm">Admin</th>
                                    <th className="px-6 py-4 text-gray-400 font-medium text-sm">Action</th>
                                    <th className="px-6 py-4 text-gray-400 font-medium text-sm">Details</th>
                                    <th className="px-6 py-4 text-gray-400 font-medium text-sm">IP / Device</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            Loading audit records...
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            No records found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm font-mono">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-300">
                                                        {log.admin_email?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-gray-300 text-sm">{log.admin_email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getActionIcon(log.action)}
                                                    <span className="text-white text-sm capitalize">{log.action.replace(/_/g, ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate font-mono">
                                                {JSON.stringify(log.details || {}).replace(/"/g, '')}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">
                                                {log.ip_address} <br />
                                                <span className="opacity-50">{log.user_agent?.substring(0, 20)}...</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
