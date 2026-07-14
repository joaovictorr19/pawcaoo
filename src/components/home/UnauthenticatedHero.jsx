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
            style={{ color: item.color, opacity: 0.4, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.06))" }}
            strokeWidth={2}
            fill="none"
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
      <motion.div variants={itemVariants} className="relative z-10 px-4 md:px-6 pt-2 md:pt-14 max-w-5xl mx-auto text-center">
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
            <div className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2.5rem] aspect-[4/3] md:aspect-[5/4] w-full max-w-md mx-auto border border-white/40" style={{ background: "#ffffff", boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}>
              <img
                src={dogImageUrl || "https://media.base44.com/images/public/6907b3be1ec43db5676a2085/6f5a681b3_generated_image.png"}
                alt="Cão cool PawCão"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>

          </motion.div>

          {/* Right: premium glass CTA cards */}
          <div className="relative flex flex-col gap-4 md:gap-5">

            {/* Card 1 - CLIENTE */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="relative overflow-hidden rounded-[24px] border border-white/60"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,250,0.9) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 10px 40px rgba(0,166,153,0.10), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              {/* Accent glow strip */}
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${TEAL}, #2dd4bf, ${TEAL})` }} />
              {/* Decorative corner glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${TEAL}, transparent 70%)` }} />

              <div className="relative p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl shadow-sm" style={{ background: `linear-gradient(135deg, ${TEAL}, #2dd4bf)`, boxShadow: `0 4px 12px ${TEAL}30` }}>
                    <Search className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-extrabold uppercase tracking-wider" style={{ color: TEAL }}>
                    {language === "pt" ? "Cliente" : language === "es" ? "Cliente" : language === "fr" ? "Client" : "Client"}
                  </span>
                </div>
                <p className="text-[13px] md:text-sm leading-relaxed text-slate-700 mb-6">{card1Body}</p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onEncontrar}
                  className="hero-cta-teal inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white transition-all"
                >
                  {language === "pt" ? "Encontrar" : language === "es" ? "Buscar" : language === "fr" ? "Trouver" : "Find"}
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </motion.button>
              </div>
            </motion.div>

            {/* Card 2 - PROFISSIONAL */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="relative overflow-hidden rounded-[24px] border border-white/60"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,245,240,0.9) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 10px 40px rgba(255,102,51,0.10), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              {/* Accent glow strip */}
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${ORANGE}, #ff9966, ${ORANGE})` }} />
              {/* Decorative corner glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${ORANGE}, transparent 70%)` }} />

              <div className="relative p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl shadow-sm" style={{ background: `linear-gradient(135deg, ${ORANGE}, #ff9966)`, boxShadow: `0 4px 12px ${ORANGE}30` }}>
                    <Euro className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-extrabold uppercase tracking-wider" style={{ color: ORANGE }}>
                    {language === "pt" ? "Profissional" : language === "es" ? "Profesional" : language === "fr" ? "Professionnel" : "Professional"}
                  </span>
                </div>
                <p className="text-[13px] md:text-sm leading-relaxed text-slate-700 mb-6">{card2Body}</p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onRegistar}
                  className="hero-cta-orange inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white transition-all"
                >
                  {language === "pt" ? "Registar" : language === "es" ? "Registrarse" : language === "fr" ? "S'inscrire" : "Register"}
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}