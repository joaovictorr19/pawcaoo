import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from "@/utils/getCurrentUser";
import PawCaoLogo from '@/components/PawCaoLogo';
import { LogOut } from 'lucide-react';
import LanguageSelector from '@/components/ui/LanguageSelector';
import { useLanguage } from '@/components/LanguageContext';
import ModeSwitcherMenu from '@/components/layout/ModeSwitcherMenu';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
    retry: false,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const authed = !!user;
  const isAdmin = user?.role === 'admin';
  const isHotel = user?.role === 'hotel' || user?.role === 'hotel_admin';

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const lbl = (key) => NAV_LABELS[key]?.[language] || NAV_LABELS[key]?.pt || key;

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
            <div ref={menuRef}>
              <ModeSwitcherMenu
                open={menuOpen}
                onToggle={() => setMenuOpen(o => !o)}
                currentLabel={(() => {
                  if (isHotel && isActive('HotelDashboard')) return lbl('hotel');
                  if (isActive('ProfessionalHubV2')) return lbl('professional');
                  if (isActive('ClientDashboard')) return lbl('client');
                  if (isAdmin && isActive('AdminDashboard')) return lbl('admin');
                  return lbl('professional');
                })()}
                options={[
                  ...(isHotel ? [{
                    key: 'hotel',
                    label: lbl('hotel'),
                    active: isActive('HotelDashboard'),
                    onClick: () => { navigate(createPageUrl('HotelDashboard')); setMenuOpen(false); },
                  }] : []),
                  {
                    key: 'professional',
                    label: lbl('professional'),
                    active: isActive('ProfessionalHubV2'),
                    onClick: () => { navigate(createPageUrl('ProfessionalHubV2')); setMenuOpen(false); },
                  },
                  {
                    key: 'client',
                    label: lbl('client'),
                    active: isActive('ClientDashboard'),
                    onClick: () => { navigate(createPageUrl('ClientDashboard')); setMenuOpen(false); },
                  },
                  ...(isAdmin ? [{
                    key: 'admin',
                    label: lbl('admin'),
                    active: isActive('AdminDashboard'),
                    onClick: () => { navigate(createPageUrl('AdminDashboard')); setMenuOpen(false); },
                  }] : []),
                ]}
              />
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