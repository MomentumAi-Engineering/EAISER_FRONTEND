import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Settings, Check, ArrowRight } from 'lucide-react';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [preferences, setPreferences] = useState({
        essential: true, // Always true
        optional: false
    });

    useEffect(() => {
        // Check if user has already made a choice
        const savedPrefs = localStorage.getItem('eaiser_cookie_consent');
        if (!savedPrefs) {
            // Show banner after a slight delay
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        } else {
            setPreferences(JSON.parse(savedPrefs));
        }

        // Setup global event listener to open preferences from footer
        const handleOpenPreferences = () => {
            setShowPreferences(true);
            setIsVisible(true);
        };
        window.addEventListener('openCookiePreferences', handleOpenPreferences);
        return () => window.removeEventListener('openCookiePreferences', handleOpenPreferences);
    }, []);

    const handleSave = (newPrefs) => {
        setPreferences(newPrefs);
        localStorage.setItem('eaiser_cookie_consent', JSON.stringify(newPrefs));
        setIsVisible(false);
        setShowPreferences(false);
        // You would typically trigger analytics initialization here if optional is true
        if (newPrefs.optional) {
            console.log('Optional cookies enabled');
        }
    };

    const handleAcceptAll = () => {
        const allOn = { essential: true, optional: true };
        handleSave(allOn);
    };

    const handleRejectOptional = () => {
        const onlyEssential = { essential: true, optional: false };
        handleSave(onlyEssential);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-x-0 bottom-0 z-[100] p-6 pointer-events-none flex justify-center">
                    {!showPreferences ? (
                        /* Banner View */
                        <motion.div 
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="pointer-events-auto max-w-4xl w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row items-center gap-6"
                            style={{ 
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                            }}
                        >
                            <div className="flex-grow space-y-2">
                                <div className="flex items-center gap-3 text-yellow-400">
                                    <Shield className="w-5 h-5" />
                                    <h3 className="font-bold text-lg tracking-tight">Privacy Guard</h3>
                                </div>
                                <p className="text-gray-200 text-sm leading-relaxed">
                                    We use cookies and similar technologies to keep EAiSER working securely, personalize your experience, and help us improve the platform. You can choose which optional cookies to allow in Preferences.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 shrink-0">
                                <button 
                                    onClick={() => setShowPreferences(true)}
                                    className="px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    Preferences
                                </button>
                                <button 
                                    onClick={handleRejectOptional}
                                    className="px-5 py-2.5 text-sm font-semibold text-white/70 hover:text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                                >
                                    Reject Optional
                                </button>
                                <button 
                                    onClick={handleAcceptAll}
                                    className="px-6 py-2.5 text-sm font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all flex items-center gap-2"
                                >
                                    Accept All
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        /* Preferences Modal */
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="pointer-events-auto w-full max-w-lg bg-gray-950 border border-white/10 rounded-3xl shadow-3xl overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-black text-white">Cookie Settings</h2>
                                    <button onClick={() => setShowPreferences(false)} className="p-2 text-gray-500 hover:text-white">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Essential */}
                                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-4">
                                        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
                                            <Check className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between">
                                                <h4 className="font-bold text-white">Essential Cookies</h4>
                                                <span className="text-[10px] uppercase font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Required</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Required for the system to function correctly, like authentication and security.</p>
                                        </div>
                                    </div>

                                    {/* Optional */}
                                    <div 
                                        onClick={() => setPreferences(prev => ({...prev, optional: !prev.optional}))}
                                        className={`p-4 cursor-pointer border transition-all rounded-2xl flex items-start gap-4 ${preferences.optional ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/5 border-white/5'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${preferences.optional ? 'bg-yellow-500/20' : 'bg-gray-800'}`}>
                                            <Settings className={`w-5 h-5 ${preferences.optional ? 'text-yellow-400' : 'text-gray-500'}`} />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-bold text-white">Optional Cookies</h4>
                                                <div className={`w-10 h-5 rounded-full relative transition-colors ${preferences.optional ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${preferences.optional ? 'left-6' : 'left-1'}`} />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Analytics and performance tracking to help us improve the system.</p>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleSave(preferences)}
                                    className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-yellow-400 transition-all text-center"
                                >
                                    Save My Choice
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
