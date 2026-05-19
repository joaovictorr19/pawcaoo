import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import PawCaoLogo from '@/components/PawCaoLogo';
import { LogOut } from 'lucide-react';

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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    base44.auth.isAuthenticated()
      .then(async (ok) => {
        if (mounted) setAuthed(!!ok);
        if (ok) {
          try {
            const me = await base44.auth.me();
            if (mounted) setIsAdmin(me?.role === 'admin');
          } catch {}
        } else {
          if (mounted) setIsAdmin(false);
        }
      })
      .catch(() => { if (mounted) { setAuthed(false); setIsAdmin(false); } });
    return () => { mounted = false; };
  }, []);

  // Check if we're on a root tab
  const isRootRoute = ROOT_ROUTES.some(route => location.pathname === route);



  // Get page title from route (Home/root shows brand)
  const pageTitle = isRootRoute
    ? 'PawCão'
    : (Object.entries(ROUTE_TITLES).find(([route]) => location.pathname.startsWith(route))?.[1] || 'Página');

  const isOnProfHub = location.pathname === '/ProfessionalHubV2' || location.pathname === createPageUrl('ProfessionalHubV2');
  const qs = new URLSearchParams(location.search);
  const activeTab = qs.get('tab') || 'overview';
  const tabs = [
    { value: 'overview', label: 'Visão' },
    { value: 'services', label: 'Serviços' },
    { value: 'tools', label: 'Ferramentas' },
    { value: 'calendar', label: 'Agenda' },
    { value: 'reviews', label: 'Avaliações' },
    { value: 'portfolio', label: 'Portfólio' },
    { value: 'finances', label: 'Finanças' },
  ];


  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-[11000] bg-white border-b border-slate-200 px-3 py-1 flex items-center justify-center gap-2" style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}>
      <div className="grid grid-cols-[auto,1fr,auto] items-center w-full">
        {/* Logo à esquerda */}
        <div className="flex items-center">
          <button onClick={() => navigate(createPageUrl('Home'))} aria-label="Ir para a página inicial" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
            <PawCaoLogo size="small" showText={false} />
          </button>
        </div>

        {/* Botões centralizados */}
        <div className="flex items-center justify-center">
          {authed && (
            <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
              <Button size="sm" variant="secondary" className="h-8 px-3 text-[10px] sm:text-[11px] shrink-0" onClick={() => navigate(createPageUrl('ProfessionalHubV2'))}>Profissional</Button>
              <Button size="sm" variant="secondary" className="h-8 px-3 text-[10px] sm:text-[11px] shrink-0" onClick={() => navigate(createPageUrl('ClientDashboard'))}>Cliente</Button>
              {isAdmin && (
                <Button size="sm" variant="secondary" className="h-8 px-3 text-[10px] sm:text-[11px] shrink-0" onClick={() => navigate(createPageUrl('AdminDashboard'))}>Admin</Button>
              )}
            </div>
          )}
        </div>

        {/* Ações à direita */}
        <div className="flex items-center justify-end">
          {authed ? (
            <Button size="sm" variant="secondary" className="h-8 px-3 text-[10px] sm:text-[11px]" onClick={() => base44.auth.logout()}>
              <LogOut className="w-4 h-4 mr-1" /> Sair
            </Button>
          ) : (
            <Button size="sm" className="h-8 px-3 text-[10px] sm:text-[11px]" onClick={() => base44.auth.redirectToLogin()}>
              Entrar
            </Button>
          )}
        </div>
      </div>


    </div>
  );
}