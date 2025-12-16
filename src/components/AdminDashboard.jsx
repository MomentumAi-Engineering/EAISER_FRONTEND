import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Loader2, Edit2, ShieldCheck, Mail, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();

  // Approval Modal State
  const [approvalModal, setApprovalModal] = useState(null); // { issueId, currentAuth }
  const [editAuthority, setEditAuthority] = useState(false);
  const [newAuthData, setNewAuthData] = useState({ name: '', email: '' });

  useEffect(() => {
    // Basic auth check
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchReviews();
  }, [navigate]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPendingReviews();
      setReviews(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
      if (err.message && err.message.includes('401')) {
        navigate('/admin'); // Redirect to login on unauthorized
      }
      setError("Failed to load pending reviews.");
    } finally {
      setLoading(false);
    }
  };

  const openApproveModal = (issue) => {
    const report = issue.report?.report || issue.report || {};
    const currentAuths = report.responsible_authorities_or_parties || [];
    const currentAuth = currentAuths.length > 0 ? currentAuths[0] : { name: 'Default', email: 'eaiser@momntumai.com' };

    setNewAuthData({ name: currentAuth.name || '', email: currentAuth.email || '' });
    setEditAuthority(false);
    setApprovalModal({ issueId: issue._id || issue.issue_id, currentAuth, issue });
  };

  const closeApproveModal = () => {
    setApprovalModal(null);
    setEditAuthority(false);
  };

  const confirmApprove = async () => {
    if (!approvalModal) return;
    const issueId = approvalModal.issueId;

    setProcessingId(issueId);
    try {
      if (editAuthority) {
        await apiClient.approveIssueAdmin(issueId, 'admin', 'Approved with updated authority', newAuthData.email, newAuthData.name);
      } else {
        await apiClient.approveIssueAdmin(issueId, 'admin', 'Approved via Dashboard');
      }
      // Remove from list
      setReviews(prev => prev.filter(r => r._id !== issueId && r.issue_id !== issueId));
      closeApproveModal();
    } catch (err) {
      alert("Failed to approve: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (issueId) => {
    const reason = prompt("Enter reason for rejection:", "Fake report / Not a public issue");
    if (!reason) return;

    setProcessingId(issueId);
    try {
      await apiClient.declineIssueAdmin(issueId, 'admin', reason);
      setReviews(prev => prev.filter(r => r._id !== issueId && r.issue_id !== issueId));
    } catch (err) {
      alert("Failed to decline: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 relative">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Review flagged and low-confidence reports</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                navigate('/admin');
              }}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30 transition-all"
            >
              Logout
            </button>
            <button
              onClick={fetchReviews}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm border border-gray-700 transition-all"
            >
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-200 mb-8 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {reviews.length === 0 && !error ? (
          <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
            <p className="text-gray-400">No pending reports to review.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => {
              const id = review._id || review.issue_id;
              // Extract data safely
              const report = review.report?.report || review.report || {};
              const aiData = report.unified_report || report.issue_overview || {};
              const issueType = aiData.issue_type || review.issue_type || 'Unknown';
              const confidence = aiData.confidence_percent || 0;
              const summary = aiData.summary_explanation || review.description || "No description";


              // Correct Image URL Logic:
              let imageUrl = null;
              if (review.image_url) {
                imageUrl = `${apiClient.baseURL}${review.image_url}`;
              } else if (review.image_id) {
                // Fallback: Use GridFS endpoint if specific URL lacks
                // If image_id exists, construct /api/issues/{id}/image
                imageUrl = `${apiClient.baseURL}/issues/${id}/image`;
              }

              return (
                <div key={id} className="bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl overflow-hidden flex flex-col hover:border-gray-500 transition-all shadow-xl">
                  {/* Image Header */}
                  <div className="relative h-48 bg-gray-800">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Evidence" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur px-2 py-1 rounded text-xs font-mono text-white border border-gray-600">
                      ID: {String(id).slice(-6)}
                    </div>
                    <div className={`absolute bottom-3 left-3 px-2 py-1 rounded text-xs font-bold ${confidence > 80 ? 'bg-green-500/90 text-black' :
                      confidence < 50 ? 'bg-red-500/90 text-white' : 'bg-yellow-500/90 text-black'
                      }`}>
                      {confidence}% Confidence
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-white capitalize">{issueType.replace(/_/g, ' ')}</h3>
                      <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                        {review.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 mb-4 line-clamp-3 flex-1">
                      {summary}
                    </p>

                    {/* Debug Info */}
                    <details className="mb-2 text-xs text-gray-600">
                      <summary>Raw Data</summary>
                      <pre className="mt-2 p-2 bg-black rounded overflow-auto max-h-32 text-[10px]">
                        {JSON.stringify(review, null, 2)}
                      </pre>
                    </details>

                    <div className="text-xs text-gray-500 mb-4 space-y-1">
                      <p>📍 {review.location?.address || review.address || 'Unknown Location'}</p>
                      <p>🕒 {new Date(review.timestamp).toLocaleString()}</p>
                      <p>👤 {review.reporter_email || 'Anonymous'}</p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <button
                        onClick={() => handleDecline(id)}
                        disabled={processingId === id}
                        className="flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processingId === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Decline
                      </button>
                      <button
                        onClick={() => openApproveModal(review)}
                        disabled={processingId === id}
                        className="flex items-center justify-center gap-2 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processingId === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <button
              onClick={closeApproveModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-1">Confirm Approval</h2>
              <p className="text-gray-400 text-sm mb-6">Review authority assignment before sending.</p>

              <div className="space-y-4">
                <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Authority</span>
                    {!editAuthority && (
                      <button
                        onClick={() => setEditAuthority(true)}
                        className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Change
                      </button>
                    )}
                  </div>

                  {editAuthority ? (
                    <div className="space-y-3 animation-fade-in">
                      {/* Authority Selector */}
                      {(approvalModal?.issue?.available_authorities?.length > 0 || approvalModal?.issue?.report?.available_authorities?.length > 0) && (
                        <div className="mb-2">
                          <label className="text-xs text-gray-500 block mb-1">Select from Available Authorities</label>
                          <select
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-blue-500 outline-none"
                            onChange={(e) => {
                              const idx = e.target.value;
                              if (idx === "") return;
                              const auths = approvalModal.issue.available_authorities || approvalModal.issue.report.available_authorities;
                              const selected = auths[idx];
                              if (selected) {
                                setNewAuthData({ name: selected.name, email: selected.email });
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>-- Select Authority --</option>
                            {(approvalModal.issue.available_authorities || approvalModal.issue.report?.available_authorities || []).map((auth, idx) => (
                              <option key={idx} value={idx}>
                                {auth.name} ({auth.type})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Authority Name</label>
                        <input
                          value={newAuthData.name}
                          onChange={(e) => setNewAuthData({ ...newAuthData, name: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                          placeholder="e.g. City Fire Dept"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Authority Email</label>
                        <input
                          value={newAuthData.email}
                          onChange={(e) => setNewAuthData({ ...newAuthData, email: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => {
                            setEditAuthority(false);
                            // Reset to original if needed, or keep? Keeping enables toggle back/forth
                          }}
                          className="text-xs text-gray-400 hover:text-white px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{newAuthData.name || approvalModal.currentAuth.name}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {newAuthData.email || approvalModal.currentAuth.email}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-200/80">
                    Approving this issue will immediately trigger an email notification to the assigned authority.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-900/50 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={closeApproveModal}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={processingId === approvalModal.issueId}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg text-sm transition-all flex items-center gap-2"
              >
                {processingId === approvalModal.issueId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
