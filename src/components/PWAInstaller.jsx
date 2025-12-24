import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';

export default function PWAInstaller() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(reg => console.log('✅ Service Worker registered'))
          .catch(err => console.log('❌ Service Worker failed:', err));
      });
    }

    // Listen for install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show if not already installed and user hasn't dismissed it
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowInstallPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showInstallPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-[99999] max-w-sm"
        >
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-2xl p-4 border border-white/20">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="PawCão" className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">
                  {language === 'pt' ? 'Instalar PawCão' : 'Install PawCão'}
                </h3>
                <p className="text-xs text-white/90">
                  {language === 'pt' 
                    ? 'Acesso rápido sem browser. Instale como app!'
                    : 'Quick access without browser. Install as app!'}
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleInstall}
              className="w-full bg-white text-green-600 hover:bg-gray-100 font-semibold"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              {language === 'pt' ? 'Instalar Agora' : 'Install Now'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}