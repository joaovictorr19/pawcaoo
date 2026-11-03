import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import "./missionTicker.css";

const DURATION = 6500;

const CONTENT = {
  pt: [
    {
      label: "A nossa missão",
      title: "Cuidar de cada cão como se fosse nosso.",
      text: "Cada passeio, estadia ou sessão de treino é acompanhado por profissionais verificados e registado num diário que podes consultar.",
    },
    {
      label: "Porque existimos",
      title: "Encontrar quem cuide bem do teu cão não devia ser uma lotaria.",
      text: "Reunimos hotéis, passeadores, treinadores e groomers num só lugar, com avaliações reais de quem já confiou.",
    },
    {
      label: "Sobre nós",
      title: "Uma plataforma portuguesa feita por quem tem cão.",
      text: "Nascida em Lisboa, construída com tutores e profissionais para tornar o cuidado animal simples, transparente e justo.",
    },
    {
      label: "A nossa promessa",
      title: "Confiança em cada reserva.",
      text: "Pagamentos protegidos, histórico de serviços e apoio próximo — para que só te preocupes em voltar a ver o teu cão feliz.",
    },
  ],
  en: [
    {
      label: "Our mission",
      title: "Caring for every dog as if it were our own.",
      text: "Every walk, stay or training session is handled by verified professionals and logged in a diary you can follow.",
    },
    {
      label: "Why we exist",
      title: "Finding someone who cares well for your dog shouldn't be a lottery.",
      text: "We bring hotels, walkers, trainers and groomers together in one place, with real reviews from people who already trusted them.",
    },
    {
      label: "About us",
      title: "A Portuguese platform built by dog people.",
      text: "Born in Lisbon, shaped with owners and professionals to make pet care simple, transparent and fair.",
    },
    {
      label: "Our promise",
      title: "Trust in every booking.",
      text: "Protected payments, full service history and close support, so all you worry about is seeing your dog happy again.",
    },
  ],
  es: [
    {
      label: "Nuestra misión",
      title: "Cuidar de cada perro como si fuera nuestro.",
      text: "Cada paseo, estancia o sesión de adiestramiento está a cargo de profesionales verificados y queda registrado en un diario que puedes consultar.",
    },
    {
      label: "Por qué existimos",
      title: "Encontrar a quien cuide bien de tu perro no debería ser una lotería.",
      text: "Reunimos hoteles, paseadores, adiestradores y peluqueros en un solo lugar, con opiniones reales de quienes ya confiaron.",
    },
    {
      label: "Sobre nosotros",
      title: "Una plataforma portuguesa hecha por gente con perro.",
      text: "Nacida en Lisboa y construida con tutores y profesionales para que el cuidado animal sea simple, transparente y justo.",
    },
    {
      label: "Nuestra promesa",
      title: "Confianza en cada reserva.",
      text: "Pagos protegidos, historial de servicios y apoyo cercano, para que solo te preocupes por ver a tu perro feliz otra vez.",
    },
  ],
  fr: [
    {
      label: "Notre mission",
      title: "Prendre soin de chaque chien comme du nôtre.",
      text: "Chaque promenade, séjour ou séance d'éducation est assuré par des professionnels vérifiés et consigné dans un journal consultable.",
    },
    {
      label: "Pourquoi nous existons",
      title: "Trouver quelqu'un qui s'occupe bien de votre chien ne devrait pas être une loterie.",
      text: "Nous réunissons hôtels, promeneurs, éducateurs et toiletteurs au même endroit, avec de vrais avis de ceux qui leur ont déjà fait confiance.",
    },
    {
      label: "À propos",
      title: "Une plateforme portugaise créée par des amoureux des chiens.",
      text: "Née à Lisbonne, construite avec des propriétaires et des professionnels pour rendre le soin animal simple, transparent et juste.",
    },
    {
      label: "Notre promesse",
      title: "La confiance à chaque réservation.",
      text: "Paiements protégés, historique complet et accompagnement proche, pour ne penser qu'à revoir votre chien heureux.",
    },
  ],
};

export default function MissionTicker() {
  const { language } = useLanguage();
  const items = CONTENT[language] || CONTENT.pt;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), DURATION);
    return () => clearInterval(id);
  }, [items.length]);

  const item = items[index];

  return (
    <div className="relative max-w-sm">
      <div aria-live="polite">
        <div key={index} className="mt-slide">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
            {item.label}
          </div>
          <h2 className="font-heading text-3xl font-semibold leading-[1.15] tracking-tight text-white">
            {item.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {item.text}
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2" aria-hidden="true">
        {items.map((_, i) => (
          <span
            key={i}
            className={
              i === index
                ? "h-[3px] w-10 overflow-hidden rounded-full bg-white/25"
                : "h-[3px] w-2 rounded-full bg-white/25 transition-all duration-500"
            }
          >
            {i === index && (
              <span key={index} className="mt-bar-fill" style={{ animationDuration: `${DURATION}ms` }} />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}