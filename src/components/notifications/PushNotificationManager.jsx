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
    
    // Verificar suporte em diferentes dispositivos
    const hasNotificationSupport = 'Notification' in window;
    if (!hasNotificationSupport) {
      console.warn('Notificações não suportadas neste navegador');
      return;
    }

    // Verificar se precisa mostrar banner
    const dismissed = localStorage.getItem('push_banner_dismissed');
    const dismissedTime = localStorage.getItem('push_banner_dismissed_time');
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Re-mostrar banner após 7 dias se ainda não tiver permissão
    const shouldShow = permission === 'default' && (!dismissed || (dismissedTime && parseInt(dismissedTime) < sevenDaysAgo));

    if (shouldShow) {
      // Mostrar após 3 segundos (menos intrusivo)
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
      // Solicitar permissão - funciona em desktop e mobile, mas requer interação do usuário
      let result;
      
      // Para garantir que funciona no PC, verificar se já não está concedido
      if (Notification.permission === 'granted') {
        result = 'granted';
      } else if (Notification.permission === 'denied') {
        result = 'denied';
      } else {
        // Solicitar nova permissão - DEVE ser chamado em resposta a uma ação do usuário
        result = await Notification.requestPermission();
      }
      
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
    localStorage.setItem('push_banner_dismissed_time', Date.now().toString());
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
            className="fixed top-20 md:top-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md px-0"
          >
            <Card className="border-0 shadow-2xl backdrop-blur-xl bg-white/95 rounded-2xl overflow-hidden">
              <CardContent className="p-4 md:p-6 relative">
                <button
                  onClick={dismissBanner}
                  className="absolute top-2 right-2 md:top-3 md:right-3 text-gray-400 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100 p-1.5 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 md:p-3 rounded-xl shadow-lg flex-shrink-0">
                    <Bell className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="flex-1 pr-0 md:pr-6 w-full">
                    <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1">
                      Ativar Notificações
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 leading-relaxed">
                      {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                        ? 'Alertas no celular sobre passeios.'
                        : 'Alertas em tempo real sobre passeios.'}
                    </p>
                    <Button
                      onClick={requestPermission}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md font-semibold rounded-xl h-10 md:h-11 transition-all text-sm"
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
        <div className="hidden md:flex items-center gap-2 text-xs text-blue-600">
          <Bell className="w-4 h-4" />
          <span>Notificações ativas</span>
        </div>
      )}
    </>
  );
}