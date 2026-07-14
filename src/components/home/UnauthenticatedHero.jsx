import React from "react";
import { motion } from "framer-motion";
import { PawPrint, Bone, Heart, Star, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

const TEAL = "#00a699";
const ORANGE = "#ff6633";
const YELLOW = "#ffcc33";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const HERO_TOYS = [
  { Icon: Bone, pos: "top-[1%] left-[1%]", color: TEAL, size: 38, delay: 0, dur: 7 },
  { Icon: Heart, pos: "top-[4%] right-[3%]", color: ORANGE, size: 28, delay: 1.5, dur: 6 },
  { Icon: Star, pos: "top-[16%] right-[9%]", color: YELLOW, size: 24, delay: 2, dur: 6.5 },
  { Icon: Sparkles, pos: "top-[42%] right-[1%]", color: YELLOW, size: 22, delay: 2.5, dur: 6 },
  { Icon: Bone, pos: "bottom-[6%] right-[4%]", color: TEAL, size: 32, delay: 1.2, dur: 7 },
  { Icon: Heart, pos: "bottom-[20%] left-[4%]", color: TEAL, size: 24, delay: 1.8, dur: 5.5 },
  { Icon: PawPrint, pos: "top-[62%] left-[1%]", color: ORANGE, size: 30, delay: 3, dur: 7.2 },
  { Icon: Sparkles, pos: "bottom-[42%] left-[7%]", color: TEAL, size: 20, delay: 0.6, dur: 6.3 },
  { Icon: Star, pos: "bottom-[55%] right-[18%]", color: ORANGE, size: 18, delay: 1.1, dur: 5.8 },
];

function TennisBall({ className, delay = 0 }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{ y: [0, -14, 0], rotate: [0, 20, 0] }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      <div className="w-7 h-7 rounded-full relative" style={{ background: `radial-gradient(circle at 35% 35%, #ffe066, ${YELLOW})`, boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}>
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <path d="M4,20 Q10,4 20,4 Q30,4 36,20" fill="none" stroke="white" strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/>
          <path d="M4,20 Q10,36 20,36 Q30,36 36,20" fill="none" stroke="white" strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/>
        </svg>
      </div>
    </motion.div>
  );
}

function CollarDecoration({ className }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.12))" }}
    >
      <svg width="140" height="70" viewBox="0 0 140 70" fill="none">
        <path d="M8,35 Q70,14 132,35 Q70,56 8,35" stroke={ORANGE} strokeWidth="12" strokeLinecap="round" fill="none"/>
        <path d="M12,33 Q70,16 128,33" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <circle cx="28" cy="30" r="3.5" fill={YELLOW}/>
        <circle cx="48" cy="26" r="3.5" fill={YELLOW}/>
        <circle cx="92" cy="26" r="3.5" fill={YELLOW}/>
        <circle cx="112" cy="30" r="3.5" fill={YELLOW}/>
        <rect x="60" y="22" width="20" height="26" rx="4" fill={TEAL} stroke="white" strokeWidth="2"/>
        <rect x="66" y="28" width="8" height="14" rx="2" fill="white" opacity="0.35"/>
        <circle cx="70" cy="55" r="3" fill={TEAL}/>
        <circle cx="70" cy="63" r="10" fill={YELLOW} stroke="white" strokeWidth="2"/>
        <circle cx="70" cy="61" r="2.5" fill={TEAL}/>
        <circle cx="66" cy="58.5" r="1.5" fill={TEAL}/>
        <circle cx="74" cy="58.5" r="1.5" fill={TEAL}/>
        <circle cx="67" cy="64" r="1.2" fill={TEAL}/>
        <circle cx="73" cy="64" r="1.2" fill={TEAL}/>
      </svg>
    </motion.div>
  );
}

function HeroDecorations() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {HERO_TOYS.map((item, i) => (
        <motion.div
          key={i}
          className={`absolute ${item.pos}`}
          animate={{ y: [0, -14, 0], rotate: [0, 8, -4, 0] }}
          transition={{ duration: item.dur, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
        >
          <item.Icon
            size={item.size}
            style={{ color: item.color, opacity: 0.35, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.06))" }}
            strokeWidth={2}
            fill="currentColor"
          />
        </motion.div>
      ))}
      <TennisBall className="top-[26%] right-[16%]" delay={1} />
      <TennisBall className="bottom-[32%] left-[9%]" delay={2.5} />
    </div>
  );
}

