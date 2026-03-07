// HMR Force Update - Refined Description formatting

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Image as ImageIcon, MapPin, FileText, CheckCircle2, Clock, Check, AlertTriangle, ShieldAlert, Send, Edit2, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti'; // Assuming it's installed, otherwise I will guide to install or use fallback.
// Actually, to be safe, I'll use a dynamic import or checking.
// But since I can't interactively check, I'll use a robust method: `npm install canvas-confetti` command? No, I should use what's available.
// I'll stick to Framer Motion for the checkmark and "Celebrate" via CSS particles if needed.
// WAIT. I'll try to just use Framer Motion for a "Burst" effect which is reliable. Confetti might be overkill if library missing.
// user said "yeh sabhi kuch impliment karo" (Implement everything).
// I will try to use `canvas-confetti`. I will run `npm install canvas-confetti` alongside.

// ... re-reading prompt ...
// "Success Celebration (Confetti Blast ... Green Checkmark line by line)"

// I'll use `framer-motion` for checkmark drawing.
// I'll run `npm install canvas-confetti` in a separate command to ensure it's there.


// Helper to safely access nested fields with fallback
const pick = (obj, keys, fallback = undefined) => {
  // Iterate keys until a defined value is found
  for (const key of keys) {
    const parts = key.split('.');
    let cur = obj;
    for (const p of parts) {
      if (!cur || typeof cur !== 'object') { cur = undefined; break; }
      cur = cur[p];
    }
    if (cur !== undefined && cur !== null) return cur;
  }
  return fallback;
};

