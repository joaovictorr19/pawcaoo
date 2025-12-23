import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight, Home } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function Breadcrumbs() {
  return null; // Breadcrumbs removidos
  
  const location = useLocation();
  const { language } = useLanguage();

  // Map of routes to readable names
  const routeNames = {
    // Main pages
    'Home': { pt: 'Início', es: 'Inicio', en: 'Home' },
    'Shop': { pt: 'Loja', es: 'Tienda', en: 'Shop' },
    'AdoptionListings': { pt: 'Adoção', es: 'Adopción', en: 'Adoption' },
    'PostEmergency': { pt: 'Emergência', es: 'Emergencia', en: 'Emergency' },
    'ShelterDashboard': { pt: 'Abrigo', es: 'Refugio', en: 'Shelter' },
    'Favorites': { pt: 'Favoritos', es: 'Favoritos', en: 'Favorites' },
    'MyBookings': { pt: 'Reservas', es: 'Reservas', en: 'Bookings' },
    'WalkHistory': { pt: 'Histórico', es: 'Historial', en: 'History' },
    'MyOrders': { pt: 'Encomendas', es: 'Pedidos', en: 'Orders' },
    'MyWishlist': { pt: 'Lista de Desejos', es: 'Lista de Deseos', en: 'Wishlist' },
    'Notifications': { pt: 'Notificações', es: 'Notificaciones', en: 'Notifications' },
    'Gamification': { pt: 'Hall da Fama', es: 'Salón de la Fama', en: 'Hall of Fame' },
    'AffiliateDashboard': { pt: 'Afiliados', es: 'Afiliados', en: 'Affiliates' },
    'OwnerSubscriptions': { pt: 'Subscrições', es: 'Suscripciones', en: 'Subscriptions' },
    
    // Professional
    'ProfessionalDashboard': { pt: 'Painel Profissional', es: 'Panel Profesional', en: 'Professional Dashboard' },
    'BecomeProfessional': { pt: 'Tornar-me Profissional', es: 'Hacerse Profesional', en: 'Become Professional' },
    'WalkerDetails': { pt: 'Detalhes do Passeador', es: 'Detalles del Paseador', en: 'Walker Details' },
    'TrainerDetails': { pt: 'Detalhes do Treinador', es: 'Detalles del Entrenador', en: 'Trainer Details' },
    'EditWalkerProfile': { pt: 'Editar Perfil', es: 'Editar Perfil', en: 'Edit Profile' },
    'ManageAvailability': { pt: 'Disponibilidade', es: 'Disponibilidad', en: 'Availability' },
    
    // Admin
    'AdminDashboard': { pt: 'Admin', es: 'Admin', en: 'Admin' },
    'AdminProductManagement': { pt: 'Gestão de Produtos', es: 'Gestión de Productos', en: 'Product Management' },
    'AdminShopHub': { pt: 'Shop Hub', es: 'Shop Hub', en: 'Shop Hub' },
    'AdminShelterVerification': { pt: 'Verificar Abrigos', es: 'Verificar Refugios', en: 'Verify Shelters' },
    'ModerationPanel': { pt: 'Moderação', es: 'Moderación', en: 'Moderation' },
    'PaymentSetup': { pt: 'Pagamentos', es: 'Pagos', en: 'Payments' },
    
    // Company
    'PartnerDashboard': { pt: 'Empresa', es: 'Empresa', en: 'Company' },
    'RegisterCompany': { pt: 'Registar Empresa', es: 'Registrar Empresa', en: 'Register Company' },
    
    // User
    'UserProfile': { pt: 'Perfil', es: 'Perfil', en: 'Profile' },
    'AccountSettings': { pt: 'Definições', es: 'Ajustes', en: 'Settings' },
    
    // Other
    'AboutUs': { pt: 'Sobre Nós', es: 'Sobre Nosotros', en: 'About Us' },
    'Contact': { pt: 'Contacto', es: 'Contacto', en: 'Contact' },
    'FAQ': { pt: 'FAQ', es: 'FAQ', en: 'FAQ' },
    'TermsOfService': { pt: 'Termos', es: 'Términos', en: 'Terms' },
    'PrivacyPolicy': { pt: 'Privacidade', es: 'Privacidad', en: 'Privacy' },
  };

  // Extract page name from path
  const getPageFromPath = (path) => {
    // Remove leading slash and query params
    const cleanPath = path.split('?')[0].replace(/^\//, '');
    
    // Handle root
    if (!cleanPath || cleanPath === '') return 'Home';
    
    // Return the page name
    return cleanPath;
  };

  const currentPage = getPageFromPath(location.pathname);
  
  // Don't show breadcrumbs on home page
  if (currentPage === 'Home' || !currentPage) {
    return null;
  }

  // Get translated name
  const getTranslatedName = (pageName) => {
    const names = routeNames[pageName];
    return names ? (names[language] || names.en) : pageName;
  };

  return (
    <nav 
      className="hidden md:flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200/50 text-sm"
      aria-label="Breadcrumb"
    >
      <Link
        to={createPageUrl("Home")}
        className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      <ChevronRight className="w-4 h-4 text-gray-400" />
      
      <span className="font-medium text-gray-900">
        {getTranslatedName(currentPage)}
      </span>

      {/* Show query params if relevant (e.g., tab=X) */}
      {location.search && (
        <>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 capitalize">
            {new URLSearchParams(location.search).get('tab') || 
             new URLSearchParams(location.search).get('category') ||
             new URLSearchParams(location.search).get('view')}
          </span>
        </>
      )}
    </nav>
  );
}