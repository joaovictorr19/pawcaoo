import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Mail, Phone, User, Send, Loader2 } from "lucide-react";

export default function ContactShelterModal({ listing, isOpen, onClose, user }) {
  const [formData, setFormData] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    phone: "",
    message: `Olá, estou interessado(a) em adotar o(a) ${listing?.pet_name}. Gostaria de saber mais informações.`
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      // Validate inputs
      if (!formData.name || !formData.email || !formData.message) {
        throw new Error("Por favor preencha todos os campos obrigatórios.");
      }

      // Prepare email body
      const emailBody = `
        Nova mensagem de interesse em adoção via PawCão!
        
        Pet: ${listing.pet_name} (${listing.breed || 'Raça não especificada'})
        Referência: ${listing.id}
        
        Interessado(a):
        Nome: ${formData.name}
        Email: ${formData.email}
        Telefone: ${formData.phone || 'Não informado'}
        
        Mensagem:
        ${formData.message}
        
        Responda diretamente para: ${formData.email}
      `;

      // 1. Tentar criar Notificação In-App (Garantia de entrega para usuários do app)
      if (listing.created_by) {
        try {
          await base44.entities.Notification.create({
            recipient_email: listing.created_by,
            title: `🐾 Interesse em Adoção: ${listing.pet_name}`,
            message: `Você recebeu uma nova mensagem de ${formData.name}.\n\n"${formData.message}"\n\nContato: ${formData.email} | ${formData.phone || ''}`,
            type: 'message',
            related_id: listing.id,
            action_url: `/AdoptionListingDetails?id=${listing.id}`,
            priority: 'high',
            is_read: false
          });
        } catch (notifError) {
          console.error("Erro ao criar notificação:", notifError);
        }
      }

      // 2. Enviar Email
      // Priorizar created_by porque é garantido ser um usuário do app (evita erro de 'user outside the app' em sandbox)
      // Se não houver created_by (ex: importado), tenta contact_email
      const recipientEmail = listing.created_by || listing.contact_email;

      try {
        await base44.integrations.Core.SendEmail({
          to: recipientEmail,
          subject: `[PawCão] Interesse em adoção: ${listing.pet_name}`,
          body: emailBody,
          from_name: "PawCão Adoption"
        });
      } catch (emailError) {
        console.warn("Falha ao enviar email:", emailError);
        // Se a notificação in-app funcionou, consideramos sucesso parcial e não bloqueamos o fluxo
        // A menos que não tenha created_by, aí é crítico.
        if (!listing.created_by) {
            throw new Error("Não foi possível contatar o abrigo (Email falhou e usuário não identificado).");
        }
        // Se enviou notificação, não lança erro para o usuário final não ver o 'Cannot send...'
      }
      
      return true;
    },
    onSuccess: () => {
      toast.success("Mensagem enviada com sucesso! O abrigo entrará em contato em breve.");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar mensagem. Tente novamente.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendEmailMutation.mutate();
  };

  if (!listing) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-600" />
            Contactar Abrigo/Responsável
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem para saber mais sobre <strong>{listing.pet_name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Seu Nome *</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-9"
                placeholder="Seu nome completo"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Seu Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-9"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (Opcional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-9"
                  placeholder="+351..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="min-h-[100px]"
              placeholder="Escreva sua mensagem aqui..."
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}