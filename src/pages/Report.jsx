import React, { useState } from 'react';
import { Upload, Camera, MapPin, Navigation, FileText, Clock, Image, X, Sparkles, Loader2, Heart } from 'lucide-react';
import apiClient from '../services/apiClient';
import ReportReview from '../components/ReportReview'; // Modular review panel component

export default function EaiserReport() {
  // Keep both the preview (data URL) and the original File for upload
  const [selectedImage, setSelectedImage] = useState(null); // preview data URL for UI
  const [selectedFile, setSelectedFile] = useState(null); // actual File for backend upload
  const [locationPermission, setLocationPermission] = useState(false);
  const [coords, setCoords] = useState({ latitude: 0.0, longitude: 0.0 }); // GPS coords for backend
  const [formData, setFormData] = useState({
    zipCode: '',
    streetAddress: '',
    description: ''
  });
  const [issueResult, setIssueResult] = useState(null); // store backend response for review UI
  const [systemReport, setSystemReport] = useState(null); // store public system report for UI display
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedAuthorities, setSelectedAuthorities] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [authoritiesByZip, setAuthoritiesByZip] = useState([]);
  const [editedSummary, setEditedSummary] = useState('');
  const [showAuthEditor, setShowAuthEditor] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Save File object for FormData upload
      setSelectedFile(file);

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
          // Persist coordinates for backend payload
          setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
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

  const handleGenerateReport = async () => {
    if (!selectedFile) {
      alert('Please upload an image first.');
      return;
    }
    setGeneratingReport(true);
    try {
      const payload = {
        imageFile: selectedFile,
        description: formData.description || '',
        address: formData.streetAddress,
        zip_code: formData.zipCode || undefined,
        latitude: coords.latitude || 0.0,
        longitude: coords.longitude || 0.0,
        user_email: undefined,
        issue_type: 'other',
      };
      const response = await apiClient.createIssue(payload);
      setIssueResult(response);
      const recommended = response?.report?.report?.responsible_authorities_or_parties || [];
      const avail = response?.report?.available_authorities || response?.available_authorities || [];
      setSelectedAuthorities(Array.isArray(recommended) && recommended.length > 0 ? recommended : avail);
      const initialSummary = response?.report?.report?.issue_overview?.summary_explanation || response?.report?.summary || '';
      setEditedSummary(initialSummary);
      const z = formData.zipCode || response?.zip_code || '';
      if (z) {
        try {
          const authorities = await apiClient.getAuthoritiesByZip(z);
          const flat = Object.values(authorities || {}).flat();
          setAuthoritiesByZip(Array.isArray(flat) ? flat : []);
        } catch {
          setAuthoritiesByZip([]);
        }
      }
      const resId = response?.id || response?.issue_id || response?.data?.id || 'N/A';
      alert(`Issue created! ID: ${resId}`);
    } catch (err) {
      alert(`Failed to create issue: ${err.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedFile) {
      alert('Please upload an image first.');
      return;
    }
    try {
      setAnalyzing(true);
      const form = new FormData();
      form.append("image", selectedFile);  // KEY MUST MATCH backend

      const result = await apiClient.analyzeImage(form);

      setAnalysis(result);
      setFormData(f => ({ ...f, description: result?.description || f.description }));
    } catch (err) {
      console.error('Failed to analyze image:', err);
      alert(`Failed to analyze image: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleAuthority = (auth) => {
    const key = `${auth.email}|${auth.name}|${auth.type}`;
    setSelectedAuthorities((prev) => {
      const exists = prev.some(a => `${a.email}|${a.name}|${a.type}` === key);
      if (exists) return prev.filter(a => `${a.email}|${a.name}|${a.type}` !== key);
      return [...prev, auth];
    });
  };

  const handleSubmitToAuthorities = async () => {
    if (!issueResult?.id) {
      alert('Issue not ready to submit.');
      return;
    }
    if (!selectedAuthorities || selectedAuthorities.length === 0) {
      alert('Please select at least one authority.');
      return;
    }
    try {
      setSubmitting(true);
      const edited_report = editedSummary ? { issue_overview: { summary_explanation: editedSummary } } : undefined;
      const res = await apiClient.submitIssue(issueResult.id, selectedAuthorities, edited_report);
      // alert('Issue submitted to authorities.'); // Removed alert in favor of modal
      setIssueResult({ ...issueResult, submitted: true, submitResult: res });
      setShowThankYou(true);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (e) {
      alert(`Failed to submit: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
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
                      onClick={() => { setSelectedImage(null); setSelectedFile(null); }} // Clear both preview and file
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

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  onClick={() => { setSelectedImage(null); setSelectedFile(null); setAnalysis(null); }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-gray-600 rounded-xl text-sm font-semibold transition-all"
                >
                  <X className="w-4 h-4" />
                  Clear Photo
                </button>
                <button
                  onClick={handleAnalyzeImage}
                  disabled={analyzing}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${analyzing ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300' : 'bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-300'}`}
                >
                  <Sparkles className="w-4 h-4" />
                  {analyzing ? 'Analyzing...' : 'Analyze Image'}
                </button>
                
              </div>

              {analysis && (
                <div className="mt-4 bg-white/5 border border-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-2">Detected Issues</h3>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.issues || []).map((it, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full text-xs bg-red-500/20 border border-red-500/40 text-red-300">
                        {it}
                      </span>
                    ))}
                    {(!analysis.issues || analysis.issues.length === 0) && (
                      <span className="text-xs text-gray-400">No explicit issues listed</span>
                    )}
                  </div>
                  {analysis.labels && analysis.labels.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-gray-400 mb-1">Scene Labels</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.labels.map((l, i) => (
                          <span key={i} className="px-2 py-1 rounded-md text-xs bg-blue-500/20 border border-blue-500/40 text-blue-300">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                id="edit-summary"
              />
              {analysis && (
                <p className="mt-2 text-xs text-gray-400">Auto-filled from image analysis. You can edit as needed.</p>
              )}
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
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${locationPermission
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

            

            
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <button
            onClick={handlePrevious}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-bold transition-all"
          >
            <Clock className="w-5 h-5" />
            Previous Reports
          </button>
          <button
            onClick={async () => {
              try {
                // Call public report endpoint to verify connectivity
                const result = await apiClient.getPublicReport({ report_type: 'performance', format: 'json' });
                setSystemReport(result); // store for UI display
                console.log('Public report:', result);
                alert('Fetched performance report.');
              } catch (e) {
                console.error('Failed to fetch public report:', e);
                alert(`Failed to fetch report: ${e.message}`);
              }
            }}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-bold transition-all"
          >
            <FileText className="w-5 h-5" />
            Fetch System Report
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-black transition-all hover:shadow-lg hover:shadow-yellow-500/20 ${generatingReport
                ? 'bg-gradient-to-r from-yellow-500/70 to-amber-500/70 cursor-wait'
                : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400'
              }`}
          >
            {generatingReport ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generate Report
              </>
            )}
          </button>
        </div>
        {/* Report Review Panel - shows after successful submission */}
        {issueResult && (
          <ReportReview
            issue={issueResult}
            imagePreview={selectedImage}
            analysisDescription={analysis?.description || formData.description}
            userAddress={formData.streetAddress}
            userZip={formData.zipCode}
            userLat={coords.latitude}
            userLon={coords.longitude}
            imageName={selectedFile?.name || ''}
          />
        )}

        {issueResult && (
          <div className="mt-6 bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-bold mb-3">Select Authorities & Submit</h2>
            <p className="text-xs text-gray-400 mb-3">AI selected authorities based on issue and ZIP. You can edit before submitting.</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-400 mb-2">Edit AI Report Summary</label>
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 focus:border-yellow-500/50 rounded-xl text-white text-sm placeholder-gray-500 outline-none transition-all"
                placeholder="Edit the AI-generated summary before submission"
              />
            </div>
            {!showAuthEditor && (
              <div className="mb-4">
                <button
                  onClick={() => setShowAuthEditor(true)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-xl text-sm"
                >
                  Edit Authorities
                </button>
              </div>
            )}
            {showAuthEditor && (
              <>
                <div className="grid md:grid-cols-2 gap-3 mb-4">
                  {(issueResult.report?.available_authorities || []).map((auth, idx) => {
                    const checked = selectedAuthorities.some(a => a.email === auth.email && a.name === auth.name && a.type === auth.type);
                    return (
                      <label key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${checked ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-gray-700 bg-white/5'}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleAuthority(auth)} />
                        <div className="text-sm">
                          <div className="font-semibold">{auth.name || 'Authority'}</div>
                          <div className="text-xs text-gray-400">{auth.email || '—'} • {auth.type || '—'}</div>
                        </div>
                      </label>
                    );
                  })}
                  {(issueResult.report?.available_authorities || []).length === 0 && (
                    <p className="text-xs text-gray-400">No authorities listed for this issue.</p>
                  )}
                </div>
                {/* Extra authority by ZIP removed per request */}
              </>
            )}
            <button
              onClick={handleSubmitToAuthorities}
              disabled={submitting || issueResult?.submitted}
              className={`px-6 py-3 rounded-xl font-bold ${submitting ? 'bg-gray-700 text-gray-300' : 'bg-green-600 hover:bg-green-500 text-white'} transition-all`}
            >
              {submitting ? 'Submitting...' : (issueResult?.submitted ? 'Already Submitted' : 'Submit to Authorities')}
            </button>
          </div>
        )}

        {/* Thank You Modal */}
        {showThankYou && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl shadow-yellow-500/20 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-yellow-500/30">
                <Heart className="w-10 h-10 text-yellow-500 fill-yellow-500/20" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Thank You!</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Thank you for using <span className="text-yellow-500 font-semibold">Eaiser AI</span>.
                <br />
                <span className="text-sm text-gray-400">Your contribution helps build a better community.</span>
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Refreshing page...</span>
              </div>
            </div>
          </div>
        )}

        {/* System Report Display (public metrics) */}
        {systemReport && (
          <div className="mt-8 bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold mb-3">System Report</h2>
            <pre className="text-xs bg-white/5 border border-gray-700 rounded-xl p-4 overflow-auto text-gray-300">
              {JSON.stringify(systemReport, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}