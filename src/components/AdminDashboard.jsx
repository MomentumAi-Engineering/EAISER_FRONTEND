import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Loader2, Edit2, ShieldCheck, Mail, Save, X, Users, BarChart3, CheckSquare, Square, MapPin, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hasPermission, canActOnIssue, getCurrentAdmin } from '../utils/permissions';

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

  // Assignment Modal State
  const [assignmentModal, setAssignmentModal] = useState(null); // { issueId }
  const [adminList, setAdminList] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState('');

  // Detail/Edit Modal State
  const [detailModal, setDetailModal] = useState(null);
  const [editFormData, setEditFormData] = useState({ issue_type: '', summary: '', confidence: 0 });

  // View Mode State
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'assigned'

  // Bulk Selection State
  const [selectedIssues, setSelectedIssues] = useState(new Set());

  const toggleIssueSelection = (id) => {
    const newSet = new Set(selectedIssues);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIssues(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIssues.size === reviews.length && reviews.length > 0) {
      setSelectedIssues(new Set());
    } else {
      setSelectedIssues(new Set(reviews.map(r => r._id || r.issue_id)));
    }
  };

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
      setReviews([]); // Clear data first
      const data = await apiClient.getPendingReviews();
      setReviews(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch reviews", err);

      // Handle authentication errors
      if (err.message && (err.message.includes('401') || err.message.includes('403') || err.message.includes('Admin access required'))) {
        console.warn('Authentication failed, clearing tokens and redirecting');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        navigate('/admin', { replace: true });
        return;
      }

      setError("Failed to load pending reviews: " + (err.message || 'Unknown error'));
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

  // Fetch admin list for assignment
  const fetchAdmins = async () => {
    try {
      const admins = await apiClient.getAdmins();
      // Filter only active admins who can handle issues
      const activeAdmins = admins.filter(a =>
        a.is_active &&
        (a.role === 'admin' || a.role === 'team_member' || a.role === 'super_admin')
      );
      setAdminList(activeAdmins);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    }
  };

  // Open assignment modal
  const openAssignmentModal = (issue) => {
    setAssignmentModal(issue);
    setSelectedAdmin('');
    fetchAdmins();
  };

  // Handle issue assignment (Supports Single and Bulk)
  const handleAssignIssue = async () => {
    if (!selectedAdmin) {
      alert('Please select an admin to assign');
      return;
    }

    try {
      if (assignmentModal.isBulk) {
        await apiClient.bulkAssignIssues(Array.from(selectedIssues), selectedAdmin);
        alert(`Successfully assigned ${selectedIssues.size} issues!`);
        setSelectedIssues(new Set());
      } else {
        const issueId = assignmentModal._id || assignmentModal.issue_id;
        await apiClient.assignIssue(issueId, selectedAdmin);
        alert('Issue assigned successfully!');
      }
      setAssignmentModal(null);
      fetchReviews(); // Refresh list
    } catch (err) {
      console.error('Failed to assign issue:', err);
      alert('Failed to assign issue: ' + err.message);
    }
  };

  const openDetailModal = (issue) => {
    const report = issue.report?.report || issue.report || {};
    const aiData = report.unified_report || report.issue_overview || {};
    setEditFormData({
      issue_type: aiData.issue_type || issue.issue_type || 'Unknown',
      summary: aiData.summary_explanation || issue.description || '',
      confidence: aiData.confidence_percent || 0
    });
    setDetailModal(issue);
  };

  const closeDetailModal = () => {
    setDetailModal(null);
  };

  const handleSaveChanges = async () => {
    if (!detailModal) return;
    const id = detailModal._id || detailModal.issue_id;
    try {
      setProcessingId(id);
      await apiClient.updateReport(id, editFormData.summary, editFormData.issue_type, Number(editFormData.confidence));
      // Update local state deeply to reflect changes immediately
      setReviews(prev => prev.map(r => {
        if ((r._id || r.issue_id) === id) {
          const updated = { ...r };
          // Ensure nested structure exists
          if (!updated.report) updated.report = {};
          if (!updated.report.issue_overview) updated.report.issue_overview = {};

          // Update fields
          updated.report.issue_overview.issue_type = editFormData.issue_type;
          updated.report.issue_overview.summary_explanation = editFormData.summary;
          updated.report.issue_overview.confidence_percent = editFormData.confidence;

          // Also top level fallback
          updated.description = editFormData.summary;
          updated.issue_type = editFormData.issue_type;
          return updated;
        }
        return r;
      }));
      alert("Changes saved!");
    } catch (err) {
      alert("Failed to save changes: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSetStatus = async (issueId, newStatus) => {
    try {
      setProcessingId(issueId);
      await apiClient.setIssueStatus(issueId, newStatus, 'admin', 'Status updated via Dashboard');
      setReviews(prev => prev.map(r =>
        (r._id === issueId || r.issue_id === issueId) ? { ...r, status: newStatus } : r
      ));
      alert(`Status updated to ${newStatus}`);
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivateUser = async (email, issueId) => {
    if (!email) return alert("No reporter email found.");
    const reason = prompt(`Deactivate user ${email}? Enter reason:`, "Spam / Fake Reports");
    if (!reason) return;

    if (!window.confirm(`Are you SURE you want to deactivate ${email}? This action prevents them from logging in.`)) return;

    try {
      await apiClient.deactivateUser(email, reason, 'admin', issueId);
      alert(`User ${email} deactivated.`);
    } catch (err) {
      // Simple check for the warning message
      if (err.message && (err.message.includes("low AI confidence") || err.message.includes("Low confidence"))) {
        if (window.confirm("⚠️ SYSTEM WARNING:\nThe AI confidence for this report is LOW. Banning this user implies they submitted a fake report, but the AI is not sure.\n\nDo you want to FORCE deactivate anyway?")) {
          try {
            await apiClient.deactivateUser(email, reason, 'admin', issueId, true); // force_confirm=true
            alert(`User ${email} deactivated (Forced).`);
          } catch (e2) {
            alert("Failed to deactivate: " + e2.message);
          }
        }
      } else {
        alert("Failed to deactivate: " + err.message);
      }
    }
  };

  // Switch view mode
  const switchViewMode = async (mode) => {
    setViewMode(mode);
    setLoading(true);
    setReviews([]); // Clear data while loading to prevent stale renders

    try {
      if (mode === 'assigned') {
        const data = await apiClient.getMyAssignedIssues();
        setReviews(data.issues || []);
      } else if (mode === 'resolved') {
        const data = await apiClient.getResolvedReviews();
        setReviews(data || []);
      } else {
        await fetchReviews();
      }
    } catch (err) {
      console.error('Failed to switch view:', err);
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between mb-10">
            <div className="h-10 w-64 bg-gray-800 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-800 rounded animate-pulse"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden h-96">
                <div className="h-48 bg-gray-800 animate-pulse"></div>
                <div className="p-5 space-y-4">
                  <div className="h-6 w-3/4 bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-gray-800 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 relative">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-blue-500">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Review flagged and low-confidence reports</p>
          </div>
          <div className="flex gap-3">
            {/* Show Manage Team button only for super_admin */}
            {hasPermission('manage_team') && (
              <button
                onClick={() => navigate('/admin/team')}
                className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-sm border border-purple-500/30 transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Manage Team
              </button>
            )}
            {/* View Stats button for all roles */}
            {hasPermission('view_stats') && (
              <button
                onClick={() => navigate('/admin/stats')}
                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm border border-blue-500/30 transition-all flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                View Stats
              </button>
            )}
            <button
              onClick={() => navigate('/admin/mapping')}
              className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-sm border border-orange-500/30 transition-all flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Mapping
            </button>
            <button
              onClick={() => navigate('/admin/authorities')}
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm border border-blue-500/30 transition-all flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Authorities
            </button>
            <button
              onClick={() => navigate('/admin/security')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Security
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminData');
                navigate('/admin');
              }}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30 transition-all"
            >
              Logout
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-sm border border-rose-500/30 transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> Manage Users
            </button>
            <button
              onClick={fetchReviews}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 hover:text-white text-gray-400 rounded-lg text-sm border border-gray-700 transition-all flex items-center gap-2"
            >
              <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        {/* View Mode Tabs */}
        {
          hasPermission('view_assigned_issues') && (
            <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-lg w-fit">
              <button
                onClick={() => switchViewMode('all')}
                className={`px-6 py-2 rounded-lg transition-all ${viewMode === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                Pending
              </button>
              <button
                onClick={() => switchViewMode('assigned')}
                className={`px-6 py-2 rounded-lg transition-all ${viewMode === 'assigned'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                Assigned
              </button>
              <button
                onClick={() => switchViewMode('resolved')}
                className={`px-6 py-2 rounded-lg transition-all ${viewMode === 'resolved'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                Resolved History
              </button>
            </div>
          )
        }


        {/* Bulk Actions Header */}
        {
          hasPermission('assign_issue') && (
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                {selectedIssues.size > 0 && selectedIssues.size === reviews.length ? <CheckSquare className="w-5 h-5 text-purple-500" /> : <Square className="w-5 h-5" />}
                Select All ({reviews.length})
              </button>
              {selectedIssues.size > 0 && (
                <span className="text-purple-400 font-semibold">{selectedIssues.size} selected</span>
              )}
            </div>
          )
        }

        {
          error && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-200 mb-8 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )
        }

        {
          reviews.length === 0 && !error ? (
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

                // Define status helper
                const statusLower = (review.status || '').toLowerCase();
                const isResolved = ['approved', 'rejected', 'declined', 'submitted', 'resolved'].includes(statusLower);

                // Extract data safely
                const report = review.report?.report || review.report || {};
                const aiData = report.unified_report || report.issue_overview || {};
                const issueType = aiData.issue_type || review.issue_type || 'Unknown';
                const confidence = aiData.confidence_percent || 0;
                // 🟢 Ticket 2: Prefer "User Friendly" summary, fall back to "Technical" or standard
                const summary = aiData.user_feedback || aiData.summary_explanation || review.description || "No description";

                // 🟢 Ticket 2: Admin Analysis for tooltip or extra info
                const adminAnalysis = aiData.admin_analysis || "No technical analysis available";

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
                  <div key={id} onClick={() => !isResolved && openDetailModal(review)} className={`group bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl overflow-hidden flex flex-col hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 transform ${!isResolved ? 'cursor-pointer hover:-translate-y-1 hover:border-purple-500/50' : 'cursor-default opacity-80'}`}>
                    {/* Image Header */}
                    <div
                      className={`relative h-48 bg-gray-800 group ${!isResolved ? 'cursor-pointer' : ''}`}
                      onClick={(e) => {
                        if (isResolved) {
                          e.stopPropagation();
                          return;
                        }
                        openReportModal(review);
                      }}
                    >
                      {/* Selection Checkbox */}
                      {hasPermission('assign_issue') && !isResolved && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleIssueSelection(id); }}
                          className="absolute top-3 left-3 z-10 p-1 rounded hover:scale-110 transition-transform bg-black/40 backdrop-blur-sm"
                        >
                          {selectedIssues.has(id) ? <CheckSquare className="w-5 h-5 text-purple-500 fill-purple-500/10" /> : <Square className="w-5 h-5 text-white/50 hover:text-white" />}
                        </button>
                      )}
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
                        <p>👤 <span className="text-white font-medium">{review.user_reputation?.name || 'User'}</span> <span className="text-gray-500 text-xs">({review.reporter_email || review.user_email || 'No Email'})</span></p>

                        {/* Show Resolver Info if available */}
                        {review.admin_review && review.admin_review.admin_id && (
                          <p className="text-green-400 font-semibold border-t border-gray-800 pt-1 mt-1">
                            ✅ Resolved by: {review.admin_review.admin_id}
                          </p>
                        )}
                      </div>

                      {/* Assignment Section */}
                      {hasPermission('assign_issue') && (
                        <div className="mb-3">
                          {review.assigned_to ? (
                            <div className="text-xs text-purple-400 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/30">
                              📌 Assigned to: {review.assigned_to}
                            </div>
                          ) : (
                            !isResolved && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openAssignmentModal(review); }}
                                className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                              >
                                <Users className="w-4 h-4" />
                                Assign to Team Member
                              </button>
                            )
                          )}
                        </div>
                      )}                      {/* Action Buttons - Hide if already resolved */}
                      {isResolved ? (
                        <div className="mt-4 p-2 bg-gray-800 rounded border border-gray-700 text-center text-sm text-gray-400">
                          <CheckCircle2 className="w-4 h-4 inline mr-2 text-green-500" />
                          Review Completed
                        </div>
                      ) : (
                        /* Only show actions if admin can act AND issue is pending */
                        <>
                          {canActOnIssue(review) && (
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDecline(id); }}
                                disabled={processingId === id}
                                className="flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {processingId === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Decline
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); openApproveModal(review); }}
                                disabled={processingId === id}
                                className="flex items-center justify-center gap-2 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {processingId === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Review
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* Show message if user cannot act on this issue */}
                      {!canActOnIssue(review) && !isResolved && (
                        <div className="text-center py-3 text-gray-500 text-sm">
                          <ShieldAlert className="w-4 h-4 inline mr-2" />
                          Not assigned to you
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div >

      {/* Bulk Action Bar - Sticky Bottom */}
      {
        selectedIssues.size > 0 && hasPermission('assign_issue') && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur border border-purple-500/50 rounded-xl px-6 py-4 shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-5">
            <span className="text-white font-bold text-lg">{selectedIssues.size} selected</span>
            <div className="h-8 w-px bg-gray-700"></div>
            <button
              onClick={() => { setAssignmentModal({ isBulk: true }); fetchAdmins(); }}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20"
            >
              <Users className="w-5 h-5" /> Assign to Team
            </button>
            <button
              onClick={() => setSelectedIssues(new Set())}
              className="text-gray-400 hover:text-white text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        )
      }

      {/* Approval Modal */}
      {
        approvalModal && (
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
        )
      }

      {/* Assignment Modal */}
      {
        assignmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-400" />
                {assignmentModal.isBulk ? `Assign ${selectedIssues.size} Issues` : 'Assign Issue'}
              </h2>

              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-4">
                  Select a team member to assign this issue to:
                </p>

                <select
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Select Admin --</option>
                  {adminList.map((admin) => (
                    <option key={admin.id || admin._id} value={admin.email}>
                      {admin.name || admin.email} ({admin.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAssignmentModal(null)}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignIssue}
                  disabled={!selectedAdmin}
                  className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Assign
                </button>
              </div>
            </div>
          </div>
        )
      }


      {/* Detail / Edit Modal */}
      {
        detailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">

              {/* Modal Header */}
              <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-500" />
                  Inspect & Verify Report
                </h2>
                <button onClick={closeDetailModal} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
                <div className="grid md:grid-cols-2 gap-8">

                  {/* Left Column: Evidence & Map */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Visual Evidence</h3>
                      <div className="rounded-xl overflow-hidden border border-gray-700 aspect-video bg-black relative">
                        {/* Safe Image Access */}
                        {(() => {
                          const id = detailModal._id || detailModal.issue_id;
                          let img = detailModal.image_url;
                          if (!img && detailModal.image_id) img = `${apiClient.baseURL}/issues/${id}/image`;
                          else if (img && !img.startsWith('http')) img = `${apiClient.baseURL}${img}`;

                          return img ? (
                            <img src={img} alt="Evidence" className="w-full h-full object-contain" />
                          ) : <div className="flex items-center justify-center h-full text-gray-500">No Image</div>;
                        })()}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">AI Analysis Summary</h3>
                      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                        {(() => {
                          const r = detailModal.report?.report || detailModal.report || {};
                          const ov = r.issue_overview || {};
                          return ov.summary_explanation || detailModal.description || "No analysis available.";
                        })()}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Location</h3>
                      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                        <div className="flex items-center gap-3 text-gray-300 mb-2">
                          <MapPin className="w-5 h-5 text-blue-500" />
                          <span>{detailModal.location?.address || detailModal.address || 'Unknown Location'}</span>
                        </div>
                        <div className="text-xs text-gray-500 pl-8">
                          ZIP: {detailModal.location?.zip_code || detailModal.zip_code || '—'}
                          <span className="mx-2">•</span>
                          Lat/Lon: {detailModal.location?.latitude || detailModal.latitude || '0'}, {detailModal.location?.longitude || detailModal.longitude || '0'}
                        </div>
                        {/* Simple Map Link */}
                        <a
                          href={`https://www.google.com/maps?q=${detailModal.location?.latitude || detailModal.latitude},${detailModal.location?.longitude || detailModal.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block mt-3 text-center py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm rounded-lg transition-colors border border-blue-500/20"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    </div>

                    {/* Reporter Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Reporter</h3>
                      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 flex justify-between items-center">
                        <div className="flex items-center gap-3 text-gray-300">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                            {(detailModal.user_reputation?.name || detailModal.reporter_email || detailModal.user_email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{detailModal.user_reputation?.name || 'User'} <span className="text-gray-500 font-normal text-xs">({detailModal.reporter_email || detailModal.user_email || 'Anonymous'})</span></div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span>Reporter</span>
                              {detailModal.user_reputation && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${(detailModal.user_reputation.rejected_count || 0) > 2
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-gray-700 text-gray-400 border-gray-600'
                                  }`}>
                                  {(detailModal.user_reputation.rejected_count || 0)} Rejected Reports
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {detailModal.reporter_email && (
                          <button
                            onClick={() => handleDeactivateUser(detailModal.reporter_email, detailModal._id || detailModal.issue_id)}
                            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs transition-colors flex items-center gap-1"
                          >
                            <ShieldAlert className="w-3 h-3" /> Ban User
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Editable Details */}
                  <div className="space-y-6">

                    {/* Issue Type */}
                    <div>
                      <label className="text-sm font-semibold text-gray-400 mb-2 block">Issue Type</label>
                      <select
                        value={editFormData.issue_type}
                        onChange={(e) => setEditFormData({ ...editFormData, issue_type: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none capitalize"
                      >
                        {[
                          'pothole', 'road_damage', 'broken_streetlight', 'garbage',
                          'flood', 'fire', 'dead_animal', 'water_leakage',
                          'fallen_tree', 'illegal_parking', 'vandalism', 'other', 'unknown'
                        ].map(type => (
                          <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>

                    {/* Confidence Score */}
                    <div>
                      <label className="text-sm font-semibold text-gray-400 mb-2 block flex justify-between">
                        <span>Confidence Score</span>
                        <span
                          className="font-bold transition-colors duration-300"
                          style={{
                            color: (() => {
                              const val = editFormData.confidence;
                              if (val >= 80) return '#4ade80'; // green-400
                              if (val >= 50) return '#facc15'; // yellow-400
                              return '#ef4444'; // red-500
                            })()
                          }}
                        >
                          {editFormData.confidence}%
                        </span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editFormData.confidence}
                        onChange={(e) => setEditFormData({ ...editFormData, confidence: Number(e.target.value) })}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: (() => {
                            const val = editFormData.confidence;
                            let color = '#ef4444'; // red-500
                            if (val >= 80) color = '#4ade80'; // green-400
                            else if (val >= 50) color = '#facc15'; // yellow-400
                            return `linear-gradient(to right, ${color} 0%, ${color} ${val}%, #374151 ${val}%, #374151 100%)`;
                          })()
                        }}
                      />
                    </div>

                    {/* Description / Summary */}
                    <div>
                      <label className="text-sm font-semibold text-gray-400 mb-2 block">Summary / Description</label>
                      <textarea
                        value={editFormData.summary}
                        onChange={(e) => setEditFormData({ ...editFormData, summary: e.target.value })}
                        className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Enter detailed description of the issue..."
                      />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-800">
                      <button
                        onClick={handleSaveChanges}
                        disabled={processingId === (detailModal._id || detailModal.issue_id)}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" /> Save Changes
                      </button>
                    </div>

                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-between items-center gap-4">
                {/* Left: Dismiss/Cancel */}
                <button
                  onClick={closeDetailModal}
                  className="px-6 py-2 text-gray-500 hover:text-white transition-colors"
                >
                  Close
                </button>

                {/* Status Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Set Status:</span>
                  <select
                    className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 outline-none"
                    value={detailModal.status || 'needs_review'}
                    onChange={(e) => handleSetStatus(detailModal._id || detailModal.issue_id, e.target.value)}
                  >
                    <option value="needs_review">Needs Review</option>
                    <option value="investigating">Investigating</option>
                    <option value="needs_support">Needs Support</option>
                    <option value="no_action_required">No Action Required</option>
                    <option value="duplicate">Duplicate</option>
                  </select>
                </div>

                {/* Right: Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const id = detailModal._id || detailModal.issue_id;
                      if (window.confirm('Are you sure you want to decline this report?')) {
                        handleDecline(id);
                        closeDetailModal();
                      }
                    }}
                    className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-semibold flex items-center gap-2 transition-all"
                  >
                    <XCircle className="w-4 h-4" /> Decline Report
                  </button>
                  <button
                    onClick={() => {
                      openApproveModal(detailModal);
                      // Hide detail modal when approving
                      closeDetailModal();
                    }}
                    className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg shadow-lg shadow-green-900/20 flex items-center gap-2 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Assign
                  </button>
                </div>
              </div>

            </div>
          </div>
        )
      }

    </div >
  );
}
