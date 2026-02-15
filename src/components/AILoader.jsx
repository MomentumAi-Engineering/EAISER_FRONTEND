import React, { useState, useEffect, useRef } from 'react';

/**
 * AILoader Component
 * 
 * An ultra-advanced, performance-optimized, and premium AI loader for EAiSER AI.
 * Built with React, Tailwind CSS 4.x, and CSS-first animations.
 * 
 * Features:
 * - Living AI Core with facial expressions (Thinking, Neutral, Happy, Error)
 * - Dynamic Typewriter messaging system
 * - Background system scanning intelligence
 * - Responsive, lightweight, and hardware-accelerated
 */
const AILoader = ({
    status = 'loading',
    messages = [
        "Analyzing civic issue data...",
        "Scanning location & severity...",
        "Matching authority jurisdiction...",
        "Finalizing verified report..."
    ],
    onComplete
}) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const timerRef = useRef(null);
    const textTimerRef = useRef(null);

    // Status mapping for AI Face
    const faceState = {
        loading: '🤔',
        processing: '🙂',
        success: '😄',
        error: '😵'
    };

    // Handle Typewriter Effect
    useEffect(() => {
        const currentFullText = messages[currentMessageIndex];
        const typingSpeed = isDeleting ? 30 : 50;

        const handleTyping = () => {
            if (!isDeleting && displayedText === currentFullText) {
                // Wait at the end of message
                textTimerRef.current = setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && displayedText === "") {
                setIsDeleting(false);
                setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
            } else {
                const nextText = isDeleting
                    ? currentFullText.substring(0, displayedText.length - 1)
                    : currentFullText.substring(0, displayedText.length + 1);

                setDisplayedText(nextText);
            }
        };

        textTimerRef.current = setTimeout(handleTyping, typingSpeed);

        return () => clearTimeout(textTimerRef.current);
    }, [displayedText, isDeleting, currentMessageIndex, messages]);

    // Handle Exit Animation
    useEffect(() => {
        if (status === 'success') {
            const exitTimer = setTimeout(() => {
                setIsVisible(false);
                if (onComplete) {
                    setTimeout(onComplete, 600); // Wait for transition
                }
            }, 2500);
            return () => clearTimeout(exitTimer);
        }
    }, [status, onComplete]);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-700 ${status === 'success' && !isVisible ? 'opacity-0' : 'opacity-100'}`}>

            {/* Background Intelligence Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#FFCC0011_1px,transparent_1px),linear-gradient(to_bottom,#FFCC0011_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFCC0005] to-transparent h-[200%] animate-scan"></div>
            </div>

            {/* Living AI Core */}
            <div className="relative flex flex-col items-center">

                {/* Anti-Gravity Floating Container */}
                <div className="animate-float">

                    {/* AI Core Shell */}
                    <div className="relative w-32 h-32 rounded-full bg-zinc-900 border-2 border-yellow-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(255,204,0,0.1)]">

                        {/* Inner Core Pulse */}
                        <div className={`absolute inset-2 rounded-full border border-yellow-500/10 ${status === 'loading' ? 'animate-pulse-slow' : ''}`}></div>

                        {/* Face Components (SVG for performance) */}
                        <svg width="80" height="40" viewBox="0 0 80 40" className="relative z-10 overflow-visible">
                            {/* Eyes */}
                            <g className="animate-blink">
                                <circle cx="20" cy="15" r="4" fill="#FFCC00" className={`transition-all duration-300 ${status === 'success' ? 'fill-cyan-400' : ''}`} />
                                <circle cx="60" cy="15" r="4" fill="#FFCC00" className={`transition-all duration-300 ${status === 'success' ? 'fill-cyan-400' : ''}`} />
                            </g>

                            {/* Mouth System */}
                            {status === 'loading' && (
                                <path d="M30 30 Q 40 25 50 30" stroke="#FFCC00" strokeWidth="3" fill="none" strokeLinecap="round" className="animate-mouth-think" />
                            )}
                            {status === 'success' && (
                                <path d="M25 25 Q 40 40 55 25" stroke="#22D3EE" strokeWidth="4" fill="none" strokeLinecap="round" className="animate-mouth-happy" />
                            )}
                            {status === 'error' && (
                                <path d="M30 30 L 50 30" stroke="#EF4444" strokeWidth="3" fill="none" strokeLinecap="round" />
                            )}
                        </svg>

                        {/* Orbiting Nodes */}
                        <div className="absolute inset-0 animate-spin-slow">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_#FFCC00]"></div>
                        </div>
                    </div>
                </div>

                {/* Data Flow Indicators */}
                <div className="mt-12 flex gap-3 h-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-yellow-500/40 will-change-transform"
                            style={{
                                animation: `pulse-node 2s infinite ${i * 0.3}s cubic-bezier(0.4, 0, 0.6, 1)`
                            }}
                        ></div>
                    ))}
                </div>

                {/* Smart Text System */}
                <div className="mt-8 text-center min-h-[3rem]">
                    <div className="flex flex-col items-center">
                        <div className="text-yellow-500 font-mono text-sm tracking-widest uppercase mb-2 opacity-50">
                            {status === 'success' ? 'Processing Complete' : 'AI Intelligence Active'}
                        </div>
                        <div className="flex items-center text-white/90 font-medium text-lg">
                            <span className="mr-0.5">{displayedText}</span>
                            <span className="w-2 h-5 bg-yellow-500 animate-cursor-blink"></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tailwind 4.x Keyframes Injection */}
            <style>{`
        @keyframes scan {
          from { transform: translateY(-50%); }
          to { transform: translateY(0%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.1); opacity: 0.3; }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes mouth-think {
          0%, 100% { d: path("M30 30 Q 40 25 50 30"); }
          50% { d: path("M30 30 Q 40 35 50 30"); }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulse-node {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.5); opacity: 0.8; background-color: #FFCC00; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-scan { animation: scan 8s linear infinite; will-change: transform; }
        .animate-float { animation: float 6s ease-in-out infinite; will-change: transform; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; will-change: transform, opacity; }
        .animate-blink { animation: blink 5s infinite; }
        .animate-mouth-think { animation: mouth-think 3s ease-in-out infinite; }
        .animate-cursor-blink { animation: cursor-blink 1s infinite; }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; will-change: transform; }
      `}</style>
        </div>
    );
};

export default AILoader;
