import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { adminPath } from '../utils/adminPaths';
import { Lock, Mail, AlertCircle, Loader2, Shield, Clock, ChevronRight, Fingerprint, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLockoutInfo(null);
    setRateLimited(false);
    setLoading(true);

    try {
      const res = await apiClient.adminLogin(formData.email, formData.password, is2FARequired ? otp : undefined);

      if (res.require_2fa) {
        setIs2FARequired(true);
        setLoading(false);
        return;
      }

      localStorage.setItem('adminToken', res.token);
      if (res.admin) {
        localStorage.setItem('adminData', JSON.stringify(res.admin));
      }

      if (res.admin?.require_password_change) {
        navigate(adminPath('/change-password'));
      } else {
        navigate(adminPath('/dashboard'));
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.message?.includes('429')) {
        setRateLimited(true);
        setError('Too many login attempts. Please wait 1 minute and try again.');
      } else if (err.message?.includes('403') && err.message?.includes('locked')) {
        const match = err.message.match(/(\d+) minutes/);
        if (match) {
          setLockoutInfo({ minutes: parseInt(match[1]) });
        }
        setError(err.message || 'Account locked due to multiple failed attempts.');
      } else if (err.message?.includes('401')) {
        setError(is2FARequired ? 'Invalid 2FA code.' : 'Incorrect email or password. Please try again.');
      } else if (err.message?.includes('Inactive')) {
        setError('Your account has been deactivated. Please contact an administrator.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
        if (is2FARequired && !err.message?.includes('code')) setIs2FARequired(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-black overflow-hidden selection:bg-blue-500/30">
      {/* Professional Technical Background */}
      <div className="absolute inset-0 z-0 opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pro-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pro-grid)" />
        </svg>
      </div>

      {/* Subtle Mouse Spotlight */}
      <div
        className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-500"
        style={{
          background: `radial-gradient(650px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.03), transparent 80%)`
        }}
      />

      <div className="flex-grow flex items-center justify-center p-6 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "circOut" }}
          className="max-w-md w-full"
        >
          {/* Top Logo Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-block"
            >
              <div className="bg-yellow-400 p-3 rounded-2xl shadow-2xl shadow-yellow-500/5 mb-6 border border-yellow-300/20">
                <img src="/newlogo.png" alt="EAiSER Logo" className="w-14 h-14 object-contain" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                EAiSER <span className="text-gray-500 font-light">Admin</span>
              </h1>
              <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-[0.4em] mb-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Security Terminal</span>
              </div>
            </motion.div>
          </div>

          {/* Secure Login Console */}
          <div className="relative">
            {/* Minimal High-End Card */}
            <div className="relative bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden">
              {/* Subtle technical gradient edge */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                <AnimatePresence mode="wait">
                  {!is2FARequired ? (
                    <motion.div
                      key="login-fields"
                      initial={{ opacity: 0, filter: "blur(8px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, filter: "blur(8px)" }}
                      className="space-y-6"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">
                          Access Identifier
                        </label>
                        <div className="relative group">
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-white/[0.02] border border-white/10 rounded-2xl text-white placeholder-gray-800 transition-all focus:outline-none focus:border-blue-600 focus:bg-white/[0.04]"
                            placeholder="admin@eaiser.ai"
                            required
                            disabled={loading}
                          />
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 transition-colors group-focus-within:text-blue-500" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">
                          Encryption Key
                        </label>
                        <div className="relative group">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-12 pr-12 py-4 bg-white/[0.02] border border-white/10 rounded-2xl text-white placeholder-gray-800 transition-all focus:outline-none focus:border-blue-600 focus:bg-white/[0.04]"
                            placeholder="••••••••"
                            required
                            disabled={loading}
                          />
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 transition-colors group-focus-within:text-blue-500" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="2fa-field"
                      initial={{ opacity: 0, filter: "blur(8px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, filter: "blur(8px)" }}
                      className="space-y-8 text-center"
                    >
                      <div>
                        <div className="inline-flex p-4 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-6">
                          <Fingerprint className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">MFA Authentication</h3>
                        <p className="text-sm text-gray-500 px-4">Enter the synchronization code from your secure device.</p>
                      </div>

                      <div className="relative group">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-700 transition-colors group-focus-within:text-blue-500" />
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full pl-14 pr-4 py-6 bg-white/[0.02] border border-white/10 rounded-2xl text-white focus:outline-none focus:border-blue-600 transition-all tracking-[0.5em] text-3xl font-mono text-center"
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
                        className="text-xs text-gray-600 hover:text-white transition-colors uppercase font-black tracking-widest"
                      >
                        ← Back to Identity Verification
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-5 rounded-2xl border flex items-start gap-4 ${lockoutInfo || rateLimited
                      ? 'bg-amber-950/10 border-amber-900/30 text-amber-200'
                      : 'bg-red-950/10 border-red-900/30 text-red-200'
                      }`}
                  >
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                    <div className="text-xs font-semibold leading-relaxed">
                      <p>{error}</p>
                    </div>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group h-16 rounded-2xl overflow-hidden shadow-2xl transition-all"
                >
                  <div className="absolute inset-0 bg-blue-600 transition-colors group-hover:bg-blue-700" />
                  <div className="relative h-full flex items-center justify-center gap-3 px-8 text-white">
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                    ) : (
                      <>
                        <span className="text-xs font-black uppercase tracking-[0.4em] ml-2">
                          {is2FARequired ? 'Confirm Authority' : 'Launch Session'}
                        </span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </div>
                </button>
              </form>
            </div>

            {/* Status Footer */}
            <div className="mt-12 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                <span className="text-[9px] font-black text-gray-800 uppercase tracking-widest">Auth-Node Online</span>
              </div>
              <span className="text-[9px] font-black text-gray-800 uppercase tracking-widest">v2.4.0 ENCRYPTED</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
