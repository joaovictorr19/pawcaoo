import { useMemo } from "react";
import SEO from "@/components/SEO";
import { getPublicBaseUrl } from "@/utils/publicUrl";

const COUNTRY_DATA = {
  portugal: {
    code: "PT",
    name: { pt: "Portugal", es: "Portugal", en: "Portugal", fr: "Portugal" },
    keywords: {
      pt: ["Dog Walker", "dog walker Portugal", "pet sitter Portugal", "creche canina Portugal", "hotel canino Portugal", "reserva hotel canino Portugal", "alojamento para cães Portugal"],
      es: ["paseador de perros Portugal", "dog walker Portugal", "guardería canina Portugal", "hotel canino Portugal", "reserva hotel canino Portugal"],
      en: ["dog walker Portugal", "pet sitter Portugal", "dog boarding Portugal", "dog hotel Portugal", "dog daycare Portugal", "book dog hotel Portugal"],
      fr: ["promeneur de chien Portugal", "pet sitter Portugal", "pension pour chien Portugal", "hôtel pour chien Portugal", "garde d'animaux Portugal"],
    },
    hotelKeywords: {
      pt: ["hotel canino", "creche canina", "alojamento para cães", "reserva hotel canino", "estadia para cães", "hotel para cães Portugal"],
      es: ["hotel canino", "guardería canina", "residencia canina", "alojamiento para perros", "hotel para perros Portugal"],
      en: ["dog hotel", "dog boarding", "dog daycare", "dog kennel", "dog accommodation Portugal", "book dog hotel"],
      fr: ["hôtel pour chien", "pension canine", "garde d'animaux", "résidence canine", "accueil pour chien Portugal"],
    },
  },
  spain: {
    code: "ES",
    name: { pt: "Espanha", es: "España", en: "Spain", fr: "Espagne" },
    keywords: {
      pt: ["Dog Walker Espanha", "dog walker Espanha", "hotel canino Espanha", "creche canina Espanha"],
      es: ["paseador de perros", "dog walker España", "guardería canina", "hotel canino España", "pet sitter España", "residencia canina España", "alojamiento para perros España"],
      en: ["dog walker Spain", "pet sitter Spain", "dog boarding Spain", "dog hotel Spain", "dog daycare Spain"],
      fr: ["promeneur de chien Espagne", "pet sitter Espagne", "pension pour chien Espagne", "hôtel pour chien Espagne"],
    },
    hotelKeywords: {
      pt: ["hotel canino Espanha", "alojamento para cães Espanha", "reserva hotel canino Espanha"],
      es: ["hotel canino", "guardería canina", "residencia canina", "alojamiento para perros", "hotel para perros España", "reserva hotel canino España"],
      en: ["dog hotel Spain", "dog boarding Spain", "dog kennel Spain", "dog daycare Spain", "book dog hotel Spain"],
      fr: ["hôtel pour chien Espagne", "pension canine Espagne", "garde d'animaux Espagne"],
    },
  },
  france: {
    code: "FR",
    name: { pt: "França", es: "Francia", en: "France", fr: "France" },
    keywords: {
      pt: ["Dog Walker França", "dog walker França", "hotel canino França"],
      es: ["paseador de perros Francia", "dog walker Francia", "hotel canino Francia"],
      en: ["dog walker France", "pet sitter France", "dog boarding France", "dog hotel France", "dog daycare France"],
      fr: ["promeneur de chien", "dog walker France", "garde d'animaux", "pension pour chien", "pet sitter France", "hôtel pour chien France", "garde d'animaux France"],
    },
    hotelKeywords: {
      pt: ["hotel canino França", "alojamento para cães França"],
      es: ["hotel canino Francia", "residencia canina Francia"],
      en: ["dog hotel France", "dog boarding France", "dog kennel France", "dog daycare France"],
      fr: ["hôtel pour chien", "pension canine", "garde d'animaux", "résidence canine", "accueil pour chien France", "réservation hôtel pour chien"],
    },
  },
};

