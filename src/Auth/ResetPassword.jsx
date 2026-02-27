import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [showPassword, setShowPassword] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token. Please request a new link.");
        }
    }, [token]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) return;

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8005';
            await axios.post(`${backendUrl}/api/auth/reset-password`, {
                token,
                new_password: formData.password
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password. Link may be expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative flex items-center justify-center p-4">
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
                        <h1 className="text-3xl font-black mb-2">New <span className="text-yellow-400">Password</span></h1>
                        <p className="text-gray-400 text-sm">Securely update your account credentials.</p>
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Password */}
                            <div className="group">
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-10 py-3 bg-white/5 border border-gray-700 focus:border-yellow-500 rounded-xl text-white text-sm outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-400"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="group">
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-700 focus:border-yellow-500 rounded-xl text-white text-sm outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-xs text-center font-medium">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading || !token}
                                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl font-bold text-black hover:shadow-yellow-500/20 hover:shadow-xl transition-all disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-8">
                            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Password Reset!</h2>
                            <p className="text-gray-400 text-sm">Your password has been successfully updated. Redirecting to login...</p>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <Link to="/login" className="text-sm text-gray-500 hover:text-yellow-400 transition-colors">
                            Cancel and Return to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
