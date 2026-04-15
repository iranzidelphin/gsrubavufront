import React, { useState, useEffect } from 'react';

export function Loader() {
  const [clicked, setClicked] = useState(false);
  const [dots, setDots] = useState(0);

  // Loading dots animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev >= 3 ? 0 : prev + 1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    setClicked(!clicked);
  };

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center z-50 cursor-pointer select-none overflow-hidden"
      onClick={handleClick}
    >
      {/* Ambient background glow */}
      <div
        className={`absolute w-[500px] h-[500px] rounded-full transition-all duration-1000 ease-out ${
          clicked
            ? 'bg-blue-500/10 blur-[120px] scale-150'
            : 'bg-blue-500/5 blur-[100px] scale-100'
        }`}
      />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="text-center relative z-10">
        {/* Animated circles */}
        <div
          className={`relative w-28 h-28 mx-auto mb-10 transition-transform duration-700 ease-out ${
            clicked ? 'scale-110 rotate-180' : 'scale-100 rotate-0'
          }`}
        >
          {/* Outer ring - static border */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-700 ${
              clicked
                ? 'border-[3px] border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                : 'border-[2px] border-white/10'
            }`}
          />

          {/* Spinning arc - top */}
          <div
            className={`absolute inset-0 rounded-full border-[3px] border-transparent animate-spin ${
              clicked
                ? 'border-t-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                : 'border-t-white/70'
            }`}
            style={{ animationDuration: clicked ? '0.8s' : '1.5s' }}
          />

          {/* Spinning arc - bottom (reverse) */}
          <div
            className={`absolute inset-3 rounded-full border-[2px] border-transparent animate-spin-reverse ${
              clicked
                ? 'border-b-blue-300/80'
                : 'border-b-white/30'
            }`}
            style={{ animationDuration: clicked ? '1.2s' : '2s' }}
          />

          {/* Inner spinning arc */}
          <div
            className={`absolute inset-6 rounded-full border-[2px] border-transparent animate-spin ${
              clicked
                ? 'border-r-blue-500/60'
                : 'border-r-white/15'
            }`}
            style={{ animationDuration: clicked ? '0.6s' : '2.5s' }}
          />

          {/* Center dot */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-500 ${
              clicked
                ? 'bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)] scale-150'
                : 'bg-white/50 scale-100'
            }`}
          />

          {/* Orbiting dots - appear on click */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                clicked ? 'bg-blue-400/70' : 'bg-transparent'
              }`}
              style={{
                transform: `rotate(${i * 90}deg) translateY(-52px) translate(-50%, -50%)`,
                animation: clicked ? `orbit 2s linear infinite` : 'none',
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* GS RUBAVU Lettering */}
        <div className="relative">
          {/* Main text */}
          <h1
            className={`text-3xl md:text-4xl font-black tracking-[0.35em] transition-all duration-700 ${
              clicked ? 'text-blue-400' : 'text-white'
            }`}
            style={{
              textShadow: clicked
                ? '0 0 40px rgba(59,130,246,0.3), 0 0 80px rgba(59,130,246,0.1)'
                : '0 0 20px rgba(255,255,255,0.05)',
              letterSpacing: '0.35em',
            }}
          >
            GS RUBAVU
          </h1>

          {/* Outline/stroke layer behind */}
          <h1
            className="absolute inset-0 text-3xl md:text-4xl font-black tracking-[0.35em] text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.1)] transition-all duration-700"
            style={{ letterSpacing: '0.35em' }}
          >
            GS RUBAVU
          </h1>
        </div>

        {/* Decorative line */}
        <div className="flex items-center justify-center gap-3 mt-5 mb-4">
          <div
            className={`h-[1px] transition-all duration-700 ${
              clicked ? 'w-16 bg-blue-500/50' : 'w-8 bg-white/20'
            }`}
          />
          <div
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              clicked
                ? 'bg-blue-400 rotate-45 scale-125'
                : 'bg-white/30 rotate-0 scale-100'
            }`}
          />
          <div
            className={`h-[1px] transition-all duration-700 ${
              clicked ? 'w-16 bg-blue-500/50' : 'w-8 bg-white/20'
            }`}
          />
        </div>

        {/* Subtitle / Loading text */}
        <p
          className={`text-sm tracking-[0.3em] uppercase transition-all duration-500 ${
            clicked ? 'text-blue-500/60' : 'text-white/30'
          }`}
        >
          Loading{'.'.repeat(dots)}
        </p>

        {/* Click hint */}
        <p className="text-[10px] text-white/15 mt-6 tracking-[0.2em] uppercase">
          click to interact
        </p>
      </div>

      {/* Corner accents */}
      <div className="absolute top-6 left-6 w-8 h-8 border-l border-t border-white/10 transition-all duration-700"
        style={{ borderColor: clicked ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)' }}
      />
      <div className="absolute top-6 right-6 w-8 h-8 border-r border-t border-white/10 transition-all duration-700"
        style={{ borderColor: clicked ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)' }}
      />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-l border-b border-white/10 transition-all duration-700"
        style={{ borderColor: clicked ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)' }}
      />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-r border-b border-white/10 transition-all duration-700"
        style={{ borderColor: clicked ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)' }}
      />

      <style>{`
        @keyframes orbit {
          0% { transform: rotate(0deg) translateY(-52px) translate(-50%, -50%); }
          100% { transform: rotate(360deg) translateY(-52px) translate(-50%, -50%); }
        }
      `}</style>
    </div>
  );
}

export default Loader;