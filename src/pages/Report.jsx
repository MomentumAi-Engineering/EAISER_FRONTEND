import React, { useState } from "react";
import { Upload, Camera, MapPin, Navigation, X } from "lucide-react";

export default function SimpleReport() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [coords, setCoords] = useState({ latitude: 0.0, longitude: 0.0 });
  const [formData, setFormData] = useState({ streetAddress: "", zipCode: "" });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    alert("Camera functionality would open here");
  };

  const handleLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission(true);
          setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          alert("Location access granted!");
        },
        () => alert("Location access denied")
      );
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center">
            <Upload className="w-5 h-5 text-yellow-400" />
          </div>
          Report an Issue
        </h1>

        {/* Upload Section */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-gray-400" /> Photo Evidence
          </h2>

          {selectedImage ? (
            <div className="relative group">
              <img src={selectedImage} className="w-full h-64 object-cover rounded-xl border border-gray-700" />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setSelectedFile(null);
                }}
                className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-gray-600 transition-colors">
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-4">Drop your image here or click to upload</p>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="file-upload" />
              <label
                htmlFor="file-upload"
                className="inline-block px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold cursor-pointer"
              >
                Choose File
              </label>
            </div>
          )}

          <button
            onClick={handleCapture}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold text-sm"
          >
            <Camera className="w-4 h-4" /> Capture with Camera
          </button>
        </div>

        {/* Location Section */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" /> Location Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Street Address</label>
              <input
                type="text"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                placeholder="123 Main Street"
                className="w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">ZIP Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="12345"
                className="w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-xl text-sm"
              />
            </div>

            <button
              onClick={handleLocationPermission}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                locationPermission
                  ? "bg-green-600/20 border border-green-600 text-green-400"
                  : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
              }`}
            >
              <Navigation className="w-4 h-4" />
              {locationPermission ? "Location Access Granted" : "Use Current Location"}
            </button>

            {locationPermission && (
              <p className="text-xs text-green-400 mt-2 text-center">GPS Captured ✓</p>
            )}
          </div>
        </div>

        {/* Generate Report Button */}
        <button
          onClick={() => alert("Report Generated!")}
          className="w-full mt-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition-all"
        >
          Generate Report
        </button>
      </div>
    </div>
  );
}
