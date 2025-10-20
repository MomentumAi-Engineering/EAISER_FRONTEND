import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden min-h-screen flex items-center justify-center px-6 py-20">
      {/* Floating Blobs */}
      <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Animated Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-7xl font-extrabold text-white leading-tight drop-shadow-lg"
        >
          EAISER AI IS{' '}
          <span className="block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent animate-text-glow">
            HERE
          </span>
        </motion.h1>

        {/* Animated Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-6 text-lg md:text-2xl text-gray-300 leading-relaxed"
        >
          Transform your community with intelligent issue reporting. Our AI analyzes and categorizes problems in real-time for faster resolution.
        </motion.p>

        {/* Call to Action */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="mt-10 px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300"
        >
          Report Issue
        </motion.button>
      </div>

      {/* Animated Scroll Down Indicator (Optional) */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-1 animate-bounce">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
