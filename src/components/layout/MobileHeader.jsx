import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';

const ROOT_ROUTES = [
  createPageUrl('Home'),
  createPageUrl('Dashboard'),
  createPageUrl('ProfessionalHubV2'),
  createPageUrl('ClientDashboard'),
  createPageUrl('Shop'),
];

const ROUTE_TITLES = {
  [createPageUrl('MyBookings')]: 'Minhas Reservas',
  [createPageUrl('MyWallet')]: 'Minha Carteira',
  [createPageUrl('AccountSettings')]: 'Configurações',
  [createPageUrl('Notifications')]: 'Notificações',
  [createPageUrl('Favorites')]: 'Favoritos',
  [createPageUrl('WalkHistory')]: 'Histórico',
  [createPageUrl('Gamification')]: 'Legado',
  [createPageUrl('UserProfile')]: 'Perfil',
  [createPageUrl('BecomeProfessional')]: 'Tornar-me Profissional',
};

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on a root tab
  const isRootRoute = ROOT_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route)
  );

  if (isRootRoute) return null;

  // Get page title from route
  const pageTitle = Object.entries(ROUTE_TITLES).find(
    ([route]) => location.pathname.startsWith(route)
  )?.[1] || 'Página';

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors active:scale-95"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-slate-700" />
      </button>
      <h1 className="text-lg font-bold text-slate-900 flex-1">{pageTitle}</h1>
    </div>
  );
}