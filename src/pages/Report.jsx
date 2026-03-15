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
  Fingerprint,
  Globe,
  Activity,
  AlertTriangle,
  Send,
  RefreshCw,
  ZapOff
} from "lucide-react";
import * as geolib from 'geolib';
import EXIF from 'exif-js';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReportReview from "../components/ReportReview";
import AILoader from "../components/AILoader";
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import Navbar from "../components/Navbar";
import imageCompression from 'browser-image-compression'; // Added for performance
import { useReportContext } from "../context/ReportContext";
import { useDialog } from "../context/DialogContext";

const SERVICED_ZIP_CODES = ["37013", "37027", "37062", "37072", "37076", "37115", "37138", "37201", "37203", "37204", "37205", "37206", "37207", "37208", "37209", "37210", "37211", "37212", "37214", "37215", "37216", "37217", "37218", "37219", "37220", "37221", "37222", "37224", "37227", "37228", "37229", "37230", "37232", "37234", "37235", "37236", "37238", "37240", "37242", "37250"];

const isInsideFairview = (lat, lng, zip = null) => {
  // If we have a zip, check if it's in our authority database
  if (zip) {
    return SERVICED_ZIP_CODES.includes(String(zip));
  }

  // Fallback to geographic bounds ONLY if no zip is provided
  if (!lat || !lng) return true;
  return lat <= FAIRVIEW_BOUNDS.north &&
    lat >= FAIRVIEW_BOUNDS.south &&
    lng >= FAIRVIEW_BOUNDS.west &&
    lng <= FAIRVIEW_BOUNDS.east;
};

const OUTSIDE_AREA_MESSAGE = "It seems this incident is outside EAiSER’s current serviced areas. If you’d like, please go ahead and finish your report; our team will review it and do our best to share the information with the appropriate local authorities. For the fastest and most reliable response, we strongly recommend that you also contact your local authorities directly through their current channels. We are actively working to expand into more regions so we can fully support incidents like yours in the future.";
// -----------------------------------

const LIBRARIES = ["places"];

