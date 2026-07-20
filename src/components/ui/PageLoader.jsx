import React from "react";

export default function PageLoader() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative"
      style={{ background: "linear-gradient(160deg, #f0fdfa 0%, #ffffff 45%, #ecfdf5 100%)" }}
      role="status"
      aria-live="polite"
    >
      {/* Floating decorative paws */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-[0.06]"
            style={{
              left: `${[8, 72, 20, 85, 50, 35][i]}%`,
              top: `${[18, 25, 75, 70, 45, 88][i]}%`,
              animation: `pawFloat ${4 + i}s ease-in-out ${i * 0.5}s infinite alternate`,
            }}
          >
            <svg width={[48, 64, 40, 56, 44, 52][i]} height={[48, 64, 40, 56, 44, 52][i]} viewBox="0 0 24 24" fill="#0d9483">
              <path d="M12 10.5c1.5 0 2.5-1.5 2.5-3S13.5 4 12 4s-2.5 2-2.5 3.5 1 3 2.5 3zM6.5 12c1 0 1.75-1 1.75-2S7.5 8 6.5 8 4.75 9 4.75 10s.75 2 1.75 2zM17.5 12c1 0 1.75-1 1.75-2S18.5 8 17.5 8s-1.75 1-1.75 2 .75 2 1.75 2zM5 15.5c0 2.5 2.5 4.5 7 4.5s7-2 7-4.5-3-3.5-7-3.5-7 1-7 3.5z"/>
            </svg>
          </div>
        ))}
      </div>

      {/* Logo + brand */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-5">
          {/* Pulsing ring */}
          <span
            className="absolute inset-0 rounded-full"
            style={{
              animation: "loaderRing 1.8s ease-out infinite",
              background: "radial-gradient(circle, rgba(13,148,131,0.25) 0%, transparent 70%)",
            }}
          />
          {/* Official PawCão logo */}
          <div
            className="relative rounded-full overflow-hidden ring-2 ring-white/80"
            style={{
              width: 76,
              height: 76,
              boxShadow: "0 10px 34px rgba(13,148,131,0.35), inset 0 0 0 1px rgba(255,255,255,0.4)",
              animation: "loaderBounce 1.2s ease-in-out infinite",
            }}
          >
            <img
              src="https://media.base44.com/images/public/6907b3be1ec43db5676a2085/e3013a5a7_IMG_3975.jpg"
              alt="PawCão"
              className="w-full h-full object-cover scale-[1.06]"
            />
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                background: "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
                animation: "loaderShimmer 1.8s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* Brand name */}
        <h1
          className="text-2xl font-extrabold tracking-tight mb-5"
          style={{ fontFamily: "'League Spartan', sans-serif", color: "#0f766e" }}
        >
          Paw<span style={{ color: "#1D8A82" }}>Cão</span>
        </h1>

        {/* Loading dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block rounded-full"
              style={{
                width: 9,
                height: 9,
                background: "#0d9483",
                animation: `loaderDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Loading bar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-1 rounded-full bg-teal-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #0d9483, #2dd4bf)",
            animation: "loaderBar 1.4s ease-in-out infinite",
          }}
        />
      </div>

      <span className="sr-only">A carregar PawCão...</span>

      <style>{`
        @keyframes loaderBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
        }
        @keyframes loaderRing {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes loaderDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes loaderBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes loaderShimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
        @keyframes pawFloat {
          from { transform: translateY(0) rotate(-5deg); }
          to { transform: translateY(-18px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}