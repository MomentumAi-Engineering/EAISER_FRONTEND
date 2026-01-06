import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Loader2, AlertTriangle, Search, Plus, Save, X, Building, Mail, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuthorityManagement = () => {
    const [authorities, setAuthorities] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Modal state for editing a Zip Code
    const [editingZip, setEditingZip] = useState(null); // String (zip code)
    const [editData, setEditData] = useState({}); // { dept: [contacts] }
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAuthorities();
    }, []);

    const fetchAuthorities = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getAuthorities();
            setAuthorities(data || {});
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditZip = (zip) => {
        setEditingZip(zip);
        setEditData(JSON.parse(JSON.stringify(authorities[zip] || {})));
    };

    const handleCreateZip = () => {
        const zip = prompt("Enter new Zip Code:");
        if (!zip) return;
        if (authorities[zip]) {
            alert("Zip code already exists!");
            return;
        }
        setEditingZip(zip);
        setEditData({});
    };

    const handleSave = async () => {
        if (!editingZip) return;
        setSaving(true);
        try {
            await apiClient.updateAuthority(editingZip, editData);
            setAuthorities(prev => ({ ...prev, [editingZip]: editData }));
            setEditingZip(null);
        } catch (err) {
            alert("Failed to save: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const updateContact = (dept, index, field, value) => {
        setEditData(prev => {
            const newData = { ...prev };
            if (!newData[dept]) newData[dept] = [];
            newData[dept][index] = { ...newData[dept][index], [field]: value };
            return newData;
        });
    };

    const addContact = (dept) => {
        setEditData(prev => {
            const newData = { ...prev };
            if (!newData[dept]) newData[dept] = [];
            newData[dept].push({ name: '', email: '', type: dept });
            return newData;
        });
    };

    const removeContact = (dept, index) => {
        setEditData(prev => {
            const newData = { ...prev };
            newData[dept].splice(index, 1);
            if (newData[dept].length === 0) delete newData[dept];
            return newData;
        });
    }

    const filteredZips = Object.keys(authorities).filter(zip =>
        zip.includes(searchTerm) ||
        JSON.stringify(authorities[zip]).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const departments = [
        "public_works", "sanitation", "fire", "police", "animal_control",
        "environment", "water_utility", "code_enforcement", "transportation",
        "property_management", "general", "building_inspection", "emergency"
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-500 flex items-center gap-2">
                            <Building className="w-8 h-8" /> Authority Management
                        </h1>
                        <p className="text-gray-400 mt-2">Manage authorities contacts by zip code</p>
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

                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search zip or city..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-blue-500 outline-none text-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleCreateZip}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Zip Code
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : filteredZips.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800">
                        <p className="text-gray-400">No zip codes found matching "{searchTerm}"</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredZips.map(zip => (
                            <div key={zip} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Map className="w-5 h-5 text-gray-400" /> {zip}
                                    </h3>
                                    <button
                                        onClick={() => handleEditZip(zip)}
                                        className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                                    >
                                        Edit Contacts
                                    </button>
                                </div>
                                <div className="space-y-2 text-sm text-gray-400">
                                    {Object.keys(authorities[zip] || {}).slice(0, 4).map(dept => (
                                        <div key={dept} className="flex items-center justify-between">
                                            <span className="capitalize">{dept.replace('_', ' ')}</span>
                                            <span className="bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-300">
                                                {(authorities[zip][dept] || []).length} contact(s)
                                            </span>
                                        </div>
                                    ))}
                                    {Object.keys(authorities[zip] || {}).length > 4 && (
                                        <div className="text-center text-xs pt-1 text-gray-600">
                                            + {Object.keys(authorities[zip]).length - 4} more departments
                                        </div>
                                    )}
                                    {Object.keys(authorities[zip] || {}).length === 0 && (
                                        <div className="text-center text-gray-600 italic">No contacts configured</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Edit Modal */}
                {editingZip && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900 rounded-t-2xl">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Edit Authorities</h2>
                                    <p className="text-gray-400 text-sm">Zip Code: <span className="text-blue-400 font-mono">{editingZip}</span></p>
                                </div>
                                <button onClick={() => setEditingZip(null)} className="text-gray-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                {departments.map(dept => (
                                    <div key={dept} className="mb-6 bg-black/20 border border-gray-800 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-gray-300 capitalize flex items-center gap-2">
                                                {dept.replace('_', ' ')}
                                            </h4>
                                            <button
                                                onClick={() => addContact(dept)}
                                                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Add
                                            </button>
                                        </div>

                                        {(editData[dept] || []).length === 0 ? (
                                            <p className="text-xs text-gray-600 italic">No contacts for this department.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {editData[dept].map((contact, idx) => (
                                                    <div key={idx} className="flex gap-2 items-start">
                                                        <input
                                                            placeholder="Name (e.g. City Fire)"
                                                            value={contact.name || ''}
                                                            onChange={e => updateContact(dept, idx, 'name', e.target.value)}
                                                            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                                                        />
                                                        <input
                                                            placeholder="Email"
                                                            value={contact.email || ''}
                                                            onChange={e => updateContact(dept, idx, 'email', e.target.value)}
                                                            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                                                        />
                                                        <button
                                                            onClick={() => removeContact(dept, idx)}
                                                            className="text-red-400 hover:text-red-300 p-1"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-gray-800 bg-gray-900 rounded-b-2xl flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingZip(null)}
                                    className="px-4 py-2 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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

export default AuthorityManagement;
