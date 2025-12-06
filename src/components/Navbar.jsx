import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check token on mount and when location changes
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [location]);

  useEffect(() => {
    // Listen for storage changes (for cross-tab communication)
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/");
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
          <li className="hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer">
            <Link to="/">Home</Link>
          </li>
          <li className="hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer">
            <Link to="/report">Report Issue</Link>
          </li>
        </ul>

        {/* Desktop auth links */}
        <div className="hidden md:flex items-center">
          {!isLoggedIn ? (
            <Link to="/signup">
              <button className="bg-yellow-400 text-black px-6 py-2 rounded-2xl font-bold shadow-md hover:bg-yellow-300 transition-all duration-300 hover:scale-105">
                Sign Up
              </button>
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-6 py-2 rounded-2xl font-bold shadow-md hover:bg-red-600 transition-all duration-300 hover:scale-105"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile Icon */}
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
          <Link
            to="/report"
            onClick={() => setOpen(false)}
            className="block hover:text-white transition"
          >
            Report Issue
          </Link>

          {/* Mobile auth links */}
          <div>
            {!isLoggedIn ? (
              <Link to="/signup" onClick={() => setOpen(false)} className="block">
                <button className="w-full bg-yellow-400 text-black py-2 rounded-xl font-semibold hover:bg-yellow-300 transition">
                  Sign Up
                </button>
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
