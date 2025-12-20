

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Image as ImageIcon, MapPin, FileText, CheckCircle2, Clock, Check, AlertTriangle, ShieldAlert, Send, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  const handleSubmit = async () => {
    if (selectedAuths.length === 0) {
      setError("Please select at least one authority to submit the report.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await apiClient.submitIssue(issueId, selectedAuths);
      setSuccessMessage(response.message || "Report submitted successfully.");
      setIsReview(response.report?.status === 'needs_review');
      setSubmitSuccess(true);
      // Optional: Navigate after delay or show success state
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

        <h2 className="text-2xl font-bold text-white mb-4">Report Flagged for Review</h2>

        <p className="text-gray-300 mb-6 text-lg">
          Our automated system has flagged this report for manual verification.
        </p>

        <div className="bg-white/5 border border-gray-700 rounded-xl p-6 text-left mb-8">
          <p className="text-sm text-gray-400 mb-2 font-semibold uppercase tracking-wider">What happens next?</p>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-yellow-500 shrink-0" />
              <span>This report will be briefly sent to our team for manual inspection.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-yellow-500 shrink-0" />
              <span>If verified as a valid public issue, we will submit it to the authorities immediately.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-yellow-500 shrink-0" />
              <span>You will be notified once the status changes.</span>
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

          <h2 className="text-2xl font-bold text-white mb-4">Under Quality Review</h2>

          <p className="text-gray-300 mb-6 text-lg">
            {successMessage || "Your report has been submitted to the EAiSER AI team for review."}
          </p>

          <div className="bg-white/5 border border-gray-700 rounded-xl p-6 text-left mb-8">
            <p className="text-sm text-gray-400 mb-2 font-semibold uppercase tracking-wider">Reason for Review</p>
            <p className="text-sm text-gray-300 mb-4">
              To ensure accuracy and prevent false reports, this issue has been flagged for manual verification by our specialized team.
            </p>

            <p className="text-sm text-gray-400 mb-2 font-semibold uppercase tracking-wider">Proccess</p>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                <span>Our team verifies the details.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                <span>Once approved, it is automatically forwarded to the authorities.</span>
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
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
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
  }
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

  const reportText = pick(aiReport, ['issue_overview.summary_explanation', 'additional_notes.summary', 'template_fields.formatted_text'], null);
  const descriptionText = analysisDescription || summaryExplanation || reportText || null;
  const recommendedActions = pick(issue, ['recommended_actions', 'report.recommended_actions', 'report.report.recommended_actions'], []);
  const imageAnalysis = pick(aiReport, ['ai_evaluation.image_analysis'], null);
  // recommendedAuthorities removed here as it was already declared above
  // Prefer unified_report.confidence_percent when available
  let confidence = pick(issue, [
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

  const lat = typeof latitude === 'number' ? latitude : Number(latitude);
  const lon = typeof longitude === 'number' ? longitude : Number(longitude);
  const mapsLink = lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null);

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
  const hazardWords = ['danger', 'fire', 'smoke', 'collapse', 'crack', 'flood', 'leak', 'exposed', 'broken', 'damaged'];
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
  let priorityLabel = String(aiSeverity || 'medium');
  if (hits.length >= 3) priorityLabel = 'High'; else if (hits.length >= 1) priorityLabel = 'Medium'; else priorityLabel = 'Low';
  const locCity = city && city !== '—' ? city : (address && address !== '—' ? address.split(',')[0] : 'Unknown');
  const locState = state && state !== '—' ? state : '—';
  const templateSummary = `Our AI detected a ${String(issueType || 'Unknown')} in ${String(locCity)}, ${String(locState)} (ZIP ${String(zipCode || '—')}).\nThe image shows ${shortDesc}.\nBased on the location and context, this incident has been classified as ${String(priorityLabel)} due to ${riskTags || 'contextual risks'}.`;

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
              const el = document.getElementById('edit-summary');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-lg text-xs"
          >
            Edit Report
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
          <p className="text-sm font-semibold">{String(issueType)}</p>
        </div>

        {confidence !== null && (
          <div className="bg-white/5 border border-gray-700 rounded-xl p-3">
            <p className="text-xs text-gray-400">Confidence</p>
            <p className="text-sm font-semibold">{String(confidence)}</p>
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
        <p className="text-sm font-bold mb-2">Summary</p>
        {templateSummary ? (
          <div className="bg-white/5 border border-gray-700 rounded-xl p-4 text-sm whitespace-pre-wrap">
            {String(templateSummary)}
          </div>
        ) : (
          <div className="bg-white/5 border border-gray-700 rounded-xl p-4 text-xs text-gray-400">No summary provided.</div>
        )}
        {confidence !== null && (
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-1">Confidence</p>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-gray-700">
              <div className="h-full bg-blue-500/50" style={{ width: `${Math.max(0, Math.min(100, confidence))}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{Math.max(0, Math.min(100, confidence))}%</p>
          </div>
        )}
      </div>
      {mapsLink && (
        <div className="mb-6">
          <a href={mapsLink} target="_blank" rel="noreferrer" className="text-xs text-purple-300 hover:text-purple-200">View on Map</a>
        </div>
      )}

      {/* AI Generated Items */}
      <div className="mb-6">
        <p className="text-sm font-bold mb-2">AI Generated Items</p>
        {summaryExplanation && (
          <div className="bg-white/5 border border-gray-700 rounded-xl p-4 text-sm whitespace-pre-wrap mb-3">
            {String(summaryExplanation)}
          </div>
        )}
        {imageAnalysis && (
          <div className="bg-white/5 border border-gray-700 rounded-xl p-4 text-sm whitespace-pre-wrap mb-3">
            {String(imageAnalysis)}
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-2">Detected Problems</p>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(detectedProblems) && detectedProblems.length > 0 ? detectedProblems : derivedProblems).map((it, idx) => (
                <span key={idx} className="px-3 py-1 rounded-full text-xs bg-red-500/20 border border-red-500/40 text-red-300">
                  {String(it)}
                </span>
              ))}
              {(!detectedProblems || detectedProblems.length === 0) && derivedProblems.length === 0 && (
                <span className="text-xs text-gray-400">No specific problems listed</span>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-2">Recommended Actions</p>
            {Array.isArray(recommendedActions) && recommendedActions.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-200">
                {recommendedActions.map((act, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>{String(act)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">No recommendations provided</p>
            )}
          </div>
        </div>
      </div>

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
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting || selectedAuths.length === 0}
          className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${submitting || selectedAuths.length === 0
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

      {/* Raw debug removed */}
    </div>
  );
}