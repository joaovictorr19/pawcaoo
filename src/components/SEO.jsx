import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, keywords, image, url, type = 'website' }) {
  const siteTitle = 'PawCão';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const metaDescription = description ? description.substring(0, 160) : 'A melhor plataforma de cuidados para pets em Portugal. Encontre passeadores, treinadores e adote seu novo melhor amigo.';
  const metaImage = image || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=2070&auto=format&fit=crop';
  const currentUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{fullTitle}</title>
      <meta name='description' content={metaDescription} />
      <meta name='keywords' content={keywords || 'pets, cães, gatos, passeadores, adoção, portugal, pawcão, dog walking, pet sitting, dog training'} />

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
    </Helmet>
  );
}