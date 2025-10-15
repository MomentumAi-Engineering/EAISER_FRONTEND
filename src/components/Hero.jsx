import React from 'react';
import { AlertCircle } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="bg-slate-900 py-20 px-4 min-h-screen flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center">
        
        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
          EAISER AI IS 
          <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            HERE
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
          Transform your community with intelligent issue reporting. Our AI analyzes and categorizes problems in real-time for faster resolution.
        </p>

        {/* CTA Button */}
        <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-10 py-5 rounded-full text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg">
          Report Issue
        </button>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-blue-400/10 rounded-full blur-lg"></div>
        
      </div>
    </section>
  );
};

export default HeroSection;