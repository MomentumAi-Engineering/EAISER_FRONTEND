import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import { ReportProvider } from './context/ReportContext';
import PageLoader from "./components/PageLoader";

// Lazy Load Components
const Hero = lazy(() => import("./components/Hero"));
const Signup = lazy(() => import("./Auth/Signup"));
const Login = lazy(() => import('./Auth/Login'));
const ForgotPassword = lazy(() => import('./Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./Auth/ResetPassword'));
const Report = lazy(() => import('./pages/Report'));
const AuthorityAction = lazy(() => import('./pages/AuthorityAction'));
const VerifyEmail = lazy(() => import('./Auth/VerifyEmail'));
const AuthorityDashboard = lazy(() => import('./pages/AuthorityDashboard'));

// Admin Components
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TeamManagement = lazy(() => import('./components/TeamManagement'));
const StatsDashboard = lazy(() => import('./components/StatsDashboard'));
const AdminSettings = lazy(() => import('./components/AdminSettings'));
const ChangePassword = lazy(() => import('./components/ChangePassword'));
const SecuritySettings = lazy(() => import('./components/SecuritySettings'));
const MappingReview = lazy(() => import('./components/MappingReview'));
const AuthorityManagement = lazy(() => import('./components/AuthorityManagement'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const WarRoom = lazy(() => import('./components/WarRoom'));
const AuditLog = lazy(() => import('./components/AuditLog'));

// User Components
const UserDash = lazy(() => import('./pages/UserDashboard'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));

/**
 * Detect if running on the admin subdomain.
 */
function isAdminSubdomain() {
  const hostname = window.location.hostname;
  return (
    hostname.startsWith('admin.') ||
    hostname === 'admin.eaiser.ai'
  );
}

/**
 * Returns the full URL for the admin subdomain equivalent of a path.
 */
function getAdminSubdomainUrl(path = "") {
  const { protocol, host, hostname } = window.location;
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/admin/')) cleanPath = cleanPath.replace('/admin/', '/');
  if (cleanPath === '/admin') cleanPath = '/auth/login';

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//admin.${host}${cleanPath}`;
  }

  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const baseDomain = parts.slice(-2).join('.');
    return `${protocol}//admin.${baseDomain}${cleanPath}`;
  }

  return `${protocol}//admin.${hostname}${cleanPath}`;
}

/**
 * Admin-only app shell
 */
function AdminApp() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <Routes>
          <Route path="/auth/login" element={<AdminLogin />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/team" element={<TeamManagement />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/stats" element={<StatsDashboard />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/security" element={<SecuritySettings />} />
          <Route path="/mapping" element={<MappingReview />} />
          <Route path="/authorities" element={<AuthorityManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/warroom" element={<WarRoom />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </div>
      <Footer />
      <CookieConsent />
    </div>
  );
}

/**
 * Public-facing app shell
 */
function PublicApp() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<><Navbar /><Hero /></>} />
          <Route path="/report" element={<Report />} />
          <Route path="/authority-action" element={<AuthorityAction />} />
          <Route path="/authority/dashboard" element={<AuthorityDashboard />} />
          <Route path="/dashboard" element={<UserDash />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Fallback Admin routes for local dev */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminLogin />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
      <CookieConsent />
    </div>
  );
}

export default function App() {
  const isAdmin = isAdminSubdomain();

  return (
    <ReportProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          {isAdmin ? <AdminApp /> : <PublicApp />}
        </Suspense>
      </Router>
    </ReportProvider>
  );
}
