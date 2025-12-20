import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Lock, Mail, AlertCircle, Loader2, Shield, Clock } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [is2FARequired, setIs2FARequired] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLockoutInfo(null);
    setRateLimited(false);
    setLoading(true);

    try {
      // Pass OTP if 2FA is required
      const res = await apiClient.adminLogin(formData.email, formData.password, is2FARequired ? otp : undefined);

      // Handle 2FA Challenge
      if (res.require_2fa) {
        setIs2FARequired(true);
        setLoading(false);
        return;
      }

      // Store token and user details
      localStorage.setItem('adminToken', res.token);
      if (res.admin) {
        localStorage.setItem('adminData', JSON.stringify(res.admin));
      }

      // Check if password change required
      if (res.admin?.require_password_change) {
        navigate('/admin/change-password');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);

      // Handle specific error codes
      if (err.message?.includes('429')) {
        setRateLimited(true);
        setError('Too many login attempts. Please wait 1 minute and try again.');
      } else if (err.message?.includes('403') && err.message?.includes('locked')) {
        // Extract lockout time if available
        const match = err.message.match(/(\d+) minutes/);
        if (match) {
          setLockoutInfo({ minutes: parseInt(match[1]) });
        }
        setError(err.message || 'Account locked due to multiple failed attempts.');
      } else if (err.message?.includes('401')) {
        setError(is2FARequired ? 'Invalid 2FA code.' : 'Incorrect email or password. Please try again.');
        // Don't reset 2FA state on code error, user needs to retry code
      } else if (err.message?.includes('Inactive')) {
        setError('Your account has been deactivated. Please contact an administrator.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
        // Reset 2FA state if likely session error or unknown
        if (is2FARequired && !err.message?.includes('code')) setIs2FARequired(false);
      }
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
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-blue-500">
            Admin Login
          </h1>
          <p className="text-gray-500 mt-2">Secure access to EAiSER Admin Dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#0a1628] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!is2FARequired ? (
              <>
                {/* Email Input */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="admin@eaiser.ai"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            ) : (
              /* 2FA Input */
              <div className="animate-in fade-in slide-in-from-right">
                <div className="text-center mb-6">
                  <div className="bg-blue-500/10 w-fit mx-auto p-3 rounded-full mb-3">
                    <Lock className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-400">Enter the code from your authenticator app</p>
                </div>

                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors tracking-widest text-lg"
                    placeholder="000000"
                    required
                    autoFocus
                    disabled={loading}
                    maxLength={6}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIs2FARequired(false)}
                  className="text-sm text-gray-400 mt-4 hover:text-white transition-colors w-full text-center"
                >
                  ← Back to login
                </button>
              </div>
            )}

            {error && (
              <div className={`p-4 rounded-lg border flex items-start gap-3 ${lockoutInfo
                  ? 'bg-red-500/10 border-red-500/50 text-red-200'
                  : rateLimited
                    ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-200'
                    : 'bg-red-500/10 border-red-500/50 text-red-200'
                }`}>
                {lockoutInfo ? (
                  <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{error}</p>
                  {lockoutInfo && (
                    <p className="text-sm mt-2 opacity-80">
                      Your account will be unlocked in approximately {lockoutInfo.minutes} minutes.
                    </p>
                  )}
                  {rateLimited && (
                    <p className="text-sm mt-2 opacity-80">
                      For security reasons, we limit the number of login attempts per minute.
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {is2FARequired ? 'Verifying...' : 'Authenticating...'}
                </>
              ) : (
                is2FARequired ? 'Verify & Login' : 'Sign In Securely'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-8 text-sm">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
