export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "PawCão",
  "url": window.location.origin,
  "logo": `${window.location.origin}/logo.png`,
  "sameAs": [
    "https://www.facebook.com/pawcao",
    "https://www.instagram.com/pawcao"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+351-123-456-789",
    "contactType": "customer service"
  }
});

export const generateWebSiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "PawCão",
  "url": window.location.origin,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${window.location.origin}/Home?search={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
});

export const generatePetSchema = (pet) => ({
  "@context": "https://schema.org",
  "@type": "Product", 
  "name": pet.pet_name,
  "description": pet.description,
  "image": pet.photos,
  "sku": pet.id,
  "brand": {
    "@type": "Organization",
    "name": pet.shelter_name || "PawCão Adoption"
  },
  "offers": {
    "@type": "Offer",
    "url": window.location.href,
    "priceCurrency": "EUR",
    "price": pet.fee_amount || "0",
    "availability": pet.status === 'available' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
  }
});

export const generateServiceSchema = (walker) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": walker.walker_name,
  "image": walker.photo_url,
  "telephone": walker.phone,
  "priceRange": `${walker.hourly_rate} EUR`,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": walker.location,
    "addressCountry": "PT"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": walker.rating || "5",
    "reviewCount": walker.total_walks || "1"
  }
});

export const generateBreadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});