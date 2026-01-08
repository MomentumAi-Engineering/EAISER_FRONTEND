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
  const videoRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

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
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative pt-20">
      {/* Dynamic Mouse-Following Gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(234, 179, 8, 0.15), transparent 80%)`
        }}
      />

      {/* Animated Mesh Background */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(234, 179, 8, 0.3)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-20 w-72 h-72 bg-amber-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

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

            <h1 className="text-7xl lg:text-8xl font-black leading-none">
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
              className="flex gap-8 pt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div>
                <div className="text-3xl font-black text-yellow-400">12+</div>
                <div className="text-sm text-gray-400">Issues Resolved</div>
              </div>
              <div className="w-px bg-gray-800" />
              <div>
                <div className="text-3xl font-black text-yellow-400">18h</div>
                <div className="text-sm text-gray-400">Avg Resolution</div>
              </div>
              <div className="w-px bg-gray-800" />
              <div>
                <div className="text-3xl font-black text-yellow-400">95%</div>
                <div className="text-sm text-gray-400">Satisfaction</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual Element - 3D Card Stack */}
          <div className="relative h-[600px] hidden lg:block">
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: `translateY(${scrollY * 0.1}px)` }}
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {/* Card 1 - Background */}
              <motion.div
                className="absolute top-0 right-0 w-80 h-96 bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-yellow-500/20 transform rotate-6 shadow-2xl"
                animate={{ rotate: [6, 8, 6] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Card 2 - Middle */}
              <motion.div
                className="absolute top-10 right-10 w-80 h-96 bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-yellow-500/40 transform rotate-3 shadow-2xl"
                animate={{ rotate: [3, 1, 3] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="p-8 h-full flex flex-col justify-between">
                  <Brain className="w-16 h-16 text-yellow-400" />
                  <div>
                    <h3 className="text-2xl font-bold mb-2">AI-Powered</h3>
                    <p className="text-gray-400">Smart classification with 95% accuracy</p>
                  </div>
                </div>
              </motion.div>

              {/* Card 3 - Front */}
              <motion.div
                className="relative w-80 h-96 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-xl rounded-3xl border-2 border-yellow-500 shadow-2xl shadow-yellow-500/30 p-8 flex flex-col justify-between"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">STATUS</div>
                    <div className="font-bold text-yellow-400">ACTIVE</div>
                  </div>
                </div>

                <div>
                  <div className="text-5xl font-black mb-2">Real-Time</div>
                  <div className="text-xl text-gray-300">Issue Detection</div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-400">Powered by Momntum Ai</div>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
              </motion.div>
            </motion.div>
          </div>
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
            {/* Feature 1 - Large */}
            <div className="lg:col-span-2 group relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-3xl border border-gray-800 hover:border-yellow-500/50 p-10 overflow-hidden transition-all hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform">
                  <Zap className="w-8 h-8 text-black" />
                </div>

                <h3 className="text-3xl font-black mb-4 text-white group-hover:text-yellow-400 transition-colors">
                  Smart AI Analysis
                </h3>

                <p className="text-lg text-gray-400 mb-6 leading-relaxed">
                  Our EAiSER Ai instantly classify issues as public or business-related with 95% accuracy.
                </p>

                <div className="inline-flex items-center gap-2 text-yellow-400 font-semibold group-hover:gap-4 transition-all">
                  Learn More <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Feature 2 - Small */}
            <div className="group relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-3xl border border-gray-800 hover:border-yellow-500/50 p-10 overflow-hidden transition-all hover:-translate-y-2">
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform">
                  <MapPin className="w-8 h-8 text-black" />
                </div>

                <h3 className="text-3xl font-black mb-4 text-white group-hover:text-yellow-400 transition-colors">
                  Precision Location
                </h3>

                <p className="text-lg text-gray-400 leading-relaxed">
                  GPS and visual data pinpoint exact locations for faster response times.
                </p>
              </div>
            </div>

            {/* Feature 3 - Small */}
            <div className="group relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-3xl border border-gray-800 hover:border-yellow-500/50 p-10 overflow-hidden transition-all hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-400 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform">
                  <FileText className="w-8 h-8 text-black" />
                </div>

                <h3 className="text-3xl font-black mb-4 text-white group-hover:text-yellow-400 transition-colors">
                  Automated Reporting
                </h3>

                <p className="text-lg text-gray-400 leading-relaxed">
                  Generate professional reports automatically sent to appropriate authorities.
                </p>
              </div>
            </div>

            {/* Feature 4 - Large CTA */}
            <div className="lg:col-span-2 group relative bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-xl rounded-3xl border-2 border-yellow-500/50 p-10 overflow-hidden hover:border-yellow-400 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-amber-500/0 group-hover:from-yellow-500/10 group-hover:to-amber-500/10 transition-all" />

              <div className="relative z-10">
                <div className="text-sm font-bold text-yellow-400 mb-2">SUCCESS STORIES</div>
                <h3 className="text-4xl font-black mb-4">Making a Measurable Difference</h3>
                <p className="text-xl text-gray-300">See how communities are transforming with AI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="relative bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-xl rounded-3xl border border-yellow-500/30 p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.1),transparent_50%)]" />

          <div className="relative z-10">
            <Rocket className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-5xl font-black mb-4">Ready to Transform Your Community?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the future of intelligent issue reporting and resolution
            </p>

            <button
              onClick={() => navigate('/report')}
              className="px-12 py-5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl font-bold text-xl text-black hover:shadow-2xl hover:shadow-yellow-500/50 transition-all hover:scale-105"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </div>

      {/* Video overlay (50vw x 50vh) */}
      {showVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowVideo(false); videoRef.current?.pause(); } }}
        >
          <div className="relative w-[50vw] h-[50vh] bg-black rounded-lg overflow-hidden shadow-2xl">
            <button
              aria-label="Close video"
              className="absolute top-3 right-3 z-20 p-2 rounded bg-white/10 hover:bg-white/20"
              onClick={() => {
                setShowVideo(false);
                if (videoRef.current) {
                  videoRef.current.pause();
                  videoRef.current.currentTime = 0;
                }
              }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <video
              ref={videoRef}
              src={VideoDEmo}
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <style>{`
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
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}