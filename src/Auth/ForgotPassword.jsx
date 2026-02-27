import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            // Backend URL config - assuming same as login
            const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8005';
            const response = await axios.post(`${backendUrl}/api/auth/forgot-password`, { email });
            setMessage(response.data.message);
        } catch (err) {
            // Generic message even on error to follow security best practices
            setMessage('If an account exists with this email, you will receive a password reset link shortly.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative flex items-center justify-center p-4">
            {/* Logo in top left corner */}
            <Link to="/" className="absolute top-6 left-6 z-50 transition-transform hover:scale-105">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-xl px-4 py-2">
                    <img src="/lat.png" alt="Logo" className="h-8 w-auto" />
                </div>
            </Link>

            {/* Background Effect */}
            <div
                className="pointer-events-none fixed inset-0 z-0"
                style={{ background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(234, 179, 8, 0.05), transparent 80%)` }}
            />

            <div className="relative z-10 w-full max-w-md">
                <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-yellow-500/20 p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl mb-4 shadow-lg shadow-yellow-500/20">
                            <Sparkles className="w-7 h-7 text-black" />
                        </div>
                        <h1 className="text-3xl font-black mb-2">Reset <span className="text-yellow-400">Password</span></h1>
                        <p className="text-gray-400 text-sm px-4">Enter your email and we'll send you a secure link to reset your password.</p>
                    </div>

                    {!message ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="group">
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        className="w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-700 focus:border-yellow-500 rounded-xl text-white text-sm outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl font-bold text-black flex items-center justify-center gap-2 hover:shadow-yellow-500/20 hover:shadow-xl transition-all disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                                {!loading && <ArrowRight className="w-5 h-5" />}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6 py-4">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                <p className="text-green-400 text-sm font-medium leading-relaxed">{message}</p>
                            </div>
                            <p className="text-gray-500 text-xs">Remember to check your spam folder if you don't see it within a few minutes.</p>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-400 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
