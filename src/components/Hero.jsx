import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoDEmo from '../assets/VideoDEmo.mp4';
import { Zap, MapPin, FileText, CheckCircle, Clock, Users, ArrowRight, Sparkles, Brain, Target, Rocket, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EaiserAIHero() {
  const scrollRef = useRef(0);
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    
    const handleMouseMove = (e) => {
      // Direct DOM update instead of state to prevent 60fps React re-renders
      if (heroRef.current && !isMobile) {
        heroRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        heroRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      }
    };

    const handleScroll = () => {
      // Use ref for scroll to avoid re-render if not used in JSX
      scrollRef.current = window.scrollY;
      if (heroRef.current) {
        heroRef.current.style.setProperty('--scroll-y', `${window.scrollY}px`);
      }
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowVideo(false);
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
    <div 
      ref={heroRef}
      className="min-h-screen bg-black text-white overflow-hidden relative pt-20"
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
        '--scroll-y': '0px'
      }}
    >
      {/* Dynamic Mouse-Following Gradient - Uses CSS variables to avoid React re-renders */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 hidden md:block"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(234, 179, 8, 0.12), transparent 80%)`
        }}
      />

      {/* Static gradient for mobile (battery efficient) */}
      <div className="md:hidden absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(234,179,8,0.1),transparent_70%)] pointer-events-none" />

      {/* Animated Mesh Background */}
      <div className="absolute inset-0 opacity-20 md:opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(234, 179, 8, 0.2)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating Orbs - Simplified for Mobile */}
      <div className="absolute top-20 left-10 w-48 h-48 md:w-64 md:h-64 bg-yellow-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 md:opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-56 h-56 md:w-72 md:h-72 bg-amber-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 md:opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-20">
        {/* Hero Section - Asymmetric Layout */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center mb-16 sm:mb-20 md:mb-32">
          {/* Left Content */}
          <motion.div
            className="space-y-6 md:space-y-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2 bg-yellow-500/10 backdrop-blur-sm rounded-full border border-yellow-500/30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-[10px] md:text-sm font-bold text-yellow-400 tracking-wider">NEXT-GEN AI TECHNOLOGY</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] md:leading-none">
              <span className="block text-white mb-2">EAiSER AI</span>
              <span className="block bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                is here...
              </span>
            </h1>

            <motion.p
              className="text-base md:text-xl text-gray-300 leading-relaxed max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Transform your community with <span className="text-yellow-400 font-semibold">intelligent issue reporting</span>.
              Our AI analyzes problems in <span className="text-yellow-400 font-semibold">real-time</span> for faster resolution.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={() => navigate('/report')}
                className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl font-bold text-black overflow-hidden transition-all hover:shadow-2xl hover:shadow-yellow-500/50 active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Send a Report
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <button
                onClick={() => setShowVideo(true)}
                className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-yellow-500/30 rounded-2xl font-bold text-white hover:bg-white/10 transition-all active:scale-95"
              >
                Watch Demo
              </button>
            </motion.div>

            {/* Live Stats */}
            <motion.div
              className="flex flex-wrap gap-4 sm:gap-8 pt-6 sm:pt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div>
                <div className="text-2xl sm:text-3xl font-black text-yellow-400">&lt; 30s</div>
                <div className="text-sm text-gray-400">Report an Issue</div>
              </div>
              <div className="w-px bg-gray-800" />
              <div>
                <div className="text-2xl sm:text-3xl font-black text-yellow-400">Free</div>
                <div className="text-sm text-gray-400">for Residents</div>
              </div>
              <div className="w-px bg-gray-800" />
              <div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl sm:text-3xl font-black text-yellow-400">95%+</div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-green-500 uppercase tracking-[0.2em]">Live</span>
                  </div>
                </div>
                <div className="text-sm text-gray-400">AI Detection Accuracy</div>
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
                  <div className="text-gray-400">Powered by MomntumAi</div>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* How EAiSER AI Works Section */}
        <div className="mb-20 sm:mb-32 md:mb-48 relative">
          <motion.div 
            className="text-center mb-12 sm:mb-16 md:mb-24"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black mb-4 sm:mb-6">
              How <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">EAiSER AI</span> works
            </h2>
            <div className="w-16 sm:w-24 h-1.5 bg-yellow-500 mx-auto rounded-full" />
          </motion.div>

          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-[280px] left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-yellow-500/20 z-0" />

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 relative z-10"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.2 }
              }
            }}
          >
            {[
              {
                step: "01",
                title: "You report an issue",
                desc: "Take or upload a photo, and share the location in a few taps. It's that simple.",
                icon: <MapPin className="w-8 h-8 text-black" />,
                color: "from-yellow-400 to-amber-500"
              },
              {
                step: "02",
                title: "AI understands the problem",
                desc: "EAiSER AI analyzes the image and location to classify the issue and extract key details.",
                icon: <Brain className="w-8 h-8 text-black" />,
                color: "from-amber-400 to-yellow-500"
              },
              {
                step: "03",
                title: "We recommend the right team",
                desc: "Our system suggests the most appropriate city department or organization to handle it.",
                icon: <Target className="w-8 h-8 text-black" />,
                color: "from-yellow-500 to-amber-600"
              },
              {
                step: "04",
                title: "Authorities take action",
                desc: "Staff respond faster with precise data, keeping your community safer and smoother.",
                icon: <Rocket className="w-8 h-8 text-black" />,
                color: "from-amber-600 to-yellow-400"
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 50, scale: 0.9 },
                  show: { opacity: 1, y: 0, scale: 1 }
                }}
                whileHover={{ y: -15, transition: { duration: 0.3 } }}
                className="group relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-2xl rounded-2xl sm:rounded-[2.5rem] border border-white/5 hover:border-yellow-500/50 p-6 sm:p-8 md:p-10 overflow-hidden transition-colors"
              >
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl group-hover:bg-yellow-500/15 transition-all duration-500" />
                
                <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br ${item.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-5 sm:mb-6 md:mb-8 transform group-hover:rotate-[10deg] transition-all duration-500 shadow-xl shadow-yellow-500/20 relative`}>
                  <span className="absolute -top-3 -right-3 w-10 h-10 bg-black text-yellow-400 text-sm font-black rounded-xl flex items-center justify-center border-2 border-yellow-500/30 group-hover:scale-110 transition-transform">
                    {item.step}
                  </span>
                  {item.icon}
                </div>

                <h3 className="text-lg sm:text-xl md:text-2xl font-black mb-3 sm:mb-4 text-white group-hover:text-yellow-400 transition-colors leading-tight">
                  {item.title}
                </h3>
                
                <p className="text-gray-400 leading-relaxed text-sm sm:text-base md:text-lg">
                  {item.desc}
                </p>

                {/* Progress Indicator Dots */}
                {index < 3 && (
                  <div className="lg:hidden flex justify-center mt-8">
                    <ArrowRight className="w-6 h-6 text-yellow-500/30 rotate-90" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Purpose Section */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 mb-20 sm:mb-32 md:mb-48">
          {/* What it's for */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="group relative bg-gradient-to-br from-gray-900/40 to-black/40 backdrop-blur-xl rounded-2xl sm:rounded-[3rem] border border-white/5 p-6 sm:p-8 md:p-12 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px]" />
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6 sm:mb-8 md:mb-10 flex items-center gap-3 sm:gap-4 text-white">
              <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </div>
              What Eaiser AI is for
            </h2>

            <ul className="space-y-5 sm:space-y-6 md:space-y-8">
              {[
                "Reporting non‑emergency community issues like road hazards, fallen trees, or flooding.",
                "Helping cities receive clear, structured reports with precise locations and photos.",
                "Reducing misrouted tickets so the right department acts fast the first time."
              ].map((text, i) => (
                <motion.li 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex gap-6 group/item"
                >
                  <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center shrink-0 mt-1 transition-transform group-hover/item:scale-110">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* What it's not for */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="group relative bg-gradient-to-br from-gray-900/40 to-black/40 backdrop-blur-xl rounded-2xl sm:rounded-[3rem] border border-white/5 p-6 sm:p-8 md:p-12 overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px]" />

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6 sm:mb-8 md:mb-10 flex items-center gap-3 sm:gap-4 text-red-500">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                <X className="w-8 h-8" />
              </div>
              What Eaiser AI is not for
            </h2>

            <ul className="space-y-5 sm:space-y-6 md:space-y-8">
              {[
                "Eaiser AI is not for emergencies. In any life‑threatening situation, call 911 immediately.",
                "Eaiser AI does not replace official city hotlines or 311 systems; it works alongside them.",
                "Eaiser AI is not for private disputes or reports requiring direct police contact."
              ].map((text, i) => (
                <motion.li 
                  key={i} 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex gap-6 group/item"
                >
                  <div className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center shrink-0 mt-1 transition-transform group-hover/item:scale-110">
                    <X className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Final CTA Section */}
        <div className="relative bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-yellow-500/30 p-8 sm:p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.1),transparent_50%)]" />

          <div className="relative z-10">
            <Rocket className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-yellow-400 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black mb-3 sm:mb-4">Ready to Transform Your Community?</h2>
            <p className="text-sm sm:text-base md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join the future of intelligent issue reporting and resolution
            </p>

            <button
              onClick={() => navigate('/report')}
              className="px-8 sm:px-10 md:px-12 py-3.5 sm:py-4 md:py-5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl text-black hover:shadow-2xl hover:shadow-yellow-500/50 transition-all hover:scale-105 w-full sm:w-auto"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </div>

      {/* Video overlay (Responsive sizing) */}
      {showVideo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowVideo(false); } }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_100px_-20px_rgba(234,179,8,0.3)] border border-white/10"
          >
            <button
              aria-label="Close video"
              className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-black/50 hover:bg-white/10 border border-white/10 transition-colors"
              onClick={() => setShowVideo(false)}
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <video
              ref={videoRef}
              src={VideoDEmo}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </motion.div>
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
