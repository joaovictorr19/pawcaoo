import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

const I18N = {
  title:    { pt: 'Instalar a PawCão',            en: 'Install PawCão',          es: 'Instalar PawCão',         fr: 'Installer PawCão' },
  subtitle: { pt: 'Acesso rápido no seu ecrã',    en: 'Quick access on your screen', es: 'Acceso rápido en tu pantalla', fr: 'Accès rapide sur votre écran' },
  install:  { pt: 'Instalar',                     en: 'Install',                  es: 'Instalar',                fr: 'Installer' },
  later:    { pt: 'Agora não',                    en: 'Not now',                  es: 'Ahora no',                fr: 'Pas maintenant' },
  // iOS instructions
  iosStep1: { pt: 'Toque em Partilhar',           en: 'Tap Share',               es: 'Toca Compartir',          fr: 'Appuyez sur Partager' },
  iosStep2: { pt: 'Depois "Adicionar ao Ecrã"',  en: 'Then "Add to Home Screen"', es: 'Luego "Añadir a pantalla', fr: 'Puis "Sur écran d\'accueil"' },
};

const DISMISS_KEY = 'pwa_install_banner_dismissed';

export default function InstallPrompt() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  const t = (key) => I18N[key]?.[language] || I18N[key]?.pt || key;

  useEffect(() => {
    // Já está instalado como PWA — não mostrar
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // Já foi dispensado — não mostrar mais
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;

    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIOS || isAndroid;

    if (!isMobile) return; // Só mostrar em mobile

    let timer = null;
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Pequeno delay para não interromper a navegação
      timer = setTimeout(() => setShowBanner(true), 6000);
    };

    if (isIOS) {
      // iOS não dispara beforeinstallprompt — mostrar dica direta
      timer = setTimeout(() => setShowIOSHint(true), 6000);
      return () => clearTimeout(timer);
    } else {
      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        if (timer) clearTimeout(timer);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setDeferredPrompt(null);
      setShowBanner(false);
      localStorage.setItem(DISMISS_KEY, 'true');
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    setShowIOSHint(false);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  return (
    <AnimatePresence>
      {(showBanner || showIOSHint) && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-20 md:bottom-6 left-3 right-3 z-[99997] md:max-w-sm md:left-1/2 md:-translate-x-1/2"
        >
          <div
            className="rounded-2xl overflow-hidden border border-white/50 shadow-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center gap-3 p-3">
              {/* Ícone */}
              <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#00a699] to-[#2dd4bf] flex items-center justify-center shadow-sm">
                <Download className="w-4 h-4 text-white" />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-sm text-slate-900 leading-tight">
                  {t('title')}
                </p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('subtitle')}
                </p>

                {/* Dica iOS extra */}
                {showIOSHint && (
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-600">
                    <Share className="w-3 h-3 shrink-0" />
                    <span>{t('iosStep1')}</span>
                    <PlusSquare className="w-3 h-3 shrink-0 ml-1" />
                    <span>{t('iosStep2')}</span>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={dismiss}
                  className="h-7 px-2.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                >
                  {t('later')}
                </button>
                {showIOSHint ? (
                  <button
                    onClick={dismiss}
                    className="h-7 px-3 text-[11px] font-bold text-white rounded-full transition-transform active:scale-95 bg-gradient-to-br from-[#00a699] to-[#207373]"
                  >
                    OK
                  </button>
                ) : (
                  <button
                    onClick={handleInstallClick}
                    className="h-7 px-3 text-[11px] font-bold text-white rounded-full transition-transform active:scale-95 bg-gradient-to-br from-[#00a699] to-[#207373]"
                  >
                    {t('install')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}