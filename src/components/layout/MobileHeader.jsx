import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import PawCaoLogo from '@/components/PawCaoLogo';
import { LogOut } from 'lucide-react';
import LanguageSelector from '@/components/ui/LanguageSelector';
import { useLanguage } from '@/components/LanguageContext';

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
  [createPageUrl('HotelDashboard')]: 'Painel do Hotel',
  [createPageUrl('PartnerHotelPanel')]: 'Painel do Parceiro',
};

const NAV_LABELS = {
  professional: { pt: 'Profissional', en: 'Professional', es: 'Profesional', fr: 'Professionnel' },
  client:       { pt: 'Cliente',       en: 'Client',       es: 'Cliente',      fr: 'Client'        },
  admin:        { pt: 'Admin',         en: 'Admin',        es: 'Admin',        fr: 'Admin'         },
  hotel:        { pt: 'Hotel',         en: 'Hotel',        es: 'Hotel',        fr: 'Hôtel'         },
  enter:        { pt: 'Entrar',        en: 'Sign In',      es: 'Entrar',       fr: 'Connexion'     },
  exit:         { pt: 'Sair',          en: 'Sign Out',     es: 'Salir',        fr: 'Déconnecter'   },
};

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHotel, setIsHotel] = useState(false);

  const lbl = (key) => NAV_LABELS[key]?.[language] || NAV_LABELS[key]?.pt || key;

  useEffect(() => {
    let mounted = true;
    base44.auth.isAuthenticated()
      .then(async (ok) => {
        if (mounted) setAuthed(!!ok);
        if (ok) {
          try {
            const me = await base44.auth.me();
            if (mounted) {
              setIsAdmin(me?.role === 'admin');
              setIsHotel(me?.role === 'hotel' || me?.role === 'hotel_admin');
            }
          } catch {}
        } else {
          if (mounted) { setIsAdmin(false); setIsHotel(false); }
        }
      })
      .catch(() => { if (mounted) { setAuthed(false); setIsAdmin(false); setIsHotel(false); } });
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
    <div className="md:hidden fixed top-0 left-0 right-0 z-[11000] bg-white border-b border-slate-200 px-2 py-1 flex items-center justify-center gap-1" style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}>
      <div className="flex items-center w-full gap-1">
        {/* Logo à esquerda */}
        <div className="flex items-center shrink-0">
          <button onClick={() => navigate(createPageUrl('Home'))} aria-label="Ir para a página inicial" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
            <PawCaoLogo size="small" showText={false} />
          </button>
        </div>

        {/* Botões centralizados - scrollable */}
        <div className="flex-1 flex items-center justify-center overflow-x-auto flex-nowrap min-w-0" style={{ scrollbarWidth: 'none' }}>
          {authed && (
            <div className="flex items-center gap-1 whitespace-nowrap">
              {isHotel && (
                <Button size="sm" variant="secondary" className="h-7 px-2.5 text-[10px] shrink-0 bg-slate-900 text-white hover:bg-slate-800" onClick={() => navigate(createPageUrl('HotelDashboard'))}>{lbl('hotel')}</Button>
              )}
              <Button size="sm" variant="secondary" className="h-7 px-2.5 text-[10px] shrink-0" onClick={() => navigate(createPageUrl('ProfessionalHubV2'))}>{lbl('professional')}</Button>
              <Button size="sm" variant="secondary" className="h-7 px-2.5 text-[10px] shrink-0" onClick={() => navigate(createPageUrl('ClientDashboard'))}>{lbl('client')}</Button>
              {isAdmin && (
                <Button size="sm" variant="secondary" className="h-7 px-2.5 text-[10px] shrink-0" onClick={() => navigate(createPageUrl('AdminDashboard'))}>{lbl('admin')}</Button>
              )}
            </div>
          )}
        </div>

        {/* Ações à direita */}
        <div className="flex items-center justify-end gap-1 shrink-0">
          <LanguageSelector />
          {authed ? (
            <Button size="sm" variant="secondary" className="h-7 px-2.5 text-[10px]" onClick={() => base44.auth.logout()}>
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button size="sm" className="h-7 px-2.5 text-[10px]" onClick={() => base44.auth.redirectToLogin()}>
              {lbl('enter')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}