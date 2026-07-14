import React from "react";
import { motion } from "framer-motion";
import { PawPrint, Bone, Heart, Star, Sparkles, Euro, ArrowRight, Search } from "lucide-react";
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
        <h1 className="font-heading font-bold tracking-tight leading-[1.08] text-2xl sm:text-3xl md:text-4xl lg:text-5xl" style={{ color: TEAL }}>
          {line1}
        </h1>
        <h2 className="font-heading font-bold tracking-tight leading-[1.15] text-lg sm:text-xl md:text-2xl lg:text-3xl mt-3 text-slate-700">
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
            <div className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2.5rem] aspect-[4/3] md:aspect-[5/4] w-full max-w-md mx-auto border border-white/40 backdrop-blur-sm" style={{ background: "rgba(255, 255, 255, 0.06)", boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}>
              {dogImageUrl ? (
                <img src={dogImageUrl} alt="Cão cool PawCão" className="w-full h-full object-cover mix-blend-multiply" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PawPrint className="w-16 h-16" style={{ color: TEAL, opacity: 0.4 }} />
                </div>
              )}
            </div>

          </motion.div>

          {/* Right: premium glass CTA cards */}
          <div className="flex flex-col gap-4 md:gap-5">
            {/* Card 1 - ENCONTRAR PROFISSIONAL */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="rounded-2xl relative overflow-hidden border border-white/60 group"
              style={{ background: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", boxShadow: "0 12px 40px rgba(0,0,0,0.07)" }}
            >
              <div className="flex">
                {/* Vertical accent bar */}
                <div className="w-1.5 shrink-0 bg-[#00a699]" />
                {/* Content */}
                <div className="flex-1 p-5 md:p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-[#00a699]/10 border border-[#00a699]/15">
                      <Search className="w-4.5 h-4.5 text-[#00a699]" strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#00a699]">Cliente</span>
                  </div>
                  <p className="text-[13px] md:text-sm leading-relaxed text-slate-600 mb-4">{card1Body}</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onEncontrar}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white bg-[#00a699] shadow-[0_4px_14px_rgba(0,166,153,0.3)] hover:shadow-[0_6px_20px_rgba(0,166,153,0.4)] transition-shadow"
                  >
                    Encontrar
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={3} />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Card 2 - REGISTA-TE COMO PROFISSIONAL */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="rounded-2xl relative overflow-hidden border border-white/60 group"
              style={{ background: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", boxShadow: "0 12px 40px rgba(0,0,0,0.07)" }}
            >
              <div className="flex">
                {/* Vertical accent bar */}
                <div className="w-1.5 shrink-0 bg-[#ff6633]" />
                {/* Content */}
                <div className="flex-1 p-5 md:p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-[#ff6633]/10 border border-[#ff6633]/15">
                      <Euro className="w-4.5 h-4.5 text-[#ff6633]" strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff6633]">Profissional</span>
                  </div>
                  <p className="text-[13px] md:text-sm leading-relaxed text-slate-600 mb-4">{card2Body}</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRegistar}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white bg-[#ff6633] shadow-[0_4px_14px_rgba(255,102,51,0.3)] hover:shadow-[0_6px_20px_rgba(255,102,51,0.4)] transition-shadow"
                  >
                    Registar
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={3} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}