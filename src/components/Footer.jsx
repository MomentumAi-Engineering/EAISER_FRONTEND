import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Globe, Sparkles } from 'lucide-react';

const Footer = () => {
    const triggerCookieSettings = (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('openCookiePreferences'));
    };

    return (
        <footer className="bg-black border-t border-white/5 pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-black" />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tighter">EAiSER AI</span>
                        </div>
                        <p className="text-gray-400 max-w-sm leading-relaxed">
                            Empowering communities through advanced AI-driven incident reporting and resolution protocols. 
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Platform</h4>
                        <ul className="space-y-4 text-sm text-gray-500 font-medium">
                            <li><a href="/" className="hover:text-yellow-400 transition-colors">Home</a></li>
                            <li><a href="/report" className="hover:text-yellow-400 transition-colors">Send Report</a></li>
                            <li><a href="/dashboard" className="hover:text-yellow-400 transition-colors">Citizen Dashboard</a></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Legal & Privacy</h4>
                        <ul className="space-y-4 text-sm text-gray-500 font-medium">
                            <li><a href="/verify-email" className="hover:text-yellow-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-yellow-400 transition-colors">Terms of Service</a></li>
                            <li>
                                <button 
                                    onClick={triggerCookieSettings}
                                    className="hover:text-yellow-400 transition-colors text-left"
                                >
                                    Cookie Preferences
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs text-gray-600 font-medium">
                        © {new Date().getFullYear()} MomntumAi Research. All rights reserved.
                    </p>
                    
                    <div className="flex items-center gap-6 text-gray-600">
                        <div className="flex items-center gap-2 text-xs">
                            <Shield className="w-3.5 h-3.5" />
                            <span>AES-256 Encrypted</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Cloud Distributed</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
