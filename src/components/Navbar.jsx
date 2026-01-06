import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Check token on mount & route change
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [location]);

  // Cross-tab logout/login sync
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/");
    setOpen(false);
  };

  // Report Issue
  const handleReportClick = () => {
    navigate("/report");
    setOpen(false);
  };

  return (
    <nav className="w-full bg-gradient-to-r from-black via-zinc-900 to-black text-yellow-400 shadow-xl fixed top-0 left-0 z-50 border-b border-yellow-400/30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <h1 className="text-3xl font-extrabold tracking-wider text-yellow-400 drop-shadow-md">
          EaiserAI
        </h1>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-10 text-lg font-semibold">
          <li className="hover:text-white transition-all duration-300 hover:scale-110">
            <Link to="/">Home</Link>
          </li>
          {isLoggedIn && (
            <li className="hover:text-white transition-all duration-300 hover:scale-110">
              <Link to="/dashboard">Dashboard</Link>
            </li>
          )}
          <li>
            <button
              onClick={handleReportClick}
              className="hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"
            >
              Report Issue
            </button>
          </li>
        </ul>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-4">
          {!isLoggedIn ? (
            <Link to="/signup">
              <button className="bg-yellow-400 text-black px-6 py-2 rounded-2xl font-bold shadow-md hover:bg-yellow-300 transition-all duration-300 hover:scale-105">
                Sign Up
              </button>
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all">
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold text-sm">
                  {(() => {
                    try {
                      const user = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
                      return user.name ? user.name.charAt(0).toUpperCase() : 'U';
                    } catch { return 'U'; }
                  })()}
                </div>
                <span className="text-sm font-medium text-yellow-100">
                  {(() => {
                    try {
                      const user = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
                      return user.name?.split(' ')[0] || 'User';
                    } catch { return 'User'; }
                  })()}
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
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="block hover:text-white transition"
            >
              Dashboard
            </Link>
          )}

          <button
            onClick={handleReportClick}
            className="block hover:text-white transition"
          >
            Report Issue
          </button>

          {/* Mobile Auth */}
          {!isLoggedIn ? (
            <Link to="/signup" onClick={() => setOpen(false)}>
              <button className="w-full bg-yellow-400 text-black py-2 rounded-xl font-semibold hover:bg-yellow-300 transition">
                Sign Up
              </button>
            </Link>
          ) : (
            <div className="space-y-3">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 w-full bg-zinc-800 text-yellow-400 py-2 px-4 rounded-xl font-semibold hover:bg-zinc-700 transition"
              >
                <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold text-xs">
                  {(() => {
                    try {
                      const user = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
                      return user.name ? user.name.charAt(0).toUpperCase() : 'U';
                    } catch { return 'U'; }
                  })()}
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
