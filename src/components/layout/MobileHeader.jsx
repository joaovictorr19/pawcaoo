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
    <div className="md:hidden fixed top-0 left-0 right-0 z-[11000] bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-3 py-2 flex items-center justify-between gap-2" style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/60 transition-colors active:scale-95"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-slate-700" />
      </button>
      <h1 className="text-base font-bold text-slate-900 flex-1 truncate">{pageTitle}</h1>
      {!authed ? (
        <Button size="sm" variant="default" onClick={() => base44.auth.redirectToLogin()} className="h-8 px-3">
          Entrar
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => base44.auth.logout()} className="h-8 px-3">
          Sair
        </Button>
      )}

      {isOnProfHub && (
        <div className="mt-2 -mb-1 w-full overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-2 pr-2">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => navigate(createPageUrl('ProfessionalHubV2') + `?tab=${t.value}`)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                  activeTab === t.value
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white/60 text-slate-700 border-slate-300 hover:bg-white/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}