export default function ReportReview({ issue, imagePreview, analysisDescription, userAddress, userZip, userLat, userLon, imageName, onClearReport, isManualMode, incidentDate }) {
  const navigate = useNavigate();
  const issueId = pick(issue, ['id', 'issue_id', 'data.id'], 'N/A');
  const status = pick(issue, ['report.status', 'status'], 'pending');
  const dispatchDecision = pick(issue, ['report.dispatch_decision', 'dispatch_decision'], null);

  // Compute confidence early as it's used in submit handlers
  let confidence = pick(issue, [
    'confidence',              // top-level from IssueResponse
    'report.confidence',       // nested in report object
    'report.report.unified_report.confidence_percent',
    'report.unified_report.confidence_percent',
    'report.report.issue_overview.confidence',
    'report.issue_overview.confidence',
  ], null);
  if (confidence !== null) {
    try {
      const num = Number(confidence);
      confidence = num <= 1 ? Math.round(num * 100) : Math.round(num);
    } catch { }
  }

  const formatIssueType = (type) => {
    if (!type || String(type).toLowerCase() === 'manual report') return type || 'Unknown';
    return String(type)
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Manual report form state (for No Issue Detected card)
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDescription, setManualDescription] = useState('');
  const [manualIssueType, setManualIssueType] = useState('other');
  const [customManualIssueType, setCustomManualIssueType] = useState('');

  // Extract authorities
  const recommendedAuthorities = pick(issue, ['report.report.responsible_authorities_or_parties', 'responsible_authorities_or_parties'], []);
  const availableAuthorities = pick(issue, ['authorities', 'available_authorities', 'report.available_authorities'], []) || [];

  // Merge lists to ensure we have a comprehensive list for selection (deduplicating by email)
  const allAuthsMap = new Map();
  [...availableAuthorities, ...recommendedAuthorities].forEach(auth => {
    if (auth.email) allAuthsMap.set(auth.email, auth);
  });
  const allAuthorities = Array.from(allAuthsMap.values());

  const [allAuthoritiesState, setAllAuthoritiesState] = useState([]);
  const [needsAuthorityRefresh, setNeedsAuthorityRefresh] = useState(false);
  const [isRefreshingAuths, setIsRefreshingAuths] = useState(false);

  // State for selected authorities
  const [selectedAuths, setSelectedAuths] = useState([]);

  // Initialize selected authorities with recommended ones
  useEffect(() => {
    if (!hasEdited) {
      setAllAuthoritiesState(allAuthorities);
      if (recommendedAuthorities.length > 0) {
        setSelectedAuths(recommendedAuthorities);
      } else if (allAuthorities.length > 0) {
        // Default to first if no specific recommendation
        setSelectedAuths([allAuthorities[0]]);
      }
    }
  }, [issue]);

  const toggleAuthority = (auth) => {
    setSelectedAuths(prev => {
      const exists = prev.find(a => a.email === auth.email);
      if (exists) {
        return prev.filter(a => a.email !== auth.email);
      } else {
        return [...prev, auth];
      }
    });
  };

  const [successMessage, setSuccessMessage] = useState("");
  const [isReview, setIsReview] = useState(false);

  // Safe computation of Guest Status
  const isAuthenticated = !!(localStorage.getItem("token") || localStorage.getItem("auth_token"));
  const API_IsGuest = pick(issue, ['is_guest', 'data.is_guest'], null);

  // If they have a token NOW, unlock the wall. Otherwise trust API or fallback to true.
  const isGuest = isAuthenticated ? false : (API_IsGuest !== null ? !!API_IsGuest : true);

  // Auth popup state for guest users trying to submit
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  // EDIT MODE STATE
  const [isEditing, setIsEditing] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const [editForm, setEditForm] = useState({
    issue_type: 'Other',
    severity: 'medium',
    summary: '',
    description: '',
    returnTo: '/report'
  });

  // Initialize Edit Mode for Manual Reports
  useEffect(() => {
    const type = pick(issue, ['issue_overview.issue_type', 'report.report.issue_overview.issue_type', 'report.unified_report.issue_type', 'issue_type'], 'Unknown');
    const conf = pick(issue, ['report.report.unified_report.confidence_percent', 'report.issue_overview.confidence'], 100);

    // Set initial form values
    const initialSummary = pick(issue, ['report.report.issue_overview.summary_explanation', 'summary'], '');

    setEditForm({
      issue_type: type,
      severity: pick(issue, ['severity', 'priority'], 'medium'),
      summary: initialSummary,
      description: initialSummary
    });

    // Auto-enter edit mode for manual reports
    if (type === 'Manual Report' || conf === 0) {
      setIsEditing(true);
    }
  }, [issue]);

  if (hasEdited) {
    confidence = null; // Auto remove confidence string if user manually edits
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    setHasEdited(true);
    setNeedsAuthorityRefresh(true);
  };

  const handleRefreshAuthorities = async () => {
    try {
      setIsRefreshingAuths(true);
      setError(null);
      const currentZipCode = userZip || pick(issue, ['zip_code', 'location.zip_code'], 'default');
      const res = await apiClient.getAuthoritiesByZip(currentZipCode);

      const formIssueType = (editForm.issue_type || "other").toLowerCase();
      const typeMap = {
        pothole: ['public_works', 'transportation'],
        road_damage: ['public_works', 'transportation'],
        broken_streetlight: ['public_works'],
        garbage: ['sanitation', 'environment', 'public_works'],
        flood: ['water_utility', 'public_works', 'emergency'],
        water_leakage: ['water_utility', 'public_works'],
        fire: ['fire', 'emergency'],
        dead_animal: ['animal_control', 'sanitation', 'public_works'],
        vandalism: ['police', 'public_works'],
        car_accident: ['police', 'emergency', 'transportation'],
        abandoned_vehicle: ['police', 'code_enforcement', 'public_works']
      };

      const neededCategories = typeMap[formIssueType] || ['general', 'public_works'];

      let newAuths = [];
      const addedEmails = new Set();

      for (const cat of neededCategories) {
        if (res[cat] && Array.isArray(res[cat])) {
          res[cat].forEach(auth => {
            if (!addedEmails.has(auth.email)) {
              newAuths.push(auth);
              addedEmails.add(auth.email);
            }
          });
        }
      }

      if (newAuths.length === 0 && res.default) {
        Object.values(res.default).flat().forEach(auth => {
          if (!addedEmails.has(auth.email)) {
            newAuths.push(auth);
            addedEmails.add(auth.email);
          }
        });
      }

      if (newAuths.length === 0 && allAuthorities.length > 0) {
        newAuths = allAuthorities;
      }

      setAllAuthoritiesState(newAuths);
      setSelectedAuths(newAuths);
      setNeedsAuthorityRefresh(false);

    } catch (err) {
      console.error(err);
      setError("Failed to fetch updated authorities. You may proceed with current selection.");
      setNeedsAuthorityRefresh(false);
    } finally {
      setIsRefreshingAuths(false);
    }
  };

  const handleSubmit = async () => {
    // ---------------------------------------------------------------
    // AUTH GATE: Block unauthenticated users from submitting
    // ---------------------------------------------------------------
    if (isGuest) {
      setShowAuthPopup(true);
      return;
    }

    let finalAuths = selectedAuths;

    // For any issue with no mapped authorities (including 'other' / unknown types),
    // automatically route to Admin Review Team.
    // Admin will review via Mapping Review and route to correct department.
    if (finalAuths.length === 0) {
      finalAuths = [{
        name: "EAiSER Admin Review Team",
        email: "eaiser@momntumai.com",
        type: "admin_review"
      }];
    }


    setSubmitting(true);
    setError(null);
    try {
      const reportData = (isEditing || hasEdited) ? editForm : undefined;
      const response = await apiClient.submitIssue(issueId, finalAuths, reportData);
      setSuccessMessage(response.message || "Report submitted successfully.");
      setIsReview(response.report?.status === 'needs_review');
      setSubmitSuccess(true);

      try { sessionStorage.removeItem('eaiser_pending_report'); } catch { }

      // Trigger Confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#22c55e', '#ffffff']
      });

    } catch (err) {
      console.error("Submit failed", err);
      // If it's an auth error, trigger the login popup
      if (err.status === 401) {
        setIsGuest(true);
        setShowAuthPopup(true);
        setError("Your session has expired. Please log in again to submit your report.");
        return;
      }
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- SCREENED OUT / FLAGGED VIEW ---
  if (status === 'screened_out' || dispatchDecision === 'reject') {
    return (
      <div className="mt-8 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl border border-red-900/50 p-8 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">Pending Manual Audit</h2>

        <p className="text-gray-300 mb-6 text-lg">
          Our specialized verification team is conducting a manual audit of this report to ensure high-quality data integrity.
        </p>

        <div className="bg-white/5 border border-gray-700 rounded-xl p-6 text-left mb-8">
          <p className="text-sm text-gray-400 mb-2 font-semibold uppercase tracking-wider">Audit Process</p>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-yellow-500 shrink-0" />
              <span>Report is forwarded to our internal Quality Assurance team.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-yellow-500 shrink-0" />
              <span>Evidence is cross-referenced with local municipal records.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-yellow-500 shrink-0" />
              <span>Upon verification, the report is dispatched to the relevant authorities.</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => onClearReport ? onClearReport() : window.location.reload()}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold text-white transition-all"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  // --- NO ISSUE DETECTED → SHORT MANUAL REVIEW CARD ---
  const aiEval = pick(issue, ['report.report.ai_evaluation', 'report.ai_evaluation', 'ai_evaluation'], {});
  const isNoIssue = (
    aiEval.issue_detected === false
    || status === 'manual_review_required'
    || pick(issue, ['report.report._manual_review_required', 'report._manual_review_required', '_manual_review_required'], false) === true
  );

  if (isNoIssue && !submitSuccess) {
    const noIssueSummary = "AI detection inconclusive. To ensure the city receives accurate info, please Request a Review or Manually Describe the issue to proceed.";

    // Handler for manual report submission (forces Internal Review Team only)
    const handleManualSubmit = async () => {
      if (isGuest) {
        setShowAuthPopup(true);
        return;
      }

      if (!manualDescription.trim()) {
        setError("Please describe the issue before submitting.");
        return;
      }

      const internalTeam = [{
        name: "Internal Review Team",
        email: "eaiser@momntumai.com",
        type: "internal"
      }];

      const manualReportData = {
        issue_type: manualIssueType === 'other_issue' ? customManualIssueType : manualIssueType,
        severity: 'medium',
        summary: manualDescription.trim(),
        description: manualDescription.trim(),
      };

      setSubmitting(true);
      setError(null);
      try {
        const response = await apiClient.submitIssue(issueId, internalTeam, manualReportData);
        setSuccessMessage(response.message || "Manual report submitted to admin team for review.");
        setIsReview(true);
        setSubmitSuccess(true);

        try { sessionStorage.removeItem('eaiser_pending_report'); } catch { }

        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#facc15', '#eab308', '#ffffff']
        });

      } catch (err) {
        console.error("Manual submit failed", err);
        setError(err.message || "Failed to submit manual report. Please try again.");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="mt-8 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl border border-yellow-800/40 p-8 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
          <AlertTriangle className="w-10 h-10 text-yellow-500" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">No Issue Detected</h2>
        <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
          {String(noIssueSummary)}
        </p>

        {/* Show submitted image */}
        {imagePreview && (
          <div className="mb-6 max-w-sm mx-auto">
            <img src={imagePreview} alt="Submitted" className="w-full h-48 object-cover rounded-xl border border-gray-700" />
          </div>
        )}

        <div className="bg-white/5 border border-gray-700 rounded-xl p-5 text-left mb-6 max-w-md mx-auto">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">What happens next?</p>
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-3">Once Submitted:</p>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <span><strong className="text-white">Expert Verification:</strong> Our team will receive your report for manual review.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <span><strong className="text-white">Precision Guard:</strong> To ensure high accuracy, city notifications are held until the issue is confirmed.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <span><strong className="text-white">Rapid Escalation:</strong> Once verified, your report is fast-tracked to the correct municipal department.</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm max-w-md mx-auto">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${submitting
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg'
              }`}
          >
            {submitting ? 'Submitting...' : (
              <><Send className="w-4 h-4" /> Request Manual Review</>
            )}
          </button>

          {/* --- MANUAL REPORT OPTION --- */}
          <div className="relative">
            <div className="flex items-center gap-4 my-2">
              <div className="h-px flex-1 bg-gray-800" />
              <span className="text-[10px] font-black text-gray-600 uppercase italic">Or</span>
              <div className="h-px flex-1 bg-gray-800" />
            </div>

            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className={`w-full py-3 border rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${showManualForm
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                : 'bg-white/5 hover:bg-white/10 border-gray-700 text-gray-300 hover:text-white'
                }`}
            >
              <Edit2 className="w-4 h-4" />
              {showManualForm ? 'Hide Manual Report Form' : 'Generate Manual Report'}
            </button>

            {showManualForm && (
              <div className="mt-4 bg-gray-900/60 border border-gray-700 rounded-2xl p-6 text-left space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Edit2 className="w-3 h-3 text-blue-400" /> Manual Report
                  </p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Describe the issue in your own words. This report will be sent <strong className="text-yellow-400">only to the admin team</strong> — not directly to authorities.
                  </p>
                </div>

                {/* Issue Type */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Issue Type</label>
                  <select
                    value={manualIssueType}
                    onChange={(e) => setManualIssueType(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="other">Select Issue Type...</option>
                    <option value="pothole">Pothole / Road Hole</option>
                    <option value="road_damage">Road Damage</option>
                    <option value="broken_streetlight">Broken Streetlight</option>
                    <option value="garbage">Garbage / Waste</option>
                    <option value="flood">Flooding / Waterlogging</option>
                    <option value="water_leakage">Water Leakage</option>
                    <option value="fire">Fire / Smoke Hazard</option>
                    <option value="dead_animal">Dead Animal</option>
                    <option value="vandalism">Public Property Vandalism</option>
                    <option value="car_accident">Car Accident</option>
                    <option value="abandoned_vehicle">Abandoned Vehicle</option>
                    <option value="other_issue">Specify Manually...</option>
                  </select>
                </div>

                {manualIssueType === 'other_issue' && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Specify Issue</label>
                    <input
                      type="text"
                      placeholder="e.g. Broken bench, Tree fallen..."
                      className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-blue-500 transition-colors"
                      onChange={(e) => {
                        // We use the input directly when submitting if manualIssueType is 'other_issue'
                        // but to keep it simple, let's just make the manualSubmit use a ref or another state.
                        // Actually, I'll update the manualSubmit logic to check this.
                        setCustomManualIssueType(e.target.value);
                      }}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Describe the Issue</label>
                  <textarea
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe what you see in detail — what is the problem, how severe is it, and any other relevant information..."
                    className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-blue-500 transition-colors resize-none placeholder:text-gray-600"
                  />
                  <p className="text-[10px] text-gray-600 mt-1 text-right">{manualDescription.length}/500</p>
                </div>

                {/* Admin-only notice */}
                <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                  <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-300/80 leading-relaxed">
                    This manual report will be reviewed by our <strong>admin team only</strong>. It will <strong>not</strong> be sent to any external authority directly.
                  </p>
                </div>

                {/* Submit Manual Report Button */}
                <button
                  onClick={handleManualSubmit}
                  disabled={submitting || !manualDescription.trim()}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${submitting || !manualDescription.trim()
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    }`}
                >
                  {submitting ? 'Submitting...' : (
                    <><Send className="w-4 h-4" /> Submit Manual Report to Admin</>
                  )}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onClearReport ? onClearReport() : window.location.reload()}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-xl font-semibold text-white text-sm transition-all"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  // --- SUCCESS VIEW (ANIMATED POPUP) ---
  if (submitSuccess) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md px-4">
        {/* Animated Background Rays */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -mt-[100vw] -ml-[100vw] w-[200vw] h-[200vw] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(0,0,0,0)_0%,rgba(59,130,246,0.1)_25%,rgba(0,0,0,0)_50%,rgba(59,130,246,0.1)_75%,rgba(0,0,0,0)_100%)] rounded-full z-0"
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="relative z-10 bg-gradient-to-br from-gray-900 to-black p-8 md:p-12 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.2)] max-w-xl w-full text-center"
        >
          {isReview ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.6, duration: 0.8, delay: 0.2 }}
              className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(234,179,8,0.3)] border border-yellow-500/50"
            >
              <Clock className="w-12 h-12 text-yellow-400" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.6, duration: 0.8, delay: 0.2 }}
              className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)] border border-green-500/50"
            >
              <svg className="w-12 h-12 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <motion.path
                  d="M20 6L9 17l-5-5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8, ease: "easeInOut" }}
                />
              </svg>
            </motion.div>
          )}

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-3xl md:text-4xl font-black text-white mb-6"
          >
            {isReview ? (
              <span>Report Submitted for <span className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">Review</span></span>
            ) : (
              <span>Report <span className="text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">Submitted</span> successfully</span>
            )}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="min-h-[60px]"
          >
            {isReview ? (
              <p className="text-yellow-200/90 text-lg tracking-wide border-t border-b border-white/5 py-4 leading-relaxed font-medium">
                Your report has been received and is being verified by our team before dispatching to the authorities.
              </p>
            ) : (
              <div className="border-t border-b border-white/5 py-4">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Report Submitted to:</p>
                <div className="flex flex-col items-center justify-center gap-1">
                  {selectedAuths.map((auth, idx) => (
                    <p key={idx} className="text-blue-300 text-lg font-semibold tracking-wide flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" /> {auth.name}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className="mt-8 pt-4 pb-2"
          >
            <p className="text-white font-black text-xl md:text-2xl mb-3 tracking-wide">Thank you for using EAiSER</p>
            <div className="flex flex-col items-center mt-6 gap-4">
              <button
                onClick={() => {
                  if (onClearReport) onClearReport();
                  navigate('/dashboard');
                }}
                className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95"
              >
                Back to Dashboard
              </button>

            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const aiReport = pick(issue, ['report.report', 'report', 'data.report'], {});
  const aiOverview = pick(aiReport, ['issue_overview', 'unified_report.issue_overview'], {});
  const summaryExplanation = pick(aiOverview, ['summary_explanation', 'summary'], null);
  const detectedProblems = pick(aiOverview, ['detected_problems', 'issues', 'labels'], []);

  let issueType = pick(issue, [
    'issue_type',
    'classification.issue_type',
    'report.report.unified_report.issue_type',
    'report.unified_report.issue_type',
    'report.report.issue_overview.issue_type',
    'report.report.template_fields.issue_type',
    'report.issue_type',
  ], 'Unknown');
  if (!issueType || String(issueType).toLowerCase() === 'unknown') {
    const labelsText = String((Array.isArray(detectedProblems) ? detectedProblems.join(' ') : '') + ' ' + (summaryExplanation || '')).toLowerCase();
    if (labelsText.includes('tree')) issueType = 'tree_fallen';
    else if (labelsText.includes('pothole') || labelsText.includes('crack')) issueType = 'road_damage';
    else if (labelsText.includes('streetlight')) issueType = 'broken_streetlight';
    else if (labelsText.includes('garbage') || labelsText.includes('trash') || labelsText.includes('waste')) issueType = 'garbage';
    else if (labelsText.includes('flood') || labelsText.includes('waterlogging')) issueType = 'flood';
    else if (labelsText.includes('fire') || labelsText.includes('smoke')) issueType = 'fire';
    else if (labelsText.includes('accident') || labelsText.includes('crash') || labelsText.includes('collision')) issueType = 'car_accident';
    else if (labelsText.includes('roadkill') || labelsText.includes('dead animal') || labelsText.includes('carcass') || labelsText.includes('animal')) issueType = 'dead_animal';
    else if (labelsText.includes('abandoned') || (labelsText.includes('vehicle') && labelsText.includes('dust'))) issueType = 'abandoned_vehicle';
  }

  // Is Manual Report Check
  const isManualReport = isManualMode || String(issueType).toLowerCase() === 'manual report' || (confidence !== null && Number(confidence) === 0) || !imagePreview;
  const aiSeverity = pick(aiOverview, ['severity'], pick(issue, ['severity', 'priority'], ''));
  const category = pick(issue, ['category'], '');
  const zipCodeBase = pick(issue, ['zip_code', 'location.zip_code'], '—');
  const addressBase = pick(issue, ['address', 'location.address'], '—');
  const latitudeBase = pick(issue, ['latitude', 'location.latitude'], '—');
  const longitudeBase = pick(issue, ['longitude', 'location.longitude'], '—');
  const zipCode = userZip || zipCodeBase;
  const address = userAddress || addressBase;
  const latitude = (typeof userLat === 'number' && !Number.isNaN(userLat)) ? userLat : latitudeBase;
  const longitude = (typeof userLon === 'number' && !Number.isNaN(userLon)) ? userLon : longitudeBase;
  const authorities = pick(issue, ['authorities', 'available_authorities', 'report.available_authorities'], []);

  const reportText = pick(aiReport, ['issue_overview.user_feedback', 'issue_overview.summary_explanation', 'additional_notes.summary', 'template_fields.formatted_text'], null);

  // --- Advanced Location Parsing ---
  let city = '—';
  let state = '—';
  let displayZip = userZip || zipCodeBase || '—';

  if (typeof address === 'string' && address.length > 0) {
    const parts = address.split(',').map(s => s.trim());
    const stateZipPart = parts.find(p => /\b[A-Z]{2}\b\s+\d{5}/.test(p));
    if (stateZipPart) {
      const match = stateZipPart.match(/([A-Z]{2})\s+(\d{5,})/);
      if (match) {
        state = match[1];
        if (displayZip === '—' || !displayZip) displayZip = match[2];
      }
      const stateZipIndex = parts.indexOf(stateZipPart);
      if (stateZipIndex > 0) city = parts[stateZipIndex - 1];
    } else if (parts.length >= 2) {
      city = parts[parts.length - 3] || parts[0];
      state = (parts[parts.length - 2] || '').split(' ')[0];
    }
  }

  const isSpecificAddress = address && address !== '—' && /^\d+/.test(address);
  const isCoordinatesOnly = typeof address === 'string' && address.includes('(Coordinates Only)');

  const locCity = city && city !== '—' ? city : 'Unknown';
  const locState = state && state !== '—' ? state : '';
  const incidentTypeTitle = formatIssueType(hasEdited ? editForm.issue_type : issueType);

  const locationHeader = isCoordinatesOnly
    ? `${incidentTypeTitle} reported at ${address.replace('(Coordinates Only)', '').trim()}`
    : `${incidentTypeTitle} reported in ${locCity}${locState ? `, ${locState}` : ''} ${displayZip !== '—' ? displayZip : ''}`.trim();

  // Enforce strictly the single formatted string for AI reports. For manual reports, keep user input.
  const baseDescription = isManualReport
    ? (analysisDescription || summaryExplanation || reportText || '')
    : (summaryExplanation || '');

  const descriptionText = baseDescription.startsWith(incidentTypeTitle)
    ? baseDescription
    : `${locationHeader}\n\n${baseDescription}`;

  const recommendedActions = pick(issue, ['recommended_actions', 'report.recommended_actions', 'report.report.recommended_actions'], []);
  const lat = typeof latitude === 'number' ? latitude : Number(latitude);
  const lon = typeof longitude === 'number' ? longitude : Number(longitude);
  const mapsLink = lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null);

  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 font-medium animate-pulse">Submitting to authorities...</p>
      </div>
    );
  }

  const shortDesc = (typeof descriptionText === 'string' && descriptionText.length > 0)
    ? (descriptionText.split(/[.!?]/)[0] || descriptionText).slice(0, 160)
    : (Array.isArray(detectedProblems) && detectedProblems.length > 0 ? detectedProblems[0] : 'an incident');

  const hazardWords = ['danger', 'fire', 'smoke', 'collapse', 'crack', 'flood', 'leak', 'exposed', 'broken', 'damaged', 'accident', 'crash', 'collision', 'injury', 'emergency'];
  const baseWords = (String(descriptionText || '').toLowerCase() + ' ' + (Array.isArray(detectedProblems) ? detectedProblems.join(' ').toLowerCase() : ''));
  const hits = hazardWords.filter(w => baseWords.includes(w));
  const riskTags = hits.length > 0 ? hits.slice(0, 6).join(', ') : (Array.isArray(detectedProblems) ? detectedProblems.slice(0, 4).join(', ') : '');
  const derivedProblems = (() => {
    const set = new Set();
    hits.forEach(h => set.add(h));
    const mapIssue = {
      dead_animal: 'dead animal',
      tree_fallen: 'fallen tree',
      road_damage: 'road damage',
      broken_streetlight: 'broken streetlight',
      garbage: 'garbage',
      flood: 'flooding',
      fire: 'fire/smoke',
    };
    const m = mapIssue[String(issueType || '').toLowerCase()];
    if (m) set.add(m);
    return Array.from(set);
  })();

  let priorityLabel = 'LOW';
  const severityMap = {
    'critical': 'HIGH',
    'high': 'HIGH',
    'medium': 'MEDIUM',
    'low': 'LOW'
  };

  const currentSeverity = String(aiSeverity || '').toLowerCase();
  if (severityMap[currentSeverity]) {
    priorityLabel = severityMap[currentSeverity];
  } else if (aiSeverity && String(aiSeverity).length > 1) {
    priorityLabel = String(aiSeverity).toUpperCase();
  } else if (hits.length >= 3) {
    priorityLabel = 'HIGH';
  } else if (hits.length >= 1) {
    priorityLabel = 'MEDIUM';
  }

  const locationText = `${locCity}${locState ? `, ${locState}` : ''} ${displayZip !== '—' ? displayZip : ''}`.trim();
  const templateSummary = `${incidentTypeTitle} reported in ${locationText}.\n\nAI Analysis: ${shortDesc}.`;

  // Render a clean card with the report details
  return (
    <div className="mt-8 bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">

      {/* Top header and progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Review Generated Report</h2>
              <p className="text-xs text-gray-400">Issue #{issueId}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isEditing && !hasEdited) {
                setEditForm(prev => ({
                  ...prev,
                  issue_type: issueType,
                  severity: priorityLabel.toLowerCase(),
                  summary: descriptionText || '',
                  description: descriptionText || ''
                }));
              }
              setIsEditing(!isEditing);
            }}
            className={`px-3 py-2 border rounded-lg text-xs transition-all ${isEditing
              ? 'bg-yellow-500 text-black border-yellow-500'
              : 'bg-white/5 hover:bg-white/10 border-gray-700'
              }`}
          >
            {isEditing ? (
              <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Done Editing</span>
            ) : (
              <span className="flex items-center gap-1"><Edit2 className="w-3 h-3" /> Edit Report</span>
            )}
          </button>
        </div>
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-purple-300" /> Visual Evidence
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-purple-300" /> Location
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-purple-300" /> Review
          </div>
        </div>
      </div>
      {/* Header */}
      <div className={isGuest ? "relative" : ""}>
        {/* Auth Popup Overlay - shown when guest clicks Submit */}
        {showAuthPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowAuthPopup(false)}>
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-yellow-500/15 rounded-full flex items-center justify-center mx-auto border border-yellow-500/30">
                  <LogIn className="w-10 h-10 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">Login Required</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your report has been generated successfully! To submit this report to the authorities, please <strong className="text-white">Login</strong> or <strong className="text-white">Sign Up</strong>.
                </p>
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => navigate('/signup', { state: { returnTo: '/report' } })}
                    className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold shadow-lg transition-all text-sm"
                  >
                    Create My Account
                  </button>
                  <button
                    onClick={() => navigate('/login', { state: { returnTo: '/report' } })}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all text-sm"
                  >
                    Login to Existing Account
                  </button>
                </div>
                <button
                  onClick={() => setShowAuthPopup(false)}
                  className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Report Review</h2>
            <span className="text-xs text-gray-400">Issue ID: {issueId}</span>
          </div>

          {/* Responsible Authorities (moved to bottom) */}
          {/* Meta grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 border border-gray-700 rounded-xl p-3">
              <p className="text-xs text-gray-400">Issue Type</p>
              {isEditing ? (
                <div className="space-y-2">
                  <select
                    name="issue_type"
                    value={['Manual Report', 'pothole', 'road_damage', 'broken_streetlight', 'garbage', 'flood', 'water_leakage', 'fire', 'dead_animal', 'car_accident', 'abandoned_vehicle'].includes(editForm.issue_type) ? editForm.issue_type : 'other_issue'}
                    onChange={(e) => {
                      if (e.target.value === 'other_issue') {
                        setEditForm(prev => ({ ...prev, issue_type: '' }));
                      } else {
                        handleEditChange(e);
                      }
                    }}
                    className="w-full bg-black/40 text-white border border-gray-700/50 rounded-xl px-4 py-3 text-sm mt-2 focus:border-yellow-500/50 transition-all outline-none cursor-pointer hover:bg-black/60 shadow-sm"
                  >
                    <option className="bg-gray-900 text-white" value="Manual Report">Manual Report</option>
                    <option className="bg-gray-900 text-white" value="pothole">Pothole</option>
                    <option className="bg-gray-900 text-white" value="road_damage">Road Damage</option>
                    <option className="bg-gray-900 text-white" value="broken_streetlight">Broken Streetlight</option>
                    <option className="bg-gray-900 text-white" value="garbage">Garbage / Trash</option>
                    <option className="bg-gray-900 text-white" value="flood">Flooding</option>
                    <option className="bg-gray-900 text-white" value="water_leakage">Water Leakage</option>
                    <option className="bg-gray-900 text-white" value="fire">Fire Hazard</option>
                    <option className="bg-gray-900 text-white" value="dead_animal">Dead Animal</option>
                    <option className="bg-gray-900 text-white" value="car_accident">Car Accident</option>
                    <option className="bg-gray-900 text-white" value="abandoned_vehicle">Abandoned Vehicle</option>
                    <option className="bg-gray-900 text-white" value="other_issue">Specify Manually...</option>
                  </select>

                  {(!['Manual Report', 'pothole', 'road_damage', 'broken_streetlight', 'garbage', 'flood', 'water_leakage', 'fire', 'dead_animal', 'car_accident', 'abandoned_vehicle'].includes(editForm.issue_type)) && (
                    <input
                      type="text"
                      name="issue_type"
                      value={editForm.issue_type}
                      onChange={handleEditChange}
                      placeholder="Type issue name..."
                      className="w-full bg-black/60 text-white border border-yellow-500/30 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 transition-all outline-none animate-in fade-in slide-in-from-top-1"
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm font-semibold">{formatIssueType(hasEdited ? editForm.issue_type : issueType)}</p>
              )}
            </div>

            <div className="bg-white/5 border border-gray-700 rounded-xl p-3">
              <p className="text-xs text-gray-400">Severity</p>
              {isEditing ? (
                <select
                  name="severity"
                  value={editForm.severity}
                  onChange={handleEditChange}
                  className="w-full bg-black/40 text-white border border-gray-700/50 rounded-xl px-4 py-3 text-sm mt-2 focus:border-yellow-500/50 transition-all outline-none cursor-pointer hover:bg-black/60 shadow-sm"
                >
                  <option className="bg-gray-900 text-white" value="low">LOW PRIORITY</option>
                  <option className="bg-gray-900 text-white" value="medium">MEDIUM PRIORITY</option>
                  <option className="bg-gray-900 text-white" value="high">MEDIUM HIGH PRIORITY</option>
                  <option className="bg-gray-900 text-white" value="critical">HIGH PRIORITY</option>
                </select>
              ) : (
                <span className={`text-sm font-semibold uppercase ${(() => {
                  const sev = (hasEdited ? editForm.severity : priorityLabel).toLowerCase();
                  if (sev === 'critical' || sev === 'high') return 'text-red-500';
                  if (sev === 'medium') return 'text-yellow-400';
                  if (sev === 'low') return 'text-blue-400';
                  return 'text-zinc-400';
                })()}`}>
                  {hasEdited ? severityMap[editForm.severity] || editForm.severity : priorityLabel}
                </span>
              )}
            </div>

            {!isManualReport && confidence !== null && !isEditing ? (
              <div className="bg-white/5 border border-gray-700 rounded-xl p-3">
                <p className="text-xs text-gray-400">Confidence</p>
                <p className="text-sm font-semibold">{String(confidence)}%</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-gray-700 rounded-xl p-3">
                <p className="text-xs text-gray-400">Report Date</p>
                <p className="text-sm font-semibold">{String(incidentDate || pick(issue, ['timestamp_formatted', 'report.timestamp_formatted'], new Date().toLocaleDateString())).split(' ')[0]}</p>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 border border-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-400">Street Address</p>
              {isSpecificAddress ? (
                <p className="text-sm font-semibold text-white">{String(address)}</p>
              ) : (
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-gray-400 italic">No specific home address detected</p>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Using Precise Coordinates for Resolution</p>
                </div>
              )}
            </div>
            <div className="bg-white/5 border border-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-400">Location Data (ZIP / GPS)</p>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-white">
                  {String(displayZip || '—')}
                </p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[10px] text-gray-500 font-mono">
                    {latitude && latitude !== '—' ? Number(latitude).toFixed(6) : '—'}, {longitude && longitude !== '—' ? Number(longitude).toFixed(6) : '—'}
                  </p>
                  {mapsLink && (
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      <MapPin className="w-2.5 h-2.5" /> View on Map
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Authorities removed as requested earlier */}

          {/* Issue Overview summary text */}
          <div className="mb-6">
            <p className="text-sm font-bold mb-2">Description / Summary</p>

            {isEditing ? (
              <textarea
                name="summary"
                value={editForm.summary}
                onChange={handleEditChange}
                rows={4}
                className="w-full bg-white/5 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 focus:border-yellow-500 outline-none"
                placeholder="Describe the issue in detail..."
              />
            ) : (
              (hasEdited ? editForm.summary : descriptionText) ? (
                <div className="bg-white/5 border border-gray-700 rounded-xl p-4 text-sm whitespace-pre-wrap break-words text-gray-200 leading-relaxed overflow-hidden">
                  {String(hasEdited ? editForm.summary : descriptionText)}
                </div>
              ) : (
                <div className="bg-white/5 border border-gray-700 rounded-xl p-4 text-xs text-gray-400">No summary provided.</div>
              )
            )}
            {!isManualReport && confidence !== null && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1">Confidence</p>
                <div className="h-2 rounded-full overflow-hidden"
                  style={{
                    background: (() => {
                      const val = Math.max(0, Math.min(100, Number(confidence) || 0));
                      let color = '#ef4444'; // red-500
                      if (val >= 80) color = '#4ade80'; // green-400
                      else if (val >= 50) color = '#facc15'; // yellow-400
                      return `linear-gradient(to right, ${color} 0%, ${color} ${val}%, #374151 ${val}%, #374151 100%)`;
                    })()
                  }}
                />
                <p className="text-xs mt-1" style={{
                  color: (() => {
                    const val = Math.max(0, Math.min(100, Number(confidence) || 0));
                    if (val >= 80) return '#4ade80';
                    if (val >= 50) return '#facc15';
                    return '#ef4444';
                  })()
                }}>
                  {Math.max(0, Math.min(100, Number(confidence) || 0))}%
                </p>
              </div>
            )}
          </div>


          {/* AI Generated Items merged into Description above as requested */}

          {/* Image Preview if available */}
          {imagePreview && (
            <div className="mb-6">
              <p className="text-sm font-bold mb-2">Submitted Image</p>
              <div className="relative">
                <img src={imagePreview} alt="Submitted" className="w-full h-64 object-cover rounded-xl border border-gray-700" />
                {imageName && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 rounded-b-xl">
                    {imageName}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Responsible Authorities (bottom) */}
          <div className="mb-6">
            <p className="text-sm font-bold mb-2 flex items-center justify-between">
              <span>Responsible Authorities</span>
              <span className="text-xs font-normal text-gray-400">Tap to select/deselect</span>
            </p>

            {allAuthoritiesState.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-2">
                {allAuthoritiesState.map((auth, idx) => {
                  const isSelected = selectedAuths.some(a => a.email === auth.email);
                  return (
                    <div
                      key={`${auth.email || idx}`}
                      onClick={() => toggleAuthority(auth)}
                      className={`border rounded-xl p-3 cursor-pointer transition-all ${isSelected
                        ? 'bg-blue-500/20 border-blue-500/50 ring-1 ring-blue-500/50'
                        : 'bg-white/5 border-gray-700 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{String(auth.name || 'Authority')}</p>
                          <p className="text-xs text-gray-400">{String(auth.type || '—')}</p>
                          <p className="text-xs text-gray-400">{String(auth.email || '—')}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                          }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // No authorities found → will go to Admin Review Team
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-yellow-300 mb-1">No Specific Authority Mapped</p>
                  <p className="text-xs text-yellow-200/70 leading-relaxed">
                    This issue type doesn't have a mapped authority yet. Your report will be submitted to the <span className="font-semibold text-white">EAiSER Admin Review Team</span> who will review, classify, and route it to the correct department.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">Will be routed by Admin Team</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons — visible to everyone, auth checked on click */}
          {!summaryExplanation?.includes("Please provide the correct image") && (
            <div className="flex flex-col gap-3">
              {needsAuthorityRefresh && !isManualReport && (
                <button
                  onClick={handleRefreshAuthorities}
                  disabled={isRefreshingAuths}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isRefreshingAuths ? 'bg-gray-700 text-gray-400' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    }`}
                >
                  {isRefreshingAuths ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Refreshing...</>
                  ) : (
                    <>Refresh Authorities (Required)</>
                  )}
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting || (needsAuthorityRefresh && !isManualReport)}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${submitting || (needsAuthorityRefresh && !isManualReport)
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : allAuthoritiesState.length === 0
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg hover:shadow-yellow-600/20'
                    : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg hover:shadow-yellow-500/20'
                  }`}
              >
                {submitting ? (
                  'Submitting...'
                ) : allAuthoritiesState.length === 0 ? (
                  <><Send className="w-4 h-4" /> Submit for Admin Review</>
                ) : (
                  <><Send className="w-4 h-4" /> Submit Report</>
                )}
              </button>
            </div>
          )}

          {/* AI generated report disclaimer — premium animated alert */}
          {!isManualReport && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-5 relative overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-500/[0.06] border border-red-500/20 backdrop-blur-sm"
                style={{ boxShadow: '0 0 15px rgba(239,68,68,0.05), inset 0 1px 0 rgba(255,255,255,0.03)' }}
              >
                {/* Pulsing dot */}
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <p className="text-[11px] text-red-400/90 font-medium tracking-wide">
                  Information may contain errors. Please verify details before reporting.
                </p>
              </div>
            </motion.div>
          )}

        </div> {/* Explicitly close the isGuest wrapper */}
      </div>

      {/* AUTH POPUP - Shown when guest tries to submit */}
      {showAuthPopup && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-blue-500/10">
            {/* Header */}
            <div className="p-8 text-center border-b border-white/5">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-yellow-500/30">
                <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-2">
                Almost There!
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                Your report has been generated successfully! To submit it to the authorities, please login or create an account.
              </p>
            </div>

            {/* Buttons */}
            <div className="p-6 space-y-3">
              <button
                onClick={() => {
                  navigate('/login', { state: { returnTo: '/report' } });
                }}
                className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login to Submit
              </button>
              <button
                onClick={() => {
                  navigate('/signup', { state: { returnTo: '/report' } });
                }}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm border border-white/10 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Account
              </button>
              <button
                onClick={() => setShowAuthPopup(false)}
                className="w-full py-2.5 text-gray-500 hover:text-gray-300 text-xs font-medium transition-colors"
              >
                Continue Reviewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raw debug removed */}
    </div>
  );
}