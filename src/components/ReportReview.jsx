

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Image as ImageIcon, MapPin, FileText, CheckCircle2, Clock, Check, AlertTriangle, ShieldAlert, Send, Edit2 } from 'lucide-react';
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

export default function ReportReview({ issue, imagePreview, analysisDescription, userAddress, userZip, userLat, userLon, imageName }) {
  const navigate = useNavigate();
  const issueId = pick(issue, ['id', 'issue_id', 'data.id'], 'N/A');
  const status = pick(issue, ['report.status', 'status'], 'pending');
  const dispatchDecision = pick(issue, ['report.dispatch_decision', 'dispatch_decision'], null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);

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

  // EDIT MODE STATE
  const [isEditing, setIsEditing] = useState(false);
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
  };

  const handleSubmit = async () => {
    let finalAuths = selectedAuths;

    // For Manual Reports or Low Confidence, allow submission to Internal Team
    if (finalAuths.length === 0) {
      if (editForm.issue_type === 'Manual Report' || confidence === 0) {
        finalAuths = [{
          name: "Internal Review Team",
          email: "eaiser@momntumai.com", // Default Admin Email
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
      // Pass editForm if isEditing was used, otherwise undefined
      const reportData = isEditing ? editForm : undefined;
      const response = await apiClient.submitIssue(issueId, finalAuths, reportData);
      setSuccessMessage(response.message || "Report submitted successfully.");
      setIsReview(response.report?.status === 'needs_review');
      setSubmitSuccess(true);

      // Trigger Confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#22c55e', '#ffffff']
      });

      // Automatically redirect after 3 seconds to clear state and show fresh form
      setTimeout(() => {
        // Force full reload to ensure previous report state is completely cleared
        window.location.href = '/';
      }, 3000);

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

  // --- SUCCESS VIEW ---
  if (submitSuccess) {
    if (isReview) {
      return (
        <div className="mt-8 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl border border-yellow-900/50 p-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">Verification in Progress</h2>

          <p className="text-gray-300 mb-6 text-lg">
            {successMessage || "Your report has been submitted to EAiSER AI for professional verification."}
          </p>

          <div className="bg-white/5 border border-gray-700 rounded-xl p-6 text-left mb-8">
            <p className="text-sm text-gray-400 mb-2 font-semibold uppercase tracking-wider">Verification Rationale</p>
            <p className="text-sm text-gray-300 mb-4">
              To maintain elite data standards and prevent erroneous reporting, this submission is undergoing a brief manual validation by our civic engineers.
            </p>

            <p className="text-sm text-gray-400 mb-2 font-semibold uppercase tracking-wider">Next Steps</p>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                <span>Engineers confirm the incident details and visual evidence.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                <span>Authorized dispatch occurs immediately upon approval.</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold text-white transition-all"
          >
            Back to Home
          </button>
        </div>
      )
    }

    return (
      <div className="mt-8 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl border border-green-900/50 p-8 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
          <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <motion.path
              d="M20 6L9 17l-5-5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">Report Submitted Successfully</h2>

        <p className="text-gray-300 mb-6 text-lg">
          {successMessage || "Thank you! Your report has been submitted to the selected authorities."}
        </p>

        <div className="bg-white/5 border border-gray-700 rounded-xl p-6 text-left mb-8">
          <p className="text-sm text-gray-400 mb-4">Authorities Notified:</p>
          <ul className="space-y-2">
            {selectedAuths.map((auth, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-gray-200">
                <Check className="w-4 h-4 text-green-500" />
                {auth.name}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold text-white transition-all"
        >
          Back to Home
        </button>
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
    else if (labelsText.includes('roadkill') || labelsText.includes('dead animal') || labelsText.includes('carcass') || labelsText.includes('animal')) issueType = 'dead_animal';
    else if (labelsText.includes('accident') || labelsText.includes('crash') || labelsText.includes('collision')) issueType = 'car_accident';
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
  const isManualReport = String(issueType) === 'Manual Report' || (confidence !== null && Number(confidence) === 0);
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
  const descriptionText = analysisDescription || summaryExplanation || reportText || null;
  const recommendedActions = pick(issue, ['recommended_actions', 'report.recommended_actions', 'report.report.recommended_actions'], []);
  const imageAnalysis = pick(aiReport, ['ai_evaluation.image_analysis', 'ai_evaluation.rationale'], null);
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
      {(confidence < 25 || (summaryExplanation && summaryExplanation.includes("Please provide the correct image"))) && (
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
            onClick={() => setIsEditing(!isEditing)}
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
            <p className="text-sm font-semibold">{String(issueType)}</p>
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
            <span className={`text-sm font-semibold uppercase ${priorityLabel.toLowerCase() === 'high' || priorityLabel.toLowerCase() === 'critical'
              ? 'text-red-400'
              : priorityLabel.toLowerCase() === 'medium'
                ? 'text-yellow-400'
                : 'text-green-400'
              }`}>
              {priorityLabel}
            </span>
          )}
        </div>

        {confidence !== null && (
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
          templateSummary ? (
            <div className="bg-white/5 border border-gray-700 rounded-xl p-4 text-sm whitespace-pre-wrap">
              {String(templateSummary)}
            </div>
          ) : (
            <div className="bg-white/5 border border-gray-700 rounded-xl p-4 text-xs text-gray-400">No summary provided.</div>
          )
        )}
        {confidence !== null && (
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

      {/* AI Generated Items - Hidden for Manual Reports */}
      {!isManualReport && (
        <div className="mb-6">
          <p className="text-sm font-bold mb-2">AI Generated Items</p>
          {summaryExplanation && (
            <div className="bg-white/5 border border-gray-700 rounded-xl p-4 text-sm whitespace-pre-wrap mb-3">
              {String(summaryExplanation)}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white/5 border border-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-2">AI Visual Analysis</p>
              <div className="text-sm text-gray-200 leading-relaxed">
                {imageAnalysis || "Detailed analysis not available for this report."}
              </div>
            </div>

          </div>
        </div>
      )}

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

      {/* Action Buttons */}
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

      {/* Raw debug removed */}
    </div>
  );
}