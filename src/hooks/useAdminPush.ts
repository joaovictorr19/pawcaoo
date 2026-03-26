import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

interface AdminPushResult {
  sendDirectAlert: (walkerEmail: string, requestId: string) => Promise<void>;
}

export function useAdminPush(): AdminPushResult {
  const sendDirectAlert = async (walkerEmail: string, requestId: string): Promise<void> => {
    try {
      if (!walkerEmail) {
        toast.error('Email do profissional não encontrado.');
        return;
      }

      await base44.entities.Notification.create({
        recipient_email: walkerEmail,
        title: '🚨 SOS PRÓXIMO DE TI!',
        message: 'O Admin detectou um pedido de emergência na tua zona. Entra online para aceitar!',
        type: 'emergency',
        related_id: requestId,
        priority: 'urgent',
      });

      toast.success('Notificação enviada ao profissional!');
    } catch (error) {
      console.error('Admin push failed:', error);
      toast.error('Falha ao enviar alerta.');
    }
  };

  return { sendDirectAlert };
}
