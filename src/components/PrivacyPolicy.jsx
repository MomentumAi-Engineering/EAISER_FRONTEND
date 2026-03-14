import React from 'react';

export default function PrivacyPolicy({ isModal = false }) {
    const sections = [
        {
            id: 'introduction',
            title: '1. Introduction',
            content: (
                <p>
                    EAiSER.Ai ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                    explains how we collect, use, and share your personal information when you use our 
                    reporting platform.
                </p>
            )
        },
        {
            id: 'collection',
            title: '2. Information We Collect',
            content: (
                <div className="space-y-4">
                    <div>
                        <p className="font-semibold text-white mb-2">2.1 Information You Provide</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Account Information: Name, email address, password, and phone number.</li>
                            <li>Report Content: Photos, videos, and descriptions of incidents you report.</li>
                            <li>Communication: Information you provide when contacting our support team.</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-white mb-2">2.2 Automatically Collected Information</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Location Data: Precise GPS coordinates to map and route your reports.</li>
                            <li>Device Information: IP address, device type, and operating system.</li>
                            <li>Usage Data: Information about how you interact with the Service.</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'usage',
            title: '3. How We Use Your Information',
            content: (
                <div className="space-y-2">
                    <p>We use your information to:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Operate, maintain, and improve the reporting platform.</li>
                        <li>Analyze and classify reports using AI technology.</li>
                        <li>Route reports to relevant municipal authorities or city departments.</li>
                        <li>Communicate with you about your reports or account.</li>
                        <li>Ensure compliance with our Terms of Service.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'sharing',
            title: '4. How We Share Your Information',
            content: (
                <div className="space-y-2">
                    <p>We may share your information with:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Authorities: Municipal departments and agencies responsible for resolving reported issues.</li>
                        <li>Service Providers: Third-party vendors who help us operate our Service (e.g., AI providers, cloud hosting).</li>
                        <li>Legal compliance: When required by law or to protect the safety of our users.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'choices',
            title: '5. Your Choices',
            content: (
                <p>
                    You can access and update your account information in the Profile section of the Service. 
                    You may also revoke location permissions in your device settings, though this will 
                    limit the platform's ability to map reports accurately.
                </p>
            )
        },
        {
            id: 'security',
            title: '6. Data Security',
            content: (
                <p>
                    We use industry-standard security measures, including encryption, to protect your 
                    information. However, no method of transmission over the internet is 100% secure.
                </p>
            )
        },
        {
            id: 'contact',
            title: '7. Contact Us',
            content: (
                <p>
                    If you have questions about this Privacy Policy, please contact us at <a href="mailto:support@momntumai.com" className="text-yellow-400 hover:underline">support@momntumai.com</a>.
                </p>
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
        </div>
    );

    if (!isModal) {
        return content;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-zinc-900 to-black flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white">Privacy Policy</h2>
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('closePrivacyModal'))}
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
                <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('closePrivacyModal'))}
                        className="px-8 py-3 rounded-xl bg-yellow-500 text-black font-black hover:bg-yellow-400 transition-all active:scale-95"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}

