import React, { useState, useRef, useEffect } from "react";
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
import ReportReview from "../components/ReportReview";
import AILoader from "../components/AILoader";
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import Navbar from "../components/Navbar";
import { useReportContext } from "../context/ReportContext";
import { useDialog } from "../context/DialogContext";

const LIBRARIES = ["places"];

export default function SimpleReport() {
  const navigate = useNavigate();
  // Use Global Context
  const { generateReport, loading, error, reportResult, clearReport } = useReportContext();
  const { showAlert, showConfirm } = useDialog();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [autocomplete, setAutocomplete] = useState(null);

  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        setCoords({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });

        // Parse address components
        let zip = "";
        if (place.address_components) {
          const zipComponent = place.address_components.find((c) =>
            c.types.includes("postal_code")
          );
          if (zipComponent) zip = zipComponent.long_name;
        }

        setFormData((prev) => ({
          ...prev,
          streetAddress: place.formatted_address || place.name,
          zipCode: zip || prev.zipCode,
        }));

        setLocationPermission(false); // Because user typed manually/selected
      }
    }
  };

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [coords, setCoords] = useState(null);
  const [formData, setFormData] = useState({ streetAddress: "", zipCode: "" });
  const [guestLimitReached, setGuestLimitReached] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Immediate check on mount
    const count = parseInt(localStorage.getItem("guest_report_count") || "0", 10);
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (!token && count >= 1) {
      setGuestLimitReached(true);
    }
  }, []);

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
          showAlert("Location access granted!", { variant: 'success', title: 'Location' });
        },
        () => showAlert("Location access denied", { variant: 'error', title: 'Location Error' })
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
        await showAlert("Address not found", { variant: 'error' });
      }
    } catch (error) {
      console.error("Geocoding failed", error);
      await showAlert("Failed to get location from address", { variant: 'error' });
    }
  };

  /* 
   * GUEST REPORT LIMIT LOGIC
   * -------------------------
   */
  const GUEST_LIMIT = 1;

  const checkGuestLimit = () => {
    const authToken = localStorage.getItem("auth_token") || localStorage.getItem("token"); // Example key

    if (authToken) {
      return true; // Logged in users have no limit here
    }

    // Check if key exists and is >= 1
    const currentCount = parseInt(localStorage.getItem("guest_report_count") || "0", 10);

    // Strict check: if count is 1 or more, block.
    if (currentCount >= 1) {
      return false;
    }
    return true;
  };

  const incrementGuestCount = () => {
    const authToken = localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (!authToken) {
      // Force set to 1 immediately after first successful report
      localStorage.setItem("guest_report_count", "1");
    }
  };

  const handleGenerateReport = async () => {
    // 1. Check Guest Limit
    if (!checkGuestLimit()) {
      const confirmLogin = await showConfirm(
        "You have already submitted a free guest report.\n\nTo submit more reports and access your personal dashboard, you must Register or Login.",
        { title: "Authentication Required", confirmText: "Login / Register", cancelText: "Cancel", variant: "warning" }
      );
      if (confirmLogin) {
        navigate("/login"); // Redirect to login page
      }
      return;
    }

    if (!selectedFile && !isManualMode) {
      await showAlert("Please upload an image first.", { variant: 'warning' });
      return;
    }

    // Get user email if logged in
    let userEmail = undefined;
    try {
      const userData = localStorage.getItem('userData') || localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        userEmail = user.email;
      }
    } catch (e) {
      console.error("Failed to retrieve user email", e);
    }

    // Use Context Action
    await generateReport({
      imageFile: isManualMode ? null : selectedFile,
      description: isManualMode
        ? `${formData.description || ''}\nTime: ${formData.incidentDate || 'Not specified'}`
        : "User reported issue via web interface",
      address: formData.streetAddress || "",
      zip_code: formData.zipCode || "",
      latitude: coords?.lat || 0,
      longitude: coords?.lng || 0,
      user_email: userEmail,
      issue_type: isManualMode ? (formData.issueType || 'Manual Report') : 'other'
    });

    // 2. Increment Guest Counter on Success
    incrementGuestCount();

    // Optional: Show message after 3rd report
    const authToken = localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (!authToken) {
      const newCount = parseInt(localStorage.getItem("guest_report_count") || "0", 10);
      if (newCount >= GUEST_LIMIT) {
        await showAlert("You have used your free guest report. To track this issue and submit more, please Login or Register.", {
          title: "Guest Limit Reached",
          variant: "info",
          confirmText: "Understand"
        });
      }
    }
  };

  if (reportResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={clearReport}
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

  // Show Ultra-Advanced AI Loader during generation
  if (loading) {
    return (
      <AILoader
        status="loading"
        messages={[
          "Analyzing civic issue data...",
          "Scanning location & severity...",
          "Matching authority jurisdiction...",
          "Finalizing verified report...",
          "Verifying visual evidence accuracy...",
          "Syncing with authority databases..."
        ]}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto space-y-8 p-6 pt-24">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          Report an Issue
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Manual Mode Toggle */}
        <div className="flex justify-end mb-2">
          {!isManualMode && (
            <button
              onClick={() => setIsManualMode(true)}
              className="text-yellow-500 hover:text-yellow-400 text-sm font-semibold underline"
            >
              Skip & Report Manually
            </button>
          )}
          {isManualMode && (
            <button
              onClick={() => setIsManualMode(false)}
              className="text-blue-500 hover:text-blue-400 text-sm font-semibold underline"
            >
              Back to Photo Upload
            </button>
          )}
        </div>

        {/* Upload Section - Only show if NOT in manual mode */}
        {!isManualMode ? (
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
                  alt="Selected issue"
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

                <div className="mt-6 pt-4 border-t border-gray-800">
                  <p className="text-gray-500 text-xs mb-3">Don't have a photo?</p>
                  <button
                    onClick={() => setIsManualMode(true)}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold text-sm border border-gray-700"
                  >
                    continue with Manual Report
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold text-sm"
            >
              <Camera className="w-4 h-4" /> Capture with Camera
            </button>
          </div>
        ) : (
          <div className="bg-yellow-900/10 border border-yellow-700/50 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-yellow-500 mb-2">Manual Report Mode</h2>
            <p className="text-gray-400 text-sm mb-4">
              You are submitting a report without visual evidence. Please provide the details below.
            </p>

            <div className="space-y-4">
              {/* Issue Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Type of Issue</label>
                <select
                  name="issueType"
                  value={formData.issueType || 'other'}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-xl text-sm text-gray-200 outline-none focus:border-yellow-500 appearance-none [&_option]:bg-gray-900 [&_option]:text-gray-200"
                >
                  <option value="other">Select Issue Type...</option>
                  <option value="pothole">Pothole</option>
                  <option value="road_damage">Road Damage</option>
                  <option value="broken_streetlight">Broken Streetlight</option>
                  <option value="garbage">Garbage / Trash</option>
                  <option value="flood">Flooding</option>
                  <option value="water_leakage">Water Leakage</option>
                  <option value="fire">Fire Hazard</option>
                  <option value="dead_animal">Dead Animal</option>
                  <option value="vandalism">Vandalism</option>
                  <option value="other_issue">Other Issue</option>
                </select>
              </div>

              {/* Date/Time */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Date & Time of Incident</label>
                <input
                  type="datetime-local"
                  name="incidentDate"
                  value={formData.incidentDate || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-sm text-gray-200 outline-none focus:border-yellow-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-sm text-gray-200 outline-none focus:border-yellow-500"
                />
              </div>
            </div>
          </div>
        )}

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
              {isLoaded ? (
                <Autocomplete
                  onLoad={onAutocompleteLoad}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                    className="w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-xl text-sm"
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  placeholder="Loading Maps..."
                  disabled
                  className="w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-xl text-sm opacity-50 cursor-wait"
                />
              )}
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
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${locationPermission
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

          {coords && isLoaded && (
            <div className="mt-4 h-64 rounded-xl overflow-hidden border border-gray-700">
              <GoogleMap
                center={coords}
                zoom={15}
                mapContainerStyle={{ width: "100%", height: "100%" }}
              >
                <Marker
                  position={coords}
                  draggable={true}
                  onDragEnd={(e) => {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    setCoords({ lat, lng });
                  }}
                />
              </GoogleMap>
            </div>
          )}
        </div>

        {/* Generate Report Button */}
        <button
          onClick={handleGenerateReport}
          disabled={loading || guestLimitReached}
          className={`w-full mt-6 py-3 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 
            ${loading || guestLimitReached ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-black'}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generating...
            </>
          ) : guestLimitReached ? (
            "Guest Limit Reached - Login Required"
          ) : (
            "Generate Report"
          )}
        </button>
      </div>
    </div >
  );
}