export default function UnauthenticatedHero({ onEntrar, onEncontrar, onRegistar, dogImageUrl }) {
  const { language } = useLanguage();

  const line1 =
    language === "pt"
      ? "PASSEIOS, PET SITTING, HOTEL E MUITO MAIS."
      : language === "es"
      ? "PASEOS, PET SITTING, HOTEL Y MUCHO MÁS."
      : language === "fr"
      ? "PROMENADES, PET SITTING, HÔTEL ET BIEN PLUS."
      : "WALKS, PET SITTING, HOTEL AND MUCH MORE.";

  const line2 =
    language === "pt"
      ? "TUDO O QUE O SEU PATUDO PRECISA, NUM SÓ LUGAR."
      : language === "es"
      ? "TODO LO QUE TU MASCOTA NECESITA, EN UN SOLO LUGAR."
      : language === "fr"
      ? "TOUT CE DONT VOTRE COMPAGNON A BESOIN, EN UN SEUL ENDROIT."
      : "EVERYTHING YOUR DOG NEEDS, IN ONE PLACE.";

  const card1Body =
    language === "pt"
      ? "Profissionais verificados prontos para dar ao seu cão o passeio que ele merece."
      : language === "es"
      ? "Profesionales verificados listos para darle a tu perro el paseo que merece."
      : language === "fr"
      ? "Des professionnels vérifiés prêts à offrir à votre chien la promenade qu'il mérite."
      : "Verified professionals ready to give your dog the walk they deserve.";

  const card2Body =
    language === "pt"
      ? "Transforme a sua paixão por animais numa fonte de rendimento flexível."
      : language === "es"
      ? "Convierte tu pasión por los animales en una fuente de ingresos flexible."
      : language === "fr"
      ? "Transformez votre passion pour les animaux en une source de revenus flexible."
      : "Turn your passion for animals into a flexible source of income.";

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full overflow-hidden"
    >
      <HeroDecorations />

      {/* Hero text - centered */}
      <motion.div variants={itemVariants} className="relative z-10 px-4 md:px-6 pt-10 md:pt-14 max-w-5xl mx-auto text-center">
        <h1 className="font-black tracking-tight leading-[1.08] text-2xl sm:text-3xl md:text-4xl lg:text-5xl" style={{ color: TEAL }}>
          {line1}
        </h1>
        <h2 className="font-black tracking-tight leading-[1.15] text-lg sm:text-xl md:text-2xl lg:text-3xl mt-3 text-slate-700">
          {line2}
        </h2>
      </motion.div>

      {/* Content grid: dog left, glass cards right */}
      <div className="relative z-10 px-4 md:px-6 pt-8 md:pt-12 pb-10 md:pb-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          {/* Left: dog image in transparent glass frame + collar */}
          <motion.div variants={itemVariants} className="relative">
            {/* Soft glow behind */}
            <div className="absolute inset-0 rounded-[2.5rem] blur-3xl opacity-25" style={{ background: `radial-gradient(circle at 50% 40%, ${TEAL}, transparent 70%)` }} />

            {/* Transparent glass frame */}
            <div className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2.5rem] aspect-[4/3] md:aspect-[5/4] w-full max-w-md mx-auto border border-white/50 backdrop-blur-md" style={{ background: "rgba(255, 255, 255, 0.12)", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
              {dogImageUrl ? (
                <img src={dogImageUrl} alt="Cão cool PawCão" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PawPrint className="w-16 h-16" style={{ color: TEAL, opacity: 0.4 }} />
                </div>
              )}
            </div>

            {/* Collar decoration floating at bottom */}
            <CollarDecoration className="-bottom-5 left-1/2 -translate-x-1/2 z-20" />
          </motion.div>

          {/* Right: glass CTA cards */}
          <div className="flex flex-col gap-4 md:gap-6">
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-[1.75rem] p-6 md:p-8 border border-white/60 relative overflow-hidden"
              style={{ background: "rgba(255, 255, 255, 0.38)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
            >
              <div className="relative z-10 flex flex-col gap-4">
                <p className="font-semibold text-sm md:text-base leading-relaxed text-slate-700">{card1Body}</p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onEncontrar}
                  className="self-start rounded-full px-7 py-3 font-black uppercase tracking-wider text-sm text-white shadow-lg transition-colors"
                  style={{ background: TEAL }}
                >
                  ENCONTRAR
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-[1.75rem] p-6 md:p-8 border border-white/60 relative overflow-hidden"
              style={{ background: "rgba(255, 255, 255, 0.38)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
            >
              <div className="relative z-10 flex flex-col gap-4">
                <p className="font-semibold text-sm md:text-base leading-relaxed text-slate-700">{card2Body}</p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onRegistar}
                  className="self-start rounded-full px-7 py-3 font-black uppercase tracking-wider text-sm text-white shadow-lg transition-colors"
                  style={{ background: ORANGE }}
                >
                  REGISTA-TE
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}