import React from "react";
import { useNavigate } from "react-router-dom";

const AuthNavbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
      {/* Modern Coded Logo */}
      <div
        onClick={() => navigate("/")}
        className="flex items-center space-x-2 cursor-pointer group"
      >
        <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
          <span className="text-white text-3xl font-extrabold tracking-tight group-hover:scale-110 transition-transform duration-200">
            E
          </span>

          {/* Glow ring effect */}
          <div className="absolute inset-0 rounded-xl border border-white/20 group-hover:border-white/40 blur-sm"></div>
        </div>

        <span className="text-2xl font-bold text-gray-800 tracking-tight">
          aiser
        </span>
      </div>
    </nav>
  );
};

export default AuthNavbar;
