import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

const Warning = ({ message }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative group mb-6"
        >
            {/* Outer Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 via-red-500/30 to-red-600/20 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

            {/* Main Container */}
            <div className="relative flex flex-col sm:flex-row items-center gap-4 bg-black/60 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 sm:p-5 overflow-hidden">
                {/* Animated Side Gradient Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-600 via-red-500 to-red-600"></div>

                {/* Icon with Glowing Border */}
                <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md animate-ping"></div>
                    <div className="relative w-12 h-12 bg-red-950/40 border border-red-500/40 rounded-full flex items-center justify-center shadow-inner">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                </div>

                <div className="flex-grow text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                        <h4 className="text-red-500 font-black text-[10px] uppercase tracking-[0.3em]">AI Assistance Notice</h4>
                    </div>
                    <div className="space-y-3">
                        <div className="text-gray-200 text-[13px] font-bold leading-relaxed">
                            {message ? (
                                <p>{message}</p>
                            ) : (
                                <div className="space-y-2">
                                    <p>This report was generated using AI-assisted analysis of the submitted image and location data.</p>
                                    <p className="text-gray-300 font-medium">While the system is designed to provide accurate civic issue detection, we recommend verifying the details before final submission.</p>
                                </div>
                            )}
                        </div>
                        <div className="h-px bg-gradient-to-r from-red-500/40 via-red-500/10 to-transparent w-full"></div>
                        <p className="text-red-400/90 text-[11px] font-semibold leading-relaxed tracking-wide italic">
                            Eaiser functions as a civic reporting and routing platform to help connect users with the appropriate authorities.
                        </p>
                    </div>
                </div>

                {/* Animated Background Element */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-red-500/5 to-transparent pointer-events-none"></div>
            </div>

            <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .warning-scan {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(239, 68, 68, 0.05), transparent);
          animation: scanline 3s linear infinite;
          pointer-events: none;
        }
      `}</style>
            <div className="warning-scan"></div>
        </motion.div>
    );
};

export default Warning;
