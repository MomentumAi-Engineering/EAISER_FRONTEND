import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoDEmo from '../assets/VideoDEmo.mp4';
import { Zap, MapPin, FileText, CheckCircle, Clock, Users, ArrowRight, Sparkles, Brain, Target, Rocket, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EaiserAIHero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();

    const handleMouseMove = (e) => {
      // Performance: Skip state updates on mobile/tablet
      if (window.innerWidth < 1024) return;
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      // Periodic check or just use scrollY for simple effects
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkMobile);

    // close video on Escape
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowVideo(false);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative pt-20">
      {/* Dynamic Mouse-Following Gradient */}
      {!isMobile && (
        <div
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 will-change-[background]"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(234, 179, 8, 0.15), transparent 80%)`
          }}
        />
      )}

      {/* Animated Mesh Background - Static on mobile for performance */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(234, 179, 8, 0.3)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating Orbs - Fewer on mobile */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob pointer-events-none" />
      <div className="absolute top-40 right-20 w-72 h-72 bg-amber-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none" />
      {!isMobile && (
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000 pointer-events-none" />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20" ref={heroRef}>
        {/* Hero Section - Asymmetric Layout */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          {/* Left Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-5 py-2 bg-yellow-500/10 backdrop-blur-sm rounded-full border border-yellow-500/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-yellow-400 tracking-wide">NEXT-GEN AI TECHNOLOGY</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none">
              <span className="block text-white mb-2">Eaiser AI</span>
              <span className="block bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                is here...
              </span>
            </h1>

            <motion.p
              className="text-xl text-gray-300 leading-relaxed max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Transform your community with <span className="text-yellow-400 font-semibold">intelligent issue reporting</span>.
              Our AI analyzes and categorizes problems in <span className="text-yellow-400 font-semibold">real-time</span> for faster resolution.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button
                onClick={() => {
                  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
                  if (token) {
                    navigate('/report');
                  } else {
                    navigate('/signup');
                  }
                }}
                className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl font-bold text-black overflow-hidden transition-all hover:shadow-2xl hover:shadow-yellow-500/50 hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Report an Issue
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <button
                onClick={() => setShowVideo(true)}
                className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-yellow-500/30 rounded-2xl font-bold text-white hover:bg-white/10 transition-all hover:-translate-y-1"
              >
                Watch Demo
              </button>
            </motion.div>

            {/* Live Stats */}
            <motion.div
              className="flex flex-wrap gap-6 md:gap-8 pt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div>
                <div className="text-2xl md:text-3xl font-black text-yellow-400">12+</div>
                <div className="text-xs md:text-sm text-gray-400">Issues Resolved</div>
              </div>
              <div className="hidden sm:block w-px bg-gray-800" />
              <div>
                <div className="text-2xl md:text-3xl font-black text-yellow-400">18h</div>
                <div className="text-xs md:text-sm text-gray-400">Avg Resolution</div>
              </div>
              <div className="hidden sm:block w-px bg-gray-800" />
              <div>
                <div className="text-2xl md:text-3xl font-black text-yellow-400">95%</div>
                <div className="text-xs md:text-sm text-gray-400">Satisfaction</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual Element - Hidden on Mobile */}
          {!isMobile && (
            <div className="relative h-[600px] hidden lg:block">
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                {/* 3D Card Elements */}
                <div className="relative w-80 h-96 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-xl rounded-3xl border-2 border-yellow-500 shadow-2xl p-8 flex flex-col justify-between">
                  {/* Simplest version for performance */}
                  <Brain className="w-16 h-16 text-yellow-400" />
                  <div>
                    <div className="text-5xl font-black mb-2">Real-Time</div>
                    <div className="text-xl text-gray-300">Detection</div>
                  </div>
                  <Sparkles className="w-8 h-8 text-yellow-500" />
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Features Section - Bento Grid Style */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-5xl lg:text-6xl font-black mb-4">
              Why <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Eaiser AI</span> Stands Apart
            </h2>
            <p className="text-xl text-gray-400">Advanced AI technology streamlining issue resolution</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <div className="lg:col-span-2 group relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-3xl border border-gray-800 hover:border-yellow-500/50 p-10 overflow-hidden transition-all hover:-translate-y-2">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-3xl font-black mb-4 text-white">Smart AI Analysis</h3>
                <p className="text-lg text-gray-400 leading-relaxed">Our EAiSER Ai instantly classify issues as public or business-related.</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-3xl border border-gray-800 hover:border-yellow-500/50 p-10 overflow-hidden transition-all hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-3xl font-black mb-4 text-white">Precision Location</h3>
              <p className="text-lg text-gray-400">GPS and visual data pinpoint exact locations.</p>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="relative bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-xl rounded-3xl border border-yellow-500/30 p-16 text-center overflow-hidden">
          <div className="relative z-10">
            <Rocket className="w-12 h-12 md:w-16 md:h-16 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-black mb-4 px-4">Ready to Transform Your Community?</h2>
            <button
              onClick={() => navigate('/report')}
              className="px-8 md:px-12 py-4 md:py-5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl font-bold text-lg md:text-xl text-black"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </div>

      {/* Video overlay */}
      {showVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowVideo(false); videoRef.current?.pause(); } }}
        >
          <div className="relative w-full md:w-[70vw] lg:w-[50vw] h-auto aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            <button
              className="absolute top-3 right-3 z-20 p-2 rounded bg-white/10 text-white"
              onClick={() => { setShowVideo(false); videoRef.current?.pause(); }}
            >
              <X className="w-4 h-4" />
            </button>
            <video ref={videoRef} src={VideoDEmo} controls autoPlay className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite; will-change: transform; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}