import React, { useState, useEffect, useRef } from 'react';
import { Zap, MapPin, FileText, CheckCircle, Clock, Users, ArrowRight, Sparkles, Brain, Target, Rocket } from 'lucide-react';

export default function EaiserAIHero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
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
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(234, 179, 8, 0.3)" strokeWidth="0.5"/>
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
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-yellow-500/10 backdrop-blur-sm rounded-full border border-yellow-500/30">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-yellow-400 tracking-wide">NEXT-GEN AI TECHNOLOGY</span>
            </div>

            <h1 className="text-7xl lg:text-8xl font-black leading-none">
              <span className="block text-white mb-2">Eaiser AI</span>
              <span className="block bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                is here...
              </span>
            </h1>

            <p className="text-xl text-gray-300 leading-relaxed max-w-xl">
              Transform your community with <span className="text-yellow-400 font-semibold">intelligent issue reporting</span>. 
              Our AI analyzes and categorizes problems in <span className="text-yellow-400 font-semibold">real-time</span> for faster resolution.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl font-bold text-black overflow-hidden transition-all hover:shadow-2xl hover:shadow-yellow-500/50 hover:-translate-y-1">
                <span className="relative z-10 flex items-center gap-2">
                  Report an Issue
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <button className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-yellow-500/30 rounded-2xl font-bold text-white hover:bg-white/10 transition-all hover:-translate-y-1">
                Watch Demo
              </button>
            </div>

            {/* Live Stats */}
            <div className="flex gap-8 pt-8">
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
            </div>
          </div>

          {/* Right Visual Element - 3D Card Stack */}
          <div className="relative h-[600px] hidden lg:block">
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: `translateY(${scrollY * 0.1}px)` }}
            >
              {/* Card 1 - Background */}
              <div className="absolute top-0 right-0 w-80 h-96 bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-yellow-500/20 transform rotate-6 shadow-2xl" />
              
              {/* Card 2 - Middle */}
              <div className="absolute top-10 right-10 w-80 h-96 bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-yellow-500/40 transform rotate-3 shadow-2xl">
                <div className="p-8 h-full flex flex-col justify-between">
                  <Brain className="w-16 h-16 text-yellow-400" />
                  <div>
                    <h3 className="text-2xl font-bold mb-2">AI-Powered</h3>
                    <p className="text-gray-400">Smart classification with 95% accuracy</p>
                  </div>
                </div>
              </div>
              
              {/* Card 3 - Front */}
              <div className="relative w-80 h-96 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-xl rounded-3xl border-2 border-yellow-500 shadow-2xl shadow-yellow-500/30 p-8 flex flex-col justify-between">
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
                  <div className="text-gray-400">Powered by Neural Networks</div>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
            </div>
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
                  Our neural networks instantly classify issues as public or business-related with 95% accuracy.
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
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-yellow-400 mb-2">SUCCESS STORIES</div>
                  <h3 className="text-4xl font-black mb-4">Making a Measurable Difference</h3>
                  <p className="text-xl text-gray-300">See how communities are transforming with AI</p>
                </div>
                
                <button className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-yellow-400 transition-all hover:scale-105 flex items-center gap-2">
                  View Impact <Target className="w-5 h-5" />
                </button>
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
            
            <button className="px-12 py-5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl font-bold text-xl text-black hover:shadow-2xl hover:shadow-yellow-500/50 transition-all hover:scale-105">
              Get Started Now
            </button>
          </div>
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
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}