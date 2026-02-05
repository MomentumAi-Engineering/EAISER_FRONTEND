import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Signup from "./Auth/Signup";
import Login from './Auth/Login';
import Report from './pages/Report'
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import TeamManagement from './components/TeamManagement';
import StatsDashboard from './components/StatsDashboard';
import ChangePassword from './components/ChangePassword';
import SecuritySettings from './components/SecuritySettings';
import UserDash from './pages/UserDashboard';
import MappingReview from './components/MappingReview';
import AuthorityManagement from './components/AuthorityManagement';
import UserManagement from './components/UserManagement';
import ProfilePage from './pages/Profile';

import AuthorityAction from './pages/AuthorityAction';

import { ReportProvider } from './context/ReportContext';

export default function App() {
  return (
    <ReportProvider>
      <Router>
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
          <Route path="/admin/stats" element={<StatsDashboard />} />
          <Route path="/admin/change-password" element={<ChangePassword />} />
          <Route path="/admin/security" element={<SecuritySettings />} />
          <Route path="/admin/mapping" element={<MappingReview />} />
          <Route path="/admin/authorities" element={<AuthorityManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />

          {/* user dashboard*/}
          <Route path="/dashboard" element={<UserDash />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* auth pages (no navbar) */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          {/* catch-all -> redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ReportProvider>
  );
}
