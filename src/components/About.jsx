import React from 'react';
import { Upload, MapPin, FileText } from 'lucide-react';

const AboutSection = () => {
  const features = [
    {
      icon: Upload,
      title: "Smart AI Analysis",
      description: "Our neural networks instantly classify issues as public or business-related with 95% accuracy."
    },
    {
      icon: MapPin,
      title: "Precision Location",
      description: "GPS and visual data pinpoint exact locations for faster response times."
    },
    {
      icon: FileText,
      title: "Automated Reporting",
      description: "Generate professional reports automatically sent to the appropriate authorities."
    }
  ];

  return (
    <section className="bg-slate-900 py-20 px-4 min-h-screen flex items-center justify-center">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Eaiser AI</span> Stands Apart
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Our advanced AI technology streamlines the entire issue resolution process
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-500">
                    <IconComponent size={28} className="text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-lg group-hover:text-gray-200 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 bg-cyan-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              </div>
            );
          })}
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-32 left-10 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-blue-400/5 rounded-full blur-xl"></div>
        
      </div>
    </section>
  );
};

export default AboutSection;