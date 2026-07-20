import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Phone,
  Clock,
  Send,
  MessageCircle,
  HelpCircle,
  Instagram,
  Building2,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
    category: "general",
  });

  const content = {
    pt: {
      title: "Fale Connosco",
      subtitle:
        "A nossa equipa responde em até 24 horas. Escolha o canal mais conveniente para si.",
      formTitle: "Envie uma Mensagem",
      nameLabel: "Nome completo",
      emailLabel: "Email",
      phoneLabel: "Telefone (opcional)",
      categoryLabel: "Assunto",
      subjectLabel: "Título da mensagem",
      messageLabel: "A sua mensagem",
      sendButton: "Enviar Mensagem",
      sending: "A enviar…",
      categories: {
        general: "Questão geral",
        support: "Suporte técnico",
        booking: "Ajuda com reserva",
        payment: "Questão de pagamento",
        partnership: "Parcerias",
        other: "Outro",
      },
      quickTitle: "Canais Diretos",
      quickSubtitle: "Prefere falar logo? Use um destes canais.",
      emailCard: "Email",
      emailDesc: "Para questões detalhadas",
      whatsappCard: "WhatsApp",
      whatsappDesc: "Resposta rápida em horário comercial",
      instagramCard: "Instagram",
      instagramDesc: "Veja novidades e envie DMs",
      hoursTitle: "Horário de Atendimento",
      hoursWeek: "Seg – Sex: 9h – 18h",
      hoursSat: "Sábado: 10h – 14h",
      hoursSun: "Domingo: Encerrado",
      faqTitle: "Consulte as Perguntas Frequentes",
      faqSubtitle:
        "Muitas dúvidas sobre reservas, pagamentos e profissionais já têm resposta pronta.",
      viewFaq: "Ir para o FAQ",
      success: "Mensagem enviada com sucesso! Responderemos em breve.",
      error: "Erro ao enviar mensagem. Tente novamente.",
    },
    en: {
      title: "Get in Touch",
      subtitle:
        "Our team replies within 24 hours. Pick whichever channel suits you best.",
      formTitle: "Send a Message",
      nameLabel: "Full name",
      emailLabel: "Email",
      phoneLabel: "Phone (optional)",
      categoryLabel: "Topic",
      subjectLabel: "Message subject",
      messageLabel: "Your message",
      sendButton: "Send Message",
      sending: "Sending…",
      categories: {
        general: "General question",
        support: "Technical support",
        booking: "Booking help",
        payment: "Payment issue",
        partnership: "Partnerships",
        other: "Other",
      },
      quickTitle: "Direct Channels",
      quickSubtitle: "Prefer to talk right away? Use one of these.",
      emailCard: "Email",
      emailDesc: "For detailed questions",
      whatsappCard: "WhatsApp",
      whatsappDesc: "Quick reply during business hours",
      instagramCard: "Instagram",
      instagramDesc: "See updates and send DMs",
      hoursTitle: "Business Hours",
      hoursWeek: "Mon – Fri: 9am – 6pm",
      hoursSat: "Saturday: 10am – 2pm",
      hoursSun: "Sunday: Closed",
      faqTitle: "Check the FAQ",
      faqSubtitle:
        "Many questions about bookings, payments and professionals already have ready answers.",
      viewFaq: "Go to FAQ",
      success: "Message sent successfully! We'll respond soon.",
      error: "Error sending message. Please try again.",
    },
    es: {
      title: "Hable con Nosotros",
      subtitle:
        "Nuestro equipo responde en hasta 24 horas. Elige el canal que más te convenga.",
      formTitle: "Envía un Mensaje",
      nameLabel: "Nombre completo",
      emailLabel: "Email",
      phoneLabel: "Teléfono (opcional)",
      categoryLabel: "Asunto",
      subjectLabel: "Título del mensaje",
      messageLabel: "Tu mensaje",
      sendButton: "Enviar Mensaje",
      sending: "Enviando…",
      categories: {
        general: "Pregunta general",
        support: "Soporte técnico",
        booking: "Ayuda con reserva",
        payment: "Problema de pago",
        partnership: "Asociaciones",
        other: "Otro",
      },
      quickTitle: "Canales Directos",
      quickSubtitle: "¿Prefieres hablar ahora? Usa uno de estos.",
      emailCard: "Email",
      emailDesc: "Para preguntas detalladas",
      whatsappCard: "WhatsApp",
      whatsappDesc: "Respuesta rápida en horario comercial",
      instagramCard: "Instagram",
      instagramDesc: "Ver novedades y enviar DMs",
      hoursTitle: "Horario de Atención",
      hoursWeek: "Lun – Vie: 9h – 18h",
      hoursSat: "Sábado: 10h – 14h",
      hoursSun: "Domingo: Cerrado",
      faqTitle: "Consulta las Preguntas Frecuentes",
      faqSubtitle:
        "Muchas dudas sobre reservas, pagos y profesionales ya tienen respuesta lista.",
      viewFaq: "Ir al FAQ",
      success: "¡Mensaje enviado con éxito! Responderemos pronto.",
      error: "Error al enviar mensaje. Inténtalo de nuevo.",
    },
  };

  const t = content[language] || content.pt;

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      await base44.integrations.Core.SendEmail({
        to: "support@pawcao.net",
        subject: `[${data.category}] ${data.subject}`,
        body: `Nova mensagem de contacto:

Nome: ${data.name}
Email: ${data.email}
Telefone: ${data.phone || "N/A"}
Categoria: ${data.category}
Assunto: ${data.subject}

Mensagem:
${data.message}`,
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
        category: "general",
      });
    },
    onError: () => {
      toast.error(t.error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessageMutation.mutate(formData);
  };

  const quickCards = [
    {
      icon: Mail,
      label: t.emailCard,
      desc: t.emailDesc,
      href: "mailto:support@pawcao.net",
      value: "support@pawcao.net",
      external: true,
    },
    {
      icon: MessageCircle,
      label: t.whatsappCard,
      desc: t.whatsappDesc,
      href: "https://wa.me/351938355513",
      value: "+351 938 355 513",
      external: true,
    },
    {
      icon: Instagram,
      label: t.instagramCard,
      desc: t.instagramDesc,
      href: "https://instagram.com/paw.cao",
      value: "@paw.cao",
      external: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/60 via-white to-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0d9483] via-[#14b8a6] to-[#0891b2] text-white">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm mb-6">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 font-heading tracking-tight">
              {t.title}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10 md:-mt-14 pb-16 relative z-10">
        {/* Quick contact cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-4 mb-10"
        >
          {quickCards.map((card) => (
            <a
              key={card.label}
              href={card.href}
              target={card.external ? "_blank" : undefined}
              rel={card.external ? "noopener noreferrer" : undefined}
              className="group glass-panel rounded-2xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#0d9483]/10 flex items-center justify-center flex-shrink-0">
                  <card.icon className="w-5 h-5 text-[#0d9483]" />
                </div>
                <span className="font-heading font-bold text-slate-900">
                  {card.label}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-[#0d9483] group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-sm text-slate-500 mb-1">{card.desc}</p>
              <p className="text-sm font-semibold text-[#0d9483] break-all">
                {card.value}
              </p>
            </a>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="glass-panel rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0d9483] flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-slate-900">
                  {t.formTitle}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                      {t.nameLabel} *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="h-11 rounded-xl border-slate-200 focus:border-[#0d9483] focus:ring-[#0d9483]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      {t.emailLabel} *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="h-11 rounded-xl border-slate-200 focus:border-[#0d9483] focus:ring-[#0d9483]/20"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                      {t.phoneLabel}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="h-11 rounded-xl border-slate-200 focus:border-[#0d9483] focus:ring-[#0d9483]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-semibold text-slate-700">
                      {t.categoryLabel} *
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-[#0d9483] focus:ring-[#0d9483]/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(t.categories).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-semibold text-slate-700">
                    {t.subjectLabel} *
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    required
                    className="h-11 rounded-xl border-slate-200 focus:border-[#0d9483] focus:ring-[#0d9483]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-semibold text-slate-700">
                    {t.messageLabel} *
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                    rows={5}
                    className="rounded-xl border-slate-200 focus:border-[#0d9483] focus:ring-[#0d9483]/20 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0d9483] to-[#0891b2] hover:from-[#0f766e] hover:to-[#0e7490] text-base font-bold shadow-lg shadow-[#0d9483]/25"
                >
                  {sendMessageMutation.isPending ? (
                    t.sending
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t.sendButton}
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Hours */}
            <div className="glass-panel rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#0d9483]/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#0d9483]" />
                </div>
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  {t.hoursTitle}
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">{t.hoursWeek}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">{t.hoursSat}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">{t.hoursSun}</span>
                </div>
              </div>
            </div>

            {/* FAQ CTA */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-[#0d9483] to-[#0891b2] text-white shadow-xl shadow-[#0d9483]/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-lg">{t.faqTitle}</h3>
              </div>
              <p className="text-sm text-white/90 mb-4 leading-relaxed">
                {t.faqSubtitle}
              </p>
              <Button
                asChild
                variant="secondary"
                className="w-full bg-white text-[#0d9483] hover:bg-white/90 font-bold rounded-xl h-11"
              >
                <Link to="/faq">
                  {t.viewFaq}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}