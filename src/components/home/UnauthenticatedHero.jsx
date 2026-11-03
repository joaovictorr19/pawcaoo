import React from "react";
import { motion } from "framer-motion";
import { PawPrint, Bone, Heart, Star, Sparkles, Euro, ArrowRight, Search } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import PolaroidCarousel from "@/components/home/PolaroidCarousel";

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
      ? "Transforme a sua paixão por animais numa fonte de rendimento flexível como Dog Walker e junte-se a uma rede de profissionais pet. Sem mínimo para levantar os seus ganhos."
      : language === "es"
      ? "Convierte tu pasión por los animales en una fuente de ingresos flexible como Dog Walker y únete a una red de profesionales pet. Sin mínimo para retirar tus ganancias."
      : language === "fr"
      ? "Transformez votre passion pour les animaux en une source de revenus flexible en tant que Dog Walker et rejoignez un réseau de professionnels pet. Sans minimum pour retirer vos gains."
      : "Turn your passion for animals into a flexible source of income as a Dog Walker and join a pet professional network. No minimum to withdraw your earnings.";

  const card2ProLabel =
    language === "pt" ? "Sou Profissional" : language === "es" ? "Soy Profesional" : language === "fr" ? "Je suis Pro" : "I'm a Professional";
  const card2ClientLabel =
    language === "pt" ? "Sou Cliente" : language === "es" ? "Soy Cliente" : language === "fr" ? "Je suis Client" : "I'm a Client";

  const card2ProFeatures =
    language === "pt"
      ? ["Gestão de reservas integrada", "Pagamentos seguros via Stripe", "Crescimento com qualidade e confiança"]
      : language === "es"
      ? ["Gestión de reservas integrada", "Pagos seguros vía Stripe", "Crecimiento con calidad y confianza"]
      : language === "fr"
      ? ["Gestion des réservations intégrée", "Paiements sécurisés via Stripe", "Croissance avec qualité et confiance"]
      : ["Integrated booking management", "Secure Stripe payments", "Growth with quality and trust"];

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full overflow-hidden"
    >
      {/* Hero text - centered */}
      <motion.div variants={itemVariants} className="relative z-10 px-4 md:px-6 pt-2 md:pt-14 max-w-5xl mx-auto text-center">
        <h1 className="font-display font-bold tracking-wide leading-[1.05] text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-sm" style={{ color: TEAL, textShadow: "0 2px 12px rgba(0,166,153,0.15)" }}>
          {line1}
        </h1>
        <h2 className="font-display font-semibold tracking-wide leading-[1.15] text-xl sm:text-2xl md:text-3xl lg:text-4xl mt-3 text-slate-700">
          {line2}
        </h2>
      </motion.div>

      {/* Content grid: dog left, glass cards right */}
      <div className="relative z-10 px-4 md:px-6 pt-8 md:pt-12 pb-10 md:pb-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-stretch">
          {/* Left: dog image in transparent glass frame + collar */}
          <motion.div variants={itemVariants} className="relative flex">
            {/* Soft glow behind */}
            <div className="absolute inset-0 rounded-[2.5rem] blur-3xl opacity-25" style={{ background: `radial-gradient(circle at 50% 40%, ${TEAL}, transparent 70%)` }} />

            <PolaroidCarousel />

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

            {/* Card 2 - PROFISSIONAL + CLIENTE */}
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
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${ORANGE} 1px, transparent 0)`, backgroundSize: "16px 16px" }} />

              <div className="relative p-6 md:p-8">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl" style={{ background: `linear-gradient(135deg, ${ORANGE}, #ff9966)`, boxShadow: `0 6px 16px ${ORANGE}35` }}>
                      <Euro className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-extrabold uppercase tracking-wider" style={{ color: ORANGE }}>
                      {language === "pt" ? "Juntar-se" : language === "es" ? "Únete" : language === "fr" ? "Rejoindre" : "Join Us"}
                    </span>
                  </div>
                  <Sparkles className="w-4 h-4" style={{ color: ORANGE, opacity: 0.5 }} />
                </div>

                <p className="text-[13px] md:text-sm leading-relaxed text-slate-700 mb-5">{card2Body}</p>

                {/* Feature list */}
                <ul className="space-y-2 mb-6">
                  {card2ProFeatures.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-[12px] md:text-[13px] text-slate-600">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: `${ORANGE}15` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Dual CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onRegistar}
                    className="hero-cta-orange flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition-all"
                  >
                    {card2ProLabel}
                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onEntrar}
                    className="hero-cta-glass-premium flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all"
                  >
                    {card2ClientLabel}
                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} style={{ color: TEAL }} />
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