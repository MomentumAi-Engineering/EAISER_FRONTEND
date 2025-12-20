import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Lock, Shield, Check, X, AlertCircle } from 'lucide-react';

export default function ChangePassword() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const validatePassword = (password) => {
        const checks = [
            { test: password.length >= 12, label: 'At least 12 characters' },
            { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
            { test: /[a-z]/.test(password), label: 'One lowercase letter' },
            { test: /[0-9]/.test(password), label: 'One number' },
            { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), label: 'One special character' }
        ];
        return checks;
    };

    const passwordChecks = validatePassword(formData.newPassword);
    const isPasswordValid = passwordChecks.every(check => check.test);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords don't match");
            return;
        }

        if (!isPasswordValid) {
            setError("Password doesn't meet usage requirements");
            return;
        }

        setLoading(true);

        try {
            await apiClient.changePassword(formData.currentPassword, formData.newPassword);
            setSuccess('Password changed successfully! Redirecting...');
            setTimeout(() => navigate('/admin/dashboard'), 2000);
        } catch (err) {
            setError(err.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-blue-500">
                        Change Password
                    </h1>
                    <p className="text-gray-500 mt-2">Update your security credentials</p>
                </div>

                {/* Form */}
                <div className="bg-[#0a1628] border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={formData.currentPassword}
                                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                className={`w-full px-4 py-3 bg-black border rounded-lg text-white focus:outline-none transition-colors ${formData.newPassword && !isPasswordValid ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-blue-500'
                                    }`}
                                required
                            />
                            {/* Password Strength Indicators */}
                            <div className="mt-3 grid grid-cols-1 gap-2">
                                {passwordChecks.map((check, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs">
                                        {check.test ? (
                                            <Check className="w-3 h-3 text-green-500" />
                                        ) : (
                                            <div className="w-3 h-3 rounded-full border border-gray-600" />
                                        )}
                                        <span className={check.test ? 'text-green-500' : 'text-gray-500'}>
                                            {check.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/10 border border-green-500/50 text-green-200 p-3 rounded-lg text-sm flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                {success}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/dashboard')}
                                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-semibold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !isPasswordValid}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Updating...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
