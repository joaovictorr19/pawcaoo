import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, BellOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function PushNotificationManager({ user }) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Verificar se precisa mostrar banner
    const dismissed = localStorage.getItem('push_banner_dismissed');
    if (permission === 'default' && !dismissed) {
      // Mostrar após 3 segundos
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, permission]);

  const requestPermission = async () => {
    // Verificar suporte a notificações (desktop e mobile)
    if (!('Notification' in window)) {
      toast.error('Notificações não suportadas neste dispositivo');
      return;
    }

    // No mobile, verificar se está em PWA ou navegador
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    try {
      // Solicitar permissão (funciona em desktop e mobile)
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('✅ Notificações ativadas com sucesso!');
        setShowBanner(false);
        
        // Testar notificação (compatível com desktop e mobile)
        try {
          const notification = new Notification('PawCão - Notificações Ativas', {
            body: isMobile 
              ? 'Você receberá alertas importantes no seu celular' 
              : 'Você receberá alertas em tempo real',
            icon: '/logo.png',
            badge: '/favicon.png',
            tag: 'welcome-notification',
            requireInteraction: false,
            vibrate: isMobile ? [200, 100, 200] : undefined,
            silent: false
          });

          // Fechar automaticamente após 4 segundos
          setTimeout(() => notification.close(), 4000);
        } catch (notifError) {
          console.log('Notification created but may not display:', notifError);
          // Não mostrar erro ao usuário, pois a permissão foi concedida
        }
      } else if (result === 'denied') {
        toast.error('❌ Permissão negada. Para ativar, vá em configurações do navegador.');
      } else {
        toast.info('⚠️ Permissão de notificações cancelada');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao ativar notificações. Tente novamente.');
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('push_banner_dismissed', 'true');
  };

  if (!user) return null;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <Card className="border-2 border-green-500 shadow-2xl bg-white/95 backdrop-blur-lg">
              <CardContent className="p-4">
                <button
                  onClick={dismissBanner}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Bell className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">
                      Ativar Notificações
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Receba alertas em tempo real sobre passeios, mensagens e atualizações importantes.
                    </p>
                    <Button
                      onClick={requestPermission}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Ativar Agora
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão de controle no header (se já tiver permissão) */}
      {permission === 'granted' && (
        <div className="hidden md:flex items-center gap-2 text-xs text-green-600">
          <Bell className="w-4 h-4" />
          <span>Notificações ativas</span>
        </div>
      )}
    </>
  );
}