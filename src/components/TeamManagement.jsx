
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import DashboardLayout from './DashboardLayout';
import { Shield, Plus, MoreVertical, Search, Lock, User, Trash2, CheckCircle2, XCircle } from 'lucide-react';

export default function TeamManagement() {
    const navigate = useNavigate();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // New admin form
    const [newAdmin, setNewAdmin] = useState({
        email: '',
        name: '',
        password: '',
        role: 'admin'
    });

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin', { replace: true });
            return;
        }

        // Get current admin info 
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        setCurrentAdmin(adminData);

        fetchAdmins();
    }, [navigate]);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getAdmins();
            setAdmins(data);
        } catch (err) {
            console.error('Failed to fetch admins:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        try {
            const result = await apiClient.createAdmin(newAdmin);
            alert(result.message || 'Admin created successfully!');
            setShowAddModal(false);
            setNewAdmin({ email: '', name: '', password: '', role: 'admin' });
            fetchAdmins();
        } catch (err) {
            alert(err.message || 'Failed to create admin');
        }
    };

    const handleDeactivate = async (adminId) => {
        if (!confirm('Deactivate this admin access?')) return;
        try {
            await apiClient.deactivateAdmin(adminId);
            fetchAdmins();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleReactivate = async (adminId) => {
        if (!confirm('Reactivate this admin?')) return;
        try {
            await apiClient.reactivateAdmin(adminId);
            fetchAdmins();
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role) => {
        switch (role) {
            case 'super_admin': return <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20 uppercase">Super Admin</span>;
            case 'admin': return <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 uppercase">Admin</span>;
            case 'team_member': return <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20 uppercase">Team Member</span>;
            default: return <span className="px-2 py-1 rounded-md bg-gray-500/10 text-gray-400 text-xs font-bold border border-gray-500/20 uppercase">{role}</span>;
        }
    };

    return (
        <DashboardLayout currentPage="team">
            <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Team Management
                        </h1>
                        <p className="text-gray-500 mt-1">Manage access control and team roles</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-5 h-5" /> Invide Member
                    </button>
                </div>

                {/* Filters & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="lg:col-span-3 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-1 flex items-center">
                        <Search className="w-5 h-5 text-gray-500 ml-4" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none text-white px-4 py-3 focus:ring-0 placeholder-gray-500"
                        />
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Active Members</span>
                        <span className="text-2xl font-bold text-white">{admins.filter(a => a.is_active).length}</span>
                    </div>
                </div>

                {/* Team Grid */}
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading team data...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAdmins.map((admin) => (
                            <div key={admin.id || admin._id} className="group bg-gray-900/40 backdrop-blur border border-gray-800 hover:border-blue-500/30 rounded-2xl p-6 transition-all hover:bg-gray-800/60 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-gray-400 hover:text-white"><MoreVertical className="w-5 h-5" /></button>
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-700 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                                        {admin.name?.charAt(0) || <User />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{admin.name}</h3>
                                        <p className="text-sm text-gray-500">{admin.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-6">
                                    {getRoleBadge(admin.role)}
                                    <span className={`text-xs flex items-center gap-1.5 ${admin.is_active ? 'text-green-400' : 'text-red-400'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                        {admin.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="pt-4 border-t border-gray-800 flex gap-2">
                                    {admin.is_active ? (
                                        <button
                                            onClick={() => handleDeactivate(admin.id || admin._id)}
                                            className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                        >
                                            Deactivate
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(admin.id || admin._id)}
                                            className="flex-1 py-2 rounded-lg bg-green-900/20 hover:bg-green-900/30 text-green-400 text-sm font-medium transition-colors"
                                        >
                                            Reactivate
                                        </button>
                                    )}
                                    <button className="p-2 rounded-lg bg-gray-800 hover:bg-red-900/20 text-gray-400 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                            <h2 className="text-xl font-bold text-white">Invite Team Member</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><XCircle className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        required
                                        value={newAdmin.name}
                                        onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 opacity-0" />
                                    {/* Hack for alignment, or use another icon */}
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                                    <input
                                        type="email"
                                        required
                                        value={newAdmin.email}
                                        onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="jane@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Initial Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={newAdmin.password}
                                        onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Access Role</label>
                                <select
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                                    value={newAdmin.role}
                                    onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                    <option value="team_member">Team Member</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>

                            <button className="w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all">
                                Send Investation
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
