import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Upload, Camera, MapPin, Navigation, X, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import ReportReview from "../components/ReportReview";
import LocationPicker from "../components/LocationPicker";

export default function SimpleReport() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [coords, setCoords] = useState({ latitude: 0.0, longitude: 0.0 });
  const [formData, setFormData] = useState({ streetAddress: "", zipCode: "" });
  const [loading, setLoading] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mobileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleMobileCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file) => {
    if (file) {
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);

      // Compress
      try {
        const compressed = await compressImage(file, 1024, 0.5); // Max 1024px, 0.5 quality
        setSelectedFile(compressed);
        console.log(`Compressed image: ${file.size / 1024}KB -> ${compressed.size / 1024}KB`);
      } catch (err) {
        console.error("Compression failed, using original:", err);
        setSelectedFile(file);
      }
    }
  };

  const compressImage = (file, maxWidth, quality) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const elem = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
          elem.width = width;
          elem.height = height;
          const ctx = elem.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          elem.toBlob((blob) => {
            if (!blob) { reject(new Error('Canvas is empty')); return; }
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          }, 'image/jpeg', quality);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setIsCameraActive(true);
      // Wait for the video element to be rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera, falling back to mobile capture:", err);
      // Fallback for mobile/insecure contexts
      if (mobileInputRef.current) {
        mobileInputRef.current.click();
      } else {
        alert("Could not access camera. Please check permissions or try uploading a file.");
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageDataUrl = canvas.toDataURL('image/jpeg');
      setSelectedImage(imageDataUrl);

      // Convert to file
      canvas.toBlob((blob) => {
        const file = new File([blob], "captured-photo.jpg", { type: "image/jpeg", lastModified: Date.now() });
        setSelectedFile(file);
      }, 'image/jpeg');

      stopCamera();
    }
  };

  const handleCapture = () => {
    startCamera();
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLocationUpdate = (data) => {
    setCoords({ latitude: data.latitude, longitude: data.longitude });
    setFormData({
      streetAddress: data.address,
      zipCode: data.zipCode
    });
    setLocationPermission(true); // Implicitly granted via map interaction
  };

  const handleGenerateReport = async () => {
    if (!selectedFile) {
      alert("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare payload
      // createIssue( { imageFile, description, address, zip_code, latitude, longitude, ... } )
      const response = await apiClient.createIssue({
        imageFile: selectedFile,
        description: "User reported issue via web interface", // Optional description
        address: formData.streetAddress || "",
        zip_code: formData.zipCode || "",
        latitude: coords.latitude,
        longitude: coords.longitude,
        // user_email: "test@example.com" // You might want to get this from auth context if available
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

  // Check if manual entry has any values
  const hasManualEntry = formData.streetAddress.trim() !== "" || formData.zipCode.trim() !== "";

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
            userLat={coords.latitude}
            userLon={coords.longitude}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-2 inline-flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          {/* <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center">
            <Upload className="w-5 h-5 text-yellow-400" />
          </div> */}
          Report an Issue
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

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

          {/* Hidden Fallback Input for Mobile Camera */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={mobileInputRef}
            onChange={handleMobileCapture}
            className="hidden"
          />
        </div>

        {/* Location Section */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" /> Location Details
          </h2>

          <LocationPicker
            onLocationChange={handleLocationUpdate}
            initialCoords={coords.latitude !== 0 ? { lat: coords.latitude, lng: coords.longitude } : { lat: 36.1627, lng: -86.7816 }}
          />
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
      {/* Camera Overlay */}
      {isCameraActive && createPortal(
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden border border-gray-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-[60vh] object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera Controls */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8">
              <button
                onClick={stopCamera}
                className="p-4 rounded-full bg-gray-800/80 text-white backdrop-blur-sm border border-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              <button
                onClick={capturePhoto}
                className="p-1 rounded-full border-4 border-white/30"
              >
                <div className="w-16 h-16 bg-white rounded-full active:scale-95 transition-transform" />
              </button>
            </div>
          </div>
          <p className="text-gray-400 mt-4 text-sm">Make sure the issue is clearly visible</p>
        </div>,
        document.body
      )}

      {/* AI Scanner Overlay */}
      {loading && createPortal(
        <AnimatePresence>
          <motion.div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl w-screen h-screen top-0 left-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Main Scanner Container */}
            <div className="relative w-80 h-96 border-2 border-green-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.3)] bg-black">
              {/* User Image Background (Dimmed) */}
              {selectedImage && (
                <img src={selectedImage} alt="Scanning" className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale" />
              )}

              {/* Grid Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

              {/* Laser Scanning Line */}
              <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-green-400 shadow-[0_0_20px_#4ade80]"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />

              {/* HUD Corners */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-green-500"></div>
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-green-500"></div>
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-green-500"></div>
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-green-500"></div>

              {/* Central Aim */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border border-green-500/30 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-40 h-40 border border-green-500/20 rounded-full flex items-center justify-center animate-spin-slow">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Status Text */}
            <div className="mt-8 text-center space-y-2">
              <motion.div
                className="text-green-400 font-mono text-xl tracking-widest font-bold"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                AI ANALYSIS IN PROGRESS
              </motion.div>

              <ScanningText />

              {/* Progress Bar pretending to load */}
              <div className="w-64 h-1 bg-gray-800 rounded-full mt-4 overflow-hidden">
                <motion.div
                  className="h-full bg-green-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 8, ease: "easeInOut" }}
                />
              </div>
            </div>

          </motion.div>
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}

// Helper component
const ScanningText = () => {
  const [text, setText] = useState("Initializing sensors...");
  const messages = [
    "Analyzing surface texture...",
    "Measuring crack depth...",
    "Identifying hazards...",
    "Calculating severity score...",
    "Matching location data...",
    "Generating final report..."
  ];

  React.useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(messages[i]);
      i = (i + 1) % messages.length;
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return <div className="text-gray-400 font-mono text-sm uppercase">{text}</div>;
};
