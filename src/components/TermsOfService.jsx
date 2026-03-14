import React from 'react';

export default function TermsOfService({ onAccept, onDecline, isModal = false }) {
    const sections = [
        {
            id: 'introduction',
            title: '1. Introduction',
            content: (
                <div className="space-y-4">
                    <p>
                        Welcome to EAiSER.Ai. These Terms of Service (the "Terms") govern your access to and use of
                        the EAiSER.Ai mobile application, website, and related services (collectively, the "Service"),
                        operated by Momntum AI LLC, a Tennessee limited-liability company ("Momntum AI," "we,"
                        "our," or "us").
                    </p>
                    <p>
                        By creating an account, accessing, or using the Service, you agree to be bound by these Terms. If
                        you do not agree, you may not use the Service.
                    </p>
                </div>
            )
        },
        {
            id: 'about',
            title: '2. About EAiSER.Ai',
            content: (
                <div className="space-y-4">
                    <p>
                        EAiSER.Ai is an AI-powered civic and home issue-reporting platform. Our AI technology analyzes the content, classifies
                        the issue, and generates a structured report routed to relevant authorities.
                    </p>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                        <p className="font-bold text-yellow-500 text-sm">
                            Important: EAiSER.Ai is a reporting and routing tool. We do not directly repair issues or control how authorities respond.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'eligibility',
            title: '3. Eligibility',
            content: (
                <div className="space-y-2">
                    <p>You must be at least 13 years old to use the Service. If you are under 18, you represent that you have parental permission.</p>
                </div>
            )
        },
        {
            id: 'registration',
            title: '4. Account registration',
            content: (
                <div className="space-y-4">
                    <p>To use certain features, you must create an account providing a valid email and name. You are responsible for all activity under your account.</p>
                </div>
            )
        },
        {
            id: 'license',
            title: '5. Using the Service',
            content: (
                <div className="space-y-4">
                    <p className="font-semibold text-white">5.1 License to use</p>
                    <p>We grant you a limited, non-exclusive, revocable license to use the Service for personal purposes.</p>
                    <p className="font-semibold text-white">5.2 AI Content</p>
                    <p>You acknowledge that AI classifications may contain errors. You are responsible for reviewing reports before submission.</p>
                </div>
            )
        },
        {
            id: 'acceptable_use',
            title: '6. Acceptable Use',
            content: (
                <div className="space-y-2">
                    <p>You agree not to use the Service to:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>No fraudulent or misleading reports.</li>
                        <li>No illegal or defamatory content.</li>
                        <li>No automated data harvesting (scraping).</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'intellectual_property',
            title: '9. Intellectual Property',
            content: (
                <div className="space-y-4">
                    <p>The Service technology is owned by Momntum AI LLC. You retain ownership of your submitted content but grant us a license to process it.</p>
                </div>
            )
        },
        {
            id: 'liability',
            title: '11. Limitation of Liability',
            content: (
                <p className="uppercase font-bold text-xs leading-loose">
                    TO THE FULLEST EXTENT PERMITTED BY LAW, MOMNTUM AI WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
                </p>
            )
        },
        {
            id: 'disputes',
            title: '14. Dispute Resolution',
            content: (
                <p>Disputes will be resolved by binding arbitration in Nashville, Tennessee, under AAA rules.</p>
            )
        }
    ];

    const content = (
        <div className={`space-y-12 ${isModal ? 'text-sm text-gray-300 pb-10' : 'text-gray-300'}`}>
            {!isModal && (
                <div className="mb-4">
                    <p className="text-gray-500 font-medium text-xs">Last Updated: March 14th, 2026</p>
                </div>
            )}

            {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-32">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 text-sm">
                            {section.title.split('.')[0]}
                        </span>
                        {section.title.split('.').slice(1).join('.').trim()}
                    </h3>
                    <div className="leading-relaxed pl-11">
                        {section.content}
                    </div>
                </section>
            ))}

            {!isModal && (
                <div className="pt-8 border-t border-white/10 text-yellow-500 font-bold italic">
                    By using EAiSER.Ai, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </div>
            )}
        </div>
    );

    if (!isModal) {
        return content;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-zinc-900 to-black flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-yellow-500 text-black p-3 rounded-2xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <h2 className="text-2xl font-black text-white">Terms of Service</h2>
                    </div>
                    <button
                        onClick={onDecline}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="px-8 py-10 overflow-y-auto custom-scrollbar">
                    {content}
                </div>
                <div className="p-8 border-t border-white/5 bg-black/40 flex flex-col sm:flex-row gap-4 justify-end items-center">
                    <div className="flex w-full sm:w-auto gap-3">
                        <button
                            onClick={onAccept}
                            className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-extrabold shadow-xl shadow-yellow-500/20 text-sm whitespace-nowrap active:scale-95 transition-all"
                        >
                            I Accept the Terms
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(234, 179, 8, 0.15); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(234, 179, 8, 0.3); }
            `}</style>
        </div>
    );
}
