import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { getCurrentUser } from "@/utils/getCurrentUser";
import PawCaoLogo from '@/components/PawCaoLogo';
import { LogOut, ChevronDown } from 'lucide-react';
import LanguageSelector from '@/components/ui/LanguageSelector';
import { useLanguage } from '@/components/LanguageContext';

const ROOT_ROUTES = [
  createPageUrl('Home'),
  createPageUrl('Dashboard'),
  createPageUrl('ProfessionalHubV2'),
  createPageUrl('ClientDashboard'),
];

const ROUTE_TITLES = {
  [createPageUrl('MyBookings')]: 'Minhas Reservas',
  [createPageUrl('MyWallet')]: 'Minha Carteira',
  [createPageUrl("WalkerWallet")]: 'Carteira Profissional',
  [createPageUrl('AccountSettings')]: 'Configurações',
  [createPageUrl('Notifications')]: 'Notificações',
  [createPageUrl('Favorites')]: 'Favoritos',
  [createPageUrl('WalkHistory')]: 'Histórico de Passeios',
  [createPageUrl('Gamification')]: 'Legado & Conquistas',
  [createPageUrl('UserProfile')]: 'Perfil',
  [createPageUrl('BecomeProfessional')]: 'Tornar-me Profissional',
  [createPageUrl('WalkerDetails')]: 'Perfil do Passeador',
  [createPageUrl('TrainerDetails')]: 'Perfil do Treinador',
  [createPageUrl('ProfessionalHubV2')]: 'Dashboard Profissional',
  [createPageUrl('ProfessionalSetup')]: 'Configurar Perfil',
  [createPageUrl('EditWalkerProfile')]: 'Editar Perfil',
  [createPageUrl('EditTrainerProfile')]: 'Editar Perfil',
  [createPageUrl("ProfessionalCalendar")]: 'Gerir Disponibilidade',
  [createPageUrl("ActiveWalkDashboard")]: 'Rastreamento ao Vivo',
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const lbl = (key) => NAV_LABELS[key]?.[language] || NAV_LABELS[key]?.pt || key;

  useEffect(() => {
    let mounted = true;
    base44.auth.isAuthenticated()
      .then(async (ok) => {
        if (mounted) setAuthed(!!ok);
        if (ok) {
          try {
            const me = await getCurrentUser();
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


  const isActive = (page) => location.pathname === createPageUrl(page);

  return (
    <div
      className="md:hidden fixed top-0 left-0 right-0 z-[11000] flex items-center justify-center px-2"
      style={{ paddingTop: 'calc(0.375rem + env(safe-area-inset-top))', paddingBottom: '0.375rem' }}
    >
      <div
        className="flex items-center w-full gap-2 rounded-full px-3 py-1.5"
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Logo à esquerda */}
        <div className="flex items-center shrink-0">
          <button onClick={() => navigate(createPageUrl('Home'))} aria-label="Ir para a página inicial" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
            <PawCaoLogo size="small" showText={false} />
          </button>
        </div>

        {/* Botões centralizados - dropdown compacto para poupar espaço */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          {authed && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-1 h-7 px-3 text-[10px] font-bold rounded-full transition-all duration-200 text-[#1a1a1a hover:bg-slate-100/60"
                style={{ background: 'rgba(255, 255, 255, 0.5)' }}
              >
                <span>{(() => {
                  if (isHotel && isActive('HotelDashboard')) return lbl('hotel');
                  if (isActive('ProfessionalHubV2')) return lbl('professional');
                  if (isActive('ClientDashboard')) return lbl('client');
                  if (isAdmin && isActive('AdminDashboard')) return lbl('admin');
                  return lbl('professional');
                })()}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
              </button>
              {menuOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 rounded-2xl py-1 min-w-[120px]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  }}
                >
                  {isHotel && (
                    <button
                      onClick={() => { navigate(createPageUrl('HotelDashboard')); setMenuOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-[10px] font-bold rounded-xl transition-colors ${isActive('HotelDashboard') ? 'text-white bg-[#207373]' : 'text-[#1a1a1a] hover:bg-slate-100/60'}`}
                    >
                      {lbl('hotel')}
                    </button>
                  )}
                  <button
                    onClick={() => { navigate(createPageUrl('ProfessionalHubV2')); setMenuOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] font-bold rounded-xl transition-colors ${isActive('ProfessionalHubV2') ? 'text-white bg-[#207373]' : 'text-[#1a1a1a] hover:bg-slate-100/60'}`}
                  >
                    {lbl('professional')}
                  </button>
                  <button
                    onClick={() => { navigate(createPageUrl('ClientDashboard')); setMenuOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] font-bold rounded-xl transition-colors ${isActive('ClientDashboard') ? 'text-white bg-[#207373]' : 'text-[#1a1a1a] hover:bg-slate-100/60'}`}
                  >
                    {lbl('client')}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { navigate(createPageUrl('AdminDashboard')); setMenuOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-[10px] font-bold rounded-xl transition-colors ${isActive('AdminDashboard') ? 'text-white bg-[#207373]' : 'text-[#1a1a1a] hover:bg-slate-100/60'}`}
                    >
                      {lbl('admin')}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ações à direita */}
        <div className="flex items-center justify-end gap-1.5 shrink-0">
          <LanguageSelector />
          <div className="w-px h-3.5 bg-slate-300/50" />
          {authed ? (
            <button onClick={() => base44.auth.logout()} className="h-7 px-2 text-[10px] font-bold text-[#1a1a1a] flex items-center gap-1 rounded-full hover:bg-slate-100/60 transition-colors">
              <LogOut className="w-3 h-3" />
              <span>{lbl('exit')}</span>
            </button>
          ) : (
            <button onClick={() => base44.auth.redirectToLogin()} className="h-7 px-3 text-[10px] font-bold text-white rounded-full transition-transform active:scale-95 bg-[#207373]">
              {lbl('enter')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}