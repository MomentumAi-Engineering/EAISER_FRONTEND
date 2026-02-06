import React from 'react';

/**
 * SkeletonLoader Component
 * 
 * Professional skeleton loader for admin dashboard.
 * Provides visual feedback during data loading without blocking UI.
 * 
 * Design principles:
 * - Subtle, non-distracting animation
 * - Matches actual content layout
 * - Professional gray tones (no bright colors)
 * - Smooth pulse animation
 */
export default function SkeletonLoader({ count = 6 }) {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden"
                    style={{ animationDelay: `${i * 50}ms` }}
                >
                    {/* Image Skeleton */}
                    <div className="h-48 bg-gray-800/50 animate-pulse relative">
                        <div className="absolute top-3 right-3 h-6 w-20 bg-gray-700/50 rounded"></div>
                        <div className="absolute bottom-3 left-3 h-6 w-24 bg-gray-700/50 rounded"></div>
                    </div>

                    {/* Content Skeleton */}
                    <div className="p-4 space-y-3">
                        {/* Title */}
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-32 bg-gray-800/50 rounded animate-pulse"></div>
                            <div className="h-5 w-20 bg-gray-800/50 rounded animate-pulse"></div>
                        </div>

                        {/* Description lines */}
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-gray-800/50 rounded animate-pulse"></div>
                            <div className="h-4 w-5/6 bg-gray-800/50 rounded animate-pulse"></div>
                            <div className="h-4 w-4/6 bg-gray-800/50 rounded animate-pulse"></div>
                        </div>

                        {/* Metadata */}
                        <div className="space-y-2 pt-2">
                            <div className="h-3 w-3/4 bg-gray-800/50 rounded animate-pulse"></div>
                            <div className="h-3 w-2/3 bg-gray-800/50 rounded animate-pulse"></div>
                            <div className="h-3 w-1/2 bg-gray-800/50 rounded animate-pulse"></div>
                        </div>

                        {/* Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-4">
                            <div className="h-9 bg-gray-800/50 rounded animate-pulse"></div>
                            <div className="h-9 bg-gray-800/50 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * TableSkeletonLoader Component
 * 
 * Skeleton loader for table view (future use)
 */
export function TableSkeletonLoader({ rows = 10 }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="h-16 bg-gray-900/50 border border-gray-800 rounded animate-pulse"
                    style={{ animationDelay: `${i * 30}ms` }}
                ></div>
            ))}
        </div>
    );
}
