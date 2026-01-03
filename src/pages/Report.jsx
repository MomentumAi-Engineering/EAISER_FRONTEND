import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  MapPin,
  Navigation,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import ReportReview from "../components/ReportReview";

// 1. Import Google Maps components
import { GoogleMap, Marker, LoadScript } from "@react-google-maps/api";

export default function SimpleReport() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  
  // 2. coords state — rename keys to lat/lng (Google Maps uses lat/lng)
  const [coords, setCoords] = useState(null);

  const [formData, setFormData] = useState({ streetAddress: "", zipCode: "" });
  const [loading, setLoading] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
    setSelectedFile(file);
    e.target.value = ""; // allow reselecting the same file
  };

  const handleLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission(true);
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          alert("Location access granted!");
        },
        () => alert("Location access denied")
      );
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const getCoordsFromAddress = async (address) => {
    if (!address) return;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.results.length > 0) {
        const location = data.results[0].geometry.location;
        setCoords({
          lat: location.lat,
          lng: location.lng,
        });
        setLocationPermission(false); // Because user typed manually
      } else {
        alert("Address not found");
      }
    } catch (error) {
      console.error("Geocoding failed", error);
      alert("Failed to get location from address");
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedFile) {
      alert("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.createIssue({
        imageFile: selectedFile,
        description: "User reported issue via web interface",
        address: formData.streetAddress || "",
        zip_code: formData.zipCode || "",
        latitude: coords?.lat || 0,
        longitude: coords?.lng || 0,
      });

      console.log("Report generated:", response);
      setReportResult(response);
    } catch (err) {
      console.error("Error generating report:", err);
      setError(err.message || "Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component UI
  if (reportResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setReportResult(null)}
            className="mb-4 inline-flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </button>
          <ReportReview
            issue={reportResult}
            imagePreview={selectedImage}
            imageName={selectedFile?.name}
            userAddress={formData.streetAddress}
            userZip={formData.zipCode}
            userLat={coords?.lat}
            userLon={coords?.lng}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <button
          onClick={() => navigate("/")}
          className="mb-2 inline-flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          Report an Issue
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Upload Section unchanged */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-gray-400" /> Photo Evidence
          </h2>

          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.bmp,.gif,.tiff,.heic"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedImage ? (
            <div className="relative group">
              <img
                src={selectedImage}
                className="w-full h-64 object-cover rounded-xl border border-gray-700"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setSelectedFile(null);
                  }}
                  className="p-2 bg-red-500/80 hover:bg-red-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-semibold"
                >
                  Change Image
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-gray-600 transition-colors">
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-4">
                Drop your image here or click to upload
              </p>
              <label
                htmlFor="file-upload"
                className="inline-block px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold cursor-pointer"
              >
                Choose File
              </label>
            </div>
          )}

          <button
            onClick={() => alert("Camera functionality would open here")}
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
              <label className="block text-xs font-semibold text-gray-400 mb-2">
                Street Address
              </label>
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
              <label className="block text-xs font-semibold text-gray-400 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="12345"
                className="w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-xl text-sm"
              />
            </div>

            {/* 4. Add new button to get map from typed address */}
            <button
              onClick={() =>
                getCoordsFromAddress(
                  `${formData.streetAddress} ${formData.zipCode}`
                )
              }
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-blue-700 hover:bg-blue-600"
            >
              Show on Map
            </button>

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

          {/* 5. Render Map here */}
          {coords && (
            <div className="mt-4 h-64 rounded-xl overflow-hidden border border-gray-700">
              <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  center={coords}
                  zoom={15}
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                >
                  <Marker position={coords} />
                </GoogleMap>
              </LoadScript>
            </div>
          )}
        </div>

        {/* Generate Report Button */}
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="w-full mt-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generating...
            </>
          ) : (
            "Generate Report"
          )}
        </button>
      </div>
    </div>
  );
}
