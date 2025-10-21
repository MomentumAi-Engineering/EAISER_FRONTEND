// App.jsx
import './App.css';
import { Routes, Route, BrowserRouter, useLocation } from 'react-router-dom';

// Shared Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoutes';

// Landing/Home Components
import HeroSection from './components/Hero';
import AboutSection from './components/About';
import ImpactMetricsSection from './components/AboutMore';
import Ending from './components/Ending';

// Auth & Profile
import AuthPage from './pages/Signup';
import SignInPage from './pages/SignIn';
import ProfilePage from './pages/Profile';

// App Feature Pages
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import ViewIssues from './pages/ViewIssues';
import NotFound from './pages/NotFound';

// Optional: Auth Landing Page (if used)
import AuthLanding from './pages/AuthLanding';

function AppContent() {
  const location = useLocation();
  const isAuthPage = ['/auth', '/signin', '/signup'].includes(location.pathname);

  return (
    <div>
      {/* Show Navbar conditionally */}
      {!isAuthPage && <Navbar />}

      <Routes>
        {/* Home / Landing Page */}
        <Route
          path="/"
          element={
            <>
              <HeroSection />
              <AboutSection />
              <ImpactMetricsSection />
              <Ending />
            </>
          }
        />

        {/* Authentication */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<AuthPage />} />

        {/* Protected & App Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route path="/report" element={<ReportIssue />} />
        <Route path="/view" element={<ViewIssues />} />

        {/* Auth Landing (if needed) */}
        <Route path="/auth-landing" element={<AuthLanding />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
