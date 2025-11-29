import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Signup from "./Auth/Signup";
import Login from './Auth/Login';
import Report from './pages/Report'

export default function App() {
  return (
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

        {/* auth pages (no navbar) */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* catch-all -> redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
