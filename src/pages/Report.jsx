import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Camera,
  MapPin,
  Navigation,
  X,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  LocateFixed,
  Zap,
  Calendar,
  Clock,
  ClipboardList,
  Fingerprint
} from "lucide-react";
import * as geolib from 'geolib';
import EXIF from 'exif-js';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

  useEffect(() => {
    return () => {
      // Clean up camera stream on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

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
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const [verification, setVerification] = useState(null);
  const [userAccuracy, setUserAccuracy] = useState(20); // Default 20m
  const [photoAccuracy, setPhotoAccuracy] = useState(15); // Default 15m
  const [facingMode, setFacingMode] = useState('environment');
  const [isShutterFlash, setIsShutterFlash] = useState(false);

  // Reverse Geocode Helper
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.results && data.results[0]) {
        const result = data.results[0];
        let zip = "";
        const zipComponent = result.address_components.find((c) =>
          c.types.includes("postal_code")
        );
        if (zipComponent) zip = zipComponent.long_name;

        setFormData((prev) => ({
          ...prev,
          streetAddress: result.formatted_address,
          zipCode: zip,
        }));
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error);
    }
  };

  // Camera Capture Logic
  const startCamera = async (mode = facingMode) => {
    try {
      setIsCapturing(true);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      showAlert("Could not access camera. Please check permissions.", { variant: 'error' });
      setIsCapturing(false);
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const takePhoto = () => {
    // Shutter animation
    setIsShutterFlash(true);
    setTimeout(() => setIsShutterFlash(false), 150);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Optional: Draw telemetry on canvas?
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSelectedImage(dataUrl);

    // Convert dataUrl to File object for backend
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
        setSelectedFile(file);
      });

    // Close camera immediately after flash starts (snappy feel)
    setTimeout(stopCamera, 50);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

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

    // Extract EXIF data
    EXIF.getData(file, function () {
      const lat = EXIF.getTag(this, "GPSLatitude");
      const lon = EXIF.getTag(this, "GPSLongitude");
      const latRef = EXIF.getTag(this, "GPSLatitudeRef") || "N";
      const lonRef = EXIF.getTag(this, "GPSLongitudeRef") || "E";
      const accuracy = EXIF.getTag(this, "GPSHPositioningError"); // Some devices provide this

      if (accuracy) setPhotoAccuracy(Number(accuracy));
      else setPhotoAccuracy(15); // Standard mobile GPS error

      if (lat && lon) {
        // Convert EXIF format to decimal
        const convertToDecimal = (gps, ref) => {
          let res = gps[0] + gps[1] / 60 + gps[2] / 3600;
          return ref === "S" || ref === "W" ? -res : res;
        };
        const photoLat = convertToDecimal(lat, latRef);
        const photoLon = convertToDecimal(lon, lonRef);

        setPhotoCoords({ lat: photoLat, lng: photoLon });
      } else {
        setPhotoCoords(null);
        setVerification(null);
      }
    });

    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
    setSelectedFile(file);
    e.target.value = ""; // allow reselecting the same file
  };

  const [photoCoords, setPhotoCoords] = useState(null);

  // Advanced Dynamic Threshold Logic
  const getThreshold = (address) => {
    const addr = address?.toLowerCase() || "";
    if (addr.includes("village") || addr.includes("rural") || addr.includes("tehsil")) return 150;
    if (addr.includes("sector") || addr.includes("colony") || addr.includes("suburban")) return 100;
    return 75; // Urban (Default)
  };

  // Verification Logic Effect (UPGRADED: Government-Grade)
  useEffect(() => {
    if (photoCoords && coords) {
      const rawDistance = geolib.getDistance(
        { latitude: photoCoords.lat, longitude: photoCoords.lng },
        { latitude: coords.lat, longitude: coords.lng }
      );

      // Rule #1: Accuracy Aware Distance (Handles GPS Drift)
      const totalCombinedAccuracy = userAccuracy + photoAccuracy;
      const effectiveDistance = Math.max(0, rawDistance - totalCombinedAccuracy);

      // Rule #2: Dynamic Thresholding
      const dynamicThreshold = getThreshold(formData.streetAddress);

      // Rule #3: Confidence-Based Scoring
      const confidenceScore = Math.min(100, Math.max(0, 100 - (effectiveDistance / dynamicThreshold) * 100));

      let status = 'low';
      if (confidenceScore >= 80) status = 'high';
      else if (confidenceScore >= 40) status = 'medium';

      setVerification({
        distance: rawDistance,
        effectiveDistance,
        isClose: effectiveDistance <= dynamicThreshold,
        confidenceScore,
        status,
        threshold: dynamicThreshold,
        combinedAccuracy: totalCombinedAccuracy
      });
    }
  }, [photoCoords, coords, userAccuracy, photoAccuracy, formData.streetAddress]);

  const handleLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserAccuracy(accuracy || 20);
          setLocationPermission(true);
          setCoords({ lat: latitude, lng: longitude });
          await reverseGeocode(latitude, longitude);
          showAlert("Location captured & Address updated!", { variant: 'success', title: 'GPS Sync' });
        },
        () => showAlert("Location access denied", { variant: 'error', title: 'Location Error' }),
        { enableHighAccuracy: true }
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
      <div className="max-w-3xl mx-auto space-y-8 p-4 md:p-6 pt-20 md:pt-24">
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

        {/* Manual Mode UI */}
        <AnimatePresence mode="wait">
          {!isManualMode ? (
            <motion.div
              key="photo-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group transition-all duration-500"
            >
              {/* Animated accent gradient */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px] group-hover:bg-yellow-500/20 transition-all duration-700" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <div className="p-2 bg-yellow-500/10 rounded-xl">
                        <Upload className="w-5 h-5 text-yellow-500" />
                      </div>
                      Visual Proof
                    </h2>
                    <p className="text-gray-500 text-[10px] items-center flex gap-1 mt-1 font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> AI-Verification Ready
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Step 01
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.bmp,.gif,.tiff,.heic"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-700 aspect-video bg-black/50 shadow-inner group/preview">
                    <img
                      src={selectedImage}
                      alt="Selected issue"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2.5 bg-white text-black font-black rounded-xl text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Camera className="w-3.5 h-3.5" /> Change
                      </button>
                      <button
                        onClick={() => {
                          setSelectedImage(null);
                          setSelectedFile(null);
                        }}
                        className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500 border border-red-500/50 text-white font-black rounded-xl text-xs hover:scale-105 active:scale-95 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                    {/* Image stats overlay */}
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                      <p className="text-[10px] font-bold text-white uppercase tracking-tighter">
                        {selectedFile?.name.split('.').pop()?.toUpperCase()} • {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Dropzone Area */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-800 rounded-3xl p-12 text-center transition-all duration-500 hover:border-yellow-500/40 hover:bg-yellow-500/[0.02] cursor-pointer group/dropzone flex flex-col items-center justify-center"
                    >
                      <div className="w-24 h-24 bg-gray-900/80 rounded-full flex items-center justify-center mb-6 border border-gray-800 relative group-hover/dropzone:scale-110 transition-transform duration-500">
                        <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-xl opacity-0 group-hover/dropzone:opacity-100 transition-opacity" />
                        <Upload className="w-8 h-8 text-gray-600 group-hover/dropzone:text-yellow-500 transition-colors" />
                      </div>

                      <h3 className="text-white font-bold text-lg mb-2">Evidence Upload</h3>
                      <p className="text-gray-500 text-sm max-w-[200px] mx-auto leading-relaxed mb-10">
                        Drag files here or use the high-speed captures below
                      </p>

                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-white/5"
                        >
                          <Upload className="w-4 h-4" />
                          Choose File
                        </button>

                        <div className="hidden sm:block w-px h-8 bg-gray-800 mx-2" />

                        <button
                          onClick={(e) => { e.stopPropagation(); startCamera(); }}
                          className="w-full sm:w-auto px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-yellow-500/20"
                        >
                          <Camera className="w-4 h-4" />
                          Take Photo
                        </button>
                      </div>


                    </div>

                    {isCapturing && (
                      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
                        <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-gray-900 overflow-hidden sm:rounded-3xl shadow-2xl border border-white/5">
                          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

                          {/* Shutter Flash Effect */}
                          {isShutterFlash && <div className="absolute inset-0 bg-white z-[110] animate-pulse" />}

                          {/* Target Guide / Level */}
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-64 h-64 border border-white/20 rounded-full flex items-center justify-center">
                              <div className="w-1 h-8 bg-blue-500/50 absolute" />
                              <div className="h-1 w-8 bg-blue-500/50 absolute" />
                            </div>
                            {/* HUD Corners */}
                            <div className="absolute top-10 left-10 w-10 h-10 border-t-2 border-l-2 border-white/40" />
                            <div className="absolute top-10 right-10 w-10 h-10 border-t-2 border-r-2 border-white/40" />
                            <div className="absolute bottom-10 left-10 w-10 h-10 border-b-2 border-l-2 border-white/40" />
                            <div className="absolute bottom-10 right-10 w-10 h-10 border-b-2 border-r-2 border-white/40" />
                          </div>

                          {/* Live Telemetry HUD */}
                          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                            <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 space-y-1">
                              <p className="text-[10px] font-black text-blue-500 tracking-widest uppercase">Live GPS Telemetry</p>
                              <div className="flex gap-4">
                                <div>
                                  <p className="text-[8px] text-gray-400 font-bold uppercase">Lat</p>
                                  <p className="text-xs font-mono text-white">{coords?.lat.toFixed(6) || '---'}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-gray-400 font-bold uppercase">Lon</p>
                                  <p className="text-xs font-mono text-white">{coords?.lng.toFixed(6) || '---'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                              <p className="text-[10px] font-black text-white tracking-widest uppercase italic">Recording Buffer Active</p>
                            </div>
                          </div>

                          {/* Bottom Controls */}
                          <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-6">
                            <div className="flex items-center gap-12">
                              <button
                                onClick={stopCamera}
                                className="w-14 h-14 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-all pointer-events-auto"
                              >
                                <X className="w-6 h-6" />
                              </button>

                              <button
                                onClick={takePhoto}
                                className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all pointer-events-auto group"
                              >
                                <div className="w-20 h-20 border-4 border-black/10 rounded-full flex items-center justify-center">
                                  <div className="w-16 h-16 bg-gray-100 rounded-full border-2 border-white shadow-inner group-hover:bg-white transition-colors" />
                                </div>
                              </button>

                              <button
                                onClick={toggleCamera}
                                className="w-14 h-14 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-all pointer-events-auto"
                              >
                                <Navigation className="w-6 h-6 rotate-45" />
                              </button>
                            </div>
                            <p className="text-white/60 text-[10px] uppercase font-black tracking-[4px]">Verified Evidence Channel</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Manual Bypass Prompt */}
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[4px] mb-1">Backup Routing</p>
                      <button
                        onClick={() => setIsManualMode(true)}
                        className="group/manual relative px-8 py-3 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 rounded-2xl text-xs font-black text-gray-400 hover:text-yellow-500 transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-yellow-500/5 translate-y-full group-hover/manual:translate-y-0 transition-transform duration-300" />
                        <span className="relative flex items-center gap-2 italic uppercase">
                          Skip photo & report manually <ArrowLeft className="w-3 h-3 rotate-180" />
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="manual-mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-gray-900 via-black to-gray-950 border border-yellow-500/20 rounded-[2.5rem] p-10 shadow-[0_0_50px_-12px_rgba(234,179,8,0.15)] relative overflow-hidden backdrop-blur-3xl"
            >
              {/* Background Glass Orbs */}
              <div className="absolute -top-24 -left-24 w-60 h-60 bg-yellow-500/5 rounded-full blur-[80px]" />
              <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-blue-500/5 rounded-full blur-[80px]" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                        <ClipboardList className="w-6 h-6 text-yellow-500" />
                      </div>
                      <h2 className="text-2xl font-black text-white tracking-tight">Manual Report Mode</h2>
                    </div>
                    <p className="text-gray-500 text-xs font-medium max-w-sm leading-relaxed">
                      AI-Bypass active. Please provide precise details for manual verification processing.
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                      <Fingerprint className="w-3 h-3" /> Manual Auth
                    </span>
                    <button
                      onClick={() => setIsManualMode(false)}
                      className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-wider flex items-center gap-1 group/back"
                    >
                      <ArrowLeft className="w-3 h-3 transition-transform group-hover/back:-translate-x-1" /> Back to Upload
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Issue Type Selector */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                      <AlertCircle className="w-3 h-3 text-yellow-500" /> Category of Issue
                    </label>
                    <div className="relative group/select">
                      <select
                        name="issueType"
                        value={formData.issueType || 'other'}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-gray-900/40 border border-gray-800 rounded-2xl text-sm text-white outline-none focus:border-yellow-500/50 focus:bg-gray-900/60 transition-all appearance-none cursor-pointer"
                      >
                        <option value="other">Select Issue Type...</option>
                        <option value="pothole">Pothole / Road Hole</option>
                        <option value="road_damage">Asphalt Degradation</option>
                        <option value="broken_streetlight">Public Illumination Failure</option>
                        <option value="garbage">Waste Accumulation</option>
                        <option value="flood">Drainage Overload (Flood)</option>
                        <option value="water_leakage">Utility Water Leak</option>
                        <option value="fire">Thermal/Fire Hazard</option>
                        <option value="dead_animal">Sanitation Response Req.</option>
                        <option value="vandalism">Public Property Vandalism</option>
                        <option value="other_issue">Classified Other</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600 transition-colors group-hover/select:text-yellow-500">
                        <Zap className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Date/Time Picker - ULTRA ADVANCED LOOK */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                      <Calendar className="w-3 h-3 text-blue-500" /> Incident Timeline
                    </label>
                    <div className="relative flex items-center group/date">
                      <div className="absolute left-6 text-blue-500/50 group-focus-within/date:text-blue-500 transition-colors">
                        <Clock className="w-4 h-4" />
                      </div>
                      <input
                        type="datetime-local"
                        name="incidentDate"
                        value={formData.incidentDate || ''}
                        onChange={handleChange}
                        className="w-full pl-14 pr-6 py-4 bg-gray-900/40 border border-gray-800 rounded-2xl text-sm text-white outline-none focus:border-blue-500/50 focus:bg-gray-900/60 transition-all"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>

                  {/* Description Area */}
                  <div className="md:col-span-2 space-y-3 mt-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                      <ClipboardList className="w-3 h-3 text-white/50" /> Analytical Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Provide a detailed log of the observation for AI-assisted classification..."
                      className="w-full px-6 py-5 bg-gray-900/40 border border-gray-800 rounded-3xl text-sm text-white outline-none focus:border-white/20 focus:bg-gray-900/60 transition-all resize-none shadow-inner"
                    />
                    <div className="flex justify-between px-2">
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest italic">Character limit: 500</p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest italic flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> High Priority Log
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Location Details Section - Advanced Priority UI */}
        <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group/loc transition-all">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                Incident Location
              </h2>
              <p className="text-gray-500 text-[10px] items-center flex gap-1 mt-1 font-bold uppercase tracking-wider">
                Precision GPS Tracking Active
              </p>
            </div>
            <div className="px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Step 02
            </div>
          </div>

          <div className="space-y-6">
            {/* PRIORITY ACTION: Current Location */}
            <button
              onClick={handleLocationPermission}
              className={`w-full group/locbtn relative overflow-hidden flex items-center justify-center gap-4 px-6 py-5 rounded-2xl font-black text-sm transition-all duration-300 shadow-2xl ${locationPermission
                ? "bg-green-500 text-black shadow-green-500/20"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                }`}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/locbtn:translate-y-0 transition-transform" />
              <div className="relative flex items-center gap-3 uppercase tracking-tighter">
                {locationPermission ? <ShieldCheck className="w-5 h-5" /> : <LocateFixed className="w-5 h-5" />}
                {locationPermission ? "Location Synced Successfully" : "Priority: Use My Current Location"}
              </div>
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-1 bg-gray-800" />
              <span className="text-[10px] font-black text-gray-600 uppercase italic">Or Manual Entry</span>
              <div className="h-px flex-1 bg-gray-800" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Street Address</label>
                {isLoaded ? (
                  <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                    <input
                      type="text"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleChange}
                      placeholder="Enter street name..."
                      className="w-full px-5 py-4 bg-gray-900/50 border border-gray-800 rounded-2xl text-sm focus:border-blue-500 transition-colors text-white outline-none"
                    />
                  </Autocomplete>
                ) : (
                  <div className="w-full px-5 py-4 bg-gray-900/50 border border-gray-800 rounded-2xl text-sm opacity-50 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    <span className="text-gray-500">Initializing Maps SDK...</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="1100XX"
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-800 rounded-2xl text-sm focus:border-blue-500 transition-colors text-white outline-none"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => getCoordsFromAddress(`${formData.streetAddress} ${formData.zipCode}`)}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <MapPin className="w-3.5 h-3.5" /> Force Update Map
              </button>
            </div>

            {/* Verification Status Card */}
            {verification && (
              <div className={`mt-4 p-4 rounded-2xl border ${verification.status === 'high' ? 'bg-green-500/5 border-green-500/20' :
                verification.status === 'medium' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-red-500/5 border-red-500/20'
                }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${verification.status === 'high' ? 'text-green-500' :
                      verification.status === 'medium' ? 'text-yellow-500' : 'text-red-500'
                      }`} />
                    <span className="text-xs font-black text-white uppercase tracking-widest">Location Integrity</span>
                  </div>
                  <span className={`text-xs font-black ${verification.status === 'high' ? 'text-green-500' :
                    verification.status === 'medium' ? 'text-yellow-500' : 'text-red-500'
                    }`}>{Math.round(verification.confidenceScore)}%</span>
                </div>

                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-1000 ${verification.status === 'high' ? 'bg-green-500' :
                      verification.status === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    style={{ width: `${verification.confidenceScore}%` }}
                  />
                </div>

                <p className="text-[10px] text-gray-400 font-bold flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    {verification.effectiveDistance <= 5 ? "Perfect Proximity" : `Effective Offset: ${Math.round(verification.effectiveDistance)}m`}
                    <span className="text-gray-600 font-normal">(Accuracy Adjusted)</span>
                  </span>
                  {verification.isClose
                    ? "Verified: Data within trusted jurisdiction boundaries."
                    : `Alert: Deviation exceeding ${verification.threshold}m threshold.`}
                </p>
                {/* Micro Details for Trust */}
                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-gray-500 uppercase tracking-tighter font-black">Raw Distance</span>
                    <span className="text-[10px] text-gray-300 font-bold">{verification.distance}m</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-gray-500 uppercase tracking-tighter font-black">Refined Error</span>
                    <span className="text-[10px] text-gray-300 font-bold">±{Math.round(verification.combinedAccuracy)}m</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] text-gray-500 uppercase tracking-tighter font-black">Area Type</span>
                    <span className="text-[10px] text-blue-500 font-bold uppercase">{verification.threshold === 150 ? 'Rural' : verification.threshold === 100 ? 'Suburban' : 'Urban'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {coords && isLoaded && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Real-time Satellite View</p>
                <span className="text-[10px] font-bold text-gray-500 italic">Drag marker to refine exact spot</span>
              </div>
              <div className="h-96 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl relative">
                <GoogleMap
                  center={coords}
                  zoom={20}
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  mapTypeId="hybrid"
                  options={{
                    streetViewControl: true,
                    mapTypeControl: true,
                    mapTypeControlOptions: {
                      style: 1, // HORIZONTAL_BAR
                      position: 3, // TOP_RIGHT
                      mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
                    },
                    fullscreenControl: true,
                    rotateControl: true,
                    tilt: 45, // Enable 45-degree imagery
                    styles: [
                      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                    ]
                  }}
                >
                  <Marker
                    position={coords}
                    draggable={true}
                    onDragEnd={async (e) => {
                      const lat = e.latLng.lat();
                      const lng = e.latLng.lng();
                      setCoords({ lat, lng });
                      await reverseGeocode(lat, lng);
                    }}
                  />
                </GoogleMap>
              </div>
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
