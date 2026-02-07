import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../services/apiClient';
import { useDialog } from '../context/DialogContext';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Loader2, Edit2, ShieldCheck, Mail, Save, X, Users, BarChart3, CheckSquare, Square, MapPin, Building, FileText, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hasPermission, canActOnIssue, getCurrentAdmin } from '../utils/permissions';
import SkeletonLoader from './SkeletonLoader';
import ReviewCard from './ReviewCard';
import DashboardLayout from './DashboardLayout';
import StatsCard, { StatsGrid } from './StatsCard';
import VirtualizedList from './VirtualizedList';
import DashboardAnalytics from './DashboardAnalytics';

export default function AdminDashboard() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();
  const { showAlert, showConfirm, showPrompt } = useDialog();

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
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'reviews'
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'assigned'

  // Notifications State
  const [notificationList, setNotificationList] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const previousReviewsRef = React.useRef([]);

  // Bulk Selection State
  const [selectedIssues, setSelectedIssues] = useState(new Set());

  // Memoized toggle function to prevent re-renders
  const toggleIssueSelection = useCallback((id) => {
    setSelectedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  // Memoized virtualized items to prevent hook order error
  const virtualizedItems = useMemo(() => {
    const result = [];
    // Group items into rows of 3 for the grid
    for (let i = 0; i < reviews.length; i += 3) {
      result.push(reviews.slice(i, i + 3));
    }
    return result;
  }, [reviews]);

  const handleSelectAll = useCallback(() => {
    if (selectedIssues.size === reviews.length && reviews.length > 0) {
      setSelectedIssues(new Set());
    } else {
      setSelectedIssues(new Set(reviews.map(r => r._id || r.issue_id)));
    }
  }, [selectedIssues.size, reviews]);

  // Urgent double-beep notification sound
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Tone 1: High alert sawtooth
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1); gain1.connect(audioCtx.destination);
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(900, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      // Tone 2: Contrast beep
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2); gain2.connect(audioCtx.destination);
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1200, now + 0.25);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.3, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc1.start(now); osc1.stop(now + 0.2);
      osc2.start(now + 0.25); osc2.stop(now + 0.5);
    } catch (e) { console.error("Audio fail", e); }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchReviews();
    const interval = setInterval(fetchReviews, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchReviews = async () => {
    try {
      if (reviews.length === 0) setLoading(true);
      const data = await apiClient.getPendingReviews();

      // Real-time notification logic
      if (data && Array.isArray(data)) {
        if (previousReviewsRef.current.length > 0) {
          data.forEach(newReview => {
            const isNew = !previousReviewsRef.current.some(old => (old._id || old.issue_id) === (newReview._id || newReview.issue_id));
            if (isNew) {
              playNotificationSound();
              setNotificationList(prev => [{
                id: Date.now() + Math.random(),
                text: `New Report: ${newReview.issue_type || 'Unknown Issue'} detected at ${newReview.address}`,
                time: 'Just now',
                severity: newReview.severity?.toLowerCase()
              }, ...prev].slice(0, 10)); // Keep last 10
            }
          });
        }
        previousReviewsRef.current = data;
      }

      setReviews(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
      if (err.message && (err.message.includes('401') || err.message.includes('403'))) {
        setError("Session expired. Please login again.");
        return;
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
    const currentAdmin = getCurrentAdmin();
    const adminId = currentAdmin ? (currentAdmin.id || currentAdmin._id || 'admin') : 'admin';

    setProcessingId(issueId);
    try {
      if (editAuthority) {
        await apiClient.approveIssueAdmin(issueId, adminId, 'Approved with updated authority', newAuthData.email, newAuthData.name);
      } else {
        await apiClient.approveIssueAdmin(issueId, adminId, 'Approved via Dashboard');
      }
      // Remove from list
      setReviews(prev => prev.filter(r => r._id !== issueId && r.issue_id !== issueId));
      closeApproveModal();
    } catch (err) {
      await showAlert("Failed to approve: " + err.message, { variant: 'error', title: 'Error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (issueId) => {
    const reason = await showPrompt("Enter reason for rejection:", {
      placeholder: "Fake report / Not a public issue",
      title: "Reject Issue",
      confirmText: "Reject",
      variant: 'warning'
    });
    if (!reason) return;

    const currentAdmin = getCurrentAdmin();
    const adminId = currentAdmin ? (currentAdmin.id || currentAdmin._id || 'admin') : 'admin';

    setProcessingId(issueId);
    try {
      await apiClient.declineIssueAdmin(issueId, adminId, reason);
      setReviews(prev => prev.filter(r => r._id !== issueId && r.issue_id !== issueId));
    } catch (err) {
      await showAlert("Failed to decline: " + err.message, { variant: 'error', title: 'Error' });
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
      await showAlert('Please select an admin to assign', { variant: 'warning' });
      return;
    }

    try {
      if (assignmentModal.isBulk) {
        await apiClient.bulkAssignIssues(Array.from(selectedIssues), selectedAdmin);
        await showAlert(`Successfully assigned ${selectedIssues.size} issues!`, { variant: 'success', title: 'Success' });
        setSelectedIssues(new Set());
      } else {
        const issueId = assignmentModal._id || assignmentModal.issue_id;
        await apiClient.assignIssue(issueId, selectedAdmin);
        await showAlert('Issue assigned successfully!', { variant: 'success', title: 'Success' });
      }
      setAssignmentModal(null);
      fetchReviews(); // Refresh list
    } catch (err) {
      console.error('Failed to assign issue:', err);
      await showAlert('Failed to assign issue: ' + err.message, { variant: 'error', title: 'Assignment Failed' });
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
      await showAlert("Changes saved!", { variant: 'success', title: 'Saved' });
    } catch (err) {
      await showAlert("Failed to save changes: " + err.message, { variant: 'error', title: 'Error' });
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
      await showAlert(`Status updated to ${newStatus}`, { variant: 'success' });
    } catch (err) {
      await showAlert("Failed to update status: " + err.message, { variant: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivateUser = async (email, issueId) => {
    if (!email) return await showAlert("No reporter email found.", { variant: 'warning' });
    const reason = await showPrompt(`Deactivate user ${email}? Enter reason:`, {
      placeholder: "Spam / Fake Reports",
      title: "Deactivate User",
      confirmText: "Ban User",
      variant: 'error'
    });
    if (!reason) return;

    const confirmed = await showConfirm(`Are you SURE you want to deactivate ${email}? This action prevents them from logging in.`, {
      title: "Confirm Deactivation",
      confirmText: "Yes, Deactivate",
      variant: 'error'
    });
    if (!confirmed) return;

    try {
      await apiClient.deactivateUser(email, reason, 'admin', issueId);
      await showAlert(`User ${email} deactivated.`, { variant: 'success' });
    } catch (err) {
      // Simple check for the warning message
      if (err.message && (err.message.includes("low AI confidence") || err.message.includes("Low confidence"))) {
        const force = await showConfirm(
          "⚠️ SYSTEM WARNING:\n\nThe AI confidence for this report is LOW. Banning this user implies they submitted a fake report, but the AI is not sure.\n\nDo you want to FORCE deactivate anyway?",
          { title: "Low Confidence Warning", confirmText: "Force Deactivate", variant: 'warning' }
        );
        if (force) {
          try {
            await apiClient.deactivateUser(email, reason, 'admin', issueId, true); // force_confirm=true
            await showAlert(`User ${email} deactivated (Forced).`, { variant: 'success' });
          } catch (e2) {
            await showAlert("Failed to deactivate: " + e2.message, { variant: 'error' });
          }
        }
      } else {
        await showAlert("Failed to deactivate: " + err.message, { variant: 'error' });
      }
    }
  };

  // Switch view mode
  const switchViewMode = async (mode) => {
    setViewMode(mode);
    setLoading(true);
    setError(null); // Clear previous errors
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
      <DashboardLayout currentPage="reviews">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-gray-800 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-800 rounded animate-pulse"></div>
          </div>
          <StatsGrid>
            <StatsCard loading />
            <StatsCard loading />
            <StatsCard loading />
            <StatsCard loading />
          </StatsGrid>
          <SkeletonLoader count={6} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="dashboard" notifications={reviews.length}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Review Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage and review flagged reports</p>
          </div>
          <button
            onClick={fetchReviews}
            className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm border border-gray-700/50 transition-all flex items-center gap-2"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>



        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'reviews'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
          >
            Reviews
            <span className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded-full text-xs">{reviews.length}</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <StatsGrid>
              <StatsCard
                title="Total Reviews"
                value={reviews.length}
                change="+12%"
                trend="up"
                icon={FileText}
                color="blue"
              />
              <StatsCard
                title="Pending"
                value={reviews.filter(r => r.status === 'pending_review' || r.status === 'pending').length}
                change="-5%"
                trend="down"
                icon={Clock}
                color="orange"
              />
              <StatsCard
                title="Approved Today"
                value={reviews.filter(r => r.status === 'approved').length}
                change="+8%"
                trend="up"
                icon={CheckCircle2}
                color="green"
              />
              <StatsCard
                title="High Confidence"
                value={reviews.filter(r => {
                  const report = r.report?.report || r.report || {};
                  const aiData = report.unified_report || report.issue_overview || {};
                  return (aiData.confidence_percent || 0) > 80;
                }).length}
                change="+15%"
                trend="up"
                icon={TrendingUp}
                color="purple"
              />
            </StatsGrid>
            <DashboardAnalytics reviews={reviews} />
          </div>
        ) : (
          /* Reviews List View */
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
            {/* Filter Tabs */}
            {
              hasPermission('view_assigned_issues') && (
                <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-lg w-fit">
                  <button
                    onClick={() => switchViewMode('all')}
                    className={`px-6 py-2 rounded-lg transition-all ${viewMode === 'all'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    All Issues
                  </button>
                  <button
                    onClick={() => switchViewMode('assigned')}
                    className={`px-6 py-2 rounded-lg transition-all ${viewMode === 'assigned'
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    Assigned to Me
                  </button>
                  <button
                    onClick={() => switchViewMode('resolved')}
                    className={`px-6 py-2 rounded-lg transition-all ${viewMode === 'resolved'
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    Resolved History
                  </button>
                </div>
              )
            }

            {/* Bulk Actions Header - Hide in Resolved Mode */}
            {
              hasPermission('assign_issue') && viewMode !== 'resolved' && (
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
                <div className="h-[calc(100vh-340px)] min-h-[500px]">
                  <VirtualizedList
                    items={virtualizedItems}
                    itemHeight={550} // Increased from 480 to 550 to fix overlapping/sticking rows
                    renderItem={(rowItems) => (
                      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8 pb-8 pr-4"> {/* Increased gap and padding */}
                        {rowItems.map((review) => {
                          const id = review._id || review.issue_id;
                          const statusLower = (review.status || '').toLowerCase();
                          const isResolved = ['approved', 'rejected', 'declined', 'submitted', 'resolved'].includes(statusLower);

                          return (
                            <ReviewCard
                              key={id}
                              review={review}
                              isSelected={selectedIssues.has(id)}
                              isProcessing={processingId === id}
                              canSelect={hasPermission('assign_issue') && viewMode !== 'resolved'}
                              canAct={canActOnIssue(review) && viewMode !== 'resolved'}
                              isResolved={isResolved || viewMode === 'resolved'}
                              viewMode={viewMode}
                              onToggleSelect={toggleIssueSelection}
                              onOpenDetail={openDetailModal}
                              onOpenApprove={openApproveModal}
                              onDecline={handleDecline}
                              onOpenAssignment={openAssignmentModal}
                              baseURL={apiClient.baseURL}
                            />
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
              )
            }
          </div>
        )}
      </div>

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
                          if (!img && detailModal.image_id) img = `${apiClient.baseURL}/api/issues/${id}/image`;
                          else if (img && !img.startsWith('http')) {
                            const prefix = img.startsWith('/') ? '' : '/';
                            // If it doesn't already have /api/ but is a relative path, we might need to add it 
                            // though usually images are at /uploads/ or /api/issues/.
                            // Based on backend, it's either GridFS (/api/issues/:id/image) or static.
                            img = `${apiClient.baseURL}${prefix}${img}`;
                          }

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
                <button
                  onClick={closeDetailModal}
                  className="px-6 py-2 text-gray-500 hover:text-white transition-colors"
                >
                  Close
                </button>
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
    </DashboardLayout>
  );
}
