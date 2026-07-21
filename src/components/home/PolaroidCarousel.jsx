import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const IMAGES = [
  "https://media.base44.com/images/public/6907b3be1ec43db5676a2085/a735b236a_Pawcao_dog-removebg-preview.png",
  "https://media.base44.com/images/public/6907b3be1ec43db5676a2085/879a5e393_IMG_3917-removebg-preview.png",
];

const INTERVAL_MS = 7000;

export default function PolaroidCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % IMAGES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative aspect-[4/3] md:aspect-[5/4] w-full max-w-md mx-auto rounded-xl md:rounded-2xl bg-white p-3 md:p-4 pb-10 md:pb-12"
      style={{
        boxShadow: "0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid rgba(255,255,255,0.6)",
      }}
    >
      {/* Photo area */}
      <div className="relative w-full h-full overflow-hidden rounded-lg bg-white">
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={IMAGES[index]}
            alt="Cão cool PawCão"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="w-full h-full object-contain"
          />
        </AnimatePresence>
      </div>

      {/* Polaroid caption strip */}
      <span className="absolute bottom-3 md:bottom-4 left-0 right-0 text-center text-[10px] md:text-xs font-bold tracking-wide text-slate-400 uppercase">
        PawCão
      </span>

      {/* Dots */}
      <div className="absolute bottom-1.5 md:bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {IMAGES.map((_, i) => (
          <span
            key={i}
            className="block w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i === index ? "#00a699" : "#cbd5e1",
              transform: i === index ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}