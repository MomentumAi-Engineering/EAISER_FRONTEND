import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Shield, Lock, Smartphone, ArrowLeft, Check, Copy, Loader2, AlertTriangle } from 'lucide-react';

export default function SecuritySettings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [adminData, setAdminData] = useState(null);

    // 2FA State
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [setupStep, setSetupStep] = useState(0); // 0: idle, 1: showing QR, 2: verifying
    const [secretData, setSecretData] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = JSON.parse(localStorage.getItem('adminData') || '{}');
            setAdminData(data);
            // Ideally backend returns current 2FA status. 
            // For now we assume localStorage has it or check an endpoint?
            // Since 'adminData' from login has 'two_factor_enabled' if we updated backend response...
            // Let's assume we need to refresh profile or just rely on what we have.
            // Better: check a /me endpoint or just use what's in localstorage if updated.
            // I'll update localStorage on successful changes.
            setIs2FAEnabled(!!data.two_factor_enabled);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const start2FASetup = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.setup2FA(adminData.email);
            setSecretData(res);
            setSetupStep(1);
        } catch (err) {
            setError(err.message || 'Failed to start 2FA setup');
        } finally {
            setLoading(false);
        }
    };

    const verifyAndEnable2FA = async () => {
        setLoading(true);
        setError('');
        try {
            await apiClient.verify2FA(verificationCode, secretData.secret, adminData.email);
            setIs2FAEnabled(true);
            setSuccess('2FA has been successfully enabled!');
            setSetupStep(0);
            setSecretData(null);

            // Update local storage
            const newData = { ...adminData, two_factor_enabled: true };
            localStorage.setItem('adminData', JSON.stringify(newData));
            setAdminData(newData);
        } catch (err) {
            setError(err.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const disable2FA = async () => {
        if (!confirm('Are you sure you want to disable 2FA? This will lower your account security.')) return;

        setLoading(true);
        try {
            await apiClient.disable2FA();
            setIs2FAEnabled(false);
            setSuccess('2FA has been disabled.');

            // Update local storage
            const newData = { ...adminData, two_factor_enabled: false };
            localStorage.setItem('adminData', JSON.stringify(newData));
            setAdminData(newData);
        } catch (err) {
            setError(err.message || 'Failed to disable 2FA');
        } finally {
            setLoading(false);
        }
    };

    const copySecret = () => {
        navigator.clipboard.writeText(secretData.secret);
        alert('Secret copied to clipboard!');
    };

    if (loading && !adminData) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-blue-500">Security Settings</h1>
                        <p className="text-gray-400">Manage your account security and 2FA</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Password Section */}
                    <div className="bg-[#0a1628] border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Lock className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Password</h2>
                                <p className="text-gray-400 text-sm">Update your password regularly</p>
                            </div>
                            <button
                                onClick={() => navigate('/admin/change-password')}
                                className="ml-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>

                    {/* 2FA Section */}
                    <div className="bg-[#0a1628] border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                                <Smartphone className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Two-Factor Authentication (2FA)</h2>
                                <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                            </div>
                            <div className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${is2FAEnabled ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                {is2FAEnabled ? 'ENABLED' : 'DISABLED'}
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-200 flex items-center gap-2">
                                <Check className="w-5 h-5" />
                                {success}
                            </div>
                        )}

                        {!is2FAEnabled && setupStep === 0 && (
                            <div className="bg-black/40 rounded-lg p-6 border border-gray-800">
                                <p className="text-gray-300 mb-4">
                                    Secure your account by requiring a code from your authenticator app (like Google Authenticator) in addition to your password.
                                </p>
                                <button
                                    onClick={start2FASetup}
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Enable 2FA
                                </button>
                            </div>
                        )}

                        {setupStep === 1 && secretData && (
                            <div className="bg-black/40 rounded-lg p-6 border border-gray-800 animate-in fade-in slide-in-from-top-4">
                                <h3 className="text-lg font-semibold mb-4">Setup Authenticator</h3>

                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1 space-y-4">
                                        <p className="text-gray-300">
                                            1. Scan this QR code with your authenticator app:
                                        </p>
                                        <div className="bg-white p-2 w-fit rounded-lg">
                                            {/* Using external API for QR code to avoid dependencies */}
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(secretData.uri)}`}
                                                alt="2FA QR Code"
                                                className="w-48 h-48"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <p className="text-gray-300">
                                            2. Or enter this code manually:
                                        </p>
                                        <div className="flex items-center gap-2 bg-gray-900 p-3 rounded-lg border border-gray-700 font-mono text-lg tracking-wider">
                                            {secretData.secret}
                                            <button onClick={copySecret} className="ml-auto p-2 hover:text-blue-400">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <p className="text-gray-300">
                                            3. Enter the 6-digit code from the app:
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="000000"
                                                className="w-32 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-center tracking-widest text-xl focus:border-blue-500 focus:outline-none"
                                            />
                                            <button
                                                onClick={verifyAndEnable2FA}
                                                disabled={verificationCode.length !== 6 || loading}
                                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Verifying...' : 'Verify & Enable'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {is2FAEnabled && (
                            <div className="bg-black/40 rounded-lg p-6 border border-gray-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-green-500 font-semibold flex items-center gap-2">
                                        <Check className="w-5 h-5" /> 2FA is Active
                                    </h3>
                                    <p className="text-gray-400 text-sm mt-1">Your account is secured with two-factor authentication.</p>
                                </div>
                                <button
                                    onClick={disable2FA}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/30 transition-colors"
                                >
                                    Disable 2FA
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
