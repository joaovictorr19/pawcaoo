import { useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';

export default function SEOManager({ baseTitle = "PawCão" }) {
  const { language } = useLanguage();

  // 1. Dicionário de Slogans
  const slogans = {
    pt: "O Melhor para o seu Pet",
    es: "Lo Mejor para tu Mascota",
    fr: "Le Meilleur pour votre Animal",
    en: "The Best for your Pet"
  };

  const descriptions = {
    pt: "Encontre Dog Walkers, Pet Sitters, Seguros e Produtos exclusivos em Portugal, Espanha e França.",
    es: "Encuentra Paseadores, Entrenadores, Seguros y Productos exclusivos en Portugal, España y Francia.",
    fr: "Trouvez des Promeneurs, Garde d'animaux, Assurances et Produits exclusifs au Portugal, Espagne et France.",
    en: "Find Dog Walkers, Pet Sitters, Insurance and Exclusive Products in Portugal, Spain and France."
  };

  useEffect(() => {
    // A. ATUALIZAR TÍTULO
    const currentSlogan = slogans[language] || slogans['pt'];
    document.title = `${baseTitle} - ${currentSlogan}`;

    // B. ATUALIZAR DESCRIÇÃO (Meta Description)
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', descriptions[language] || descriptions['pt']);
    }

    // C. ATUALIZAR Open Graph Title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', `${baseTitle} - ${currentSlogan}`);
    }

    // D. ATUALIZAR Open Graph Description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', descriptions[language] || descriptions['pt']);
    }

    // E. ATUALIZAR Twitter Title
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', `${baseTitle} - ${currentSlogan}`);
    }

    // F. ATUALIZAR Twitter Description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', descriptions[language] || descriptions['pt']);
    }

    // G. GARANTIR APPLE TOUCH ICON
    const faviconLink = document.querySelector("link[rel*='icon']");
    if (faviconLink && faviconLink.href) {
      let appleIcon = document.querySelector("link[rel='apple-touch-icon']");
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleIcon);
      }
      appleIcon.href = faviconLink.href;
    }

  }, [language, baseTitle]);

  return null; // Este componente não renderiza nada visual, só lógica
}