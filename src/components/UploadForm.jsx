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

    // Attach user email to link issue to account
    const user = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
    if (user && user.email) {
      formData.append('user_email', user.email);
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

      // 🛡️ BLOCK REPORT GENERATION IF REJECTED
      const summaryText = result.report?.issue_overview?.summary_explanation || "";
      const isRejected = summaryText.includes("Please provide the correct image");
      const aiDetectedNoIssue = result.report?.ai_evaluation?.issue_detected === false;

      // Always block if explicitly rejected as Fake/Cartoon/No-Issue
      if (isRejected || (aiDetectedNoIssue && !isManualMode)) {
        setStatus('Analysis Failed');
        setAlertModal({
          show: true,
          title: '⚠️ Validation Error',
          message: isRejected ? summaryText : "No civic issue detected in this image. Please provide a clear photo of an infrastructure problem.",
          type: 'warning'
        });
        setIsLoading(false);
        setActiveStep(0); // Reset to upload step
        return; // STOP: Do not proceed to report review
      }

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
        setStatus('Analysis failed: Please provide the correct image. No issue, animated, or fake image detected.');
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
      className="upload-form-container relative overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]"
          animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="form-header relative z-10">
        <motion.div
          className="header-icon-container"
          initial={{ scale: 0.8, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <div className="header-icon-bg relative group">
            <div className="absolute inset-0 bg-blue-500/30 blur-md group-hover:blur-xl transition-all duration-500 opacity-50"></div>
            <Camera className="header-icon relative z-10 w-8 h-8" />
          </div>
        </motion.div>
        <div className="flex-1">
          <h3 className="form-title text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-blue-400">
            Report an Issue
          </h3>
          <p className="form-subtitle text-blue-300/60 font-medium tracking-wide">
            AI-POWERED ANALYSIS & REPORTING SYSTEM
          </p>
        </div>

        {/* Advanced Manual Mode Trigger */}
        <motion.button
          type="button"
          onClick={enterManualMode}
          className="group relative px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-blue-500/50 rounded-lg overflow-hidden transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-center gap-2 relative z-10">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs font-bold text-gray-300 group-hover:text-blue-200 uppercase tracking-wider">Manual Override</span>
          </div>
        </motion.button>
      </div>

      {/* Progress Steps */}
      <div className="steps-container relative z-10 mb-10 px-4">
        {/* Connecting Line Background */}
        <div className="absolute top-[22px] left-[10%] right-[10%] h-[2px] bg-gray-700/50 rounded-full z-0"></div>

        {/* Animated Progress Line */}
        <motion.div
          className="absolute top-[22px] left-[10%] h-[2px] bg-gradient-to-r from-blue-500 to-purple-500 rounded-full z-0 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          initial={{ width: "0%" }}
          animate={{ width: `${(activeStep / (formSteps.length - 1)) * 80}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {formSteps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;

          return (
            <motion.div
              key={index}
              className={`step flex flex-col items-center relative z-10 ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className={`step-number w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 relative
                  ${isActive
                    ? 'bg-gray-900 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                    : isCompleted
                      ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      : 'bg-gray-800/80 border-gray-700 text-gray-500'
                  }`}
                animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={isActive ? { repeat: Infinity, duration: 2 } : {}}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}

                {/* Active Ripple */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border border-blue-500"
                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </motion.div>

              <div className="step-info mt-3 flex flex-col items-center gap-1">
                <span className={`step-title text-xs font-bold uppercase tracking-wider transition-colors duration-300
                  ${isActive || isCompleted ? 'text-blue-200' : 'text-gray-600'}
                `}>
                  {step.title}
                </span>
              </div>
            </motion.div>
          );
        })}
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
                  <div className="form-section relative overflow-hidden group">
                    {/* Holographic Border Effect */}
                    <div className="absolute inset-0 border border-blue-500/20 rounded-2xl z-0 pointer-events-none"></div>
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg"></div>

                    <div className="section-header relative z-10 mb-6">
                      <label className="section-label flex items-center gap-2 text-xl font-bold text-blue-100">
                        <Camera className="w-5 h-5 text-blue-400" />
                        Visual Evidence
                      </label>
                      <div className="section-tooltip ml-auto">
                        <Info className="tooltip-icon text-blue-400/50 hover:text-blue-400 transition-colors" />
                        <span className="tooltip-text">Upload a clear photo of the issue you're reporting</span>
                      </div>
                    </div>

                    <div
                      className={`image-upload-area relative transition-all duration-300 ${preview ? 'has-image' : ''} ${formErrors.image ? 'border-red-500/50 bg-red-500/5' : 'border-blue-500/30 hover:border-blue-400/60 bg-blue-500/5 hover:bg-blue-500/10'}`}
                      style={{ borderRadius: '16px', borderStyle: 'dashed', borderWidth: '2px' }}
                    >
                      {/* Scanning Grid Background */}
                      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(0deg,transparent_24%,#3b82f6_25%,#3b82f6_26%,transparent_27%,transparent_74%,#3b82f6_75%,#3b82f6_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,#3b82f6_25%,#3b82f6_26%,transparent_27%,transparent_74%,#3b82f6_75%,#3b82f6_76%,transparent_77%,transparent)] bg-[size:40px_40px] pointer-events-none"></div>

                      {preview ? (
                        <div className="image-preview-container relative z-10 w-full flex flex-col items-center">
                          <motion.div
                            className="relative rounded-lg overflow-hidden border border-blue-500/30 shadow-2xl"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <img
                              src={preview}
                              alt="Preview"
                              className="image-preview max-h-[300px] object-contain bg-black/50"
                            />
                            {/* Scanning Line Animation overlay on preview */}
                            <motion.div
                              className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none"
                              animate={{ top: ['-100%', '100%'] }}
                              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            />
                          </motion.div>

                          <div className="image-buttons mt-6 flex gap-4">
                            <motion.button
                              type="button"
                              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/40 flex items-center gap-2"
                              onClick={triggerFileInput}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Upload className="w-4 h-4" /> Change Frame
                            </motion.button>
                            <motion.button
                              type="button"
                              className="px-6 py-2 bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 text-red-200 rounded-lg font-bold flex items-center gap-2"
                              onClick={() => {
                                setImage(null);
                                setPreview(null);
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <X className="w-4 h-4" /> Discard
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-placeholder py-12 flex flex-col items-center justify-center relative z-10">
                          {isCameraActive ? (
                            <div className="camera-container rounded-xl overflow-hidden border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                              <video ref={videoRef} className="camera-stream w-full max-w-md" autoPlay />
                              <canvas ref={canvasRef} style={{ display: 'none' }} />

                              {/* Camera HUD Overlay */}
                              <div className="absolute inset-0 pointer-events-none border-[20px] border-black/30">
                                <div className="absolute top-4 left-4 w-16 h-[2px] bg-green-500/80"></div>
                                <div className="absolute top-4 left-4 w-[2px] h-16 bg-green-500/80"></div>
                                <div className="absolute bottom-4 right-4 w-16 h-[2px] bg-green-500/80"></div>
                                <div className="absolute bottom-4 right-4 w-[2px] h-16 bg-green-500/80"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-12 h-12 border border-green-500/50 rounded-full flex items-center justify-center">
                                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                  </div>
                                </div>
                              </div>

                              <div className="camera-controls absolute bottom-4 left-0 right-0 flex justify-center gap-8 pointer-events-auto">
                                <motion.button
                                  type="button"
                                  className="w-16 h-16 rounded-full bg-white/20 backdrop-blur border-2 border-white flex items-center justify-center hover:bg-white/30 transition-all"
                                  onClick={capturePhoto}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <div className="w-12 h-12 bg-white rounded-full"></div>
                                </motion.button>
                                <motion.button
                                  type="button"
                                  className="w-12 h-12 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-600 transition-all"
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
                                className="upload-icon-container relative mb-6"
                                animate={{
                                  y: [0, -10, 0],
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                                <ImageIcon className="upload-icon w-20 h-20 text-blue-400 relative z-10" />
                              </motion.div>
                              <h4 className="text-xl font-bold text-white mb-2">Upload Evidence</h4>
                              <p className="text-blue-200/60 mb-8 max-w-sm mx-auto">
                                Drag & drop or capture a photo. AI analysis will begin automatically.
                              </p>

                              <div className="image-buttons flex gap-4 w-full max-w-md justify-center">
                                <motion.button
                                  type="button"
                                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                                  onClick={triggerFileInput}
                                  whileHover={{ scale: 1.02, translateY: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Upload className="w-5 h-5" /> Select File
                                </motion.button>
                                <motion.button
                                  type="button"
                                  className="flex-1 py-3 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-bold border border-gray-600 flex items-center justify-center gap-2"
                                  onClick={startCamera}
                                  whileHover={{ scale: 1.02, translateY: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Camera className="w-5 h-5" /> Camera
                                </motion.button>
                              </div>
                              <p className="hint text-xs mt-4 text-gray-500">Supports JPEG, PNG, HEIC • Max 10MB</p>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="file-input hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isCameraActive}
                      />
                    </div>
                    {formErrors.image && (
                      <motion.div
                        className="error-message mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <AlertCircle className="w-5 h-5" />
                        {formErrors.image}
                      </motion.div>
                    )}

                    {/* Manual Mode Option */}
                    {!preview && !isCameraActive && (
                      <div className="text-center mt-6 pt-6 border-t border-blue-500/20">
                        <motion.button
                          type="button"
                          onClick={enterManualMode}
                          className="group relative px-6 py-2 rounded-full bg-gray-900 border border-gray-700 hover:border-purple-500/50 transition-colors mx-auto flex items-center gap-2 overflow-hidden"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                          <PenTool className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-gray-300 group-hover:text-purple-200">Continue with Manual Report</span>
                          <ChevronRight className="w-4 h-4 text-purple-500/50 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </div>
                    )}

                  </div>

                  <div className="form-navigation flex justify-end">
                    <motion.button
                      type="button"
                      className="nav-btn next px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/40 flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
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
                  <div className="form-section relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full blur-xl pointer-events-none"></div>

                    <div className="section-header relative z-10 mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                      <label className="section-label flex items-center gap-2 text-xl font-bold text-white">
                        <MapPin className="w-5 h-5 text-blue-400" /> Location
                      </label>
                      <div className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 text-xs text-blue-300">
                        Geospatial Data
                      </div>
                    </div>

                    <LocationInput
                      onLocationChange={handleLocationChange}
                      initialCoordinates={coordinates}
                    />

                    {formErrors.location && (
                      <motion.div
                        className="error-message mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {formErrors.location}
                      </motion.div>
                    )}
                  </div>

                  <div className="form-navigation flex justify-between gap-4 mt-6">
                    <motion.button
                      type="button"
                      className="nav-btn prev px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold border border-gray-600 flex items-center gap-2"
                      onClick={prevStep}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </motion.button>
                    <motion.button
                      type="submit"
                      className={`nav-btn submit px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 ${isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-green-900/40'}`}
                      disabled={isLoading || (!image && !isManualMode) || (!address && !coordinates && !zipCode)}
                      whileHover={!isLoading ? { scale: 1.05 } : {}}
                      whileTap={!isLoading ? { scale: 0.95 } : {}}
                    >
                      {isLoading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" /> Generating Report...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Generate Analysis
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
            className="report-preview-container relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            {/* Holographic Card Container */}
            <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-3xl rounded-3xl -z-10 border border-blue-500/30 shadow-2xl"></div>

            <div className="preview-header flex items-center justify-between p-6 border-b border-blue-500/20 bg-black/20 rounded-t-3xl">
              <div className="header-left flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-wide">Analysis Report</h3>
                  <p className="text-sm text-blue-300/70 font-mono">ID: #{issueId}</p>
                </div>
              </div>

              <motion.button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isEditing ? 'bg-green-500/20 text-green-300 border border-green-500/50' : 'bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20'}`}
                onClick={toggleEdit}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" /> Edit Details
                  </>
                )}
              </motion.button>
            </div>

            {/* Low Confidence / Manual Banner */}
            {isLowConfidence && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-yellow-500/10 border-b border-yellow-500/20 p-4 flex items-start gap-4"
              >
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h4 className="text-yellow-500 font-bold text-sm tracking-wide uppercase mb-1">
                    {isManualMode ? "Manual Override Protocol Active" : "Low Confidence Detected"}
                  </h4>
                  <p className="text-yellow-200/70 text-xs leading-relaxed max-w-2xl">
                    {isManualMode
                      ? "System operating in manual mode. User input required for accurate classification and routing."
                      : (editedReport?.issue_overview?.summary_explanation?.includes("Please provide the correct image")
                        ? "Please provide the correct image. No civic issue, animated, or fake image detected."
                        : "AI analysis returned low confidence scores. Please manually verify all data points before submission.")}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="report-content p-8 space-y-8">
              <motion.div
                className="report-section bg-black/20 rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-colors duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h4 className="flex items-center gap-2 text-lg font-bold text-blue-200 mb-6 pb-2 border-b border-white/5">
                  <Target className="w-5 h-5 text-blue-400" /> Issue Overview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedReport.issue_overview.issue_type}
                        onChange={(e) => handleEditChange('issue_overview', 'issue_type', e.target.value)}
                        className="w-full bg-black/40 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                      />
                    ) : (
                      <p className="text-lg font-medium text-white">{editedReport.issue_overview.issue_type}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Severity</label>
                    {isEditing ? (
                      <select
                        value={editedReport.issue_overview.severity}
                        onChange={(e) => handleEditChange('issue_overview', 'severity', e.target.value)}
                        className="w-full bg-black/40 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                      >
                        {severities.map((severity) => (
                          <option key={severity.value} value={severity.value}>{severity.label}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${severities.find(s => s.value === editedReport.issue_overview.severity)?.color || 'bg-gray-500'} shadow-[0_0_10px_currentColor]`}></div>
                        <span className="text-lg font-medium text-white capitalize">{editedReport.issue_overview.severity}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Confidence</label>
                    <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700 relative">
                      <motion.div
                        className={`h-full ${isManualMode ? 'bg-gray-600' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${editedReport.issue_overview.confidence}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      ></motion.div>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white shadow-black drop-shadow-md">
                        {isManualMode ? 'N/A' : `${editedReport.issue_overview.confidence}%`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                    <p className="text-lg font-medium text-white">{editedReport.issue_overview.category}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Summary</label>
                  {isEditing ? (
                    <textarea
                      value={editedReport.issue_overview.summary_explanation}
                      onChange={(e) => handleEditChange('issue_overview', 'summary_explanation', e.target.value)}
                      className="w-full bg-black/40 border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono min-h-[100px]"
                      rows="3"
                      maxLength={200}
                    />
                  ) : (
                    <p className="text-gray-300 leading-relaxed border-l-2 border-blue-500/50 pl-4 py-1">
                      {editedReport.issue_overview.summary_explanation}
                    </p>
                  )}
                </div>
              </motion.div>

              <motion.div
                className="report-section bg-black/20 rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-colors duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="flex items-center gap-2 text-lg font-bold text-blue-200 mb-6 pb-2 border-b border-white/5">
                  <MapPin className="w-5 h-5 text-blue-400" /> Location Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Address</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedReport.location?.address || reportPreview.report.template_fields.address || ''}
                        onChange={(e) => handleEditChange('location', 'address', e.target.value)}
                        className="w-full bg-black/40 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                        placeholder="Enter address"
                      />
                    ) : (
                      <p className="text-lg font-medium text-white truncate" title={editedReport.location?.address}>
                        {editedReport.location?.address || reportPreview.report.template_fields.address || 'Not specified'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Zip Code</label>
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
                        className="w-full bg-black/40 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                        placeholder="Enter zip code"
                        maxLength={5}
                        pattern="\d{5}"
                      />
                    ) : (
                      <p className="text-lg font-medium text-white font-mono tracking-wider">{editedReport.location?.zip_code || reportPreview.report.template_fields.zip_code || 'Not specified'}</p>
                    )}
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Map Reference</label>
                    <a
                      href={reportPreview.report.template_fields.map_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900/20 text-blue-300 hover:bg-blue-900/40 hover:text-white transition-all border border-blue-500/30 group"
                    >
                      <Map className="w-4 h-4 group-hover:scale-110 transition-transform" /> View Geospatial Data
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  </div>
                </div>
              </motion.div>

              {!isManualMode && (
                <motion.div
                  className="report-section bg-black/20 rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-colors duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h4 className="flex items-center gap-2 text-lg font-bold text-blue-200 mb-6 pb-2 border-b border-white/5">
                    <ImageIcon className="w-5 h-5 text-blue-400" /> Evidence Analysis
                  </h4>
                  {reportPreview.image_content ? (
                    <motion.div
                      className="relative rounded-xl overflow-hidden border border-gray-700 group max-w-md mx-auto"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <img
                        src={`data:image/jpeg;base64,${reportPreview.image_content}`}
                        alt="Evidence"
                        className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                        <span className="text-xs text-green-400 font-mono">HASH: {issueId.substring(0, 8)}... VALID</span>
                      </div>

                      {/* Corner markers */}
                      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/50"></div>
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/50"></div>
                    </motion.div>
                  ) : (
                    <div className="text-gray-400 text-center py-6 italic border border-dashed border-gray-700 rounded-xl">No imagery available</div>
                  )}
                </motion.div>
              )}

              {!isManualMode && (
                <motion.div
                  className="report-section bg-black/20 rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-colors duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h4 className="flex items-center gap-2 text-lg font-bold text-blue-200 mb-6 pb-2 border-b border-white/5">
                    <Shield className="w-5 h-5 text-blue-400" /> AI Deep Analysis
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-xl">
                      <label className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 block">Potential Impact</label>
                      <p className="text-sm text-gray-300 leading-relaxed">{editedReport.detailed_analysis.potential_consequences_if_ignored}</p>
                    </div>

                    <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-xl">
                      <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2 block">Safety Risk Assessment</label>
                      <p className="text-sm text-gray-300 leading-relaxed">{editedReport.detailed_analysis.public_safety_risk}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                className="report-section bg-black/20 rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-colors duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
                  <h4 className="flex items-center gap-2 text-lg font-bold text-blue-200">
                    <Users className="w-5 h-5 text-blue-400" /> Responsible Authorities
                  </h4>
                  <motion.button
                    type="button"
                    className="flex items-center gap-2 text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all"
                    onClick={() => setShowAuthoritySelector(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit className="w-3 h-3" />  {selectedAuthorities.length > 0 ? "Edit Selection" : "Select Authorities"}
                  </motion.button>
                </div>

                {/* Adaptive Authority Display */}
                {showRecommendedAuthorities ? (
                  <div className="grid gap-3">
                    {editedReport.responsible_authorities_or_parties.map((authority, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-500/30 text-blue-400">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-white text-sm">{authority.name}</h5>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">{authority.type}</p>
                        </div>
                      </motion.div>
                    ))}
                    {editedReport.responsible_authorities_or_parties.length === 0 && (
                      <p className="text-gray-400 text-sm italic text-center py-4">No specific authorities recommended by AI.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-yellow-900/5 rounded-xl border border-dashed border-yellow-700/30 tex-center">
                    <AlertCircle className="w-8 h-8 text-yellow-600/50 mb-3" />
                    <p className="text-yellow-500/70 text-sm mb-4 text-center">
                      {isManualMode
                        ? "Manual Reporting Mode: Authority selection required."
                        : "Low confidence analysis. Manual authority selection recommended."
                      }
                    </p>
                    <motion.button
                      onClick={() => setShowAuthoritySelector(true)}
                      className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-200 text-sm px-6 py-2 rounded-full border border-yellow-500/30 flex items-center gap-2 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Users className="w-4 h-4" /> Open Authority Matrix
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>

            {!showDeclineForm ? (
              <div className="report-actions flex flex-wrap gap-4 mt-8 pb-8 border-t border-white/5 pt-8">
                <motion.button
                  className="flex-[2] py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                  onClick={handleAccept}
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.02, translateY: -2 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" /> Process...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" /> CONFIRM & SEND REPORT
                    </>
                  )}
                </motion.button>

                <motion.button
                  className="flex-1 py-4 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  onClick={handleDecline}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="w-5 h-5" /> Decline
                </motion.button>

                <motion.button
                  className="flex-none px-4 py-4 bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white rounded-xl font-bold border border-gray-700 flex items-center justify-center gap-2 transition-colors"
                  onClick={resetForm}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Start Over"
                >
                  <RotateCcw className="w-5 h-5" />
                </motion.button>
              </div>
            ) : (
              <motion.form
                onSubmit={handleDeclineSubmit}
                className="decline-form mt-8 bg-red-900/10 border border-red-500/20 rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="form-section mb-6">
                  <label className="block text-red-300 font-bold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Reason for Rejection
                  </label>
                  <textarea
                    className="w-full bg-black/40 border border-red-500/30 rounded-xl p-4 text-white focus:outline-none focus:border-red-500 transition-colors min-h-[120px]"
                    rows="4"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Please explain why the AI analysis is incorrect or why you are declining the report..."
                    required
                  />
                  {formErrors.decline && (
                    <motion.div
                      className="mt-2 text-red-400 text-sm flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.decline}
                    </motion.div>
                  )}
                </div>

                <div className="form-actions flex gap-4">
                  <motion.button
                    type="button"
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold border border-gray-600"
                    onClick={() => setShowDeclineForm(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    type="submit"
                    className={`flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 disabled:opacity-50`}
                    disabled={isLoading || !declineReason}
                    whileHover={!isLoading ? { scale: 1.02 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
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
      {/* Authority Selector Modal */}
      <AnimatePresence>
        {showAuthoritySelector && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuthoritySelector(false)}
          >
            <motion.div
              className="bg-[#0f172a] border border-blue-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-900/30 p-2 rounded-lg border border-blue-500/30">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-wide">Authority Matrix</h3>
                    <p className="text-gray-400 text-xs font-mono uppercase">Zone Code: {editedReport?.location?.zip_code || zipCode || 'UNKNOWN'}</p>
                  </div>
                </div>
                <button
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowAuthoritySelector(false)}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
                {emailStatus && (
                  <motion.div
                    className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${emailStatus.includes('✅')
                      ? 'bg-green-500/10 border-green-500/30 text-green-300'
                      : emailStatus.includes('❌')
                        ? 'bg-red-500/10 border-red-500/30 text-red-300'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      }`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Info className="w-5 h-5 flex-shrink-0" />
                    {emailStatus}
                  </motion.div>
                )}

                <div className="mb-6">
                  <h4 className="flex items-center gap-2 text-white font-bold mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                    Active Units ({Object.keys(availableAuthorities).length} Types)
                  </h4>
                  <p className="text-sm text-gray-400">
                    Select the relevant departments to route this report. AI recommendations are highlighted.
                  </p>
                </div>

                <div className="space-y-8">
                  {Object.entries(availableAuthorities).map(([type, authorities]) => (
                    <motion.div
                      key={type}
                      className="authority-group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 border-b border-blue-500/20 pb-2 flex items-center justify-between">
                        {type.replace(/_/g, ' ')}
                        <span className="bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded text-[10px]">{authorities.length} Units</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {authorities.map((auth, index) => {
                          const isSelected = selectedAuthorities.includes(auth._id);
                          return (
                            <motion.div
                              key={auth._id}
                              className={`relative group cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 ${isSelected
                                ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                                }`}
                              onClick={() => handleAuthoritySelect(auth._id)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="p-4 relative z-10 flex gap-3">
                                <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-400' : 'border-gray-500 bg-transparent'
                                  }`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className={`font-bold text-sm truncate transition-colors ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                    {auth.name}
                                  </h5>
                                  <p className="text-xs text-gray-500 truncate mt-0.5">{auth.email}</p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] bg-black/40 px-2 py-1 rounded text-gray-400 border border-white/5 font-mono">
                                      {auth.jurisdiction || 'LOCAL'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {isSelected && (
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 z-0"
                                  layoutId="selected-glow"
                                />
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}

                  {Object.keys(availableAuthorities).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <Shield className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-medium">No Authorities Found</p>
                      <p className="text-sm opacity-60">Try entering a different zip code in the location settings.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-black/40 border-t border-white/10 flex justify-between items-center backdrop-blur-md">
                <div className="text-sm text-gray-400">
                  <span className="text-white font-bold">{selectedAuthorities.length}</span> authorities selected
                </div>
                <div className="flex gap-3">
                  <motion.button
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold border border-gray-600 text-sm"
                    onClick={() => setShowAuthoritySelector(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Close
                  </motion.button>
                  <motion.button
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/40 transition-colors"
                    onClick={() => setShowAuthoritySelector(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Confirm Selection
                  </motion.button>
                </div>
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
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAlertModal({ ...alertModal, show: false })}
          >
            <motion.div
              className={`bg-[#0f172a] border rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl relative ${alertModal.type === 'error' ? 'border-red-500/30' : 'border-yellow-500/30'
                }`}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 text-center ${alertModal.type === 'error' ? 'bg-red-900/10' : 'bg-yellow-900/10'}`}>
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${alertModal.type === 'error' ? 'bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-yellow-500/20 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                  }`}>
                  {alertModal.type === 'error' ? (
                    <Shield className="w-8 h-8" />
                  ) : (
                    <AlertCircle className="w-8 h-8" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{alertModal.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{alertModal.message}</p>
              </div>

              <div className="p-4 bg-black/20 border-t border-white/5">
                <motion.button
                  className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all ${alertModal.type === 'error'
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-900/30'
                    : 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/30'
                    }`}
                  onClick={() => setAlertModal({ ...alertModal, show: false })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Message Received
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