const PRO_TYPE_LABEL = {
  walker: { pt: "Dog Walker", es: "Paseador de Perros", en: "Dog Walker", fr: "Promeneur de Chien" },
  trainer: { pt: "Treinador de Cães", es: "Adiestrador Canino", en: "Dog Trainer", fr: "Dresseur Canin" },
  both: { pt: "Dog Walker e Treinador de Cães", es: "Paseador y Adiestrador", en: "Dog Walker & Trainer", fr: "Promeneur et Dresseur" },
  hotel: { pt: "Hotel Canino", es: "Hotel Canino", en: "Dog Hotel", fr: "Hôtel Canin" },
};

// Preposition "in" per language for title construction
const PREP = { pt: "em", es: "en", en: "in", fr: "à" };

// Localized description fragments
const DESC_FRAGMENTS = {
  pt: { services: "Serviços", rating: "Avaliação", bookings: "reservas", bookOnline: "Marca online no PawCão" },
  es: { services: "Servicios", rating: "Valoración", bookings: "reservas", bookOnline: "Reserva online en PawCão" },
  en: { services: "Services", rating: "Rating", bookings: "bookings", bookOnline: "Book online on PawCão" },
  fr: { services: "Services", rating: "Note", bookings: "réservations", bookOnline: "Réservez en ligne sur PawCão" },
};

function getServiceNames(walkerProfile) {
  const services = walkerProfile?.services_offered || [];
  const hotelServices = walkerProfile?.hotel_details?.services || [];
  const names = new Set();
  services.forEach(s => s.service_name && names.add(s.service_name));
  hotelServices.forEach(s => s.service_name && names.add(s.service_name));
  return Array.from(names).slice(0, 12);
}

