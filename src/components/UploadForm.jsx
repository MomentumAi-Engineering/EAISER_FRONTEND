import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  MapPin,
  FileText,
  Edit,
  Check,
  X,
  Loader,
  AlertCircle,
  Image as ImageIcon,
  Map,
  Navigation,
  RotateCcw,
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
  Info,
  Star,
  Shield,
  Clock,
  Target,
  Users,
  Building,
  Zap,
  Mail,
  Phone,
  PenTool
} from 'lucide-react';
import './UploadForm.css';
import API_BASE_URL from '../config';
import heic2any from 'heic2any';
import LocationInput from './LocationInput';

function UploadForm({ setStatus, fetchIssues }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportPreview, setReportPreview] = useState(null);
  const [issueId, setIssueId] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showAuthoritySelector, setShowAuthoritySelector] = useState(false);
  const [availableAuthorities, setAvailableAuthorities] = useState({});
  const [selectedAuthorities, setSelectedAuthorities] = useState([]);
  const [emailingAuthorities, setEmailingAuthorities] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');

  // NEW: Manual Report Mode State (Manual Trigger)
  const [isManualMode, setIsManualMode] = useState(false);

  // alert modal state
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'error' });

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const severities = [
    { value: 'low', label: 'Low', color: 'bg-green-500', icon: <Star className="w-4 h-4" /> },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500', icon: <Clock className="w-4 h-4" /> },
    { value: 'high', label: 'High', color: 'bg-orange-500', icon: <AlertCircle className="w-4 h-4" /> },
    { value: 'critical', label: 'Critical', color: 'bg-red-500', icon: <Zap className="w-4 h-4" /> }
  ];

  const formSteps = [
    { title: 'Visual Evidence', icon: <ImageIcon className="w-5 h-5" /> },
    { title: 'Location', icon: <MapPin className="w-5 h-5" /> },
    { title: 'Review', icon: <FileText className="w-5 h-5" /> }
  ];

  // Debug API response
  useEffect(() => {
    if (reportPreview) {
      console.log('Report Preview:', reportPreview);
    }
  }, [reportPreview]);

  // Fetch authorities based on zip code from editedReport
  useEffect(() => {
    if (editedReport && editedReport.location && editedReport.location.zip_code) {
      fetchAuthoritiesByZipCode(editedReport.location.zip_code);
    }
  }, [editedReport]);

  // Fetch authorities when user enters zip code manually
  useEffect(() => {
    if (zipCode && zipCode.length >= 5) { // US zip codes are typically 5 digits
      fetchAuthoritiesByZipCode(zipCode);
    }
  }, [zipCode]);

  // Fetch authorities by zip code
  const fetchAuthoritiesByZipCode = async (zipCode) => {
    console.log('Fetching authorities for zip code:', zipCode);
    try {
      const response = await fetch(`${API_BASE_URL}/authorities/${zipCode}`);
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch authorities');
      }
      const data = await response.json();
      console.log('Authorities data received:', data);
      setAvailableAuthorities(data);

      // Initialize selected authorities from current report
      if (editedReport && editedReport.responsible_authorities_or_parties) {
        setSelectedAuthorities(editedReport.responsible_authorities_or_parties);
      }
    } catch (error) {
      console.error('Error fetching authorities:', error);
      setStatus('Error fetching authorities. Using default list.');
    }
  };

  const handleImageChange = async (e) => {
    let file = e.target.files[0];
    if (file) {
      // Check for HEIC format
      if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith('.heic')) {
        try {
          setIsLoading(true);
          setStatus('Converting HEIC image to JPEG...');

          const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8
          });

          // Handle case where heic2any returns array (multi-frame heic) vs single blob
          const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

          file = new File([finalBlob], file.name.replace(/\.heic$/i, ".jpg"), {
            type: "image/jpeg",
            lastModified: new Date().getTime()
          });

          setStatus('Image converted successfully');
        } catch (err) {
          console.error("HEIC conversion failed:", err);
          setStatus("Failed to process HEIC image. Please try a JPEG/PNG.");
          setFormErrors({ ...formErrors, image: 'Failed to process HEIC file' });
          setIsLoading(false);
          return;
        } finally {
          setIsLoading(false);
        }
      }

      if (file.size > 5 * 1024 * 1024) {
        setStatus('Image size exceeds 5MB limit');
        setFormErrors({ ...formErrors, image: 'Image size exceeds 5MB limit' });
        return;
      }
      setImage(file);
      setIsManualMode(false); // Reset manual mode
      setFormErrors({ ...formErrors, image: null });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setActiveStep(1); // Move to next step
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setIsCameraActive(true);
      setStatus('Camera started. Click "Capture Photo" to take a picture.');
    } catch (error) {
      setStatus('Error accessing camera: ' + error.message);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    canvas.toBlob((blob) => {
      const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
      if (file.size > 5 * 1024 * 1024) {
        setStatus('Captured image size exceeds 5MB limit');
        setFormErrors({ ...formErrors, image: 'Captured image size exceeds 5MB limit' });
        return;
      }
      setImage(file);
      setIsManualMode(false); // Reset manual mode
      setFormErrors({ ...formErrors, image: null });
      setPreview(imageDataUrl);
      setIsCameraActive(false);
      // Stop the camera stream
      const stream = video.srcObject;
      stream.getTracks().forEach(track => track.stop());
      setStatus('Photo captured successfully!');
      setActiveStep(1); // Move to next step
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  // NEW: Handler for Manual Mode
  const enterManualMode = () => {
    setIsManualMode(true);
    setImage(null);
    setPreview(null);
    setFormErrors({ ...formErrors, image: null });
    setActiveStep(1); // Skip to location
  };

  // Location logic moved to LocationInput component
  // But we keep this handler for the child component to call
  const handleLocationChange = (data) => {
    setAddress(data.address);
    setZipCode(data.zipCode);
    setCoordinates({
      latitude: data.latitude,
      longitude: data.longitude
    });
    setFormErrors({ ...formErrors, location: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = {};
    if (!image && !isManualMode) errors.image = 'Please upload or capture an image';
    if (!address && !coordinates && !zipCode) errors.location = 'Please provide an address, zip code, or use current location';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    // setStatus not needed here as we use custom UI for scanning
    const formData = new FormData();
    if (image) {
      formData.append('image', image);
    }
    // Note: If isManualMode, we don't append image. Backend handles "image is None".

    formData.append('address', address);
    formData.append('zip_code', zipCode);

    if (coordinates) {
      formData.append('latitude', coordinates.latitude);
      formData.append('longitude', coordinates.longitude);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/issues`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || 'Failed to generate report';
        } catch (e) {
          errorMessage = errorText || 'Failed to generate report';
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setStatus('Report generated! Please review.');
      setReportPreview(result.report);
      setEditedReport(result.report.report);
      setIssueId(result.id);

      // Auto-enable edit mode for Manual Reports as they are "blank" templates
      if (isManualMode) {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }

      setImage(null);
      setPreview(null);
      setAddress('');
      setZipCode('');
      setCoordinates(null);
      setActiveStep(2); // Move to review step
    } catch (error) {
      console.error('Submit error:', error);

      const errorMsg = error.message.toLowerCase();
      let alertTitle = 'Submission Failed';
      let alertType = 'error';

      if (errorMsg.includes('fake') || errorMsg.includes('ai-generated') || errorMsg.includes('manipulated')) {
        alertTitle = '⚠️ Fake Image Detected';
        setStatus('Analysis failed: This image appears to be AI-generated or manipulated.');
      } else if (errorMsg.includes('blurry') || errorMsg.includes('unclear')) {
        alertTitle = '📸 Image Too Blurry';
        alertType = 'warning';
        setStatus('Analysis failed: The image is too blurry to analyze.');
      } else if (errorMsg.includes('size')) {
        alertTitle = '📁 File Too Large';
      } else {
        setStatus(`Submit error: ${error.message}`);
      }

      setAlertModal({
        show: true,
        title: alertTitle,
        message: error.message,
        type: alertType
      });

      setFormErrors({ ...formErrors, submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditChange = (section, field, value, index = null) => {
    setEditedReport((prev) => {
      const updated = { ...prev };
      if (section) {
        // Initialize section if it doesn't exist
        if (!updated[section]) {
          updated[section] = {};
        }
        updated[section][field] = value;
      } else if (index !== null) {
        updated[field][index] = value;
      }
      return updated;
    });
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setStatus(isEditing ? 'Report preview updated.' : 'Editing report...');
  };

  const handleAccept = async () => {
    setIsLoading(true);
    setStatus('Submitting report...');

    try {
      const response = await fetch(`${API_BASE_URL}/issues/${issueId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edited_report: editedReport,
          selected_authorities: selectedAuthorities // Pass selected authorities to backend
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('Thank you for using SnapFix!');
        setStatus(`Issue submitted successfully! ID: ${result.id}`);
        fetchIssues();
        resetForm(); // Full reset on success
      } else {
        setStatus(`Error: ${result.detail || 'Failed to submit issue'}`);
        setFormErrors({ ...formErrors, accept: result.detail || 'Failed to submit issue' });
      }
    } catch (error) {
      setStatus('Network error. Please try again.');
      console.error('Accept error:', error);
      setFormErrors({ ...formErrors, accept: 'Network error. Please try again' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    setShowDeclineForm(true);
    setStatus('Please provide a reason for rejecting the report.');
  };

  const handleDeclineSubmit = async (e) => {
    e.preventDefault();

    if (!declineReason) {
      setStatus('Please provide a decline reason.');
      setFormErrors({ ...formErrors, decline: 'Please provide a decline reason' });
      return;
    }

    setIsLoading(true);
    setStatus('Generating updated report...');

    try {
      const response = await fetch(`${API_BASE_URL}/issues/${issueId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decline_reason: declineReason, edited_report: editedReport }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('Updated report generated! Please review.');
        setReportPreview(result.report);
        setEditedReport(result.report.report);
        setShowDeclineForm(false);
        setDeclineReason('');
        setFormErrors({ ...formErrors, decline: null });

        // If it was manual, keep editing mode enabled because context is still manual
        if (isManualMode) {
          setIsEditing(true);
        }

      } else {
        setStatus(`Error: ${result.detail || 'Failed to generate updated report'}`);
        setFormErrors({ ...formErrors, decline: result.detail || 'Failed to generate updated report' });
      }
    } catch (error) {
      setStatus('Network error. Please try again.');
      console.error('Decline error:', error);
      setFormErrors({ ...formErrors, decline: 'Network error. Please try again' });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (activeStep < formSteps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const resetForm = () => {
    setImage(null);
    setPreview(null);
    setAddress('');
    setZipCode('');
    setCoordinates(null);
    setReportPreview(null);
    setIssueId(null);
    setDeclineReason('');
    setShowDeclineForm(false);
    setIsEditing(false);
    setEditedReport(null);
    setSuccessMessage('');
    setActiveStep(0);
    setFormErrors({});
    setIsManualMode(false);
    stopCamera();
    setSelectedAuthorities([]);
  };

  // Handle authority selection
  const handleAuthoritySelection = (authority, type) => {
    // Create authority object with proper type
    const authorityWithType = {
      ...authority,
      type: type || authority.type
    };

    // Check if authority is already selected
    const isSelected = selectedAuthorities.some(a =>
      a.name === authorityWithType.name && a.type === authorityWithType.type
    );

    if (isSelected) {
      // Remove from selection
      setSelectedAuthorities(selectedAuthorities.filter(a =>
        !(a.name === authorityWithType.name && a.type === authorityWithType.type)
      ));
    } else {
      // Add to selection
      setSelectedAuthorities([...selectedAuthorities, authorityWithType]);
    }
  };

  // Save selected authorities
  const saveSelectedAuthorities = () => {
    setEditedReport(prev => ({
      ...prev,
      responsible_authorities_or_parties: selectedAuthorities
    }));
    setShowAuthoritySelector(false);
    setStatus('Authorities updated successfully');
  };

  // Send email to selected authorities
  const sendEmailToAuthorities = async () => {
    if (selectedAuthorities.length === 0) {
      setEmailStatus('Please select at least one authority to send email');
      return;
    }

    setEmailingAuthorities(true);
    setEmailStatus('Sending emails...');

    try {
      const emailData = {
        issue_id: issueId,
        authorities: selectedAuthorities,
        report_data: editedReport,
        zip_code: editedReport.location?.zip_code || zipCode
      };

      const response = await fetch(`${API_BASE_URL}/send-authority-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error('Failed to send emails');
      }

      const result = await response.json();
      setEmailStatus(`✅ Emails sent successfully to ${selectedAuthorities.length} authorities`);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setEmailStatus('');
      }, 3000);

    } catch (error) {
      console.error('Error sending emails:', error);
      setEmailStatus(`❌ Failed to send emails: ${error.message}`);
    } finally {
      setEmailingAuthorities(false);
    }
  };

  // Determine if authorities should be shown automatically
  // Show if AI confidence is Medium/High (>= 40%) OR if user has manually selected authorities (even if low confidence)
  // For LOW confidence (<40%), we default to hiding the *list* and just showing the button to add manually.
  // Manual Report confidence is 0, so it falls into Low Confidence flow.
  const confidence = editedReport?.issue_overview?.confidence || 0;
  const isLowConfidence = confidence < 40;
  // If we have recommendations AND high confidence, show them.
  // If manual or low confidence, we hide recommendations initally to avoid bad AI data.
  const showRecommendedAuthorities = !isLowConfidence;

  return (
    <motion.div
      className="upload-form-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="form-header">
        <motion.div
          className="header-icon-container"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          <div className="header-icon-bg">
            <Camera className="header-icon" />
          </div>
        </motion.div>
        <div>
          <h3 className="form-title">Report an Issue</h3>
          <p className="form-subtitle">Help improve your community by reporting issues</p>

          {/* NUCLEAR TEST BUTTON */}
          <button
            type="button"
            onClick={enterManualMode}
            className="w-full bg-red-600 text-white font-bold py-4 px-6 rounded-xl mt-4 text-xl hover:bg-red-700 transition"
          >
            🚨 CLICK HERE FOR MANUAL REPORT (TEST)
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="steps-container">
        {formSteps.map((step, index) => (
          <motion.div
            key={index}
            className={`step ${index <= activeStep ? 'active' : ''} ${index < activeStep ? 'completed' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="step-number">
              {index < activeStep ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            <div className="step-info">
              <div className="step-icon">{step.icon}</div>
              <span className="step-title">{step.title}</span>
            </div>
            {index < formSteps.length - 1 && <div className="step-line"></div>}
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode='wait'>
        {!reportPreview ? (
          <motion.form
            className="issue-form"
            onSubmit={handleSubmit}
            key="form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <AnimatePresence mode='wait'>
              {/* Step 1: Visual Evidence */}
              {activeStep === 0 && (
                <motion.div
                  className="form-step"
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="form-section">
                    <div className="section-header">
                      <label className="section-label">Visual Evidence</label>
                      <div className="section-tooltip">
                        <Info className="tooltip-icon" />
                        <span className="tooltip-text">Upload a clear photo of the issue you're reporting</span>
                      </div>
                    </div>

                    <div className={`image-upload-area ${preview ? 'has-image' : ''} ${formErrors.image ? 'has-error' : ''}`}>
                      {preview ? (
                        <div className="image-preview-container">
                          <motion.img
                            src={preview}
                            alt="Preview"
                            className="image-preview"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          />
                          <div className="image-buttons">
                            <motion.button
                              type="button"
                              className="change-image-btn"
                              onClick={triggerFileInput}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Upload className="w-4 h-4" /> Change Image
                            </motion.button>
                            <motion.button
                              type="button"
                              className="capture-image-btn bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-200"
                              onClick={() => {
                                setImage(null);
                                setPreview(null);
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <X className="w-4 h-4" /> Remove
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          {isCameraActive ? (
                            <div className="camera-container">
                              <video ref={videoRef} className="camera-stream" autoPlay />
                              <canvas ref={canvasRef} style={{ display: 'none' }} />
                              <div className="camera-controls">
                                <motion.button
                                  type="button"
                                  className="capture-btn"
                                  onClick={capturePhoto}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <div className="capture-circle"></div>
                                </motion.button>
                                <motion.button
                                  type="button"
                                  className="cancel-btn"
                                  onClick={stopCamera}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <X className="w-6 h-6" />
                                </motion.button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <motion.div
                                className="upload-icon-container"
                                animate={{
                                  y: [0, -10, 0],
                                  rotate: [0, 5, 0, -5, 0]
                                }}
                                transition={{
                                  duration: 4,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <ImageIcon className="upload-icon" />
                              </motion.div>
                              <p>Click to upload or capture an image</p>
                              <p className="hint">Max 5MB • JPEG, PNG</p>
                              <div className="image-buttons">
                                <motion.button
                                  type="button"
                                  className="upload-btn"
                                  onClick={triggerFileInput}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Upload className="w-4 h-4" /> Upload Image
                                </motion.button>
                                <motion.button
                                  type="button"
                                  className="capture-btn"
                                  onClick={startCamera}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Camera className="w-4 h-4" /> Capture Photo
                                </motion.button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="file-input"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isCameraActive}
                      />
                    </div>
                    {formErrors.image && (
                      <motion.div
                        className="error-message"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <AlertCircle className="error-icon" />
                        {formErrors.image}
                      </motion.div>
                    )}

                    {/* Manual Mode Option */}
                    {!preview && !isCameraActive && (
                      <div className="text-center mt-4 border-t border-gray-700/50 pt-4">
                        <p className="text-gray-400 text-sm mb-2">Can't take a photo?</p>
                        <motion.button
                          type="button"
                          onClick={enterManualMode}
                          className="text-purple-400 hover:text-purple-300 text-sm font-medium underline flex items-center justify-center gap-1 mx-auto"
                          whileHover={{ scale: 1.05 }}
                        >
                          <PenTool className="w-3 h-3" /> Continue with Manual Report
                        </motion.button>
                      </div>
                    )}

                  </div>

                  <div className="form-navigation" style={{ justifyContent: 'flex-end' }}>
                    <motion.button
                      type="button"
                      className="nav-btn next"
                      onClick={nextStep}
                      disabled={!image && !isManualMode}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Location */}
              {activeStep === 1 && (
                <motion.div
                  className="form-step"
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="form-section">
                    <div className="section-header">
                      <label className="section-label">Location</label>
                      <div className="section-tooltip">
                        <Info className="tooltip-icon" />
                        <span className="tooltip-text">Provide the exact location of the issue</span>
                      </div>
                    </div>

                    <LocationInput
                      onLocationChange={handleLocationChange}
                      initialCoordinates={coordinates}
                    />

                    {formErrors.location && (
                      <motion.div
                        className="error-message mt-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <AlertCircle className="error-icon" />
                        {formErrors.location}
                      </motion.div>
                    )}
                  </div>

                  <div className="form-navigation">
                    <motion.button
                      type="button"
                      className="nav-btn prev"
                      onClick={prevStep}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </motion.button>
                    <motion.button
                      type="submit"
                      className={`nav-btn submit ${isLoading ? 'loading' : ''}`}
                      disabled={isLoading || (!image && !isManualMode) || (!address && !coordinates && !zipCode)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isLoading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Generate Report
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        ) : (
          <motion.div
            className="report-preview-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="preview-header">
              <div className="header-left">
                <div className="header-icon-bg">
                  <FileText className="header-icon" />
                </div>
                <div>
                  <h3 className="preview-title">Review Generated Report</h3>
                  <p className="preview-subtitle">Issue #{issueId}</p>
                </div>
              </div>

              <motion.button
                className="edit-btn"
                onClick={toggleEdit}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" /> Save Draft
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" /> Edit Report
                  </>
                )}
              </motion.button>
            </div>

            {/* Low Confidence / Manual Banner */}
            {isLowConfidence && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-yellow-500 font-semibold text-sm">
                    {isManualMode ? "Manual Report Mode" : "Low Confidence Analysis"}
                  </h4>
                  <p className="text-gray-300 text-xs mt-1">
                    {isManualMode
                      ? "You are submitting a manual report. Please ensure all details are correct and select the appropriate authorities manually."
                      : "The AI had low confidence in this analysis. Please verify all details and select authorities manually if needed."}
                  </p>
                </div>
              </div>
            )}

            <div className="report-content">
              <div className="report-section">
                <h4 className="section-title">
                  <Target className="section-icon" /> Issue Overview
                </h4>
                <div className="report-grid">
                  <div className="report-item">
                    <label className="report-label">Type</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedReport.issue_overview.issue_type}
                        onChange={(e) => handleEditChange('issue_overview', 'issue_type', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <p className="report-value">{editedReport.issue_overview.issue_type}</p>
                    )}
                  </div>

                  <div className="report-item">
                    <label className="report-label">Severity</label>
                    {isEditing ? (
                      <select
                        value={editedReport.issue_overview.severity}
                        onChange={(e) => handleEditChange('issue_overview', 'severity', e.target.value)}
                        className="edit-select"
                      >
                        {severities.map((severity) => (
                          <option key={severity.value} value={severity.value}>{severity.label}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="severity-display">
                        {severities.find(s => s.value === editedReport.issue_overview.severity)?.icon}
                        <span>{severities.find(s => s.value === editedReport.issue_overview.severity)?.label}</span>
                      </div>
                    )}
                  </div>

                  <div className="report-item">
                    <label className="report-label">Confidence</label>
                    <div className="confidence-bar">
                      <div className="confidence-track">
                        <motion.div
                          className="confidence-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${editedReport.issue_overview.confidence}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        ></motion.div>
                      </div>
                      <span>{editedReport.issue_overview.confidence}%</span>
                    </div>
                  </div>

                  <div className="report-item">
                    <label className="report-label">Category</label>
                    <p className="report-value">{editedReport.issue_overview.category}</p>
                  </div>
                </div>

                <div className="report-item full-width">
                  <label className="report-label">Summary</label>
                  {isEditing ? (
                    <textarea
                      value={editedReport.issue_overview.summary_explanation}
                      onChange={(e) => handleEditChange('issue_overview', 'summary_explanation', e.target.value)}
                      className="edit-textarea"
                      rows="4"
                      maxLength={200}
                    />
                  ) : (
                    <p className="report-value">{editedReport.issue_overview.summary_explanation}</p>
                  )}
                </div>
              </div>

              <div className="report-section">
                <h4 className="section-title">
                  <MapPin className="section-icon" /> Location Details
                </h4>
                <div className="report-grid">
                  <div className="report-item">
                    <label className="report-label">Address</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedReport.location?.address || reportPreview.report.template_fields.address || ''}
                        onChange={(e) => handleEditChange('location', 'address', e.target.value)}
                        className="edit-input"
                        placeholder="Enter address"
                      />
                    ) : (
                      <p className="report-value">{editedReport.location?.address || reportPreview.report.template_fields.address || 'Not specified'}</p>
                    )}
                  </div>

                  <div className="report-item">
                    <label className="report-label">Zip Code</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedReport.location?.zip_code || reportPreview.report.template_fields.zip_code || ''}
                        onChange={(e) => {
                          const newZipCode = e.target.value;
                          handleEditChange('location', 'zip_code', newZipCode);
                          // Fetch authorities when zip code changes
                          if (newZipCode && newZipCode.length >= 5) {
                            fetchAuthoritiesByZipCode(newZipCode);
                          }
                        }}
                        className="edit-input"
                        placeholder="Enter zip code"
                        maxLength={5}
                        pattern="\d{5}"
                      />
                    ) : (
                      <p className="report-value">{editedReport.location?.zip_code || reportPreview.report.template_fields.zip_code || 'Not specified'}</p>
                    )}
                  </div>

                  <div className="report-item full-width">
                    <label className="report-label">Map Link</label>
                    <a
                      href={reportPreview.report.template_fields.map_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="map-link"
                    >
                      <Map className="w-4 h-4" /> View on Map
                    </a>
                  </div>
                </div>
              </div>

              {!isManualMode && (
                <div className="report-section">
                  <h4 className="section-title">
                    <ImageIcon className="section-icon" /> Photo Evidence
                  </h4>
                  {reportPreview.image_content ? (
                    <motion.div
                      className="image-container"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <img
                        src={`data:image/jpeg;base64,${reportPreview.image_content}`}
                        alt="Issue"
                        className="report-image"
                      />
                      <div className="image-info">
                        <p>{reportPreview.report.template_fields.image_filename || 'Not specified'}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="no-image">
                      <ImageIcon className="no-image-icon" />
                      <p>No image available</p>
                    </div>
                  )}
                </div>
              )}

              {!isManualMode && (
                <div className="report-section">
                  <h4 className="section-title">
                    <Target className="section-icon" /> Recommended Actions
                  </h4>
                  {isEditing ? (
                    <div className="actions-list">
                      {editedReport.recommended_actions.map((action, index) => (
                        <div key={index} className="action-item">
                          <input
                            type="text"
                            value={action}
                            onChange={(e) => handleEditChange(null, 'recommended_actions', e.target.value, index)}
                            className="edit-input"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="actions-list">
                      {editedReport.recommended_actions.map((action, index) => (
                        <motion.li
                          key={index}
                          className="action-item"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Check className="action-icon" />
                          {action}
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {!isManualMode && (
                <div className="report-section">
                  <h4 className="section-title">
                    <Shield className="section-icon" /> AI Analysis
                  </h4>
                  <div className="analysis-grid">
                    <div className="analysis-item">
                      <label className="analysis-label">Potential Impact</label>
                      <p className="analysis-value">{editedReport.detailed_analysis.potential_consequences_if_ignored}</p>
                    </div>

                    <div className="analysis-item">
                      <label className="analysis-label">Urgency Reason</label>
                      <p className="analysis-value">{editedReport.detailed_analysis.public_safety_risk}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="report-section">
                <h4 className="section-title">
                  <Users className="section-icon" /> Responsible Authorities
                  <button
                    type="button"
                    className="edit-authorities-btn"
                    onClick={() => setShowAuthoritySelector(true)}
                  >
                    <Edit className="w-4 h-4" />  {selectedAuthorities.length > 0 ? "Edit Selection" : "Select Authorities"}
                  </button>
                </h4>

                {/* Adaptive Authority Display */}
                {showRecommendedAuthorities ? (
                  <div className="authorities-grid">
                    {editedReport.responsible_authorities_or_parties.map((authority, index) => (
                      <motion.div
                        key={index}
                        className="authority-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                      >
                        <div className="authority-icon">
                          <Building className="w-5 h-5" />
                        </div>
                        <div className="authority-info">
                          <h5 className="authority-name">{authority.name}</h5>
                          <p className="authority-type">{authority.type}</p>
                        </div>
                      </motion.div>
                    ))}
                    {editedReport.responsible_authorities_or_parties.length === 0 && (
                      <p className="text-gray-400 text-sm italic">No specific authorities recommended by AI.</p>
                    )}
                  </div>
                ) : (
                  <div className="low-confidence-authority-msg bg-gray-600/20 p-4 rounded-lg border border-dashed border-gray-600">
                    <p className="text-gray-300 text-sm mb-2">
                      {isManualMode
                        ? "Manual Reporting: Please select authorities manually."
                        : "Due to low confidence, no authorities were automatically recommended."
                      }
                    </p>
                    <button
                      onClick={() => setShowAuthoritySelector(true)}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-2 rounded flex items-center gap-2 transition-colors"
                    >
                      <Users className="w-4 h-4" /> Open Authority Selector
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!showDeclineForm ? (
              <div className="report-actions">
                <motion.button
                  className="action-btn accept"
                  onClick={handleAccept}
                  disabled={isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" /> Accepting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Accept Report
                    </>
                  )}
                </motion.button>

                <motion.button
                  className="action-btn decline"
                  onClick={handleDecline}
                  disabled={isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4" /> Decline Report
                </motion.button>

                <motion.button
                  className="action-btn secondary"
                  onClick={resetForm}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw className="w-4 h-4" /> New Report
                </motion.button>
              </div>
            ) : (
              <motion.form
                onSubmit={handleDeclineSubmit}
                className="decline-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="form-section">
                  <label className="section-label">Reason for Declining</label>
                  <textarea
                    className="form-textarea"
                    rows="4"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Please explain why you are declining this report..."
                    required
                  />
                  {formErrors.decline && (
                    <motion.div
                      className="error-message"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <AlertCircle className="error-icon" />
                      {formErrors.decline}
                    </motion.div>
                  )}
                </div>

                <div className="form-actions">
                  <motion.button
                    type="button"
                    className="action-btn secondary"
                    onClick={() => setShowDeclineForm(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    type="submit"
                    className={`action-btn submit ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading || !declineReason}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Feedback
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            )}

            <AnimatePresence>
              {successMessage && (
                <motion.div
                  className="success-message"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="success-icon-bg">
                    <Check className="success-icon" />
                  </div>
                  <p>{successMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Authority Selector Modal */}
      <AnimatePresence>
        {showAuthoritySelector && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuthoritySelector(false)}
          >
            <motion.div
              className="authority-selector-modal"
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  <Users className="w-5 h-5" />
                  Select Authorities for {editedReport?.location?.zip_code || zipCode}
                </h3>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowAuthoritySelector(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="modal-content">
                {emailStatus && (
                  <motion.div
                    className={`email-status ${emailStatus.includes('✅') ? 'success' : emailStatus.includes('❌') ? 'error' : 'info'}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {emailStatus}
                  </motion.div>
                )}

                <div className="authorities-section">
                  <h4>Available Authorities ({Object.keys(availableAuthorities).length})</h4>
                  <p className="section-description">
                    Select multiple authorities to send your report. You can choose any authority,
                    not just the recommended ones.
                  </p>
                  {/* console.log('Available authorities in modal:', availableAuthorities) */}
                  <div className="authorities-grid">
                    {Object.entries(availableAuthorities).map(([type, authorities]) => (
                      authorities.map((authority, index) => {
                        const isSelected = selectedAuthorities.some(selected =>
                          selected.name === authority.name && selected.type === type
                        );
                        const isRecommended = editedReport?.responsible_authorities_or_parties?.some(rec =>
                          rec.name === authority.name && rec.type === type
                        );

                        return (
                          <motion.div
                            key={`${type}-${index}`}
                            className={`authority-card selectable ${isSelected ? 'selected' : ''
                              } ${isRecommended ? 'recommended' : ''}`}
                            onClick={() => handleAuthoritySelection(authority, type)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="authority-header">
                              <div className="authority-icon">
                                <Building className="w-4 h-4" />
                              </div>
                              <div className="authority-badges">
                                {isRecommended && (
                                  <span className="badge recommended-badge">
                                    <Star className="w-3 h-3" /> Recommended
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="badge selected-badge">
                                    <Check className="w-3 h-3" /> Selected
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="authority-info">
                              <h5 className="authority-name">{authority.name}</h5>
                              <p className="authority-type">{type.replace('_', ' ').toUpperCase()}</p>
                              {authority.email && (
                                <p className="authority-email">
                                  <Mail className="w-3 h-3" /> {authority.email}
                                </p>
                              )}
                              {authority.phone && (
                                <p className="authority-phone">
                                  <Phone className="w-3 h-3" /> {authority.phone}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    ))}
                  </div>
                </div>

                {selectedAuthorities.length > 0 && (
                  <div className="selected-authorities-section">
                    <h4>Selected Authorities ({selectedAuthorities.length})</h4>
                    <div className="selected-authorities-list">
                      {selectedAuthorities.map((authority, index) => (
                        <motion.div
                          key={index}
                          className="selected-authority-item"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                        >
                          <Building className="w-4 h-4" />
                          <span>{authority.name} ({authority.type})</span>
                          <button
                            className="remove-authority-btn"
                            onClick={() => handleAuthoritySelection(authority, authority.type)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <motion.button
                  className="modal-btn secondary"
                  onClick={() => setShowAuthoritySelector(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>

                <motion.button
                  className="modal-btn primary"
                  onClick={saveSelectedAuthorities}
                  disabled={selectedAuthorities.length === 0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Save className="w-4 h-4" />
                  Save Selection ({selectedAuthorities.length})
                </motion.button>

                <motion.button
                  className={`modal-btn email ${emailingAuthorities ? 'loading' : ''}`}
                  onClick={sendEmailToAuthorities}
                  disabled={selectedAuthorities.length === 0 || emailingAuthorities}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {emailingAuthorities ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Email to Selected ({selectedAuthorities.length})
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* AI Scanner Overlay - Utilising Portal to break out of all containers */}
      {isLoading && createPortal(
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
              {preview && (
                <img src={preview} alt="Scanning" className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale" />
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

      {/* Alert Modal */}
      <AnimatePresence>
        {alertModal.show && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAlertModal({ ...alertModal, show: false })}
          >
            <motion.div
              className={`authority-selector-modal alert-modal ${alertModal.type}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '400px', textAlign: 'center' }}
            >
              <div className="modal-header" style={{ justifyContent: 'center', borderBottom: 'none', paddingBottom: 0 }}>
                <div className={`alert-icon-wrapper ${alertModal.type === 'error' ? 'text-red-500' : 'text-yellow-500'}`}>
                  {alertModal.type === 'error' ? (
                    <Shield className="w-12 h-12 mx-auto mb-2" />
                  ) : (
                    <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  )}
                </div>
              </div>

              <div className="modal-content" style={{ padding: '0 20px 20px' }}>
                <h3 className="text-xl font-bold mb-2 text-white">{alertModal.title}</h3>
                <p className="text-gray-300 mb-6">{alertModal.message}</p>

                <motion.button
                  className="action-btn secondary"
                  onClick={() => setAlertModal({ ...alertModal, show: false })}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  OK, I Understand
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper component for cycling text
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

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(messages[i]);
      i = (i + 1) % messages.length;
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return <div className="text-gray-400 font-mono text-sm uppercase">{text}</div>;
};

export default UploadForm;