export default function SimpleReport() {
  const navigate = useNavigate();
  // Use Global Context
  const { generateReport, loading, error, reportResult, clearReport, clearError } = useReportContext();
  const { showAlert, showConfirm } = useDialog();

  // 🚀 Premium Pop Card for Errors (AI Rejections & General Failures)
  useEffect(() => {
    if (error) {
      const isAIRejection = error.includes("AI detected") || error.includes("cartoon-like");

      showAlert(error, {
        title: isAIRejection ? "Visual Analysis Failed" : "Processing Error",
        variant: "error",
        confirmText: isAIRejection ? "Try Real Photo" : "Try Again"
      });

      if (isAIRejection) {
        setSelectedImage(null);
        setSelectedFile(null);
      }

      // Clear error immediately so it doesn't loop
      clearError();
    }
  }, [error, showAlert, clearError]);

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

        setMapZoom(20);

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

        // Check if outside Fairview (Check Zip first, then Geo)
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        if (!isInsideFairview(lat, lng, zip)) {
          setIsOutsideServicedArea(true);
        } else {
          setIsOutsideServicedArea(false);
        }

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
  const [locationMissing, setLocationMissing] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const mapRef = useRef(null);
  const [mapZoom, setMapZoom] = useState(20);
  const [showMapExit, setShowMapExit] = useState(false);
  const [verification, setVerification] = useState(null);
  const [userAccuracy, setUserAccuracy] = useState(20); // Default 20m
  const [photoAccuracy, setPhotoAccuracy] = useState(15); // Default 15m
  const [facingMode, setFacingMode] = useState('environment');
  const [isShutterFlash, setIsShutterFlash] = useState(false);
  const [isOutsideServicedArea, setIsOutsideServicedArea] = useState(false);
  const [showManualAddress, setShowManualAddress] = useState(false);

  // --- REPORT STATE PERSISTENCE ---
  // Save state to local storage to survive login/signup redirect
  useEffect(() => {
    const stateToSave = {
      formData,
      coords,
      isManualMode,
      selectedImage, // Base64 string survives
      isOutsideServicedArea,
      timestamp: Date.now()
    };
    // Only save if there's actual data to save
    if (formData.streetAddress || selectedImage || coords) {
      localStorage.setItem('eaiser_report_state', JSON.stringify(stateToSave));
    }
  }, [formData, coords, isManualMode, selectedImage, isOutsideServicedArea]);

  // Restore state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('eaiser_report_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Only restore if less than 1 hour old
        if (Date.now() - parsed.timestamp < 3600000) {
          if (parsed.formData) setFormData(parsed.formData);
          if (parsed.coords) setCoords(parsed.coords);
          if (parsed.isManualMode !== undefined) setIsManualMode(parsed.isManualMode);
          if (parsed.selectedImage) setSelectedImage(parsed.selectedImage);
          if (parsed.isOutsideServicedArea !== undefined) setIsOutsideServicedArea(parsed.isOutsideServicedArea);

          // Reconstruct pseudo-file so validation doesn't block "Generate" if they want to click it again
          if (parsed.selectedImage) {
            fetch(parsed.selectedImage)
              .then(res => res.blob())
              .then(blob => {
                const file = new File([blob], `restored_${Date.now()}.jpg`, { type: "image/jpeg" });
                setSelectedFile(file);
              });
          }
        } else {
          localStorage.removeItem('eaiser_report_state');
        }
      } catch (e) {
        console.error("Failed to restore report state", e);
      }
    }
  }, []);

  const clearPersistence = () => {
    localStorage.removeItem('eaiser_report_state');
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setFormData({ streetAddress: "", zipCode: "" });
    setCoords(null);
    setPhotoCoords(null);
    setVerification(null);
    setIsOutsideServicedArea(false);
    clearPersistence();
    clearReport();
  };


  // Reverse Geocode Helper
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.results.length > 0) {
        const place = data.results[0];
        const zipComponent = place.address_components.find(c => c.types.includes("postal_code"));
        let zip = "";
        if (zipComponent) zip = zipComponent.long_name;

        setFormData((prev) => ({
          ...prev,
          streetAddress: place.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)} (Coordinates Only)`,
          zipCode: zip || prev.zipCode,
        }));

        // Trigger Outside Fairview check
        setIsOutsideServicedArea(!isInsideFairview(lat, lng, zip));
        return zip; // Return zip for immediate checks
      }
      return null;
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return null;
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
    // Guest limit check removed
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
          setMapZoom(20);
          const zip = await reverseGeocode(latitude, longitude);

          // Trigger Outside Fairview check
          setIsOutsideServicedArea(!isInsideFairview(latitude, longitude, zip));

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
        setMapZoom(20);
        setLocationPermission(false); // Because user typed manually

        // Get zip from address if possible or via geocode result
        const zipComponent = data.results[0].address_components.find(c => c.types.includes("postal_code"));
        const zip = zipComponent ? zipComponent.long_name : null;

        // Trigger Outside Fairview check
        setIsOutsideServicedArea(!isInsideFairview(location.lat, location.lng, zip));
      } else {
        await showAlert("Address not found", { variant: 'error' });
      }
    } catch (error) {
      console.error("Geocoding failed", error);
      await showAlert("Failed to get location from address", { variant: 'error' });
    }
  };

  /* 
   * GUEST REPORTING LOGIC REMOVED
   * -------------------------
   */

  const handleGenerateReport = async () => {
    if (!selectedFile && !isManualMode) {
      await showAlert("Please upload an image first.", { variant: 'warning' });
      return;
    }

    if (isManualMode) {
      if (!formData.issueType || formData.issueType === 'other' || !formData.incidentDate || !formData.description || formData.description.trim() === '') {
        await showAlert("All fields (Category, Date, Description) are mandatory for a manual report.", { variant: 'warning', title: "Missing Information" });
        return;
      }
    }

    // ---------------------------------------------------------------
    // LOCATION MANDATORY CHECK
    // ---------------------------------------------------------------
    const hasAddress = formData.streetAddress && formData.streetAddress.trim().length > 0;
    const hasCoords = coords && coords.lat && coords.lng && coords.lat !== 0 && coords.lng !== 0;

    if (!hasAddress || !hasCoords) {
      setLocationMissing(true);
      await showAlert(
        "Location is mandatory. Please use GPS or enter a valid address before generating a report.",
        { variant: 'error', title: 'Location Required' }
      );
      return;
    }
    setLocationMissing(false);
    // ---------------------------------------------------------------

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

    // ---------------------------------------------------------------
    // IMAGE COMPRESSION (For Speed Optimization)
    // ---------------------------------------------------------------
    let fileToUpload = selectedFile;
    if (selectedFile && !isManualMode) {
      try {
        const options = {
          maxSizeMB: 1, // Max 1MB for speed
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        };
        fileToUpload = await imageCompression(selectedFile, options);
        console.log(`Original: ${selectedFile.size / 1024}kb, Compressed: ${fileToUpload.size / 1024}kb`);
      } catch (e) {
        console.warn("Compression failed, using original file", e);
      }
    }

    // Use Context Action
    await generateReport({
      imageFile: isManualMode ? null : fileToUpload,
      description: isManualMode
        ? (formData.description || '')
        : "User reported issue via web interface",
      address: formData.streetAddress,
      zip_code: formData.zipCode || "",
      latitude: coords.lat,
      longitude: coords.lng,
      user_email: userEmail,
      issue_type: isManualMode
        ? (formData.issueType === 'other_issue' ? formData.customIssueType : (formData.issueType || 'Manual Report'))
        : 'other'
    });
    // Report generation is handled by context — after generateReport() completes,
    // reportResult will be set and the component re-renders to show ReportReview.
  }

  // ---------------------------------------------------------------
  // REPORT REVIEW SCREEN - Shown when a report has been generated
  // ---------------------------------------------------------------
  if (reportResult) {
    const resolvedImagePreview =
      selectedImage ||
      (reportResult?.image_content ? `data:image/jpeg;base64,${reportResult.image_content}` : null) ||
      (reportResult?.report?.image_content ? `data:image/jpeg;base64,${reportResult.report.image_content}` : null);

    const resolvedAddress =
      formData.streetAddress ||
      reportResult?.address ||
      reportResult?.report?.address ||
      '';

    const resolvedZip =
      formData.zipCode ||
      reportResult?.zip_code ||
      reportResult?.report?.zip_code ||
      '';

    const resolvedLat =
      coords?.lat ||
      reportResult?.latitude ||
      reportResult?.report?.latitude ||
      null;

    const resolvedLon =
      coords?.lng ||
      reportResult?.longitude ||
      reportResult?.report?.longitude ||
      null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleReset}
            className="mb-4 inline-flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </button>
          <ReportReview
            issue={reportResult}
            imagePreview={resolvedImagePreview}
            imageName={selectedFile?.name || "restored_image.jpg"}
            userAddress={resolvedAddress}
            userZip={resolvedZip}
            userLat={resolvedLat}
            userLon={resolvedLon}
            onClearReport={handleReset}
            isManualMode={isManualMode}
            incidentDate={formData.incidentDate}
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
          "Analyzing visual evidence...",
          "Scanning location data...",
          "Evaluating civic issue patterns...",
          "Cross-referencing databases...",
          "Finalizing analysis..."
        ]}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white w-full overflow-x-hidden">
      <Navbar />
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 pt-20 sm:pt-24 min-w-0 w-full">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          Report an Issue
        </h1>

        {/* Inline error hidden in favor of premium pop-up card */}
        {/* {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm">
            {error}
          </div>
        )} */}

        {/* Manual Mode Toggle */}
        <div className="flex justify-end mb-2">
          {!isManualMode && (
            <button
              onClick={() => {
                setIsManualMode(true);
              }}
              className="text-yellow-500 hover:text-yellow-400 text-sm font-semibold underline"
            >
              Skip & Report Manually
            </button>
          )}
          {isManualMode && (
            <button
              onClick={() => {
                setIsManualMode(false);
                // Reset manual form data if returning
                setFormData(prev => ({ ...prev, issueType: 'other', incidentDate: '', description: '' }));
              }}
              className="text-blue-500 hover:text-blue-400 text-sm font-semibold underline"
            >
              Back to Photo Upload
            </button>
          )}
        </div>

        {/* --- PREMIUM OUTSIDE SERVICED AREA POPUP --- */}
        <AnimatePresence>
          {isOutsideServicedArea && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="relative max-w-md w-full p-8 rounded-[3rem] bg-gradient-to-b from-gray-900 via-black to-gray-900 border border-yellow-500/30 shadow-[0_0_80px_-20px_rgba(234,179,8,0.4)] overflow-hidden"
              >
                {/* Visual Flair: Animated Glow Orb */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-[60px]" />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    {/* Pulsing Radar Ring */}
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping" />
                    <div className="relative w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                      <Globe className="w-8 h-8 text-black" />
                    </div>
                  </div>

                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-2">Service Boundary</span>
                  <h3 className="text-2xl font-black text-white mb-4">Outside Area</h3>

                  <p className="text-gray-300 text-xs leading-relaxed mb-8 font-medium bg-white/5 p-4 rounded-2xl border border-white/5">
                    {OUTSIDE_AREA_MESSAGE}
                  </p>

                  <div className="flex flex-col w-full gap-3">
                    <button
                      onClick={() => setIsOutsideServicedArea(false)}
                      className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-yellow-500/10 active:scale-95 flex items-center justify-center gap-3 group"
                    >
                      <Activity className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Continue Anyway
                    </button>

                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="w-1 h-1 bg-yellow-500/40 rounded-full" />
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest italic">Review Mode Enabled</span>
                      <div className="w-1 h-1 bg-yellow-500/40 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 right-0 p-6">
                  <AlertTriangle className="w-5 h-5 text-yellow-500/10" />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* ------------------------------------------- */}

        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.bmp,.gif,.tiff,.heic"
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          ref={cameraInputRef}
          id="camera-capture"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Manual Mode UI */}
        <AnimatePresence mode="wait">
          {!isManualMode ? (
            <motion.div
              key="photo-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group transition-all duration-500 min-w-0 w-full"
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

                {selectedImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-700 aspect-video bg-black/50 shadow-inner group/preview">
                    {/* Fixed Close Button for Visibility */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-4 right-4 z-[30] p-2 bg-black/60 hover:bg-red-500 text-white rounded-xl backdrop-blur-md border border-white/10 transition-all shadow-lg active:scale-90"
                      title="Remove image"
                    >
                      <X className="w-5 h-5" />
                    </button>

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
                      className="border-2 border-dashed border-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center transition-all duration-500 hover:border-yellow-500/40 hover:bg-yellow-500/[0.02] cursor-pointer group/dropzone flex flex-col items-center justify-center min-w-0 w-full"
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
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col"
                      >
                        {/* iPhone Style Video Container */}
                        <div className="relative flex-1 bg-black flex items-center justify-center">
                          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />

                          {/* Shutter Flash Effect */}
                          <AnimatePresence>
                            {isShutterFlash && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white z-[110]"
                              />
                            )}
                          </AnimatePresence>

                          {/* Subtle HUD Overlay */}
                          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none p-6 flex justify-between items-start">
                            <motion.button
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              onClick={stopCamera}
                              className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto border border-white/10 hover:bg-white/10 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </motion.button>

                            <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Tracking</span>
                            </div>

                            <div className="w-10 h-10" /> {/* Spacer */}
                          </div>

                          {/* Minimalist Grid / Center Target */}
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-full h-[1px] bg-white/10" />
                            <div className="absolute h-full w-[1px] bg-white/10" />
                            <div className="w-48 h-48 border border-white/20 rounded-full flex items-center justify-center">
                              <div className="w-6 h-[1px] bg-white/40 absolute" />
                              <div className="h-6 w-[1px] bg-white/40 absolute" />
                            </div>
                          </div>

                          {/* Snapshot Telemetry (Bottom of Preview) */}
                          <div className="absolute bottom-6 left-6 text-white/60 font-mono text-[8px] uppercase tracking-widest hidden sm:block">
                            GPS: {coords?.lat.toFixed(4) || '---'}, {coords?.lng.toFixed(4) || '---'}
                          </div>
                        </div>

                        {/* iPhone Style Control Bar */}
                        <div className="h-40 bg-black flex flex-col items-center justify-center relative">
                          {/* Mode Selector */}
                          <div className="absolute top-4 flex items-center gap-8">
                            <span className="text-yellow-500 text-[10px] font-black tracking-widest uppercase">Photo</span>
                          </div>

                          <div className="flex items-center justify-between w-full max-w-sm px-8">
                            {/* Gallery/X Placeholder */}
                            <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                              {selectedImage ? (
                                <img src={selectedImage} className="w-full h-full object-cover" alt="last" />
                              ) : (
                                <Zap className="w-5 h-5 text-white/20" />
                              )}
                            </div>

                            {/* Shutter Button (iPhone Style) */}
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={takePhoto}
                              className="relative w-24 h-24 flex items-center justify-center"
                            >
                              {/* Outer white ring */}
                              <div className="absolute inset-0 border-4 border-white rounded-full" />
                              {/* Inner solid white circle with gap */}
                              <div className="w-[78px] h-[78px] bg-white rounded-full border-[6px] border-black shadow-inner" />
                            </motion.button>

                            {/* Flip Camera */}
                            <button
                              onClick={toggleCamera}
                              className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all pointer-events-auto active:rotate-180 duration-500"
                            >
                              <RefreshCw className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Footer Message */}
                          <div className="absolute bottom-4">
                            <p className="text-white/30 text-[9px] uppercase font-black tracking-[8px]">EAiSER Evidence</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Manual Bypass Prompt */}
                    <div className="flex flex-col items-center gap-3 w-full sm:w-auto px-4 sm:px-0 mt-4 sm:mt-0">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[2px] sm:tracking-[4px] mb-1 text-center">Backup Routing</p>
                      <button
                        onClick={() => {
                          setIsManualMode(true);
                          setPhotoCoords(null);
                        }}
                        className="group/manual relative px-4 sm:px-8 py-3 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 rounded-2xl text-[10px] sm:text-xs font-black text-gray-400 hover:text-yellow-500 transition-all overflow-hidden w-full sm:w-auto"
                      >
                        <div className="absolute inset-0 bg-yellow-500/5 translate-y-full group-hover/manual:translate-y-0 transition-transform duration-300" />
                        <span className="relative flex items-center justify-center gap-1.5 sm:gap-2 italic uppercase flex-wrap text-center">
                          Skip photo & report manually <ArrowLeft className="w-3 h-3 rotate-180 shrink-0" />
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
                      onClick={() => {
                        setIsManualMode(false);
                        setFormData(prev => ({ ...prev, issueType: 'other', incidentDate: '', description: '' }));
                      }}
                      className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-wider flex items-center gap-1 group/back"
                    >
                      <ArrowLeft className="w-3 h-3 transition-transform group-hover/back:-translate-x-1" /> Back to Upload
                    </button>
                  </div>
                </div>

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
                      <option value="fire_hazard">Fire Hazard</option>
                      <option value="car_accident">Car Accident</option>
                      <option value="flooding">Flooding</option>
                      <option value="broken_streetlight">Broken Streetlight</option>
                      <option value="road_damage">Road Damage</option>
                      <option value="pothole">Pothole</option>
                      <option value="water_leakage">Water Leakage</option>
                      <option value="fallen_tree">Fallen Tree</option>
                      <option value="garbage_or_trash">Garbage / Trash</option>
                      <option value="dead_animal">Dead Animal</option>
                      <option value="abandoned_vehicle">Abandoned Vehicle</option>
                      <option value="other_issue">Add Manually...</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600 transition-colors group-hover/select:text-yellow-500">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>

                  {formData.issueType === 'other_issue' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">
                        Specify Issue Type
                      </label>
                      <input
                        type="text"
                        name="customIssueType"
                        value={formData.customIssueType || ''}
                        onChange={handleChange}
                        placeholder="e.g. Broken bench, Tree fallen..."
                        className="w-full px-6 py-4 bg-gray-900/40 border border-gray-800 rounded-2xl text-sm text-white outline-none focus:border-yellow-500 focus:bg-gray-900/60 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Date/Time Picker - ULTRA ADVANCED LOOK */}
                <div className="space-y-3 mt-8">
                  <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                    <Calendar className="w-3 h-3 text-blue-500" /> Incident Timeline
                  </label>
                  <div className="relative flex items-center group/date">
                    <div className="absolute left-6 text-blue-500/50 group-focus-within/date:text-blue-500 transition-colors">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      name="incidentDate"
                      value={formData.incidentDate || ''}
                      onChange={handleChange}
                      className="w-full pl-14 pr-6 py-4 bg-gray-900/40 border border-gray-800 rounded-2xl text-sm text-white outline-none focus:border-blue-500/50 focus:bg-gray-900/60 transition-all"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {/* Description Area */}
                <div className="md:col-span-2 space-y-3 mt-8">
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
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                        className="relative group overflow-hidden px-5 py-2.5 bg-gray-900 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-white font-bold uppercase rounded-xl text-[10px] tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center gap-2"
                      >
                        <div className="absolute inset-0 bg-blue-600/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <Upload className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                        <span className="relative z-10">{selectedFile ? 'Change' : 'Add Attachment'}</span>
                      </button>

                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        type="button"
                        className="relative group overflow-hidden px-5 py-2.5 bg-gray-900 border border-yellow-500/30 hover:border-yellow-500 text-yellow-400 hover:text-black font-bold uppercase rounded-xl text-[10px] tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center gap-2"
                      >
                        <div className="absolute inset-0 bg-yellow-500 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <Camera className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                        <span className="relative z-10">Take Photo</span>
                      </button>
                    </div>

                    {selectedImage && (
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-800 shadow-lg group/thumb animate-in fade-in zoom-in duration-300">
                        <img src={selectedImage} alt="attachment" className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            setSelectedImage(null);
                            setSelectedFile(null);
                            setPhotoCoords(null);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-600 rounded-lg shadow-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:scale-110 active:scale-95"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm py-0.5 px-2">
                          <p className="text-[7px] font-bold text-white truncate uppercase tracking-tighter">
                            {selectedFile?.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Location Details Section - Advanced Priority UI */}
        <div className={`bg-gradient-to-br from-gray-900/80 to-black border ${locationMissing ? 'border-red-500/60' : 'border-gray-800'} rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group/loc transition-all min-w-0 w-full`}>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                Incident Location
              </h2>
              <p className={`text-[10px] items-center flex gap-1 mt-1 font-bold uppercase tracking-wider ${locationMissing ? 'text-red-400' : 'text-gray-500'}`}>
                {locationMissing ? '⚠ Location is required to generate report' : 'Precision GPS Tracking Active'}
              </p>
            </div>
            <div className="px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Step 02
            </div>
          </div>

          <div className="space-y-6">
            {/* ADVANCED ACTION: Current Location */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLocationPermission}
              className={`w-full group/locbtn relative overflow-hidden flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 rounded-2xl font-black transition-all duration-500 shadow-2xl min-w-0 ${locationPermission
                ? "bg-gradient-to-r from-emerald-500 to-green-400 text-black shadow-green-500/40"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/40"
                }`}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/locbtn:animate-shimmer" />

              {/* Radial Glow */}
              <div className={`absolute inset-0 opacity-0 group-hover/locbtn:opacity-100 transition-opacity duration-500 ${locationPermission ? "bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0%,transparent_70%)]" : "bg-[radial-gradient(circle,rgba(255,255,255,0.2)_0%,transparent_70%)]"
                }`} />

              <div className="relative flex items-center gap-2 sm:gap-3 uppercase tracking-tighter min-w-0">
                <div className="relative shrink-0">
                  {locationPermission ? (
                    <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 animate-in zoom-in duration-300" />
                  ) : (
                    <>
                      <LocateFixed className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                      <div className="absolute inset-0 bg-white/40 rounded-full animate-ping scale-150 opacity-0 group-hover/locbtn:opacity-100" />
                    </>
                  )}
                </div>
                <span className="text-xs sm:text-base leading-tight text-center">{locationPermission ? "Location Synced Successfully" : "Use My Current Location"}</span>
              </div>
            </motion.button>

            {/* ADVANCED ACTION: Manual Entry */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowManualAddress(!showManualAddress)}
              className={`w-full group/manual relative overflow-hidden flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-4 sm:py-5 rounded-2xl font-black uppercase tracking-tighter transition-all duration-500 shadow-xl border min-w-0 ${showManualAddress
                ? "bg-zinc-800 border-white/30 text-white shadow-white/5"
                : "bg-zinc-900/90 border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                }`}
            >
              {/* Cyber Scanner Line Animation */}
              <div className="absolute inset-0 opacity-0 group-hover/manual:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-scan" />
              </div>

              <div className="relative flex items-center gap-2 sm:gap-3 shrink-0">
                {showManualAddress ? (
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 group-hover:rotate-90 transition-transform duration-300" />
                ) : (
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                )}
                <span className="tracking-widest text-[10px] sm:text-xs text-center">
                  {showManualAddress ? "Hide Manual Entry" : "Or Enter Address Manually"}
                </span>
              </div>
            </motion.button>

            <AnimatePresence>
              {showManualAddress && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
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
                        placeholder="37XXX"
                        className="w-full px-5 py-4 bg-gray-900/50 border border-gray-800 rounded-2xl text-sm focus:border-blue-500 transition-colors text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => getCoordsFromAddress(`${formData.streetAddress} ${formData.zipCode}`)}
                      className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                      <MapPin className="w-3.5 h-3.5" /> View Pin Location
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

          {
            coords && isLoaded && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Real-time Satellite View</p>
                  <span className="text-[10px] font-bold text-gray-500 italic">Drag marker to refine exact spot</span>
                </div>
                <div className="h-96 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl relative group">
                  <GoogleMap
                    center={coords}
                    zoom={mapZoom}
                    onLoad={(map) => {
                      mapRef.current = map;

                      // Listeners to detect view changes
                      map.addListener('maptypeid_changed', () => {
                        const type = map.getMapTypeId();
                        const isSat = type === 'satellite' || type === 'hybrid';
                        const sv = map.getStreetView();
                        setShowMapExit(isSat || (sv && sv.getVisible()));
                      });

                      const sv = map.getStreetView();
                      if (sv) {
                        sv.addListener('visible_changed', () => {
                          const type = map.getMapTypeId();
                          const isSat = type === 'satellite' || type === 'hybrid';
                          setShowMapExit(isSat || sv.getVisible());
                        });
                      }
                    }}
                    onZoomChanged={() => {
                      if (mapRef.current) {
                        setMapZoom(mapRef.current.getZoom());
                      }
                    }}
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    mapTypeId="terrain"
                    options={{
                      streetViewControl: true,
                      mapTypeControl: true,
                      mapTypeControlOptions: {
                        style: 1, // HORIZONTAL_BAR
                        position: 3, // TOP_RIGHT
                        mapTypeIds: ['terrain', 'roadmap', 'satellite', 'hybrid']
                      },
                      fullscreenControl: true,
                      rotateControl: true,
                      tilt: 45, // Enable 45-degree imagery
                    }}
                  >
                    <Marker
                      position={coords}
                      draggable={true}
                      onDragEnd={async (e) => {
                        const lat = e.latLng.lat();
                        const lng = e.latLng.lng();
                        setCoords({ lat, lng });
                        setMapZoom(20);
                        const newZip = await reverseGeocode(lat, lng);

                        // Trigger Outside Fairview check
                        setIsOutsideServicedArea(!isInsideFairview(lat, lng, newZip));
                      }}
                    />
                  </GoogleMap>
                  {showMapExit && (
                    <button
                      type="button"
                      onClick={() => {
                        if (mapRef.current) {
                          // Hide Street View if active
                          const streetView = mapRef.current.getStreetView();
                          if (streetView && streetView.getVisible()) {
                            streetView.setVisible(false);
                          }
                          // Reset to normal terrain view
                          mapRef.current.setMapTypeId('terrain');
                          mapRef.current.setHeading(0);
                          mapRef.current.setTilt(0);
                          setMapZoom(20);
                          setShowMapExit(false);
                        }
                      }}
                      className="absolute bottom-6 left-6 z-[100] px-4 py-2.5 bg-red-600/90 hover:bg-red-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-[0_4px_25px_rgba(220,38,38,0.6)] border border-red-500/50 backdrop-blur-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-all animate-in fade-in zoom-in duration-300"
                    >
                      <X className="w-5 h-5" /> EXIT SATELLITE VIEW
                    </button>
                  )}
                </div>
              </div>
            )
          }
        </div >

        {/* Generate Report Button */}
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className={`w-full mt-6 py-3 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 
            ${loading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-black'}`}
        >
          {
            loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {isManualMode ? "Submitting..." : "Generating..."}
              </>
            ) : (
              <>
                {isManualMode ? <Send className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                {isManualMode ? "Submit Report" : "Generate Report"}
              </>
            )}
        </button>


      </div>
    </div>
  );
}

<style>{`
  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(200%) skewX(-15deg); }
  }
  @keyframes scan {
    0% { top: 0; opacity: 0; }
    50% { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  .animate-shimmer {
    animation: shimmer 2.5s infinite;
  }
  .animate-scan {
    animation: scan 2s linear infinite;
  }
`}</style>
