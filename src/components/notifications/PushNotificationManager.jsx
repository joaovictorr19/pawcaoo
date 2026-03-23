import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, BellOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';

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
      // Mostrar após 10 segundos para ser menos intrusivo na primeira experiência
      const timer = setTimeout(() => setShowBanner(true), 10000);
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
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

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
        
        // Registrar para push notifications (funciona no iOS quando instalado como PWA)
        try {
          const registration = await navigator.serviceWorker.ready;
          
          // Verificar se já tem subscription
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            // VAPID public key (você deve gerar sua própria com: npx web-push generate-vapid-keys)
            const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDpC9Br0qmM0kz6OdW5X91-4q4Tr0Sq9_PN8oMNLRm38';
            
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });
          }
          
          // Salvar subscription no perfil do usuário
          const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
          if (profiles.length > 0) {
            await base44.entities.UserProfile.update(profiles[0].id, {
              push_subscription: subscription.toJSON()
            });
            console.log('✅ Push subscription salva no perfil');
          }
        } catch (pushError) {
          console.error('Erro ao configurar push:', pushError);
        }
        
        // Testar notificação (compatível com desktop e mobile)
        try {
          const notification = new Notification('PawCão - Notificações Ativas', {
            body: isIOS && isPWA
              ? 'Você receberá notificações mesmo com o app fechado!' 
              : isMobile 
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

  // Converter VAPID key para Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('push_banner_dismissed', 'true');
    localStorage.setItem('push_banner_dismissed_time', Date.now().toString());
  };

  if (!user) return null;

  return (
    <>
      <ServiceWorkerRegistration />
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 z-[99998] md:w-full md:max-w-sm"
          >
            <Card className="border border-gray-100 shadow-xl backdrop-blur-xl bg-white/95 rounded-2xl overflow-hidden">
              <CardContent className="p-3 md:p-4">
                {/* Botão fechar */}
                <button
                  onClick={dismissBanner}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100 p-1.5 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {/* Layout horizontal compacto */}
                <div className="flex items-start gap-3 pr-6">
                  <div className="bg-blue-100 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 mb-0.5">
                      Ativar notificações?
                    </h3>
                    <p className="text-xs text-gray-500 leading-snug mb-2">
                      Receba alertas sobre seus passeios e mensagens importantes.
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={dismissBanner}
                        variant="ghost"
                        className="h-7 px-3 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        Agora não
                      </Button>
                      <Button
                        onClick={requestPermission}
                        className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg"
                      >
                        Ativar
                      </Button>
                    </div>
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