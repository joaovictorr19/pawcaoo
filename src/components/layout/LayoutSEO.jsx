import { Helmet } from 'react-helmet-async';
import { useLanguage } from "@/components/LanguageContext";

export default function LayoutSEO() {
  const { language } = useLanguage();

  const title = language === 'pt' ? 'PawCao - O melhor para o seu Pet' :
    language === 'es' ? 'PawCao - Lo mejor para tu Mascota' :
    language === 'fr' ? 'PawCao - Le meilleur pour votre Animal' :
    'PawCao - The best for your Pet';

  const description = language === 'pt' ? 'Encontre Dog Walkers, Pet Sitters, Seguros e Produtos exclusivos em Portugal, Espanha e Franca.' :
    language === 'es' ? 'Encuentra Paseadores, Entrenadores, Seguros y Productos exclusivos en Portugal, Espana y Francia.' :
    language === 'fr' ? 'Trouvez des Promeneurs, Garde d\'animaux, Assurances et Produits exclusifs au Portugal, Espagne et France.' :
    'Find Dog Walkers, Pet Sitters, Insurance and Exclusive Products in Portugal, Spain and France.';

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/logo.png" />
      <meta name="description" content={description} />
      <meta name="keywords" content="Passeador de caes, Treinador de caes, Pet Sitter Portugal, Paseador de perros, Adiestrador canino, Promeneur de chien, Garde d'animaux, Pet Sitter France" />
      <meta name="author" content="PawCao" />
      <link rel="canonical" href="https://pawcao.net" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="PawCao" />
      <meta property="og:title" content="PawCao - O melhor cuidado para o seu animal" />
      <meta property="og:description" content="Encontre passeadores, treinadores e cuidadores de exoticos de confianca em Portugal, Espanha e Franca. Rastreamento GPS e pagamentos seguros." />
      <meta property="og:url" content={`${window.location.protocol}//${window.location.host}${window.location.pathname}`} />
      <meta property="og:locale" content="pt_PT" />
      <meta property="og:locale:alternate" content="es_ES" />
      <meta property="og:locale:alternate" content="fr_FR" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="PawCao - O melhor cuidado para o seu animal" />
    </Helmet>
  );
}
