import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

export default function TeamManagement() {
    const navigate = useNavigate();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState(null);

    // New admin form
    const [newAdmin, setNewAdmin] = useState({
        email: '',
        name: '',
        password: '',
        role: 'admin'
    });

    useEffect(() => {
        // Check if user is super_admin
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin', { replace: true });
            return;
        }

        // Get current admin info from token or API
        fetchCurrentAdmin();
        fetchAdmins();
    }, [navigate]);

    const fetchCurrentAdmin = async () => {
        try {
            // Decode token or make API call to get current admin
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            setCurrentAdmin(adminData);

            if (adminData.role !== 'super_admin') {
                alert('Only super admins can access Team Management');
                navigate('/admin/dashboard', { replace: true });
            }
        } catch (err) {
            console.error('Failed to get admin data:', err);
        }
    };

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getAdmins();
            setAdmins(data);
        } catch (err) {
            console.error('Failed to fetch admins:', err);
            alert('Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();

        if (!newAdmin.email || !newAdmin.password || !newAdmin.name) {
            alert('Please fill all fields');
            return;
        }

        try {
            const result = await apiClient.createAdmin(newAdmin);
            alert(result.message || 'Admin created successfully! Welcome email sent.');
            setShowAddModal(false);
            setNewAdmin({ email: '', name: '', password: '', role: 'admin' });
            fetchAdmins();
        } catch (err) {
            console.error('Failed to create admin:', err);
            alert(err.message || 'Failed to create admin');
        }
    };

    const handleDeactivate = async (adminId) => {
        if (!confirm('Are you sure you want to deactivate this admin?')) return;

        try {
            await apiClient.deactivateAdmin(adminId);
            alert('Admin deactivated successfully');
            fetchAdmins();
        } catch (err) {
            console.error('Failed to deactivate admin:', err);
            alert('Failed to deactivate admin: ' + (err.message || 'Unknown error'));
        }
    };

    const handleReactivate = async (adminId) => {
        if (!confirm('Are you sure you want to reactivate this admin?')) return;

        try {
            await apiClient.reactivateAdmin(adminId);
            alert('Admin reactivated successfully');
            fetchAdmins();
        } catch (err) {
            console.error('Failed to reactivate admin:', err);
            alert('Failed to reactivate admin: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDelete = async (adminId) => {
        if (!confirm('Are you sure you want to PERMANENTLY DELETE this admin? This action cannot be undone.')) return;

        try {
            await apiClient.deleteAdmin(adminId);
            alert('Admin deleted successfully');
            fetchAdmins();
        } catch (err) {
            console.error('Failed to delete admin:', err);
            alert('Failed to delete admin: ' + (err.message || 'Unknown error'));
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'super_admin': return 'bg-purple-500';
            case 'admin': return 'bg-blue-500';
            case 'team_member': return 'bg-green-500';
            case 'viewer': return 'bg-gray-500';
            default: return 'bg-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading team members...</div>
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
                            Team Management
                        </h1>
                        <p className="text-gray-400 mt-2">Manage your admin team members and permissions</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
                        >
                            ← Back to Dashboard
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all shadow-lg"
                        >
                            + Add Team Member
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-2">Total Members</div>
                        <div className="text-3xl font-bold text-white">{admins.length}</div>
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-2">Active Admins</div>
                        <div className="text-3xl font-bold text-green-400">
                            {admins.filter(a => a.is_active).length}
                        </div>
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-2">Super Admins</div>
                        <div className="text-3xl font-bold text-purple-400">
                            {admins.filter(a => a.role === 'super_admin').length}
                        </div>
                    </div>
                </div>

                {/* Team Members List */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold">Name</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold">Email</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold">Role</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold">Status</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold">Assigned Issues</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map((admin) => (
                                <tr key={admin.id || admin._id} className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">{admin.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-gray-300">{admin.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getRoleBadgeColor(admin.role)}`}>
                                            {admin.role?.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${admin.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {admin.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        {admin.assigned_issues?.length || 0} issues
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {admin.is_active ? (
                                                (admin.role !== 'super_admin' || (currentAdmin?.role === 'super_admin' && (admin.id || admin._id) !== (currentAdmin?.id || currentAdmin?._id))) && (
                                                    <button
                                                        onClick={() => handleDeactivate(admin.id || admin._id)}
                                                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-all"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )
                                            ) : (
                                                <button
                                                    onClick={() => handleReactivate(admin.id || admin._id)}
                                                    className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-all"
                                                >
                                                    Reactivate
                                                </button>
                                            )}

                                            {/* Delete Button - Only showed if we can perform action */}
                                            {(admin.role !== 'super_admin' || (currentAdmin?.role === 'super_admin' && (admin.id || admin._id) !== (currentAdmin?.id || currentAdmin?._id))) && (
                                                <button
                                                    onClick={() => handleDelete(admin.id || admin._id)}
                                                    className="ml-2 px-3 py-1 bg-gray-700 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg text-sm transition-all"
                                                    title="Permanently Delete"
                                                >
                                                    Start over / Remove
                                                </button>
                                            )}


                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Admin Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">Add Team Member</h2>

                        <form onSubmit={handleAddAdmin} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Name</label>
                                <input
                                    type="text"
                                    value={newAdmin.name}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Email</label>
                                <input
                                    type="email"
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Temporary Password</label>
                                <input
                                    type="password"
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                    placeholder="Min 8 characters"
                                    required
                                    minLength={8}
                                />
                                <p className="text-xs text-gray-500 mt-1">User will receive this via email and should change it after first login</p>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Role</label>
                                <select
                                    value={newAdmin.role}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                >
                                    <option value="admin">Admin - Can approve/decline issues</option>
                                    <option value="team_member">Team Member - Can handle assigned issues</option>
                                    <option value="viewer">Viewer - Read-only access</option>
                                    <option value="super_admin">Super Admin - Full access</option>
                                </select>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setNewAdmin({ email: '', name: '', password: '', role: 'admin' });
                                    }}
                                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all"
                                >
                                    Add Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
