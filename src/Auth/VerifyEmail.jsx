import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { verifyEmail } from '../api/auth';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const performVerification = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link. No token found.');
                return;
            }

            try {
                const res = await verifyEmail(token);
                setStatus('success');
                setMessage(res.message || 'Email verified successfully!');
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.detail || err.message || 'Verification failed. The link may be expired.');
            }
        };

        performVerification();
    }, [token]);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(234, 179, 8, 0.3)" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Logo in top left corner */}
            <Link to="/" className="absolute top-6 left-6 z-50 group transition-transform hover:scale-105 duration-300">
                <div className="flex items-center gap-2 transition-all">
                    <img src="/newlogo.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl bg-yellow-400 p-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-3xl font-extrabold tracking-wider text-yellow-400 drop-shadow-md">
                        EAiSER
                    </span>
                </div>
            </Link>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-yellow-500/20 p-8 text-center shadow-2xl">
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-3 shadow-lg shadow-yellow-500/10 rounded-2xl overflow-hidden p-2 bg-yellow-400 border border-yellow-500/20">
                        <img src="/newlogo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>

                    {status === 'loading' && (
                        <div className="py-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/10 rounded-full mb-6 relative">
                                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Verifying Account</h1>
                            <p className="text-gray-400">Please wait while we secure your identity...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-4">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-6 border border-green-500/20">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h1 className="text-3xl font-black mb-4">
                                Verified <Sparkles className="inline w-6 h-6 text-yellow-500" />
                            </h1>
                            <p className="text-gray-300 mb-8 leading-relaxed">
                                {message} <br /> Your account is now active and ready for duty.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl font-bold text-black flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-yellow-500/20 transition-all hover:-translate-y-0.5"
                            >
                                Proceed to Log in <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-4">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-6 border border-red-500/20">
                                <AlertCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h1 className="text-3xl font-black mb-4 text-red-500">Verification Failed</h1>
                            <p className="text-gray-400 mb-8">
                                {message}
                            </p>
                            <div className="flex flex-col gap-3">
                                <Link
                                    to="/signup"
                                    className="w-full py-3 bg-white/5 border border-gray-700 rounded-xl font-bold text-white hover:bg-white/10 transition-all"
                                >
                                    Back to Signup
                                </Link>
                                <Link
                                    to="/login"
                                    className="text-yellow-400 font-semibold text-sm hover:underline"
                                >
                                    Already verified? Log in here
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
