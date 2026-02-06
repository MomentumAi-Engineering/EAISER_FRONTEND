import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { ReportProvider } from './context/ReportContext';
import PageLoader from "./components/PageLoader";

// Lazy Load Components
const Hero = lazy(() => import("./components/Hero"));
const Signup = lazy(() => import("./Auth/Signup"));
const Login = lazy(() => import('./Auth/Login'));
const Report = lazy(() => import('./pages/Report'));
const AuthorityAction = lazy(() => import('./pages/AuthorityAction'));

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

export default function App() {
  return (
    <ReportProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
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

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
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

            {/* user dashboard*/}
            <Route path="/dashboard" element={<UserDash />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* auth pages (no navbar) */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />

            {/* catch-all -> redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ReportProvider>
  );
}
