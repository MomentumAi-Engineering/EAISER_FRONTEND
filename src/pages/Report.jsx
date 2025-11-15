import React, { useState } from 'react';
import { Upload, Camera, MapPin, Navigation, FileText, Clock, Image, X } from 'lucide-react';

export default function EaiserReport() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [formData, setFormData] = useState({
    zipCode: '',
    streetAddress: '',
    description: ''
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    alert('Camera functionality would open here');
  };

  const handleLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission(true);
          console.log('Location:', position.coords);
          alert('Location access granted!');
        },
        (error) => {
          alert('Location access denied');
        }
      );
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateReport = () => {
    console.log('Generate Report:', formData, selectedImage);
    alert('Report generated successfully!');
  };

  const handlePrevious = () => {
    console.log('Going to previous reports');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-black text-white">Report an Issue</h1>
          </div>
          <p className="text-gray-400 text-sm ml-13">Fill in the details below to submit a new report</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Image Upload */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-gray-400" />
                Photo Evidence
              </h2>

              {/* Image Preview or Upload Area */}
              <div className="relative">
                {selectedImage ? (
                  <div className="relative group">
                    <img 
                      src={selectedImage} 
                      alt="Preview" 
                      className="w-full h-64 object-cover rounded-xl border border-gray-700"
                    />
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-gray-600 transition-colors">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-4">Drop your image here or click to upload</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>

              {/* Capture Button */}
              <button
                onClick={handleCapture}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 rounded-xl font-semibold text-sm transition-all"
              >
                <Camera className="w-4 h-4" />
                Capture with Camera
              </button>
            </div>

            {/* Issue Description */}
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-bold mb-4">Issue Description</h2>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the issue in detail..."
                rows="5"
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 focus:border-yellow-500/50 rounded-xl text-white text-sm placeholder-gray-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Right Column - Location Details */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                Location Details
              </h2>

              <div className="space-y-4">
                {/* Street Address */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Street Address</label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                    className="w-full px-4 py-2.5 bg-white/5 border border-gray-700 focus:border-yellow-500/50 rounded-xl text-white text-sm placeholder-gray-500 outline-none transition-all"
                  />
                </div>

                {/* ZIP Code */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="12345"
                    className="w-full px-4 py-2.5 bg-white/5 border border-gray-700 focus:border-yellow-500/50 rounded-xl text-white text-sm placeholder-gray-500 outline-none transition-all"
                  />
                </div>

                {/* Live Location Permission */}
                <div className="pt-2">
                  <button
                    onClick={handleLocationPermission}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                      locationPermission
                        ? 'bg-green-600/20 border-2 border-green-600 text-green-400'
                        : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Navigation className={`w-4 h-4 ${locationPermission ? 'text-green-400' : ''}`} />
                    {locationPermission ? 'Location Access Granted' : 'Use Current Location'}
                  </button>
                  {locationPermission && (
                    <p className="text-xs text-green-400 mt-2 text-center">✓ GPS coordinates captured</p>
                  )}
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-bold mb-4">Issue Category</h2>
              <div className="grid grid-cols-2 gap-3">
                {['Infrastructure', 'Safety', 'Environment', 'Public Services'].map((category) => (
                  <button
                    key={category}
                    className="px-4 py-3 bg-white/5 hover:bg-yellow-500/10 border border-gray-700 hover:border-yellow-500/50 rounded-xl text-sm font-semibold transition-all"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Level */}
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-bold mb-4">Priority Level</h2>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-xl text-sm font-semibold text-red-400 transition-all">
                  High
                </button>
                <button className="flex-1 px-4 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-sm font-semibold text-yellow-400 transition-all">
                  Medium
                </button>
                <button className="flex-1 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 rounded-xl text-sm font-semibold text-green-400 transition-all">
                  Low
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <button
            onClick={handlePrevious}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-bold transition-all"
          >
            <Clock className="w-5 h-5" />
            Previous Reports
          </button>
          
          <button
            onClick={handleGenerateReport}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 rounded-xl font-bold text-black transition-all hover:shadow-lg hover:shadow-yellow-500/20"
          >
            <FileText className="w-5 h-5" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}