

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

export default function ReportReview({ issue, imagePreview, analysisDescription, userAddress, userZip, userLat, userLon, imageName, onClearReport }) {
  const navigate = useNavigate();
  const issueId = pick(issue, ['id', 'issue_id', 'data.id'], 'N/A');
  const status = pick(issue, ['report.status', 'status'], 'pending');
  const dispatchDecision = pick(issue, ['report.dispatch_decision', 'dispatch_decision'], null);

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

  // Extract authorities
  const recommendedAuthorities = pick(issue, ['report.report.responsible_authorities_or_parties', 'responsible_authorities_or_parties'], []);
  const availableAuthorities = pick(issue, ['authorities', 'available_authorities', 'report.available_authorities'], []) || [];

  // Merge lists to ensure we have a comprehensive list for selection (deduplicating by email)
  const allAuthsMap = new Map();
  [...availableAuthorities, ...recommendedAuthorities].forEach(auth => {
    if (auth.email) allAuthsMap.set(auth.email, auth);
  });
  const allAuthorities = Array.from(allAuthsMap.values());

  // State for selected authorities
  const [selectedAuths, setSelectedAuths] = useState([]);

  // Initialize selected authorities with recommended ones
  useEffect(() => {
    if (recommendedAuthorities.length > 0) {
      setSelectedAuths(recommendedAuthorities);
    } else if (allAuthorities.length > 0) {
      // Default to first if no specific recommendation
      setSelectedAuths([allAuthorities[0]]);
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
    description: ''
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

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    setHasEdited(true);
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

    // For Manual Reports or Low Confidence, allow submission to Internal Team
    if (finalAuths.length === 0) {
      if (editForm.issue_type === 'Manual Report' || confidence === 0) {
        finalAuths = [{
          name: "Internal Review Team",
          email: "eaiser@momntumai.com",
          type: "internal"
        }];
      } else {
        setError("Please select at least one authority to submit the report.");
        return;
      }
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

      // Redirect to Dashboard after 6 seconds
      setTimeout(() => {
        if (onClearReport) onClearReport();
        navigate('/dashboard');
      }, 6000);

    } catch (err) {
      console.error("Submit failed", err);
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
          onClick={() => window.location.reload()}
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
    const noIssueSummary = pick(issue, [
      'report.report.issue_overview.summary_explanation',
      'report.report.ai_evaluation.rationale',
      'report.issue_overview.summary_explanation',
    ], 'Our AI system did not detect a clear civic infrastructure issue in this image.');

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
        issue_type: manualIssueType,
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

        setTimeout(() => {
          if (onClearReport) onClearReport();
          navigate('/dashboard');
        }, 6000);
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
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">What happens now?</p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <span>This report is flagged for <strong className="text-white">manual review</strong> by our team.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <span>No automatic authority notifications will be sent.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <span>If our team finds a valid issue, it will be escalated.</span>
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
                    <option value="other_issue">Other</option>
                  </select>
                </div>

                {/* Description */}
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
            onClick={() => window.location.reload()}
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
            <div className="flex flex-col items-center mt-6">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold animate-pulse">Redirecting to Dashboard...</p>
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

  // Prefer unified_report.confidence_percent when available
  let confidence = pick(issue, [
    'report.report.unified_report.confidence_percent',
    'report.unified_report.confidence_percent',
    'report.report.issue_overview.confidence',
    'report.issue_overview.confidence',
  ], null);

  // Is Manual Report Check
  const isManualReport = String(issueType).toLowerCase() === 'manual report' || (confidence !== null && Number(confidence) === 0) || !imagePreview;
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

  // Enforce strictly the single formatted string for AI reports. For manual reports, keep user input.
  const descriptionText = isManualReport
    ? (analysisDescription || summaryExplanation || reportText || null)
    : summaryExplanation;
  const recommendedActions = pick(issue, ['recommended_actions', 'report.recommended_actions', 'report.report.recommended_actions'], []);
  // recommendedAuthorities removed here as it was already declared above

  if (confidence !== null) {
    try {
      const num = Number(confidence);
      confidence = num <= 1 ? Math.round(num * 100) : Math.round(num);
    } catch { }
  }

  const lat = typeof latitude === 'number' ? latitude : Number(latitude);
  const lon = typeof longitude === 'number' ? longitude : Number(longitude);
  const mapsLink = lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null);

  // Show Loader on Submission
  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 font-medium animate-pulse">Submitting to authorities...</p>
      </div>
    );
  }

  let city = '—';
  let state = '—';
  if (typeof address === 'string' && address.length > 0) {
    const parts = address.split(',').map(s => s.trim());
    if (parts.length >= 2) {
      city = parts[0] || city;
      const m = parts[1].match(/[A-Za-z]{2,}/);
      if (m) state = m[0];
    }
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

  // 🛠️ Priority mapping: Respect AI severity first, fallback to heuristic
  let priorityLabel = 'Low';
  if (aiSeverity && String(aiSeverity).length > 1) {
    priorityLabel = String(aiSeverity).charAt(0).toUpperCase() + String(aiSeverity).slice(1).toLowerCase();
  } else if (hits.length >= 3) {
    priorityLabel = 'High';
  } else if (hits.length >= 1) {
    priorityLabel = 'Medium';
  }
  const locCity = city && city !== '—' ? city : (address && address !== '—' ? address.split(',')[0] : 'Unknown');
  const locState = state && state !== '—' ? state : '—';
  const templateSummary = `Our AI detected a ${String(issueType || 'Unknown')} in ${String(locCity)}, ${String(locState)} (ZIP ${String(zipCode || '—')}).\nThe image shows ${shortDesc}.`;

  // Render a clean card with the report details
  return (
    <div className="mt-8 bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
      {/* Alert for AI Generated / Cartoon / No Issue images */}
      {(!isManualReport && (confidence < 25 || (summaryExplanation && summaryExplanation.includes("Please provide the correct image")))) && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-5 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-red-500 font-bold text-lg leading-tight mb-1">Authenticity Warning</h3>
            <p className="text-gray-200 text-sm font-medium">
              {summaryExplanation || "Please provide the correct image. No issue, animated, or fake image detected."}
            </p>
            <div className="mt-2 text-xs text-gray-400 font-normal">
              Note: Our AI system automatically rejects cartoons, illustrations, and images that do not show clear public infrastructure issues.
            </div>
          </div>
        </div>
      )}

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
                <select
                  name="issue_type"
                  value={editForm.issue_type}
                  onChange={handleEditChange}
                  className="w-full bg-black/20 border border-gray-600 rounded px-2 py-1 text-sm mt-1 focus:border-yellow-500 outline-none"
                >
                  <option value="Manual Report">Manual Report</option>
                  <option value="pothole">Pothole</option>
                  <option value="road_damage">Road Damage</option>
                  <option value="broken_streetlight">Broken Streetlight</option>
                  <option value="garbage">Garbage / Trash</option>
                  <option value="flood">Flooding</option>
                  <option value="water_leakage">Water Leakage</option>
                  <option value="fire">Fire Hazard</option>
                  <option value="dead_animal">Dead Animal</option>
                  <option value="car_accident">Car Accident</option>
                  <option value="abandoned_vehicle">Abandoned Vehicle</option>
                  <option value="other">Other</option>
                </select>
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
                  className="w-full bg-black/20 border border-gray-600 rounded px-2 py-1 text-sm mt-1 focus:border-yellow-500 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              ) : (
                <span className={`text-sm font-semibold uppercase ${((hasEdited ? editForm.severity : priorityLabel) || '').toLowerCase() === 'high' || ((hasEdited ? editForm.severity : priorityLabel) || '').toLowerCase() === 'critical'
                  ? 'text-red-400'
                  : ((hasEdited ? editForm.severity : priorityLabel) || '').toLowerCase() === 'medium'
                    ? 'text-yellow-400'
                    : 'text-green-400'
                  }`}>
                  {hasEdited ? editForm.severity : priorityLabel}
                </span>
              )}
            </div>

            {!isManualReport && confidence !== null && (
              <div className="bg-white/5 border border-gray-700 rounded-xl p-3">
                <p className="text-xs text-gray-400">Confidence</p>
                <p className="text-sm font-semibold">{String(confidence)}%</p>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 border border-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-400">Address</p>
              <p className="text-sm font-semibold">{String(address || '—')}</p>
            </div>
            <div className="bg-white/5 border border-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-400">ZIP / Coordinates</p>
              <p className="text-sm font-semibold">{String(zipCode || '—')} • {String(latitude || '—')}, {String(longitude || '—')}</p>
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
          {mapsLink && (
            <div className="mb-6">
              <a href={mapsLink} target="_blank" rel="noreferrer" className="text-xs text-purple-300 hover:text-purple-200">View on Map</a>
            </div>
          )}

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

            {allAuthorities.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-2">
                {allAuthorities.map((auth, idx) => {
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
              <p className="text-xs text-gray-400">No authorities found.</p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons — visible to everyone, auth checked on click */}
          {!summaryExplanation?.includes("Please provide the correct image") && (
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting || (selectedAuths.length === 0 && editForm.issue_type !== 'Manual Report' && confidence !== 0)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${submitting || (selectedAuths.length === 0 && editForm.issue_type !== 'Manual Report' && confidence !== 0)
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg hover:shadow-yellow-500/20'
                  }`}
              >
                {submitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Report
                  </>
                )}
              </button>
            </div>
          )}
        </div> {/* Explicitly close the isGuest wrapper */}
      </div>

      {/* Raw debug removed */}
    </div>
  );
}