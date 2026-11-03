import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import "./missionTicker.css";

const DURATION = 6500;

const CONTENT = {
  pt: [
    {
      label: "A nossa missão",
      title: "Simplificar o cuidado animal sem nunca comprometer a confiança.",
      text: "Existimos para acabar com a frustração das plataformas confusas: ligamos donos a passeadores, treinadores, groomers e hotéis caninos em segundos, com transparência e zero burocracia.",
    },
    {
      label: "Porque existimos",
      title: "Encontrar quem cuide bem do teu cão não devia ser uma lotaria.",
      text: "Reunimos hotéis, passeadores, treinadores e groomers num só lugar, com avaliações reais de quem já confiou neles e com cada serviço registado num diário que podes consultar.",
    },
    {
      label: "Selo PawCão",
      title: "Verificamos pessoalmente cada profissional antes de lhe darmos o selo.",
      text: "Não basta um registo online: deslocamo-nos ao local, conhecemos o profissional, avaliamos as instalações e validamos as condições de trabalho. É assim que garantimos confiança real.",
    },
    {
      label: "Sobre nós",
      title: "Uma plataforma portuguesa nascida no Porto.",
      text: "Criada por quem tem cão e construída em conjunto com tutores e profissionais, já a crescer em Portugal e Espanha com a ambição de ser a número 1 no mundo.",
    },
    {
      label: "A nossa promessa",
      title: "Confiança em cada reserva.",
      text: "Pagamentos protegidos, histórico completo de serviços e apoio próximo — para que só te preocupes em voltar a ver o teu cão feliz.",
    },
  ],
  en: [
    {
      label: "Our mission",
      title: "Simplifying pet care without ever compromising trust.",
      text: "We exist to end the frustration of confusing platforms: we connect owners with walkers, trainers, groomers and dog hotels in seconds, with transparency and zero bureaucracy.",
    },
    {
      label: "Why we exist",
      title: "Finding someone who cares well for your dog shouldn't be a lottery.",
      text: "We bring hotels, walkers, trainers and groomers together in one place, with real reviews from people who already trusted them and every service logged in a diary you can follow.",
    },
    {
      label: "The PawCão Seal",
      title: "We personally check every professional before awarding the seal.",
      text: "An online registration isn't enough: we visit the place, meet the professional, assess the facilities and validate the working conditions. That's how we ensure real trust.",
    },
    {
      label: "About us",
      title: "A Portuguese platform born in Porto.",
      text: "Created by dog people and shaped with owners and professionals, now growing across Portugal and Spain with the ambition to be number one in the world.",
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
      title: "Simplificar el cuidado animal sin comprometer nunca la confianza.",
      text: "Existimos para acabar con la frustración de las plataformas confusas: conectamos dueños con paseadores, adiestradores, peluqueros y hoteles caninos en segundos, con transparencia y cero burocracia.",
    },
    {
      label: "Por qué existimos",
      title: "Encontrar a quien cuide bien de tu perro no debería ser una lotería.",
      text: "Reunimos hoteles, paseadores, adiestradores y peluqueros en un solo lugar, con opiniones reales de quienes ya confiaron en ellos y cada servicio registrado en un diario que puedes consultar.",
    },
    {
      label: "Sello PawCão",
      title: "Verificamos personalmente a cada profesional antes de darle el sello.",
      text: "No basta con un registro online: nos desplazamos al lugar, conocemos al profesional, evaluamos las instalaciones y validamos las condiciones de trabajo. Así garantizamos confianza real.",
    },
    {
      label: "Sobre nosotros",
      title: "Una plataforma portuguesa nacida en Oporto.",
      text: "Creada por gente con perro y construida junto a tutores y profesionales, ya creciendo en Portugal y España con la ambición de ser la número 1 del mundo.",
    },
    {
      label: "Nuestra promesa",
      title: "Confianza en cada reserva.",
      text: "Pagos protegidos, historial completo de servicios y apoyo cercano, para que solo te preocupes por ver a tu perro feliz otra vez.",
    },
  ],
  fr: [
    {
      label: "Notre mission",
      title: "Simplifier le soin animal sans jamais compromettre la confiance.",
      text: "Nous existons pour mettre fin à la frustration des plateformes confuses : nous relions les propriétaires à des promeneurs, éducateurs, toiletteurs et hôtels canins en quelques secondes, avec transparence et zéro bureaucratie.",
    },
    {
      label: "Pourquoi nous existons",
      title: "Trouver quelqu'un qui s'occupe bien de votre chien ne devrait pas être une loterie.",
      text: "Nous réunissons hôtels, promeneurs, éducateurs et toiletteurs au même endroit, avec de vrais avis de ceux qui leur ont déjà fait confiance et chaque prestation consignée dans un journal consultable.",
    },
    {
      label: "Le Sceau PawCão",
      title: "Nous vérifions personnellement chaque professionnel avant de décerner le sceau.",
      text: "Une inscription en ligne ne suffit pas : nous nous déplaçons sur place, rencontrons le professionnel, évaluons les locaux et validons les conditions de travail. C'est ainsi que nous garantissons une confiance réelle.",
    },
    {
      label: "À propos",
      title: "Une plateforme portugaise née à Porto.",
      text: "Créée par des amoureux des chiens et construite avec les propriétaires et les professionnels, déjà présente au Portugal et en Espagne avec l'ambition d'être la numéro un mondiale.",
    },
    {
      label: "Notre promesse",
      title: "La confiance à chaque réservation.",
      text: "Paiements protégés, historique complet des prestations et accompagnement proche, pour ne penser qu'à revoir votre chien heureux.",
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