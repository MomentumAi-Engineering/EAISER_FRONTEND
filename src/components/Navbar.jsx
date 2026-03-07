import React, { useState, useEffect } from "react";
import { useDialog } from "../context/DialogContext";
import { Menu, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({});

  const navigate = useNavigate();
  const location = useLocation();
  const { showConfirm } = useDialog();

  // Read user data from localStorage
  const refreshUserData = () => {
    try {
      const data = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
      setUserData(data);
    } catch { setUserData({}); }
  };

  // Check token on mount & route change
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    refreshUserData();
  }, [location]);

  // Cross-tab logout/login sync + profile update sync
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
      refreshUserData();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Logout
  // Logout
  const handleLogout = async () => {
    const confirmed = await showConfirm("Are you sure you want to logout?", {
      title: "Logout Confirmation",
      confirmText: "Yes, Logout",
      cancelText: "Stay",
      variant: "warning"
    });

    if (confirmed) {
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      localStorage.removeItem("userData");
      setIsLoggedIn(false);
      navigate("/");
      setOpen(false);
    }
  };

  // Report Issue
  const handleReportClick = () => {
    navigate("/report");
    setOpen(false);
  };

  return (
    <nav className="w-full bg-gradient-to-r from-black via-zinc-900 to-black text-yellow-400 shadow-xl fixed top-0 left-0 z-50 border-b border-yellow-400/30 backdrop-blur-md md:backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-105 duration-300">
          <img src="/lat.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl bg-yellow-400 p-0.5 group-hover:scale-110 transition-transform" />
          <span className="text-3xl font-extrabold tracking-wider text-yellow-400 drop-shadow-md">
            EAiSER
          </span>
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-10 text-lg font-semibold">
          <li className="hover:text-white transition-all duration-300 hover:scale-110">
            <Link to="/">Home</Link>
          </li>
          {isLoggedIn && (
            <>
              <li className="hover:text-white transition-all duration-300 hover:scale-110">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="hover:text-white transition-all duration-300 hover:scale-110">
                <Link to="/chat-hub">Chat Hub</Link>
              </li>
            </>
          )}
          <li>
            <button
              onClick={handleReportClick}
              className="hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"
            >
              Send a Report
            </button>
          </li>
        </ul>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-6">
          {!isLoggedIn ? (
            <>
              <Link to="/login" className="text-yellow-400 font-bold hover:text-white transition-colors">
                Log in
              </Link>
              <Link to="/signup">
                <button className="bg-yellow-400 text-black px-6 py-2 rounded-2xl font-bold shadow-md hover:bg-yellow-300 transition-all duration-300 hover:scale-105">
                  Sign Up
                </button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all">
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold text-sm">
                  {userData.first_name ? userData.first_name.charAt(0).toUpperCase() : (userData.name ? userData.name.charAt(0).toUpperCase() : 'U')}
                </div>
                <span className="text-sm font-medium text-yellow-100">
                  {userData.first_name || userData.name?.split(' ')[0] || 'User'}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="bg-red-500/80 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-red-600 transition-all duration-300 hover:scale-105"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Icon */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden w-full bg-black/95 text-yellow-300 px-6 py-5 space-y-4 border-t border-yellow-400/20 animate-slide-down">

          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="block hover:text-white transition"
          >
            Home
          </Link>

          {isLoggedIn && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="block hover:text-white transition"
              >
                Dashboard
              </Link>
              <Link
                to="/chat-hub"
                onClick={() => setOpen(false)}
                className="block hover:text-white transition"
              >
                Chat Hub
              </Link>
            </>
          )}

          <button
            onClick={handleReportClick}
            className="block hover:text-white transition"
          >
            Report Issue
          </button>

          {/* Mobile Auth */}
          {!isLoggedIn ? (
            <div className="flex flex-col gap-3">
              <Link to="/login" onClick={() => setOpen(false)}>
                <button className="w-full bg-white/10 text-yellow-400 py-2 rounded-xl font-semibold border border-yellow-400/20 hover:bg-white/20 transition">
                  Log in
                </button>
              </Link>
              <Link to="/signup" onClick={() => setOpen(false)}>
                <button className="w-full bg-yellow-400 text-black py-2 rounded-xl font-semibold hover:bg-yellow-300 transition">
                  Sign Up
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 w-full bg-zinc-800 text-yellow-400 py-2 px-4 rounded-xl font-semibold hover:bg-zinc-700 transition"
              >
                <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold text-xs">
                  {userData.first_name ? userData.first_name.charAt(0).toUpperCase() : (userData.name ? userData.name.charAt(0).toUpperCase() : 'U')}
                </div>
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
