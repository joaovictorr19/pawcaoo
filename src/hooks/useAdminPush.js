import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export function useAdminPush() {
  const sendDirectAlert = async (walkerEmail, requestId) => {
    try {
      if (!walkerEmail) {
        toast.error("Email do profissional não encontrado.");
        return;
      }
      
      // 1. Criamos uma notificação na tabela de notificações
      await base44.entities.Notification.create({
        recipient_email: walkerEmail,
        title: "🚨 SOS PRÓXIMO DE TI!",
        message: "O Admin detectou um pedido de emergência na tua zona. Entra online para aceitar!",
        type: "emergency",
        related_id: requestId,
        priority: "urgent"
      });

      toast.success("Notificação enviada ao profissional!", {
        icon: "🚀",
        style: { borderRadius: '20px', background: '#0f172a', color: '#fff' }
      });
    } catch (error) {
      console.error(error);
      toast.error("Falha ao enviar alerta.");
    }
  };

  return { sendDirectAlert };
}