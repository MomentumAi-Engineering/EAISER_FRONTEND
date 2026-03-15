import React, { useState, useEffect, useRef } from "react";
import { useDialog } from "../context/DialogContext";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../services/apiClient";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  // Fetch real user data from API
  const fetchUserFromAPI = async () => {
    try {
      const data = await apiClient.getMe();
      if (data) {
        setUserData(data);
        // Sync to localStorage
        const stored = JSON.parse(localStorage.getItem('userData') || '{}');
        const merged = {
          ...stored,
          first_name: data.first_name,
          last_name: data.last_name,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          avatar: data.avatar,
          email: data.email,
          username: data.username,
        };
        localStorage.setItem('userData', JSON.stringify(merged));
      }
    } catch { /* ignore - user might not be logged in */ }
  };

  // Check token on mount & route change
  useEffect(() => {
    const token = localStorage.getItem("token");
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);
    refreshUserData();
    if (loggedIn) fetchUserFromAPI();
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Logout
  const handleLogout = async () => {
    setShowDropdown(false);
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

  const displayName = userData.first_name || userData.name?.split(' ')[0] || 'User';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const avatarUrl = userData.avatar;

  return (
    <nav className="w-full bg-gradient-to-r from-black via-zinc-900 to-black text-yellow-400 shadow-xl fixed top-0 left-0 z-50 border-b border-yellow-400/30 backdrop-blur-md md:backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 md:py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group transition-transform hover:scale-105 duration-300">
          <img 
            src="/newlogo.png" 
            alt="Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg sm:rounded-xl bg-yellow-400 p-0.5 group-hover:scale-110 transition-transform" 
            fetchPriority="high"
            loading="eager"
          />
          <span className="text-2xl sm:text-3xl font-extrabold tracking-wider text-yellow-400 drop-shadow-md">
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
            <div className="relative" ref={dropdownRef}>
              {/* User Avatar Button */}
              <motion.button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 transition-all duration-300 group"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 p-[2px] shadow-lg shadow-yellow-500/20 group-hover:shadow-yellow-500/40 transition-shadow">
                    <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-yellow-400 font-black text-sm">{displayInitial}</span>
                      )}
                    </div>
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-950 shadow-lg shadow-green-400/50" />
                </div>

                {/* Name */}
                <span className="text-sm font-bold text-yellow-100 group-hover:text-white transition-colors max-w-[100px] truncate">
                  {displayName.toUpperCase()}
                </span>

                {/* Chevron */}
                <motion.div
                  animate={{ rotate: showDropdown ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5 text-yellow-400/60" />
                </motion.div>
              </motion.button>

              {/* Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-56 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-zinc-800/50">
                      <p className="text-sm font-bold text-white truncate">{userData.first_name} {userData.last_name}</p>
                      <p className="text-[11px] text-zinc-500 font-mono truncate">@{userData.username || userData.email?.split('@')[0] || 'user'}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1.5">
                      <button
                        onClick={() => { setShowDropdown(false); navigate('/profile'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-yellow-500/10 transition-all group"
                      >
                        <User className="w-4 h-4 text-yellow-500/70 group-hover:text-yellow-400 transition-colors" />
                        <span className="font-medium">My Profile</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all group"
                      >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Mobile Menu Icon */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden w-full bg-black/95 text-yellow-300 px-4 sm:px-6 py-5 space-y-4 border-t border-yellow-400/20 overflow-hidden"
          >
            <Link to="/" onClick={() => setOpen(false)} className="block hover:text-white transition">Home</Link>

            {isLoggedIn && (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="block hover:text-white transition">Dashboard</Link>
              </>
            )}

            <button onClick={handleReportClick} className="block hover:text-white transition">Report Issue</button>

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
                  className="flex items-center gap-3 w-full bg-zinc-800 text-yellow-400 py-2.5 px-4 rounded-xl font-semibold hover:bg-zinc-700 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-yellow-400 font-bold text-xs">{displayInitial}</span>
                      )}
                    </div>
                  </div>
                  {displayName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
