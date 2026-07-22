import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/components/LanguageContext';

export default function SEO({ title, description, keywords, image, url, type = 'website', schema }) {
  const { language } = useLanguage();
  const siteTitle = 'PawCão';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const metaDescription = description ? description.substring(0, 160) : 'Dog Walker, Treinador de cães, Pet Sitter Portugal | Paseador de perros España | Promeneur de chien France';
  // Garantir URL absoluta para imagens OG
  const getAbsoluteUrl = (path) => {
    if (!path) return `${window.location.protocol}//${window.location.host}/social-preview.jpg`;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${window.location.protocol}//${window.location.host}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const metaImage = getAbsoluteUrl(image);
  const currentUrl = url || window.location.href;

  return (
    <Helmet>
      <html lang={language} />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      
      {/* Standard metadata */}
      <title>{fullTitle}</title>
      <meta name='description' content={metaDescription} />
      <meta name='keywords' content={keywords || 'Dog Walker, Treinador de cães, Pet Sitter Portugal, Cuidador de animais exóticos, Paseador de perros, Adiestrador canino, Cuidadores de mascotas España, Promeneur de chien, Garde d\'animaux, Pet Sitter France, Dressage canin, Pension pour animaux'} />

      {/* Open Graph */}
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={metaDescription} />
      <meta property='og:image' content={metaImage} />
      <meta property='og:url' content={currentUrl} />
      <meta property='og:type' content={type} />
      <meta property='og:site_name' content={siteTitle} />
      
      {/* Twitter */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={metaDescription} />
      <meta name='twitter:image' content={metaImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Hreflang Tags */}
      <link rel="alternate" hreflang="pt" href={`${window.location.origin}${window.location.pathname}?lang=pt`} />
      <link rel="alternate" hreflang="es" href={`${window.location.origin}${window.location.pathname}?lang=es`} />
      <link rel="alternate" hreflang="fr" href={`${window.location.origin}${window.location.pathname}?lang=fr`} />
      <link rel="alternate" hreflang="en" href={`${window.location.origin}${window.location.pathname}?lang=en`} />
      <link rel="alternate" hreflang="x-default" href={`${window.location.origin}${window.location.pathname}?lang=pt`} />

      {/* JSON-LD Schema */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}