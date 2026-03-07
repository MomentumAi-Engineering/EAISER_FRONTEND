import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
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
const AuthorityChatHub = lazy(() => import('./pages/AuthorityChatHub'));

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
const UserChatHub = lazy(() => import('./pages/UserChatHub'));

/**
 * Detect if running on the admin subdomain.
 * Production: admin.eaiser.ai
 * Dev:        admin.localhost or localhost with /admin prefix
 */
function isAdminSubdomain() {
  const hostname = window.location.hostname;
  return (
    hostname.startsWith('admin.') ||       // admin.eaiser.ai or admin.localhost
    hostname === 'admin.eaiser.ai'
  );
}

/**
 * Returns the full URL for the admin subdomain equivalent of a path.
 */
function getAdminSubdomainUrl(path = "") {
  const { protocol, host, hostname } = window.location;

  // Clean up the path (ensure it starts with / and doesn't have /admin prefix if provided)
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/admin/')) cleanPath = cleanPath.replace('/admin/', '/');
  if (cleanPath === '/admin') cleanPath = '/auth/login';

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//admin.${host}${cleanPath}`;
  }

  // For production eaiser.ai -> admin.eaiser.ai
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const baseDomain = parts.slice(-2).join('.');
    return `${protocol}//admin.${baseDomain}${cleanPath}`;
  }

  return `${protocol}//admin.${hostname}${cleanPath}`;
}

/**
 * Component to handle cross-subdomain redirection for legacy routes.
 */
function AdminRedirect({ to = "" }) {
  React.useEffect(() => {
    window.location.replace(getAdminSubdomainUrl(to));
  }, [to]);
  return <PageLoader />;
}

/**
 * Admin-only app shell — rendered when on admin.eaiser.ai
 * Routes: /auth/login, /dashboard, /team, /settings, etc.
 */
function AdminApp() {
  return (
    <Routes>
      {/* Admin Auth */}
      <Route path="/auth/login" element={<AdminLogin />} />

      {/* Admin Pages — clean paths without /admin prefix */}
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

      {/* Root of admin subdomain → login */}
      <Route path="/" element={<Navigate to="/auth/login" replace />} />

      {/* Legacy /admin routes → redirect to clean paths */}
      <Route path="/admin" element={<Navigate to="/auth/login" replace />} />
      <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/admin/team" element={<Navigate to="/team" replace />} />
      <Route path="/admin/settings" element={<Navigate to="/settings" replace />} />
      <Route path="/admin/stats" element={<Navigate to="/stats" replace />} />
      <Route path="/admin/change-password" element={<Navigate to="/change-password" replace />} />
      <Route path="/admin/security" element={<Navigate to="/security" replace />} />
      <Route path="/admin/mapping" element={<Navigate to="/mapping" replace />} />
      <Route path="/admin/authorities" element={<Navigate to="/authorities" replace />} />
      <Route path="/admin/users" element={<Navigate to="/users" replace />} />
      <Route path="/admin/warroom" element={<Navigate to="/warroom" replace />} />
      <Route path="/admin/audit" element={<Navigate to="/audit" replace />} />

      {/* Catch-all → login */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}

/**
 * Public-facing app shell — rendered on eaiser.ai / localhost:5173
 */
function PublicApp() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <Routes>
          {/* public home with navbar */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Hero />
              </>
            }
          />

          {/* other app pages */}
          <Route path="/report" element={<Report />} />
          <Route path="/authority-action" element={<AuthorityAction />} />
          <Route path="/authority/dashboard" element={<AuthorityDashboard />} />
          <Route path="/authority/chat-hub" element={<AuthorityChatHub />} />

          {/* user dashboard */}
          <Route path="/dashboard" element={<UserDash />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chat-hub" element={<UserChatHub />} />

          {/* auth pages (no navbar) */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Admin routes on localhost (no subdomain needed) */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/team" element={<TeamManagement />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/stats" element={<StatsDashboard />} />
          <Route path="/admin/change-password" element={<ChangePassword />} />
          <Route path="/admin/security" element={<SecuritySettings />} />
          <Route path="/admin/mapping" element={<MappingReview />} />
          <Route path="/admin/authorities" element={<AuthorityManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/warroom" element={<WarRoom />} />
          <Route path="/admin/audit" element={<AuditLog />} />

          {/* catch-all -> redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
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

