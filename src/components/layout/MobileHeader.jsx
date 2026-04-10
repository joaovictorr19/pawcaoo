import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

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
  [createPageUrl('MyWalletPro')]: 'Carteira Profissional',
  [createPageUrl('AccountSettings')]: 'Configurações',
  [createPageUrl('Notifications')]: 'Notificações',
  [createPageUrl('Favorites')]: 'Favoritos',
  [createPageUrl('WalkHistory')]: 'Histórico de Passeios',
  [createPageUrl('Gamification')]: 'Legado & Conquistas',
  [createPageUrl('UserProfile')]: 'Perfil',
  [createPageUrl('BecomeProfessional')]: 'Tornar-me Profissional',
  [createPageUrl('WalkerDetails')]: 'Perfil do Passeador',
  [createPageUrl('TrainerDetails')]: 'Perfil do Treinador',
  [createPageUrl('ProfessionalDashboard')]: 'Dashboard Profissional',
  [createPageUrl('ProfessionalSetup')]: 'Configurar Perfil',
  [createPageUrl('EditWalkerProfile')]: 'Editar Perfil',
  [createPageUrl('EditTrainerProfile')]: 'Editar Perfil',
  [createPageUrl('ManageAvailability')]: 'Gerir Disponibilidade',
  [createPageUrl('LiveWalkTracking')]: 'Rastreamento ao Vivo',
  [createPageUrl('EmergencyWalkDetails')]: 'Passeio de Emergência',
  [createPageUrl('OwnerSubscriptions')]: 'Subscrições',
  [createPageUrl('AffiliateDashboard')]: 'Programa de Afiliados',
  [createPageUrl('MyOrders')]: 'Minhas Encomendas',
  [createPageUrl('MyWishlist')]: 'Lista de Desejos',
  [createPageUrl('ClientDashboard')]: 'Painel do Cliente',
  [createPageUrl('PartnerDetails')]: 'Parceiro',
  [createPageUrl('AnimalProfile')]: 'Perfil do Animal',
  [createPageUrl('EditAnimalProfile')]: 'Editar Animal',
  [createPageUrl('FiscalSettings')]: 'Configurações Fiscais',
  [createPageUrl('StripeConnectSetup')]: 'Configurar Pagamentos',
};

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    base44.auth.isAuthenticated()
      .then((ok) => { if (mounted) setAuthed(!!ok); })
      .catch(() => { if (mounted) setAuthed(false); });
    return () => { mounted = false; };
  }, []);

  // Check if we're on a root tab
  const isRootRoute = ROOT_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route)
  );



  // Get page title from route (Home/root shows brand)
  const pageTitle = isRootRoute
    ? 'PawCão'
    : (Object.entries(ROUTE_TITLES).find(([route]) => location.pathname.startsWith(route))?.[1] || 'Página');

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-[10000] bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors active:scale-95"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-slate-700" />
      </button>
      <h1 className="text-lg font-bold text-slate-900 flex-1">{pageTitle}</h1>
      {!authed && (
        <Button size="sm" variant="outline" onClick={() => base44.auth.redirectToLogin()}>
          Entrar
        </Button>
      )}
    </div>
  );
}