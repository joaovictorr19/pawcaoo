import React from "react";
import { motion } from "framer-motion";
import { PawPrint } from "lucide-react";
import PawCaoLogo from "@/components/PawCaoLogo";
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

function OrganicShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Teal blob top-right */}
      <svg className="absolute -top-24 -right-16 w-[420px] h-[420px] opacity-70 animate-blob" viewBox="0 0 200 200">
        <path fill={TEAL} d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-46.1C87.4,-33.1,90.1,-17.2,87.3,-2.6C84.5,12,76.2,26.4,66.1,38.1C56,49.8,44.1,58.8,30.6,65.3C17.1,71.8,2.1,75.8,-12.6,73.6C-27.3,71.4,-41.7,63,-53.8,52.1C-65.9,41.2,-75.7,27.8,-79.6,12.8C-83.5,-2.2,-81.5,-18.8,-73.7,-32.4C-65.9,-46,-52.3,-56.6,-38.3,-63.9C-24.3,-71.2,-9.9,-75.2,2.6,-79.1C15.1,-83,30.5,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
      </svg>
      {/* Orange curve bottom-left */}
      <svg className="absolute -bottom-32 -left-20 w-[480px] h-[480px] opacity-60 animate-blob" style={{ animationDelay: "2s" }} viewBox="0 0 200 200">
        <path fill={ORANGE} d="M37.5,-62.1C48.9,-54.3,58.1,-43.2,65.1,-30.5C72.1,-17.8,76.9,-3.5,74.6,9.7C72.3,22.9,62.9,35.1,51.4,44.4C39.9,53.7,26.3,60.1,11.5,63.4C-3.3,66.7,-19.3,66.9,-33.1,61.4C-46.9,55.9,-58.5,44.7,-66.1,31.1C-73.7,17.5,-77.3,1.5,-74.2,-13.2C-71.1,-27.9,-61.3,-41.3,-49.1,-49.8C-36.9,-58.3,-22.3,-61.9,-7.6,-62.6C7.1,-63.3,26.1,-69.9,37.5,-62.1Z" transform="translate(100 100)" />
      </svg>
      {/* Orange dots - right cluster */}
      <div className="absolute top-[18%] right-[22%] grid grid-cols-6 gap-3 opacity-40">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={`dot-r-${i}`} className="w-1.5 h-1.5 rounded-full" style={{ background: i % 3 === 0 ? ORANGE : "#ffffff" }} />
        ))}
      </div>
      {/* White dots - left cluster */}
      <div className="absolute bottom-[20%] left-6 grid grid-cols-4 gap-3 opacity-30">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={`dot-l-${i}`} className="w-1.5 h-1.5 rounded-full bg-white" />
        ))}
      </div>
      {/* Paw print accent bottom-right */}
      <PawPrint className="absolute bottom-10 right-8 w-8 h-8 opacity-50" style={{ color: TEAL }} />
      {/* Tennis ball accent */}
      <div className="absolute top-[35%] left-[44%] w-5 h-5 rounded-full opacity-80 shadow-lg" style={{ background: YELLOW }} />
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
      className="relative w-full bg-black overflow-hidden"
    >
      <OrganicShapes />

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 md:px-6 pt-6">
        <div className="flex items-center gap-2">
          <PawCaoLogo size="small" showText={false} />
          <span className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: TEAL }}>
            PAWCÃO
          </span>
        </div>
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEntrar}
          className="rounded-full px-5 py-2 text-xs font-bold text-white border border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
        >
          ENTRAR
        </motion.button>
      </div>

      {/* Hero text - centered */}
      <motion.div variants={itemVariants} className="relative z-10 px-4 md:px-6 pt-6 md:pt-10 max-w-5xl mx-auto text-center">
        <h1 className="font-black tracking-tight leading-[1.08] text-2xl sm:text-3xl md:text-4xl lg:text-5xl" style={{ color: TEAL }}>
          {line1}
        </h1>
        <h2 className="font-black tracking-tight leading-[1.15] text-lg sm:text-xl md:text-2xl lg:text-3xl mt-3" style={{ color: "#ffffff" }}>
          {line2}
        </h2>
      </motion.div>

      {/* Content grid: dog left, cards right */}
      <div className="relative z-10 px-4 md:px-6 pt-8 md:pt-12 pb-10 md:pb-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          {/* Left: dog image */}
          <motion.div variants={itemVariants} className="relative">
            <div className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2.5rem] aspect-[4/3] md:aspect-[5/4] w-full max-w-md shadow-2xl mx-auto">
              {dogImageUrl ? (
                <img src={dogImageUrl} alt="Cão cool PawCão" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: TEAL }}>
                  <PawPrint className="w-16 h-16 text-white/40" />
                </div>
              )}
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[1.75rem] md:rounded-[2.5rem] pointer-events-none" />
            </div>
          </motion.div>

          {/* Right: CTA cards */}
          <div className="flex flex-col gap-4 md:gap-6">
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-[1.75rem] p-6 md:p-8 shadow-2xl relative overflow-hidden"
              style={{ background: ORANGE }}
            >
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/15 rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-4">
                <p className="text-white font-semibold text-sm md:text-base leading-relaxed">{card1Body}</p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onEncontrar}
                  className="self-start rounded-full px-7 py-3 font-black uppercase tracking-wider text-sm text-white bg-black hover:bg-white hover:text-black transition-colors"
                >
                  ENCONTRAR
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-[1.75rem] p-6 md:p-8 shadow-2xl relative overflow-hidden"
              style={{ background: ORANGE }}
            >
              <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-black/10 rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-4">
                <p className="text-white font-semibold text-sm md:text-base leading-relaxed">{card2Body}</p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onRegistar}
                  className="self-start rounded-full px-7 py-3 font-black uppercase tracking-wider text-sm text-white bg-black hover:bg-white hover:text-black transition-colors"
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