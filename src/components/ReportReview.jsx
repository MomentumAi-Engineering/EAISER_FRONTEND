// ReportReview.jsx
// Purpose: Modular UI component to render the backend-generated issue report for review.
// Notes: Designed to be resilient to varying response shapes from the backend.
//        Uses defensive accessors and shows helpful fallbacks.

import React from 'react';
import apiClient from '../services/apiClient';
import { Image as ImageIcon, MapPin, FileText, CheckCircle2, Clock, Check } from 'lucide-react';

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
  const issueId = pick(issue, ['id', 'issue_id', 'data.id'], 'N/A');
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
    else if (labelsText.includes('pothole') || labelsText.includes('crack') || labelsText.includes('road')) issueType = 'road_damage';
    else if (labelsText.includes('streetlight')) issueType = 'broken_streetlight';
    else if (labelsText.includes('garbage') || labelsText.includes('trash') || labelsText.includes('waste')) issueType = 'garbage';
    else if (labelsText.includes('flood') || labelsText.includes('waterlogging')) issueType = 'flood';
    else if (labelsText.includes('fire') || labelsText.includes('smoke')) issueType = 'fire';
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
  const recommendedAuthorities = pick(issue, ['report.report.responsible_authorities_or_parties', 'responsible_authorities_or_parties'], []);
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
    } catch {}
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
  const hazardWords = ['hazard','danger','fire','smoke','collapse','crack','flood','leak','exposed','broken','damaged','risk'];
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
        <p className="text-sm font-bold mb-2">Responsible Authorities</p>
        {Array.isArray(recommendedAuthorities) && recommendedAuthorities.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-2">
            {recommendedAuthorities.map((auth, idx) => (
              <div key={`${auth.email || idx}`} className="bg-white/5 border border-gray-700 rounded-xl p-3">
                <p className="text-sm font-semibold">{String(auth.name || 'Authority')}</p>
                <p className="text-xs text-gray-400">{String(auth.type || '—')}</p>
                <p className="text-xs text-gray-400">{String(auth.email || '—')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No authority selected by AI.</p>
        )}
        <div className="mt-3 flex gap-3">
          <button
            onClick={async () => {
              try {
                const target = (recommendedAuthorities && recommendedAuthorities.length > 0) ? recommendedAuthorities : [];
                if (!issueId || target.length === 0) return;
                await apiClient.submitIssue(issueId, target, undefined);
                alert('Report accepted and submitted to primary authority');
              } catch (e) {
                alert(`Failed to accept: ${e.message}`);
              }
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm"
          >
            Accept Report
          </button>
          <button
            onClick={async () => {
              try {
                if (!issueId) return;
                await apiClient.declineIssue(issueId, 'user_declined');
                alert('Report declined');
              } catch (e) {
                alert(`Failed to decline: ${e.message}`);
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm"
          >
            Decline Report
          </button>
        </div>
      </div>

      {/* Raw debug removed */}
    </div>
  );
}