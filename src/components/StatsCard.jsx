import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatsCard Component
 * 
 * Animated statistics card with:
 * - Gradient backgrounds
 * - Trend indicators
 * - Smooth animations
 * - Professional design
 */
export default function StatsCard({
    title,
    value,
    change,
    trend = 'up',
    icon: Icon,
    color = 'blue',
    loading = false
}) {
    const colorClasses = {
        blue: {
            bg: 'from-blue-500/10 to-cyan-500/10',
            border: 'border-blue-500/30',
            icon: 'text-blue-400',
            text: 'text-blue-400'
        },
        green: {
            bg: 'from-emerald-500/10 to-green-500/10',
            border: 'border-emerald-500/30',
            icon: 'text-emerald-400',
            text: 'text-emerald-400'
        },
        purple: {
            bg: 'from-purple-500/10 to-pink-500/10',
            border: 'border-purple-500/30',
            icon: 'text-purple-400',
            text: 'text-purple-400'
        },
        orange: {
            bg: 'from-orange-500/10 to-amber-500/10',
            border: 'border-orange-500/30',
            icon: 'text-orange-400',
            text: 'text-orange-400'
        },
        red: {
            bg: 'from-red-500/10 to-rose-500/10',
            border: 'border-red-500/30',
            icon: 'text-red-400',
            text: 'text-red-400'
        }
    };

    const colors = colorClasses[color] || colorClasses.blue;

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';

    if (loading) {
        return (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-4 w-24 bg-gray-800 rounded"></div>
                    <div className="h-10 w-10 bg-gray-800 rounded-lg"></div>
                </div>
                <div className="h-8 w-32 bg-gray-800 rounded mb-2"></div>
                <div className="h-3 w-20 bg-gray-800 rounded"></div>
            </div>
        );
    }

    return (
        <div className={`group relative bg-gradient-to-br ${colors.bg} backdrop-blur-sm border ${colors.border} rounded-xl p-6 hover:scale-105 transition-all duration-300 overflow-hidden`}>
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    {Icon && (
                        <div className={`p-2.5 rounded-lg bg-gray-900/50 ${colors.icon}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
                        {change && (
                            <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                                <TrendIcon className="w-4 h-4" />
                                <span className="font-medium">{change}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Glow Effect */}
            <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br ${colors.bg} blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-300`}></div>
        </div>
    );
}

/**
 * StatsGrid Component
 * 
 * Grid container for stats cards with responsive layout
 */
export function StatsGrid({ children, columns = 4 }) {
    const gridCols = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    };

    return (
        <div className={`grid ${gridCols[columns] || gridCols[4]} gap-6`}>
            {children}
        </div>
    );
}
