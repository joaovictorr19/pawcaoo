import React from 'react';
import { Helmet } from 'react-helmet-async';

// Schema.org structured data para Google Rich Results
export default function StructuredData({ type, data }) {
  const getSchema = () => {
    switch (type) {
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "PawCão",
          "url": "https://pawcao.net",
          "logo": "https://pawcao.net/logo.png",
          "description": data?.description || "Plataforma líder de Dog Walkers, Pet Sitters e Treinadores em Portugal, Espanha e França",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+351-XXX-XXX-XXX",
            "contactType": "Customer Service",
            "email": "support@pawcao.net",
            "availableLanguage": ["Portuguese", "English", "Spanish", "French"]
          },
          "sameAs": [
            "https://instagram.com/paw.cao",
            "https://facebook.com/pawcao"
          ]
        };

      case 'localBusiness':
        return {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "PawCão",
          "image": "https://pawcao.net/logo.png",
          "priceRange": "€€",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "PT"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": data?.lat || 38.7223,
            "longitude": data?.lng || -9.1393
          },
          "aggregateRating": data?.rating ? {
            "@type": "AggregateRating",
            "ratingValue": data.rating,
            "reviewCount": data.reviewCount || 100
          } : undefined
        };

      case 'service':
        return {
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": data?.serviceType || "Dog Walking",
          "provider": {
            "@type": "Organization",
            "name": "PawCão"
          },
          "areaServed": {
            "@type": "Country",
            "name": data?.country || "Portugal"
          },
          "availableChannel": {
            "@type": "ServiceChannel",
            "serviceUrl": "https://pawcao.net"
          }
        };

      case 'professional':
        return {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": data?.name,
          "jobTitle": data?.jobTitle || "Dog Walker",
          "description": data?.bio,
          "image": data?.photo,
          "aggregateRating": data?.rating ? {
            "@type": "AggregateRating",
            "ratingValue": data.rating,
            "reviewCount": data.reviewCount || 0
          } : undefined,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": data?.location
          }
        };

      case 'product':
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": data?.name,
          "description": data?.description,
          "image": data?.image,
          "offers": {
            "@type": "Offer",
            "price": data?.price,
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock"
          }
        };

      default:
        return null;
    }
  };

  const schema = getSchema();
  if (!schema) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}