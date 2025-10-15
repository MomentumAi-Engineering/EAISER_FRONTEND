// App.jsx
import './App.css';
import { Routes, Route, BrowserRouter, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/Hero';
import AboutSection from './components/About';
import ImpactMetricsSection from './components/AboutMore';
import Ending from './components/Ending';
import AuthPage from './pages/Signup';
import SignInPage from './pages/SignIn';
import ProfilePage from './pages/Profile';

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth' || location.pathname === '/signin';

  return (
    <div>
      {!isAuthPage && <Navbar />}
      <Routes>
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
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/profile" element={<ProfilePage />} />
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
