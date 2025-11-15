import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";


export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="w-full bg-gradient-to-r from-black via-zinc-900 to-black text-yellow-400 shadow-xl fixed top-0 left-0 z-50 border-b border-yellow-400/30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-3xl font-extrabold tracking-wider text-yellow-400 drop-shadow-md">
          EaiserAI
        </h1>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-10 text-lg font-semibold">
          <li className="hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer">Home</li>
          <li className="hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer">Report Issue</li>
          <li className="hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer">New+</li>
          <li className="hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer">Contact</li>
        </ul>

        {/* Button */}
       <Link to="/signup">
  <button className="hidden md:block bg-yellow-400 text-black px-6 py-2 rounded-2xl font-bold shadow-md hover:bg-yellow-300 transition-all duration-300 hover:scale-105">
    Login
  </button>
</Link>


        {/* Mobile Icon */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden w-full bg-black/95 text-yellow-300 px-6 py-5 space-y-4 border-t border-yellow-400/20 animate-slide-down">
          <p className="hover:text-white transition cursor-pointer">Home</p>
          <p className="hover:text-white transition cursor-pointer">Features</p>
          <p className="hover:text-white transition cursor-pointer">About</p>
          <p className="hover:text-white transition cursor-pointer">Contact</p>

          <button className="w-full bg-yellow-400 text-black py-2 rounded-xl font-semibold hover:bg-yellow-300 transition">
            Login
          </button>
        </div>
      )}
    </nav>
  );
}
