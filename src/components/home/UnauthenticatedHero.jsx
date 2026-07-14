import React from "react";
import { motion } from "framer-motion";
import { PawPrint, Bone, Heart } from "lucide-react";
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

const FLOAT_ITEMS = [
  { Icon: PawPrint, pos: "top-[6%] left-[4%]", color: TEAL, size: 38, delay: 0, dur: 7 },
  { Icon: Heart, pos: "top-[10%] right-[7%]", color: ORANGE, size: 28, delay: 1.5, dur: 6 },
  { Icon: Bone, pos: "top-[44%] left-[2%]", color: TEAL, size: 32, delay: 0.8, dur: 8 },
  { Icon: PawPrint, pos: "bottom-[16%] right-[5%]", color: ORANGE, size: 42, delay: 2, dur: 7 },
  { Icon: Heart, pos: "bottom-[30%] left-[9%]", color: TEAL, size: 22, delay: 1.2, dur: 6.5 },
  { Icon: Bone, pos: "top-[60%] right-[3%]", color: ORANGE, size: 28, delay: 2.5, dur: 7.5 },
  { Icon: PawPrint, pos: "top-[78%] left-[7%]", color: ORANGE, size: 30, delay: 3, dur: 6 },
  { Icon: Heart, pos: "top-[26%] right-[22%]", color: YELLOW, size: 20, delay: 1.8, dur: 5.5 },
  { Icon: Bone, pos: "bottom-[50%] right-[14%]", color: TEAL, size: 24, delay: 0.4, dur: 7 },
  { Icon: PawPrint, pos: "top-[48%] right-[28%]", color: YELLOW, size: 26, delay: 3.2, dur: 6.8 },
];

function FloatingDecorations() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {FLOAT_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          className={`absolute ${item.pos}`}
          animate={{ y: [0, -16, 0], rotate: [0, 8, -4, 0] }}
          transition={{ duration: item.dur, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
        >
          <item.Icon
            size={item.size}
            style={{ color: item.color, opacity: 0.4, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.08))" }}
            strokeWidth={2.5}
            fill="currentColor"
          />
        </motion.div>
      ))}
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
      <FloatingDecorations />

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
          {/* Left: dog image in glass frame */}
          <motion.div variants={itemVariants} className="relative">
            <div className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2.5rem] aspect-[4/3] md:aspect-[5/4] w-full max-w-md shadow-2xl mx-auto border border-white/60" style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}>
              {dogImageUrl ? (
                <img src={dogImageUrl} alt="Cão cool PawCão" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/40 backdrop-blur-md">
                  <PawPrint className="w-16 h-16" style={{ color: TEAL, opacity: 0.5 }} />
                </div>
              )}
            </div>
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