export default function ProfessionalProfileSEO({ profileUser, walkerProfile, trainerProfile, displayName, displayCity, language }) {
  const seoData = useMemo(() => {
    const lang = language || "pt";
    const isHotel = walkerProfile?.professional_type === "hotel";
    const proType = walkerProfile?.professional_type || (trainerProfile ? "trainer" : "walker");
    const country = walkerProfile?.country_of_operation || trainerProfile?.country_of_operation || "portugal";
    const countryData = COUNTRY_DATA[country] || COUNTRY_DATA.portugal;
    const countryName = countryData.name[lang] || countryData.name.pt;

    const name = displayName || walkerProfile?.walker_name || trainerProfile?.trainer_name || "Profissional PawCão";
    const city = displayCity || walkerProfile?.location || trainerProfile?.location || "";
    const bio = walkerProfile?.bio || trainerProfile?.bio || "";
    const photo = walkerProfile?.photo_url || trainerProfile?.photo_url || profileUser?.profile_photo_url;
    const rating = walkerProfile?.rating || trainerProfile?.rating || 0;
    const totalWalks = walkerProfile?.total_walks || trainerProfile?.total_clients || 0;
    const hourlyRate = walkerProfile?.hourly_rate || trainerProfile?.hourly_rate;
    const phone = walkerProfile?.phone || trainerProfile?.phone;
    const instagram = walkerProfile?.instagram_url || trainerProfile?.instagram_url;

    const proTypeLabel = PRO_TYPE_LABEL[proType]?.[lang] || PRO_TYPE_LABEL.walker[lang];
    const prep = PREP[lang] || PREP.pt;
    const frag = DESC_FRAGMENTS[lang] || DESC_FRAGMENTS.pt;

    const serviceNames = getServiceNames(walkerProfile);

    // --- Title ---
    const title = city
      ? `${name} — ${proTypeLabel} ${prep} ${city}, ${countryName}`
      : `${name} — ${proTypeLabel} ${countryName}`;

    // --- Description ---
    const serviceStr = serviceNames.length > 0 ? serviceNames.slice(0, 5).join(", ") : "";
    let desc = `${proTypeLabel} ${name}`;
    if (city) desc += ` ${prep} ${city}`;
    desc += `, ${countryName}. `;
    if (serviceStr) desc += `${frag.services}: ${serviceStr}. `;
    if (rating > 0) desc += `${frag.rating} ${rating.toFixed(1)}★ (${totalWalks} ${frag.bookings}). `;
    desc += `${frag.bookOnline}.`;
    if (desc.length > 155) desc = desc.substring(0, 152) + "...";

    // --- Keywords ---
    const cityHotelKw = city
      ? [
          `hotel canino ${city}`,
          `dog hotel ${city}`,
          `dog boarding ${city}`,
          `hotel para cães ${city}`,
          `guardería canina ${city}`,
          `pension canine ${city}`,
        ]
      : [];
    const cityWalkerKw = city
      ? [`dog walker ${city}`, `Dog Walker ${city}`, `paseador de perros ${city}`, `promeneur de chien ${city}`]
      : [];

    const baseKw = [
      name,
      `${proTypeLabel} ${city || ""}`.trim(),
      `${proTypeLabel} ${countryName}`,
      `${proTypeLabel} ${countryData.code}`,
      "PawCão",
      ...(isHotel ? cityHotelKw : cityWalkerKw),
    ];
    const countryKw = countryData.keywords[lang] || countryData.keywords.pt;
    const hotelKw = isHotel ? (countryData.hotelKeywords?.[lang] || countryData.hotelKeywords?.pt || []) : [];
    const serviceKw = serviceNames.map(s => `${s} ${countryName}`);
    const keywords = [...baseKw, ...countryKw, ...hotelKw, ...serviceKw].filter(Boolean).join(", ");

    // --- Canonical URL (pawcao.pt/:slug) ---
    const slug = (walkerProfile?.hotel_details?.hotel_name || walkerProfile?.walker_name || trainerProfile?.trainer_name || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const canonicalUrl = slug ? `${getPublicBaseUrl()}/${slug}` : `${getPublicBaseUrl()}`;

    // --- JSON-LD Schema ---
    const schemaType = isHotel ? "LodgingBusiness" : "LocalBusiness";
    const schema = {
      "@context": "https://schema.org",
      "@type": schemaType,
      "name": name,
      "description": bio || `${proTypeLabel} em ${city || countryName}`,
      "url": canonicalUrl,
      "image": photo || undefined,
      "telephone": phone || undefined,
      "priceRange": hourlyRate ? `€${hourlyRate}` : "€€",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": city || undefined,
        "addressCountry": countryData.code,
      },
      "areaServed": countryName,
      "sameAs": instagram ? [instagram] : undefined,
      "aggregateRating": (rating > 0 || totalWalks > 0) ? {
        "@type": "AggregateRating",
        "ratingValue": rating > 0 ? rating.toFixed(1) : "5",
        "reviewCount": Math.max(totalWalks, 1),
      } : undefined,
      "makesOffer": serviceNames.length > 0 ? serviceNames.map(s => ({
        "@type": "Offer",
        "itemOffered": { "@type": "Service", "name": s },
      })) : undefined,
    };

    // Clean undefined fields
    const clean = (obj) => {
      Object.keys(obj).forEach(k => {
        if (obj[k] === undefined || obj[k] === null) delete obj[k];
        else if (typeof obj[k] === "object" && !Array.isArray(obj[k])) clean(obj[k]);
      });
      return obj;
    };
    clean(schema);

    return { title, description: desc, keywords, canonicalUrl, photo, schema };
  }, [profileUser, walkerProfile, trainerProfile, displayName, displayCity, language]);

  return (
    <SEO
      title={seoData.title}
      description={seoData.description}
      keywords={seoData.keywords}
      image={seoData.photo}
      url={seoData.canonicalUrl}
      type="profile"
      schema={seoData.schema}
    />
  );
}