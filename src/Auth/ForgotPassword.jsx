import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
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
            const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8005';
            const response = await axios.post(`${backendUrl}/api/auth/forgot-password`, { email });
            setMessage(response.data.message);
        } catch (err) {
            setMessage('If an account exists with this email, you will receive a password reset link shortly.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative flex items-center justify-center p-4">
            {/* Logo in top left corner */}
            <Link to="/" className="absolute top-6 left-6 z-50 group transition-transform hover:scale-105 duration-300">
                <div className="flex items-center gap-2 transition-all">
                    <img src="/lat.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl bg-yellow-400 p-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-3xl font-extrabold tracking-wider text-yellow-400 drop-shadow-md">
                        EAiSER
                    </span>
                </div>
            </Link>

            <div className="relative z-10 w-full max-w-md">
                <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-yellow-500/20 p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 mb-3 shadow-lg shadow-yellow-500/10 rounded-2xl overflow-hidden p-2 bg-yellow-400 border border-yellow-500/20">
                            <img src="/lat.png" alt="Logo" className="w-full h-full object-contain" />
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
                            <ArrowLeft className="w-4 h-4" /> Back to Log in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
