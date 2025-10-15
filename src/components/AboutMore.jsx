import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock, Users } from 'lucide-react';

const ImpactMetricsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState({ resolved: 0, resolution: 0, satisfaction: 0 });
  const sectionRef = useRef(null);

  const targetValues = { resolved: 12, resolution: 18, satisfaction: 95 };

  // Intersection Observer to trigger animation when component comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  // Animated counter effect
  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds
    const intervals = {};

    // Animate each counter
    Object.keys(targetValues).forEach(key => {
      const target = targetValues[key];
      const increment = target / (duration / 50);
      let current = 0;

      intervals[key] = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(intervals[key]);
        }
        
        setCounts(prev => ({
          ...prev,
          [key]: Math.floor(current)
        }));
      }, 50);
    });

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [isVisible]);

  const metrics = [
    {
      icon: CheckCircle,
      value: counts.resolved,
      label: "Issues Resolved",
      suffix: "",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: Clock,
      value: counts.resolution,
      label: "Avg. Resolution (hours)",
      suffix: "",
      color: "from-blue-400 to-cyan-500"
    },
    {
      icon: Users,
      value: counts.satisfaction,
      label: "User Satisfaction",
      suffix: "%",
      color: "from-purple-400 to-pink-500"
    }
  ];

  return (
    <section ref={sectionRef} className="bg-slate-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-slate-800 px-4 py-2 rounded-full mb-6">
            <span className="text-gray-400 text-sm font-medium tracking-wider uppercase">
              Impact Metrics
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Making a <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Measurable Difference
            </span>
          </h2>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <div
                key={index}
                className={`group relative bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-8 text-center hover:border-slate-600/50 transition-all duration-700 hover:transform hover:scale-105 ${
                  isVisible ? 'animate-fade-in' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {/* Glowing background effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`}></div>
                
                {/* Icon Container */}
                <div className="relative mb-6 flex justify-center">
                  <div className={`w-20 h-20 bg-gradient-to-br ${metric.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110`}>
                    <IconComponent size={32} className="text-white" />
                  </div>
                </div>

                {/* Value */}
                <div className="relative mb-4">
                  <span className={`text-6xl md:text-7xl font-bold bg-gradient-to-br ${metric.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block`}>
                    {metric.value}{metric.suffix}
                  </span>
                </div>

                {/* Label */}
                <p className="text-gray-300 text-lg font-medium group-hover:text-white transition-colors duration-300">
                  {metric.label}
                </p>

                {/* Decorative pulse effect */}
                <div className={`absolute -inset-1 bg-gradient-to-br ${metric.color} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`}></div>
                
                {/* Floating particles */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              </div>
            );
          })}
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-20 left-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-10 w-24 h-24 bg-green-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
      </div>
    </section>
  );
};

export default ImpactMetricsSection;