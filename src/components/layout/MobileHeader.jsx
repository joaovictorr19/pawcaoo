import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import PawCaoLogo from '@/components/PawCaoLogo';

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
  const isRootRoute = ROOT_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route)
  );



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
    <div className="md:hidden fixed top-0 left-0 right-0 z-[11000] bg-white border-b border-slate-200 px-3 py-1 flex items-center justify-between gap-2" style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}>
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors active:scale-95 shrink-0"
          aria-label="Home"
        >
          <PawCaoLogo size="tiny" showText={false} />
        </button>

        {false && (
          <div className="flex-1 overflow-x-auto whitespace-nowrap min-w-0">
            <div className="inline-flex w-max items-center gap-2 pr-4">
              {tabs.map((t) => (
                <button
                  key={t.value}
                  onClick={() => navigate(createPageUrl('ProfessionalHubV2') + `?tab=${t.value}`)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                    activeTab === t.value
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {!isOnProfHub && (
          <div className="flex-1 overflow-x-auto whitespace-nowrap min-w-0">
            <div className="inline-flex w-max items-center gap-2 pr-4">
              <Button size="sm" variant="outline" className="h-8 px-3 shrink-0" onClick={() => navigate(createPageUrl('ProfessionalHubV2'))}>Profissional</Button>
              <Button size="sm" variant="outline" className="h-8 px-3 shrink-0" onClick={() => navigate(createPageUrl('ClientDashboard'))}>Cliente</Button>

            </div>
          </div>
        )}

        {authed && (
          <Button size="sm" variant="outline" onClick={() => base44.auth.logout()} className="h-8 px-3 shrink-0">
            Sair
          </Button>
        )}
      </div>


    </div>
  );
}