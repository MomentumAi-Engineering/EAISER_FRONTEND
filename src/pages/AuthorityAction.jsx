
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Loader2, CheckCircle2, XCircle, FileText, MapPin, Clock, ShieldCheck, AlertTriangle, MessageSquare } from 'lucide-react';

export default function AuthorityAction() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [issue, setIssue] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [notes, setNotes] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing action token.");
            setLoading(false);
            return;
        }

        const fetchIssue = async () => {
            try {
                const res = await apiClient.getAuthorityIssue(token);
                if (res.valid) {
                    setIssue(res.issue);
                } else {
                    setError("This secure link has expired or is invalid.");
                }
            } catch (err) {
                console.error(err);
                setError("Unable to validate secure link. It may have expired.");
            } finally {
                setLoading(false);
            }
        };

        fetchIssue();
    }, [token]);

    const handleUpdate = async (newStatus) => {
        setUpdating(true);
        try {
            await apiClient.updateAuthorityIssue(token, newStatus, notes);
            setIssue(prev => ({ ...prev, status: newStatus }));
            setUpdateSuccess(true);
            setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (err) {
            alert("Failed to update status: " + err.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                <span className="ml-3 text-lg font-medium">Verifying Secure Link...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-red-500/10 border border-red-500/50 p-8 rounded-2xl max-w-md w-full text-center">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.2)] border border-white/10">
                        <ShieldCheck className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Official Action Portal</h1>
                        <p className="text-gray-400 text-sm italic font-medium tracking-tight">EAiSER Secure Authority Access</p>
                    </div>
                    <button
                        onClick={() => window.open(`/authority/chat-hub?token=${token}`, '_blank')}
                        className="ml-auto px-6 py-3 bg-gradient-to-r from-yellow-400 via-amber-500 to-amber-600 hover:from-yellow-300 hover:via-amber-400 hover:to-amber-500 text-black rounded-xl font-black text-sm transition-all shadow-[0_8px_32px_rgba(245,158,11,0.25)] flex items-center gap-2 group border-t border-white/30 uppercase tracking-widest"
                    >
                        <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Open Secure Chat Hub
                    </button>
                </div>

                {/* Status Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-2xl">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Issue #{issue.id}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>Reported: {issue.timestamp_formatted || 'Recently'}</span>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${issue.status === 'resolved' || issue.status === 'completed'
                            ? 'bg-green-500/20 text-green-400 border-green-500/50'
                            : issue.status === 'in_progress'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                            }`}>
                            {issue.status?.replace('_', ' ')}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Issue Type</label>
                                <p className="text-white font-medium">{issue.issue_type || 'Unknown'}</p>
                            </div>
                            <p className={`font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2 ${(() => {
                                const sev = (issue.severity || '').toLowerCase();
                                if (sev === 'critical') return 'text-red-500';
                                if (sev === 'high') return 'text-orange-500';
                                if (sev === 'medium') return 'text-yellow-400';
                                if (sev === 'low') return 'text-blue-400';
                                return 'text-white';
                            })()}`}>
                                <div className={`w-2 h-2 rounded-full animate-pulse ${(() => {
                                    const sev = (issue.severity || '').toLowerCase();
                                    if (sev === 'critical') return 'bg-red-500 shadow-[0_0_8px_#ef4444]';
                                    if (sev === 'high') return 'bg-orange-500 shadow-[0_0_8px_#f97316]';
                                    if (sev === 'medium') return 'bg-yellow-400 shadow-[0_0_8px_#fbbf24]';
                                    if (sev === 'low') return 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
                                    return 'bg-white';
                                })()}`} />
                                {(() => {
                                    const sev = (issue.severity || '').toLowerCase();
                                    if (sev === 'critical') return 'HIGH PRIORITY [RED]';
                                    if (sev === 'high') return 'MEDIUM HIGH PRIORITY [ORANGE]';
                                    if (sev === 'medium') return 'MEDIUM PRIORITY [YELLOW]';
                                    if (sev === 'low') return 'LOW PRIORITY [BLUE]';
                                    return issue.severity || 'MEDIUM PRIORITY';
                                })()}
                            </p>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Location</label>
                                <p className="text-white font-medium flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    {issue.address}, {issue.zip_code}
                                </p>
                            </div>
                        </div>

                        <div className="bg-black/30 rounded-xl p-4 border border-slate-800">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Description</label>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {issue.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    {issue.image_id && (
                        <div className="mb-8">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Visual Evidence</label>
                            {/* Using the image endpoint - assume image_id is valid */}
                            <img
                                src={`${apiClient.baseURL}/api/issues/image/${issue.image_id}`}
                                alt="Evidence"
                                className="w-full h-64 object-cover rounded-xl border border-slate-800"
                            />
                        </div>
                    )}

                    <hr className="border-slate-800 my-6" />

                    {/* Action Section */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Update Status</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                            <button
                                onClick={() => handleUpdate('in_progress')}
                                disabled={updating || issue.status === 'in_progress'}
                                className={`p-4 rounded-xl border text-sm font-bold transition-all ${issue.status === 'in_progress'
                                    ? 'bg-amber-600 border-amber-500 text-black shadow-[0_4px_12px_rgba(217,119,6,0.2)] cursor-default'
                                    : 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700 hover:border-amber-500'
                                    }`}
                            >
                                In Progress
                            </button>

                            <button
                                onClick={() => handleUpdate('resolved')}
                                disabled={updating || issue.status === 'resolved'}
                                className={`p-4 rounded-xl border text-sm font-bold transition-all ${issue.status === 'resolved'
                                    ? 'bg-green-600 border-green-500 text-white cursor-default'
                                    : 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700 hover:border-green-500'
                                    }`}
                            >
                                Resolved / Fixed
                            </button>

                            <button
                                onClick={() => handleUpdate('rejected')}
                                disabled={updating || issue.status === 'rejected'}
                                className={`p-4 rounded-xl border text-sm font-bold transition-all ${issue.status === 'rejected'
                                    ? 'bg-red-600 border-red-500 text-white cursor-default'
                                    : 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700 hover:border-red-500'
                                    }`}
                            >
                                Reject / Invalid
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Official Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-amber-500 outline-none transition-all focus:shadow-[0_0_15px_rgba(217,119,6,0.1)]"
                                rows={3}
                                placeholder="Add comments about the resolution or status update..."
                            />
                        </div>

                        {updateSuccess && (
                            <div className="flex items-center gap-2 text-green-400 text-sm font-bold bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                                <CheckCircle2 className="w-4 h-4" />
                                Status updated successfully. User notified.
                            </div>
                        )}
                    </div>

                </div>

                <div className="text-center text-gray-500 text-xs mt-8">
                    &copy; 2025 EAiSER AI. Secure Authority Interface.
                </div>

            </div>
        </div>
    );
}
