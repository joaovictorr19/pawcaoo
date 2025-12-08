import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, HelpCircle, Building, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";

export default function Contact() {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    category: "general"
  });

  const content = {
    pt: {
      title: "Entre em Contacto",
      subtitle: "Estamos aqui para ajudar! Envie-nos uma mensagem e responderemos o mais breve possível.",
      
      formTitle: "Enviar Mensagem",
      nameLabel: "Nome Completo",
      emailLabel: "Email",
      phoneLabel: "Telefone (Opcional)",
      categoryLabel: "Categoria",
      subjectLabel: "Assunto",
      messageLabel: "Mensagem",
      sendButton: "Enviar Mensagem",
      sending: "A enviar...",
      
      categories: {
        general: "Questão Geral",
        support: "Suporte Técnico",
        booking: "Ajuda com Reserva",
        payment: "Questão de Pagamento",
        partnership: "Parcerias",
        other: "Outro"
      },

      contactInfo: "Informações de Contacto",
      officeHours: "Horário de Atendimento",
      hoursText: "Segunda - Sexta: 9h - 18h\nSábado: 10h - 14h\nDomingo: Fechado",
      
      otherWays: "Outras Formas de Contacto",
      whatsapp: "WhatsApp",
      socialMedia: "Redes Sociais",
      
      faqTitle: "Perguntas Frequentes",
      faqSubtitle: "Encontre respostas rápidas para as perguntas mais comuns",
      viewFaq: "Ver FAQ Completo",

      success: "Mensagem enviada com sucesso! Responderemos em breve.",
      error: "Erro ao enviar mensagem. Tente novamente."
    },
    en: {
      title: "Get in Touch",
      subtitle: "We're here to help! Send us a message and we'll respond as soon as possible.",
      
      formTitle: "Send Message",
      nameLabel: "Full Name",
      emailLabel: "Email",
      phoneLabel: "Phone (Optional)",
      categoryLabel: "Category",
      subjectLabel: "Subject",
      messageLabel: "Message",
      sendButton: "Send Message",
      sending: "Sending...",
      
      categories: {
        general: "General Question",
        support: "Technical Support",
        booking: "Booking Help",
        payment: "Payment Issue",
        partnership: "Partnerships",
        other: "Other"
      },

      contactInfo: "Contact Information",
      officeHours: "Office Hours",
      hoursText: "Monday - Friday: 9am - 6pm\nSaturday: 10am - 2pm\nSunday: Closed",
      
      otherWays: "Other Ways to Contact",
      whatsapp: "WhatsApp",
      socialMedia: "Social Media",
      
      faqTitle: "Frequently Asked Questions",
      faqSubtitle: "Find quick answers to common questions",
      viewFaq: "View Full FAQ",

      success: "Message sent successfully! We'll respond soon.",
      error: "Error sending message. Please try again."
    },
    es: {
      title: "Póngase en Contacto",
      subtitle: "¡Estamos aquí para ayudar! Envíenos un mensaje y responderemos lo antes posible.",
      
      formTitle: "Enviar Mensaje",
      nameLabel: "Nombre Completo",
      emailLabel: "Email",
      phoneLabel: "Teléfono (Opcional)",
      categoryLabel: "Categoría",
      subjectLabel: "Asunto",
      messageLabel: "Mensaje",
      sendButton: "Enviar Mensaje",
      sending: "Enviando...",
      
      categories: {
        general: "Pregunta General",
        support: "Soporte Técnico",
        booking: "Ayuda con Reserva",
        payment: "Problema de Pago",
        partnership: "Asociaciones",
        other: "Otro"
      },

      contactInfo: "Información de Contacto",
      officeHours: "Horario de Atención",
      hoursText: "Lunes - Viernes: 9h - 18h\nSábado: 10h - 14h\nDomingo: Cerrado",
      
      otherWays: "Otras Formas de Contacto",
      whatsapp: "WhatsApp",
      socialMedia: "Redes Sociales",
      
      faqTitle: "Preguntas Frecuentes",
      faqSubtitle: "Encuentre respuestas rápidas a preguntas comunes",
      viewFaq: "Ver FAQ Completo",

      success: "¡Mensaje enviado con éxito! Responderemos pronto.",
      error: "Error al enviar mensaje. Inténtelo de nuevo."
    }
  };

  const t = content[language] || content.pt;

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      // In production, this would send an email via SendEmail integration
      await base44.integrations.Core.SendEmail({
        to: "support@pawcao.net",
        subject: `[${data.category}] ${data.subject}`,
        body: `
Nova mensagem de contacto:

Nome: ${data.name}
Email: ${data.email}
Telefone: ${data.phone || 'N/A'}
Categoria: ${data.category}
Assunto: ${data.subject}

Mensagem:
${data.message}
        `
      });
    },
    onSuccess: () => {
      toast.success(t.success);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        category: "general"
      });
    },
    onError: () => {
      toast.error(t.error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessageMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-600 via-green-500 to-blue-600 text-white py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <MessageSquare className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              {t.title}
            </h1>
            <p className="text-xl text-white/90">
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                  <CardTitle className="text-2xl">
                    {t.formTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">{t.nameLabel} *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">{t.emailLabel} *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="phone">{t.phoneLabel}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">{t.categoryLabel} *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({...formData, category: value})}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(t.categories).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subject">{t.subjectLabel} *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        required
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">{t.messageLabel} *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        required
                        rows={6}
                        className="mt-2"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 h-12 text-lg"
                      disabled={sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <>{t.sending}</>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          {t.sendButton}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-6 h-6 text-green-600" />
                    {t.contactInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">Email</div>
                      <a href="mailto:support@pawcao.net" className="text-blue-600 hover:underline">
                        support@pawcao.net
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">Instagram</div>
                      <a href="https://instagram.com/paw.cao" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        @Paw.cao
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">{t.whatsapp}</div>
                      <a href="tel:+351912345678" className="text-blue-600 hover:underline">
                        +351 912 345 678
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">Lisboa, Portugal</div>
                      <p className="text-sm text-gray-600">Avenida da Liberdade, 123</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">{t.officeHours}</div>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{t.hoursText}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-blue-600" />
                    {t.faqTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4">
                    {t.faqSubtitle}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = '/faq'}
                  >
                    {t.viewFaq}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}