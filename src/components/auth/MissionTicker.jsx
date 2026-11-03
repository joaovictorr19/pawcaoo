import { useEffect, useState } from "react";
import { ShieldCheck, LockKeyhole, LayoutGrid } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import "./missionTicker.css";

const DURATION = 11000;

const CHIPS = {
  pt: ["Selo verificado", "Pagamento seguro", "Tudo num só lugar"],
  en: ["Verified seal", "Secure payment", "All in one place"],
  es: ["Sello verificado", "Pago seguro", "Todo en un solo lugar"],
  fr: ["Sceau vérifié", "Paiement sécurisé", "Tout au même endroit"],
};

const CHIP_ICONS = [ShieldCheck, LockKeyhole, LayoutGrid];

const CONTENT = {
  pt: [
    {
      label: "A nossa missão",
      title: "Cuidar do teu cão devia ser simples, claro e seguro.",
      text: "Passeios, treino, grooming e hotel canino numa só plataforma: escolhes o profissional, reservas em minutos e acompanhas cada serviço num diário com fotos.",
    },
    {
      label: "Porque existimos",
      title: "Encontrar um profissional de confiança não devia depender de sorte.",
      text: "Na PawCão tens passeadores, treinadores, groomers e hotéis caninos verificados, com preços à vista e avaliações de reservas reais — sem dezenas de contactos nem negociações por mensagem.",
    },
    {
      label: "Selo PawCão",
      title: "Verificamos cada profissional em pessoa antes de dar o selo.",
      text: "Visitamos o espaço, conhecemos quem vai cuidar do teu cão, avaliamos as instalações e validamos as condições de trabalho. É isto que separa um selo real de uma simples inscrição online.",
    },
    {
      label: "Vantagem PawCão",
      title: "Pagamento seguro e valor retido até o serviço terminar.",
      text: "O dinheiro fica protegido na plataforma e só é libertado quando o serviço é concluído. Comissões transparentes, sem surpresas, e histórico completo de tudo o que contrataste.",
    },
    {
      label: "Sobre nós",
      title: "Uma plataforma portuguesa, feita por quem tem cão.",
      text: "Nasceu no Porto e cresce em Portugal e Espanha, construída lado a lado com tutores e profissionais. A ambição é ser a referência mundial em cuidado animal.",
    },
  ],
  en: [
    {
      label: "Our mission",
      title: "Caring for your dog should be simple, clear and safe.",
      text: "Walks, training, grooming and dog hotels on one platform: pick the professional, book in minutes and follow every service in a photo diary.",
    },
    {
      label: "Why we exist",
      title: "Finding someone you can trust shouldn't be down to chance.",
      text: "PawCão gives you verified walkers, trainers, groomers and dog hotels, with upfront prices and reviews from real bookings — no dozens of messages or negotiations.",
    },
    {
      label: "The PawCão Seal",
      title: "We check every professional in person before the seal.",
      text: "We visit the place, meet the person who will care for your dog, assess the facilities and validate the working conditions. That's what separates a real seal from an online sign-up.",
    },
    {
      label: "The PawCão advantage",
      title: "Secure payment, held until the service is complete.",
      text: "Your money stays protected on the platform and is only released once the service is finished. Transparent fees, no surprises, and a full history of everything you booked.",
    },
    {
      label: "About us",
      title: "A Portuguese platform built by dog people.",
      text: "Born in Porto and growing across Portugal and Spain, shaped side by side with owners and professionals. Our ambition is to be the global reference in pet care.",
    },
  ],
  es: [
    {
      label: "Nuestra misión",
      title: "Cuidar de tu perro debería ser simple, claro y seguro.",
      text: "Paseos, adiestramiento, peluquería y hoteles caninos en una sola plataforma: elige al profesional, reserva en minutos y sigue cada servicio en un diario con fotos.",
    },
    {
      label: "Por qué existimos",
      title: "Encontrar a alguien de confianza no debería depender de la suerte.",
      text: "En PawCão tienes paseadores, adiestradores, peluqueros y hoteles caninos verificados, con precios claros y opiniones de reservas reales, sin decenas de mensajes ni negociaciones.",
    },
    {
      label: "Sello PawCão",
      title: "Verificamos a cada profesional en persona antes del sello.",
      text: "Visitamos el espacio, conocemos a quien cuidará de tu perro, evaluamos las instalaciones y validamos las condiciones de trabajo. Eso separa un sello real de un simple registro online.",
    },
    {
      label: "Ventaja PawCão",
      title: "Pago seguro y dinero retenido hasta que el servicio termina.",
      text: "El importe queda protegido en la plataforma y solo se libera al completar el servicio. Comisiones transparentes, sin sorpresas, e historial completo de todo lo contratado.",
    },
    {
      label: "Sobre nosotros",
      title: "Una plataforma portuguesa, hecha por gente con perro.",
      text: "Nació en Oporto y crece en Portugal y España junto a tutores y profesionales. La ambición es ser la referencia mundial en cuidado animal.",
    },
  ],
  fr: [
    {
      label: "Notre mission",
      title: "Prendre soin de votre chien devrait être simple, clair et sûr.",
      text: "Promenades, éducation, toilettage et hôtels canins sur une seule plateforme : choisissez le professionnel, réservez en quelques minutes et suivez chaque prestation dans un journal photo.",
    },
    {
      label: "Pourquoi nous existons",
      title: "Trouver une personne de confiance ne devrait pas relever du hasard.",
      text: "PawCão réunit des promeneurs, éducateurs, toiletteurs et hôtels canins vérifiés, avec des prix affichés et de vrais avis issus de réservations, sans dizaines de messages à envoyer.",
    },
    {
      label: "Le Sceau PawCão",
      title: "Nous vérifions chaque professionnel sur place avant le sceau.",
      text: "Nous visitons les lieux, rencontrons la personne qui s'occupera de votre chien, évaluons les installations et validons les conditions de travail. C'est ce qui distingue un vrai sceau d'une simple inscription en ligne.",
    },
    {
      label: "L'avantage PawCão",
      title: "Paiement sécurisé, fonds retenus jusqu'à la fin de la prestation.",
      text: "Le montant reste protégé sur la plateforme et n'est versé qu'une fois la prestation terminée. Commissions transparentes, sans surprise, et historique complet de vos réservations.",
    },
    {
      label: "À propos",
      title: "Une plateforme portugaise, créée par des amoureux des chiens.",
      text: "Née à Porto et présente au Portugal et en Espagne, construite avec les propriétaires et les professionnels. Notre ambition : devenir la référence mondiale du soin animal.",
    },
  ],
};

export default function MissionTicker() {
  const { language } = useLanguage();
  const items = CONTENT[language] || CONTENT.pt;
  const chips = CHIPS[language] || CHIPS.pt;
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

      <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-6">
        {chips.map((chip, i) => {
          const Icon = CHIP_ICONS[i];
          return (
            <li key={chip} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {chip}
            </li>
          );
        })}
      </ul>
    </div>
  );
}