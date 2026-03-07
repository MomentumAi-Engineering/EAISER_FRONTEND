import React from 'react';

export default function TermsOfService({ onAccept, onDecline, isModal = false }) {
    const content = (
        <div className="text-sm text-gray-300 space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <h2 className="text-xl font-bold text-white mb-4">EAiSER.Ai Terms of Service</h2>
            <p className="font-semibold text-gray-400">Effective Date: March 4th, 2026.</p>

            <h3 className="text-lg font-semibold text-white mt-4">1. Introduction</h3>
            <p>
                Welcome to EAiSER.Ai. These Terms of Service (the "Terms") govern your access to and use of
                the EAiSER.Ai mobile application, website, and related services (collectively, the "Service"),
                operated by Momntum AI LLC, a Tennessee limited-liability company ("Momntum AI," "we,"
                "our," or "us").
            </p>
            <p>
                By creating an account, accessing, or using the Service, you agree to be bound by these Terms. If
                you do not agree, you may not use the Service. If you are using the Service on behalf of an
                organization, you represent that you have authority to bind that organization to these Terms.
            </p>
            <p>
                Related documents: Your use of the Service is also governed by our Privacy Policy,
                which explains how we collect and use your personal information.
            </p>

            <h3 className="text-lg font-semibold text-white mt-4">2. About EAiSER.Ai</h3>
            <p>
                EAiSER.Ai is an AI-powered civic and home issue-reporting platform. Users can submit photos,
                videos, and descriptions of issues (such as potholes, broken infrastructure, property
                maintenance problems, or other concerns). Our AI technology analyzes the content, classifies
                the issue, and generates a structured report. The Service then routes the report to relevant
                municipal authorities, city departments, or other designated recipients for review and potential
                action.
            </p>
            <p className="font-semibold text-yellow-400">
                Important: EAiSER.Ai is a reporting and routing tool. We do not directly repair issues, provide
                municipal services, or control how authorities or third parties respond to reports. We make no
                guarantee that any issue you report will be resolved, or that any authority or business will take
                action.
            </p>

            <h3 className="text-lg font-semibold text-white mt-4">3. Eligibility</h3>
            <p>
                You must be at least 13 years old to use the Service. If you are under 18, you represent that you
                have your parent or guardian's permission to use the Service and that they have reviewed and
                agreed to these Terms on your behalf.
            </p>
            <p>You may not use the Service if:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>You have been previously banned or suspended from the Service;</li>
                <li>You are prohibited by law from using the Service; or</li>
                <li>Your use would violate any applicable law or regulation.</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-4">4. Account registration and security</h3>
            <p className="font-semibold">4.1 Creating an account</p>
            <p>To use certain features of the Service, you must create an account by providing:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>A valid email address;</li>
                <li>Your first and last name;</li>
                <li>Optionally, a phone number; and</li>
                <li>Authentication credentials (password or single sign-on via a supported provider).</li>
            </ul>
            <p>You agree to provide accurate, current, and complete information and to keep your account information up to date.</p>

            <p className="font-semibold mt-2">4.2 Account security</p>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Keeping your password and account credentials confidential;</li>
                <li>All activity that occurs under your account; and</li>
                <li>Notifying us immediately at support@momntumai.com if you suspect unauthorized use of your account.</li>
            </ul>
            <p>We are not liable for any loss or damage resulting from your failure to safeguard your account credentials.</p>

            <p className="font-semibold mt-2">4.3 One account per person</p>
            <p>
                You may create only one account. Creating multiple accounts to evade bans, abuse the Service,
                or manipulate reports is prohibited and may result in termination of all your accounts and/or
                other legal actions.
            </p>

            <h3 className="text-lg font-semibold text-white mt-4">5. Using the Service</h3>
            <p className="font-semibold">5.1 License to use</p>
            <p>
                Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable
                license to access and use the Service for your personal, non-commercial purposes (or, if you are
                a business or municipal user under a separate agreement, for the purposes described in that
                agreement).
            </p>

            <p className="font-semibold mt-2">5.2 Submitting issue reports</p>
            <p>When you submit an issue report, you:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Grant us a worldwide, royalty-free, sublicensable license to use, store, process, display, and transmit your photos, videos, text, location data, and other content as necessary to operate the Service, analyze the issue, generate reports, and route them to appropriate recipients;</li>
                <li>Represent that you own or have the right to submit the content and that it does not violate any third party's rights or any law;</li>
                <li>Understand that your report (including images, location, and contact information) may be shared with municipal authorities, city departments, or other designated recipients, and may be visible to other users or on public maps if community transparency features are enabled;</li>
                <li>Acknowledge that we use AI technology (including third-party AI services such as the Gemini API) to analyze and classify your submissions, and that AI-generated classifications and descriptions may contain errors or inaccuracies.</li>
            </ul>

            <p className="font-semibold mt-2">5.3 Location services</p>
            <p>The Service uses your device's GPS location to:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Place issue reports accurately on a map;</li>
                <li>Route reports to the correct authority or geographic area; and</li>
                <li>Provide location-based features.</li>
            </ul>
            <p>You may revoke location permissions via your device settings, but some features may not function without location access. By using location-based features, you consent to the collection and use of your location data as described in our aforementioned Privacy Policy.</p>

            <p className="font-semibold mt-2">5.4 AI-generated content and classifications</p>
            <p>EAiSER.Ai uses artificial intelligence to:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Detect and classify the type of issue you report;</li>
                <li>Generate suggested descriptions, tags, and structured reports; and</li>
                <li>Assist with routing decisions.</li>
            </ul>
            <p>You acknowledge and agree that:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>AI classifications and suggestions are provided for convenience and may be inaccurate, incomplete, or incorrect;</li>
                <li>You are responsible for reviewing and, if necessary, editing AI-generated content before submitting a report;</li>
                <li>We are not liable for errors, misclassifications, or consequences resulting from AI-generated content; and</li>
                <li>AI is a tool to assist you, not a guarantee of accuracy or outcome.</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-4">6. Acceptable use policy</h3>
            <p>You agree not to use the Service to:</p>
            <p className="font-semibold">6.1 Prohibited conduct</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Submit false, fraudulent, misleading, or harassing reports;</li>
                <li>Upload content that is illegal, defamatory, obscene, threatening, hateful, or that violates any person's rights (including privacy, publicity, or intellectual property rights);</li>
                <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity;</li>
                <li>Submit reports containing viruses, malware, or harmful code;</li>
                <li>Abuse, harass, threaten, or intimidate other users, authorities, or Momntum AI staff;</li>
                <li>Scrape, harvest, or collect data from the Service using automated means without our prior written permission;</li>
                <li>Reverse-engineer, decompile, disassemble, or attempt to derive the source code of the Service;</li>
                <li>Interfere with or disrupt the Service, servers, or networks connected to the Service;</li>
                <li>Use the Service for any unlawful purpose or in violation of any local, state, national, or international law; or</li>
                <li>Attempt to gain unauthorized access to any part of the Service, other users' accounts, or our systems.</li>
            </ul>

            <p className="font-semibold mt-2">6.2 Content restrictions</p>
            <p>Do not upload or submit:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Images or videos of private spaces (e.g., inside someone's home) without permission, except where necessary to report a legitimate issue affecting your own property;</li>
                <li>Content depicting illegal activity, violence, child exploitation, or animal abuse;</li>
                <li>Personally identifiable information of others (such as Social Security numbers, credit card numbers, or government IDs) unless necessary for the report and permitted by law; or</li>
                <li>Spam, promotional content, or commercial advertisements unrelated to issue reporting.</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-4">7. Our rights and enforcement</h3>
            <p className="font-semibold">7.1 Content moderation</p>
            <p>We reserve the right, but have no obligation, to:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Review, monitor, edit, or remove any content submitted to the Service;</li>
                <li>Investigate violations of these Terms;</li>
                <li>Suspend, restrict, or terminate accounts that violate these Terms or engage in abusive or illegal conduct; and</li>
                <li>Cooperate with law enforcement and provide information as required by law or court order.</li>
            </ul>

            <p className="font-semibold mt-2">7.2 No obligation to act</p>
            <p>We are not obligated to:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Monitor or review every submission;</li>
                <li>Verify the accuracy or legitimacy of any report;</li>
                <li>Intervene in disputes between users and authorities or third parties; or</li>
                <li>Guarantee that any report will be forwarded, reviewed, or acted upon by the intended recipient.</li>
            </ul>

            <p className="font-semibold mt-2">7.3 Changes to the Service</p>
            <p>We may:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Modify, suspend, or discontinue any feature or aspect of the Service at any time, with or without notice;</li>
                <li>Impose limits on features (such as the number of reports, file sizes, or storage); and</li>
                <li>Update the AI models, routing algorithms, or other technology underlying the Service.</li>
            </ul>
            <p>We will make reasonable efforts to notify you of material changes where feasible, but continued use of the Service after such changes constitutes acceptance.</p>

            <h3 className="text-lg font-semibold text-white mt-4">8. Third parties</h3>
            <p className="font-semibold">8.1 Authorities and recipients</p>
            <p>Reports submitted through EAiSER.Ai may be forwarded to:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Municipal governments, city departments, public works agencies, and other authorities; or</li>
                <li>Businesses, service providers, or other third parties designated to handle certain types of issues.</li>
            </ul>
            <p>You acknowledge and agree that:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>We do not control or guarantee the actions, responses, or conduct of these third parties;</li>
                <li>Third parties may have their own terms, policies, and procedures;</li>
                <li>We are not responsible for delays, inaction, errors, or misconduct by third parties; and</li>
                <li>Any dispute with a third party is solely between you and that party.</li>
            </ul>

            <p className="font-semibold mt-2">8.2 Third-party services and links</p>
            <p>The Service may integrate with or link to third-party services, websites, or applications (e.g., mapping services, authentication providers, AI providers). We do not control or endorse third-party services and are not responsible for their content, policies, or practices. Your use of third-party services is governed by their terms and privacy policies.</p>

            <h3 className="text-lg font-semibold text-white mt-4">9. Intellectual property</h3>
            <p className="font-semibold">9.1 Our ownership</p>
            <p>The Service and all associated technology, software, designs, logos, trademarks, and content (excluding user-submitted content) are owned by Momntum AI LLC or our licensors and are protected by U.S. and international intellectual property laws.</p>
            <p>You may not:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Copy, reproduce, distribute, modify, create derivative works of, publicly display, or exploit any part of the Service without our prior written permission; or</li>
                <li>Use our trademarks, trade names, or branding without authorization.</li>
            </ul>

            <p className="font-semibold mt-2">9.2 Your content</p>
            <p>You retain ownership of the content you submit (photos, videos, text, and other materials). By submitting content to the Service, you grant us a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, process, display, transmit, and distribute your content solely as necessary to:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Operate and improve the Service;</li>
                <li>Analyze and classify issues using AI;</li>
                <li>Generate and route reports to authorities or other designated recipients; and</li>
                <li>Comply with legal obligations.</li>
            </ul>
            <p>This license continues for as long as your content is stored in the Service and for a reasonable period afterward as needed for backup, legal compliance, and operational purposes.</p>

            <p className="font-semibold mt-2">9.3 Feedback</p>
            <p>If you provide us with feedback, ideas, or suggestions about the Service, you grant us a perpetual, irrevocable, worldwide, royalty-free license to use and incorporate such feedback into the Service without compensation or attribution.</p>

            <h3 className="text-lg font-semibold text-white mt-4">10. Disclaimer of warranties</h3>
            <p className="uppercase font-bold">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY.</p>
            <p className="uppercase font-bold">TO THE FULLEST EXTENT PERMITTED BY LAW, MOMNTUM AI DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Merchantability, fitness for a particular purpose, and non-infringement;</li>
                <li>That the Service will be uninterrupted, error-free, secure, or free from viruses or harmful components;</li>
                <li>That AI classifications, reports, or routing decisions will be accurate, complete, or reliable;</li>
                <li>That authorities or third parties will respond to, review, or resolve any issue you report; and</li>
                <li>That any content, data, or information provided through the Service is accurate or up to date.</li>
            </ul>
            <p>You use the Service at your own risk. We do not warrant or guarantee any specific outcome or result from using the Service.</p>

            <h3 className="text-lg font-semibold text-white mt-4">11. Limitation of liability</h3>
            <p className="uppercase font-bold">TO THE FULLEST EXTENT PERMITTED BY LAW:</p>
            <p className="font-semibold mt-2">11.1 Exclusion of damages</p>
            <p className="uppercase font-bold">MOMNTUM AI, ITS OFFICERS, DIRECTORS, EMPLOYEES, AFFILIATES, AGENTS, CONTRACTORS, AND LICENSORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, including but not limited to:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Loss of profits, revenue, data, goodwill, or business opportunities;</li>
                <li>Property damage or personal injury;</li>
                <li>Delays or failures by authorities or third parties to respond to or resolve reported issues;</li>
                <li>Errors, inaccuracies, or omissions in AI-generated classifications or reports;</li>
                <li>Unauthorized access to or disclosure of your content or account;</li>
                <li>Service interruptions, bugs, or technical failures; or</li>
                <li>Any other damages arising out of or related to your use of the Service, even if we have been advised of the possibility of such damages.</li>
            </ul>

            <p className="font-semibold mt-2">11.2 Cap on liability</p>
            <p className="uppercase font-bold">IN NO EVENT WILL MOMNTUM AI'S AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE EXCEED THE GREATER OF:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>US $100; or</li>
                <li>The amount you paid us (if any) in the twelve (12) months preceding the claim.</li>
            </ul>

            <p className="font-semibold mt-2">11.3 Basis of the bargain</p>
            <p>The disclaimers and limitations in these Terms reflect a reasonable allocation of risk and are fundamental elements of the agreement between you and Momntum AI. The Service would not be provided without these limitations.</p>

            <p className="font-semibold mt-2">11.4 Applicable law</p>
            <p>Some jurisdictions do not allow the exclusion or limitation of certain warranties or damages. In such cases, the above limitations may not apply to you, and our liability will be limited to the fullest extent permitted by applicable law.</p>

            <h3 className="text-lg font-semibold text-white mt-4">12. Indemnification</h3>
            <p>You agree to indemnify, defend, and hold harmless Momntum AI, its officers, directors, employees, affiliates, agents, contractors, and licensors from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or related to:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Your use or misuse of the Service;</li>
                <li>Your violation of these Terms;</li>
                <li>Your violation of any law, regulation, or third-party right;</li>
                <li>Any content you submit to the Service;</li>
                <li>Any dispute between you and a third party (including authorities, recipients of reports, or other users); or</li>
                <li>Any claim that your content or conduct caused harm to another party.</li>
            </ul>
            <p>We reserve the right to assume exclusive defense and control of any matter subject to indemnification, and you agree to cooperate with our defense of such claims.</p>

            <h3 className="text-lg font-semibold text-white mt-4">13. Termination</h3>
            <p className="font-semibold">13.1 Your right to terminate</p>
            <p>You may terminate your account and stop using the Service at any time by contacting us at support@momntumai.com or using the account deletion feature in the app (where available).</p>

            <p className="font-semibold mt-2">13.2 Our right to terminate</p>
            <p>We may suspend, restrict, or terminate your account or access to the Service at any time, with or without notice, for any reason, including if:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>You violate these Terms or our Acceptable Use Policy;</li>
                <li>We suspect fraud, abuse, or illegal activity;</li>
                <li>We are required to do so by law or court order; or</li>
                <li>We decide to discontinue the Service or certain features.</li>
            </ul>

            <p className="font-semibold mt-2">13.3 Effect of termination</p>
            <p>Upon termination:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Your right to use the Service immediately ceases;</li>
                <li>We may delete your account and content in accordance with our data retention policies and Privacy Policy; and</li>
                <li>Sections of these Terms that by their nature should survive (including disclaimers, limitations of liability, indemnification, and dispute resolution) will continue to apply.</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-4">14. Dispute resolution and arbitration</h3>
            <p className="font-semibold">14.1 Informal resolution</p>
            <p>Before filing any claim, you agree to contact us at support@momntumai.com and attempt to resolve the dispute informally for at least 30 days.</p>

            <p className="font-semibold mt-2">14.2 Binding arbitration</p>
            <p className="uppercase font-bold">IF THE INFORMAL PROCESS DOES NOT RESOLVE THE DISPUTE, YOU AND MOMNTUM AI AGREE THAT ANY CLAIM, DISPUTE, OR CONTROVERSY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE WILL BE RESOLVED BY BINDING ARBITRATION administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules, except as modified by these Terms.</p>
            <p>Arbitration will be conducted:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>By a single arbitrator;</li>
                <li>In Nashville, Tennessee, or remotely by video/phone conference if both parties agree;</li>
                <li>In accordance with the laws of the State of Tennessee (without regard to conflict-of-law principles); and</li>
                <li>With each party bearing its own costs and attorneys' fees, unless the arbitrator awards fees as permitted by law.</li>
            </ul>
            <p>The arbitrator's award will be final and binding and may be entered as a judgment in any court of competent jurisdiction.</p>

            <p className="font-semibold mt-2">14.3 Class action waiver</p>
            <p className="uppercase font-bold">YOU AND MOMNTUM AI AGREE THAT ANY ARBITRATION OR COURT PROCEEDING WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT AS A CLASS ACTION, CONSOLIDATED ACTION, OR REPRESENTATIVE ACTION. You waive any right to participate in a class action lawsuit or class-wide arbitration against Momntum AI.</p>

            <p className="font-semibold mt-2">14.4 Exceptions</p>
            <p>Either party may bring a claim in small claims court if it qualifies. Either party may also seek injunctive or equitable relief in court to protect intellectual property rights or prevent unauthorized use of the Service.</p>

            <p className="font-semibold mt-2">14.5 Opt-out</p>
            <p>You may opt out of binding arbitration by sending a written notice to legal@momntumai.com within 30 days of first accepting these Terms. Your notice must include your name, email, and a clear statement that you wish to opt out of arbitration. If you opt out, disputes will be resolved in court under Section 14.6 below.</p>

            <p className="font-semibold mt-2">14.6 Governing law and venue (if arbitration does not apply)</p>
            <p>If arbitration does not apply or you have opted out, these Terms and any disputes will be governed by the laws of the State of Tennessee, without regard to conflict-of-law principles. You agree to submit to the exclusive jurisdiction of the state and federal courts located in Davidson County, Tennessee, and waive any objection to venue or inconvenient forum.</p>

            <h3 className="text-lg font-semibold text-white mt-4">15. General provisions</h3>
            <p className="font-semibold">15.1 Entire agreement</p>
            <p>These Terms, together with our Privacy Policy and any other terms referenced herein, constitute the entire agreement between you and Momntum AI regarding the Service and supersede all prior agreements and understandings.</p>

            <p className="font-semibold mt-2">15.2 Modifications</p>
            <p>We may modify these Terms at any time. If we make material changes, we will:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Update the "Effective" date at the top of these Terms; and</li>
                <li>Provide notice via email, in-app notification, or a prominent notice on our website or app, where feasible.</li>
            </ul>
            <p>Material changes will take effect 30 days after notice is provided. Continued use of the Service after the effective date constitutes acceptance of the updated Terms. If you do not agree, you must stop using the Service.</p>

            <p className="font-semibold mt-2">15.3 Severability</p>
            <p>If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions will remain in full force and effect, and the invalid provision will be modified to the minimum extent necessary to make it valid and enforceable.</p>

            <p className="font-semibold mt-2">15.4 Waiver</p>
            <p>Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision. Any waiver must be in writing and signed by an authorized representative of Momntum AI.</p>

            <p className="font-semibold mt-2">15.5 Assignment</p>
            <p>You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms or any rights or obligations hereunder without restriction, including in connection with a merger, acquisition, or sale of assets.</p>

            <p className="font-semibold mt-2">15.6 Force majeure</p>
            <p>We are not liable for any delay or failure to perform our obligations under these Terms due to causes beyond our reasonable control, including acts of God, natural disasters, war, terrorism, labor disputes, government actions, or failures of third-party services or infrastructure.</p>

            <p className="font-semibold mt-2">15.7 No third-party beneficiaries</p>
            <p>These Terms are solely for the benefit of you and Momntum AI and do not create any third-party beneficiary rights.</p>

            <p className="font-semibold mt-2">15.8 Contact and notices</p>
            <p>All notices, requests, and other communications under these Terms must be in writing and sent to:</p>
            <p className="pl-5">
                Momntum AI LLC<br />
                1161 Murfreesboro Pike, Ste 110, PMB 134<br />
                Nashville, TN 37217, USA<br />
                Email: support@momntumai.com
            </p>
            <p>Notices to you may be sent to the email address associated with your account and will be deemed received within 24 hours of transmission.</p>

            <h3 className="text-lg font-semibold text-white mt-4">16. Contact us</h3>
            <p>If you have questions about these Terms or the Service, please contact us at:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Email: support@momntumai.com</li>
                <li>
                    Postal mail:<br />
                    Momntum AI LLC<br />
                    1161 Murfreesboro Pike, Ste 110, PMB 134<br />
                    Nashville, TN 37217, USA
                </li>
            </ul>

            <p className="font-bold text-yellow-400 mt-6 pt-4 border-t border-gray-800">
                By using EAiSER.Ai, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
        </div>
    );

    if (!isModal) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                {content}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#111] border border-yellow-500/30 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.15)] flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-800/60 bg-gradient-to-r from-gray-900 to-black flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-yellow-500 text-black p-3 rounded-2xl shadow-lg shadow-yellow-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white leading-tight">Terms of Service</h2>
                            <p className="text-xs text-gray-500 font-medium">Agreement for EAiSER.Ai</p>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 overflow-y-auto relative flex-grow custom-scrollbar">
                    <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#111] to-transparent z-10 pointer-events-none"></div>
                    {content}
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#111] to-transparent z-10 pointer-events-none"></div>
                </div>

                <div className="p-8 border-t border-gray-800/60 bg-black/40 backdrop-blur-xl flex flex-col sm:flex-row gap-4 justify-end items-center">
                    <div className="mr-auto hidden sm:block">
                        <p className="text-xs text-gray-500 font-semibold max-w-[200px]">Review carefully. Agreement is required for account creation.</p>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                        {onDecline && (
                            <button
                                onClick={onDecline}
                                className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white transition-all text-sm font-bold active:scale-95"
                            >
                                Decline
                            </button>
                        )}
                        <button
                            onClick={onAccept}
                            className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-extrabold hover:-translate-y-0.5 active:scale-95 transition-all shadow-xl shadow-yellow-500/20 text-sm whitespace-nowrap"
                        >
                            I Accept the Terms
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(234, 179, 8, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(234, 179, 8, 0.4);
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in-95 {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-in {
          animation-duration: 300ms;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          animation-fill-mode: forwards;
        }
        .fade-in {
          animation-name: fade-in;
        }
        .zoom-in-95 {
          animation-name: zoom-in-95;
        }
      `}</style>
        </div>
    );
}
