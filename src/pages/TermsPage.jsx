import React, { useEffect, useState } from 'react';
import TermsOfService from '../components/TermsOfService';
import { motion } from 'framer-motion';
import { ChevronRight, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
    const [activeSection, setActiveSection] = useState('introduction');

    useEffect(() => {
        window.scrollTo(0, 0);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { threshold: 0.5, rootMargin: '-10% 0px -70% 0px' }
        );

        const sections = document.querySelectorAll('section[id]');
        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    const navItems = [
        { id: 'introduction', label: '1. Introduction' },
        { id: 'about', label: '2. About EAiSER' },
        { id: 'eligibility', label: '3. Eligibility' },
        { id: 'registration', label: '4. Registration' },
        { id: 'license', label: '5. Our Service' },
        { id: 'acceptable_use', label: '6. Acceptable Use' },
        { id: 'intellectual_property', label: '9. IP Rights' },
        { id: 'liability', label: '11. Liability' },
        { id: 'disputes', label: '14. Disputes' },
    ];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-yellow-500/30 overflow-x-hidden w-full">
            {/* Ambient Background - Optimized */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/[0.03] blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 will-change-[filter]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/[0.03] blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2 will-change-[filter]" />
            </div>

            <main className="relative pt-12 pb-24 px-4 sm:px-6 md:px-12 min-w-0 w-full">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10"
                    >
                        <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Back to Home</span>
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-xs font-black tracking-widest uppercase">
                                    <FileText className="w-4 h-4" />
                                    Legal Framework
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
                                    Terms of <span className="text-yellow-400">Service</span>
                                </h1>
                            </div>
                            <p className="text-zinc-500 max-w-sm text-sm font-medium leading-relaxed">
                                Please review these terms carefully as they govern your relationship with EAiSER.Ai and use of our AI services.
                            </p>
                        </div>
                    </motion.div>

                    <div className="grid lg:grid-cols-[280px_1fr] gap-16 items-start">
                        {/* Sticky Navigation */}
                        <aside className="hidden lg:block sticky top-32 space-y-8">
                            <div>
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 px-4">Sections</h4>
                                <nav className="space-y-1">
                                    {navItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${activeSection === item.id
                                                ? 'bg-zinc-900 text-white shadow-xl shadow-black'
                                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                                                }`}
                                        >
                                            {item.label}
                                            <ChevronRight className={`w-4 h-4 transition-all ${activeSection === item.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                                                }`} />
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl space-y-4">
                                <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Legal Inquiry</h5>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Need clarification on a clause? Our legal team is here to assist.
                                </p>
                                <a href="mailto:support@momntumai.com" className="block w-full py-3 bg-white text-black text-center rounded-xl text-xs font-black uppercase hover:bg-gray-200 transition-colors">
                                    Email Legal
                                </a>
                            </div>
                        </aside>

                        {/* Content Area */}
                        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 md:p-16 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] min-w-0 w-full overflow-hidden">
                            <TermsOfService isModal={false} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

