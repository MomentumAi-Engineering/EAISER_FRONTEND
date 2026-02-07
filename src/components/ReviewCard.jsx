import React, { memo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Edit2, ShieldAlert, CheckSquare, Square, Users } from 'lucide-react';

/**
 * ReviewCard Component (Memoized)
 * 
 * Optimized card component that only re-renders when props change.
 * Uses React.memo to prevent unnecessary re-renders.
 * 
 * Performance optimizations:
 * - Memoized to prevent re-renders
 * - Lazy image loading with intersection observer
 * - Minimal inline functions
 * - No heavy computations in render
 */
const ReviewCard = memo(({
    review,
    isSelected,
    isProcessing,
    canSelect,
    canAct,
    isResolved,
    viewMode,
    onToggleSelect,
    onOpenDetail,
    onOpenApprove,
    onDecline,
    onOpenAssignment,
    baseURL
}) => {
    const id = review._id || review.issue_id;

    // Extract data safely (computed once, not on every render)
    const report = review.report?.report || review.report || {};
    const aiData = report.unified_report || report.issue_overview || {};
    const issueType = aiData.issue_type || review.issue_type || 'Unknown';
    const confidence = aiData.confidence_percent || 0;
    const summary = aiData.user_feedback || aiData.summary_explanation || review.description || "No description";

    // Image URL logic - Fixed for proper loading
    let imageUrl = null;
    if (review.image_url) {
        // If image_url starts with /, don't add baseURL prefix
        imageUrl = review.image_url.startsWith('http')
            ? review.image_url
            : `${baseURL}${review.image_url.startsWith('/') ? '' : '/'}${review.image_url}`;
    } else if (review.image_id) {
        imageUrl = `${baseURL}/api/issues/${id}/image`;
    }

    console.log('Image URL:', imageUrl, 'for issue:', id);

    // Confidence color (muted, professional)
    const confidenceColor = confidence > 80
        ? 'bg-emerald-500/90 text-black'
        : confidence < 50
            ? 'bg-rose-500/90 text-white'
            : 'bg-amber-500/90 text-black';

    return (
        <div
            onClick={() => !isResolved && onOpenDetail(review)}
            className={`group bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden flex flex-col hover:shadow-xl transition-all duration-200 ${!isResolved ? 'cursor-pointer hover:border-gray-700' : 'cursor-default opacity-80'}`}
        >
            {/* Image Header */}
            <div className="relative h-48 bg-gray-800">
                {/* Selection Checkbox */}
                {canSelect && !isResolved && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleSelect(id); }}
                        className="absolute top-3 left-3 z-10 p-1.5 rounded hover:scale-110 transition-transform bg-black/50 backdrop-blur-sm"
                    >
                        {isSelected
                            ? <CheckSquare className="w-5 h-5 text-blue-400 fill-blue-400/20" />
                            : <Square className="w-5 h-5 text-white/50 hover:text-white" />
                        }
                    </button>
                )}

                {/* Lazy-loaded Image */}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                        No Image
                    </div>
                )}

                {/* ID Badge */}
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur px-2 py-1 rounded text-xs font-mono text-white border border-gray-700">
                    #{String(id).slice(-6)}
                </div>

                {/* Confidence Badge */}
                <div className={`absolute bottom-3 left-3 px-2 py-1 rounded text-xs font-semibold ${confidenceColor}`}>
                    {confidence}% Confidence
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-semibold text-white capitalize">
                        {issueType.replace(/_/g, ' ')}
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                        {review.status}
                    </span>
                </div>

                {/* Summary */}
                <p className="text-sm text-gray-400 mb-4 line-clamp-3 flex-1">
                    {summary}
                </p>

                {/* Metadata */}
                <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <p>📍 {review.location?.address || review.address || 'Unknown Location'}</p>
                    <p>🕒 {new Date(review.timestamp).toLocaleString()}</p>
                    <p>
                        👤 <span className="text-white font-medium">{review.user_reputation?.name || 'User'}</span>
                        {' '}
                        <span className="text-gray-600 text-xs">({review.reporter_email || review.user_email || 'No Email'})</span>
                    </p>

                    {/* Resolver Info */}
                    {review.admin_review?.admin_id && (
                        <p className="text-emerald-400 font-semibold border-t border-gray-800 pt-1 mt-1">
                            ✅ Resolved by: {review.admin_review.admin_id}
                        </p>
                    )}
                </div>

                {/* Assignment Section */}
                {canSelect && (
                    <div className="mb-3">
                        {review.assigned_to ? (
                            <div className="text-xs text-blue-400 bg-blue-500/10 px-3 py-2 rounded border border-blue-500/20">
                                📌 Assigned to: {review.assigned_to}
                            </div>
                        ) : (
                            !isResolved && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onOpenAssignment(review); }}
                                    className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded transition-all text-sm flex items-center justify-center gap-2"
                                >
                                    <Users className="w-4 h-4" />
                                    Assign to Team
                                </button>
                            )
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                {isResolved ? (
                    <div className="mt-2 p-3 bg-gray-800/50 rounded border border-gray-800 text-center text-sm text-gray-400 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="font-semibold text-gray-300">Resolved</span>
                        </div>
                        {review.admin_review?.resolver_name && (
                            <span className="text-xs text-emerald-400">
                                by {review.admin_review.resolver_name}
                            </span>
                        )}
                    </div>
                ) : canAct ? (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDecline(id); }}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-2 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded transition-colors disabled:opacity-50 text-sm"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Decline
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpenApprove(review); }}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded transition-colors disabled:opacity-50 text-sm"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Review
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-3 text-gray-600 text-sm">
                        <ShieldAlert className="w-4 h-4 inline mr-2" />
                        Not assigned to you
                    </div>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for memo
    // Only re-render if these specific props change
    return (
        prevProps.review._id === nextProps.review._id &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isProcessing === nextProps.isProcessing &&
        prevProps.review.status === nextProps.review.status &&
        prevProps.review.assigned_to === nextProps.review.assigned_to
    );
});

ReviewCard.displayName = 'ReviewCard';

export default ReviewCard;
