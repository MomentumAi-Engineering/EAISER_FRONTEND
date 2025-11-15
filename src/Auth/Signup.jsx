import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Calendar, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from "react-router-dom";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dob: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative flex items-center justify-center p-4">
      {/* Dynamic Mouse-Following Gradient */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(234, 179, 8, 0.05), transparent 80%)`
        }}
      />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(234, 179, 8, 0.3)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-2000" />

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glowing Border Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-3xl blur opacity-10"></div>
        
        {/* Main Card */}
        <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-yellow-500/20 p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl mb-3 shadow-md shadow-yellow-500/20">
              <Sparkles className="w-7 h-7 text-black" />
            </div>
            
            <h1 className="text-3xl font-black mb-1">
              Join <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Eaiser AI</span>
            </h1>
            <p className="text-gray-400 text-sm">Create your account and get started</p>
          </div>

          {/* Social Auth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button className="group flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-gray-700 hover:border-yellow-500/50 rounded-xl transition-all hover:-translate-y-0.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-semibold text-white">Google</span>
            </button>

            <button className="group flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-gray-700 hover:border-yellow-500/50 rounded-xl transition-all hover:-translate-y-0.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00A4EF">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
              </svg>
              <span className="text-sm font-semibold text-white">Microsoft</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-3 text-gray-500 text-xs">or continue with email</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            {/* Full Name */}
            <div className="group">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-gray-700 focus:border-yellow-500 rounded-xl text-white text-sm placeholder-gray-500 outline-none transition-all focus:bg-white/10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="group">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-gray-700 focus:border-yellow-500 rounded-xl text-white text-sm placeholder-gray-500 outline-none transition-all focus:bg-white/10"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="group">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-gray-700 focus:border-yellow-500 rounded-xl text-white text-sm outline-none transition-all focus:bg-white/10 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-gray-700 focus:border-yellow-500 rounded-xl text-white text-sm placeholder-gray-500 outline-none transition-all focus:bg-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-yellow-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="group">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-gray-700 focus:border-yellow-500 rounded-xl text-white text-sm placeholder-gray-500 outline-none transition-all focus:bg-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-yellow-400 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="group relative w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl font-bold text-base text-black overflow-hidden transition-all hover:shadow-md hover:shadow-yellow-500/20 hover:-translate-y-0.5 mt-4"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Create Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}