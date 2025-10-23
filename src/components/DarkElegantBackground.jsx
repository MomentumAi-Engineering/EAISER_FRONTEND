import React from "react";

/**
 * DarkElegantBackground.jsx
 * A dark, elegant background with subtle glowing lines — no center card.
 */

export default function DarkElegantBackground({ height = "100vh" }) {
  return (
    <div
      className="relative flex items-center justify-center w-full overflow-hidden"
      style={{ height }}
    >
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950" />

      {/* Subtle overlay pattern */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Soft glowing lines */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Center line */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        {/* Top-left corner glow */}
        <div className="absolute top-0 left-0 w-[40%] h-[1px] bg-gradient-to-r from-white/25 to-transparent blur-sm" />
        <div className="absolute top-0 left-0 h-[40%] w-[1px] bg-gradient-to-b from-white/25 to-transparent blur-sm" />
        {/* Top-right corner glow */}
        <div className="absolute top-0 right-0 w-[40%] h-[1px] bg-gradient-to-l from-white/25 to-transparent blur-sm" />
        <div className="absolute top-0 right-0 h-[40%] w-[1px] bg-gradient-to-b from-white/25 to-transparent blur-sm" />
      </div>
    </div>
  );
}
