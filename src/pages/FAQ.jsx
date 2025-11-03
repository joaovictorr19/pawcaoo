import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search, HelpCircle, Dog, CreditCard, Shield, Users, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";

export default function FAQ() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const content = {
    pt: {
      title: "Perguntas Frequentes",
      subtitle: "Encontre respostas rápidas para as suas dúvidas",
      searchPlaceholder: "Pesquisar perguntas...",
      allCategories: "Todas",
      
      categories: [
        { id: "general", name: "Geral", icon: HelpCircle },
        { id: "booking", name: "Reservas", icon: Dog },
        { id: "payment", name: "Pagamentos", icon: CreditCard },
        { id: "safety", name: "Segurança", icon: Shield },
        { id: "professional", name: "Profissionais", icon: Users }
      ],

      faqs: [
        {
          category: "general",
          question: "O que é o PawCão?",
          answer: "O PawCão é a maior plataforma de cuidados caninos em Portugal, conectando donos de cães com passeadores e treinadores profissionais verificados. Oferecemos serviços de passeios, treino, dog sitting e muito mais."
        },
        {
          category: "general",
          question: "Como funciona o PawCão?",
          answer: "É simples! 1) Crie uma conta gratuita, 2) Procure profissionais na sua área, 3) Reserve o serviço que precisa, 4) Pague de forma segura através da plataforma, 5) Aproveite o serviço! O pagamento fica retido até à conclusão do serviço para sua segurança."
        },
        {
          category: "booking",
          question: "Como faço uma reserva?",
          answer: "Navegue pelos perfis dos profissionais, escolha o que melhor se adequa, clique em 'Reservar Agora', preencha os detalhes (data, hora, cão), e confirme o pagamento. Receberá uma confirmação por email e notificação na app."
        },
        {
          category: "booking",
          question: "Posso cancelar uma reserva?",
          answer: "Sim! Cancelamentos gratuitos até 24h antes do serviço. Após esse período, aplicam-se taxas de cancelamento. Membros Premium e VIP têm cancelamentos grátis ilimitados."
        },
        {
          category: "booking",
          question: "E se o profissional cancelar?",
          answer: "Se o profissional cancelar, receberá um reembolso completo imediato e ajudaremos a encontrar um substituto. Profissionais com muitos cancelamentos são removidos da plataforma."
        },
        {
          category: "payment",
          question: "Como funciona o pagamento?",
          answer: "Aceitamos cartões de crédito/débito, MB WAY e PayPal. O pagamento é processado de forma segura através do Stripe e fica retido até à conclusão do serviço. Cobramos uma taxa de plataforma de 15% e uma taxa de transação de €1."
        },
        {
          category: "payment",
          question: "Quando é que o profissional recebe o pagamento?",
          answer: "O pagamento é liberado ao profissional após a conclusão e confirmação do serviço. Profissionais com planos pagos recebem pagamentos mais rápidos (até instantâneo no plano Pro)."
        },
        {
          category: "payment",
          question: "O que são PawPoints?",
          answer: "PawPoints são pontos de fidelidade que ganha em cada reserva (1 ponto por €1 gasto). Pode resgatar pontos por descontos, serviços grátis e produtos de parceiros. Membros Premium ganham 2x pontos!"
        },
        {
          category: "safety",
          question: "Os profissionais são verificados?",
          answer: "Sim! Todos os profissionais passam por verificação rigorosa: documento de identidade, comprovativo de morada, e opcionalmente verificação de antecedentes. Profissionais verificados têm um badge azul no perfil."
        },
        {
          category: "safety",
          question: "O que fazer em caso de emergência?",
          answer: "Em emergência médica, contacte imediatamente o veterinário mais próximo. Todos os serviços têm seguro incluído. Para outras emergências, use o botão SOS na app que alerta o suporte 24/7."
        },
        {
          category: "safety",
          question: "Os serviços têm seguro?",
          answer: "Sim! Todos os serviços têm seguro básico incluído. Pode adicionar cobertura extra ao fazer a reserva. O seguro cobre acidentes, lesões e responsabilidade civil."
        },
        {
          category: "professional",
          question: "Como me torno um profissional?",
          answer: "Clique em 'Seja um Passeador' ou 'Seja um Treinador', preencha o perfil, faça upload dos documentos necessários, e aguarde aprovação (24-48h). É gratuito começar com o plano Free (15% comissão)."
        },
        {
          category: "professional",
          question: "Quanto posso ganhar como profissional?",
          answer: "Depende da sua experiência, localização e dedicação. Profissionais a tempo inteiro podem ganhar €1.500-€3.000/mês. Com planos pagos, ganha mais (0% comissão no plano Pro)."
        },
        {
          category: "professional",
          question: "Preciso de certificações?",
          answer: "Para passeadores, não é obrigatório mas recomendado. Para treinadores, certificações profissionais são altamente valorizadas e aumentam a confiança dos clientes."
        }
      ],

      stillNeedHelp: "Ainda precisa de ajuda?",
      contactSupport: "Contactar Suporte",
      noResults: "Nenhuma pergunta encontrada",
      tryDifferent: "Tente usar outros termos de pesquisa"
    },
    en: {
      title: "Frequently Asked Questions",
      subtitle: "Find quick answers to your questions",
      searchPlaceholder: "Search questions...",
      allCategories: "All",
      
      categories: [
        { id: "general", name: "General", icon: HelpCircle },
        { id: "booking", name: "Bookings", icon: Dog },
        { id: "payment", name: "Payments", icon: CreditCard },
        { id: "safety", name: "Safety", icon: Shield },
        { id: "professional", name: "Professionals", icon: Users }
      ],

      faqs: [
        {
          category: "general",
          question: "What is PawCão?",
          answer: "PawCão is Portugal's largest dog care platform, connecting dog owners with verified professional walkers and trainers. We offer walking, training, dog sitting services and more."
        },
        {
          category: "general",
          question: "How does PawCão work?",
          answer: "It's simple! 1) Create a free account, 2) Search for professionals in your area, 3) Book the service you need, 4) Pay securely through the platform, 5) Enjoy the service! Payment is held until service completion for your safety."
        },
        {
          category: "booking",
          question: "How do I make a booking?",
          answer: "Browse professional profiles, choose the best fit, click 'Book Now', fill in details (date, time, dog), and confirm payment. You'll receive an email confirmation and app notification."
        },
        {
          category: "booking",
          question: "Can I cancel a booking?",
          answer: "Yes! Free cancellations up to 24h before service. After that, cancellation fees apply. Premium and VIP members have unlimited free cancellations."
        },
        {
          category: "booking",
          question: "What if the professional cancels?",
          answer: "If the professional cancels, you receive an immediate full refund and we'll help find a replacement. Professionals with many cancellations are removed from the platform."
        },
        {
          category: "payment",
          question: "How does payment work?",
          answer: "We accept credit/debit cards, MB WAY and PayPal. Payment is securely processed through Stripe and held until service completion. We charge a 15% platform fee and €1 transaction fee."
        },
        {
          category: "payment",
          question: "When does the professional receive payment?",
          answer: "Payment is released to the professional after service completion and confirmation. Professionals with paid plans receive faster payments (up to instant on Pro plan)."
        },
        {
          category: "payment",
          question: "What are PawPoints?",
          answer: "PawPoints are loyalty points you earn on every booking (1 point per €1 spent). You can redeem points for discounts, free services and partner products. Premium members earn 2x points!"
        },
        {
          category: "safety",
          question: "Are professionals verified?",
          answer: "Yes! All professionals undergo rigorous verification: ID document, proof of address, and optionally background checks. Verified professionals have a blue badge on their profile."
        },
        {
          category: "safety",
          question: "What to do in an emergency?",
          answer: "In medical emergency, immediately contact the nearest vet. All services have insurance included. For other emergencies, use the SOS button in the app that alerts 24/7 support."
        },
        {
          category: "safety",
          question: "Do services have insurance?",
          answer: "Yes! All services have basic insurance included. You can add extra coverage when booking. Insurance covers accidents, injuries and liability."
        },
        {
          category: "professional",
          question: "How do I become a professional?",
          answer: "Click 'Become a Walker' or 'Become a Trainer', fill in your profile, upload required documents, and wait for approval (24-48h). It's free to start with Free plan (15% commission)."
        },
        {
          category: "professional",
          question: "How much can I earn as a professional?",
          answer: "Depends on your experience, location and dedication. Full-time professionals can earn €1,500-€3,000/month. With paid plans, you earn more (0% commission on Pro plan)."
        },
        {
          category: "professional",
          question: "Do I need certifications?",
          answer: "For walkers, not mandatory but recommended. For trainers, professional certifications are highly valued and increase client trust."
        }
      ],

      stillNeedHelp: "Still need help?",
      contactSupport: "Contact Support",
      noResults: "No questions found",
      tryDifferent: "Try using different search terms"
    },
    es: {
      title: "Preguntas Frecuentes",
      subtitle: "Encuentre respuestas rápidas a sus preguntas",
      searchPlaceholder: "Buscar preguntas...",
      allCategories: "Todas",
      
      categories: [
        { id: "general", name: "General", icon: HelpCircle },
        { id: "booking", name: "Reservas", icon: Dog },
        { id: "payment", name: "Pagos", icon: CreditCard },
        { id: "safety", name: "Seguridad", icon: Shield },
        { id: "professional", name: "Profesionales", icon: Users }
      ],

      faqs: [
        {
          category: "general",
          question: "¿Qué es PawCão?",
          answer: "PawCão es la plataforma de cuidado canino más grande de Portugal, conectando dueños de perros con paseadores y entrenadores profesionales verificados. Ofrecemos servicios de paseos, entrenamiento, cuidado de perros y más."
        },
        {
          category: "general",
          question: "¿Cómo funciona PawCão?",
          answer: "¡Es simple! 1) Crea una cuenta gratuita, 2) Busca profesionales en tu área, 3) Reserva el servicio que necesitas, 4) Paga de forma segura a través de la plataforma, 5) ¡Disfruta del servicio! El pago se retiene hasta la finalización del servicio para tu seguridad."
        },
        {
          category: "booking",
          question: "¿Cómo hago una reserva?",
          answer: "Navega por los perfiles de profesionales, elige el más adecuado, haz clic en 'Reservar Ahora', completa los detalles (fecha, hora, perro) y confirma el pago. Recibirás una confirmación por correo electrónico y notificación en la app."
        },
        {
          category: "booking",
          question: "¿Puedo cancelar una reserva?",
          answer: "¡Sí! Cancelaciones gratuitas hasta 24h antes del servicio. Después de ese período, se aplican tarifas de cancelación. Los miembros Premium y VIP tienen cancelaciones gratuitas ilimitadas."
        },
        {
          category: "booking",
          question: "¿Y si el profesional cancela?",
          answer: "Si el profesional cancela, recibirás un reembolso completo inmediato y te ayudaremos a encontrar un reemplazo. Los profesionales con muchas cancelaciones son eliminados de la plataforma."
        },
        {
          category: "payment",
          question: "¿Cómo funciona el pago?",
          answer: "Aceptamos tarjetas de crédito/débito, MB WAY y PayPal. El pago se procesa de forma segura a través de Stripe y se retiene hasta la finalización del servicio. Cobramos una tarifa de plataforma del 15% y una tarifa de transacción de €1."
        },
        {
          category: "payment",
          question: "¿Cuándo recibe el pago el profesional?",
          answer: "El pago se libera al profesional después de la finalización y confirmación del servicio. Los profesionales con planes pagos reciben pagos más rápidos (hasta instantáneo en el plan Pro)."
        },
        {
          category: "payment",
          question: "¿Qué son los PawPoints?",
          answer: "PawPoints son puntos de lealtad que ganas en cada reserva (1 punto por cada €1 gastado). Puedes canjear puntos por descuentos, servicios gratis y productos de socios. ¡Los miembros Premium ganan el doble de puntos!"
        },
        {
          category: "safety",
          question: "¿Los profesionales están verificados?",
          answer: "¡Sí! Todos los profesionales pasan por una verificación rigurosa: documento de identidad, comprobante de domicilio y, opcionalmente, verificación de antecedentes. Los profesionales verificados tienen una insignia azul en su perfil."
        },
        {
          category: "safety",
          question: "¿Qué hacer en caso de emergencia?",
          answer: "En emergencia médica, contacta inmediatamente al veterinario más cercano. Todos los servicios tienen seguro incluido. Para otras emergencias, usa el botón SOS en la app que alerta al soporte 24/7."
        },
        {
          category: "safety",
          question: "¿Los servicios tienen seguro?",
          answer: "¡Sí! Todos los servicios tienen seguro básico incluido. Puedes agregar cobertura extra al hacer la reserva. El seguro cubre accidentes, lesiones y responsabilidad civil."
        },
        {
          category: "professional",
          question: "¿Cómo me convierto en profesional?",
          answer: "Haz clic en 'Conviértete en Paseador' o 'Conviértete en Entrenador', completa tu perfil, sube los documentos requeridos y espera la aprobación (24-48h). Es gratis comenzar con el plan Free (15% de comisión)."
        },
        {
          category: "professional",
          question: "¿Cuánto puedo ganar como profesional?",
          answer: "Depende de tu experiencia, ubicación y dedicación. Los profesionales de tiempo completo pueden ganar €1,500-€3,000/mes. Con planes pagos, ganas más (0% de comisión en el plan Pro)."
        },
        {
          category: "professional",
          question: "¿Necesito certificaciones?",
          answer: "Para paseadores, no es obligatorio pero recomendado. Para entrenadores, las certificaciones profesionales son muy valoradas y aumentan la confianza del cliente."
        }
      ],

      stillNeedHelp: "¿Aún necesitas ayuda?",
      contactSupport: "Contactar Soporte",
      noResults: "No se encontraron preguntas",
      tryDifferent: "Intenta usar términos de búsqueda diferentes"
    }
  };

  const t = content[language] || content.pt;

  const filteredFaqs = t.faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            <HelpCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              {t.title}
            </h1>
            <p className="text-xl text-white/90 mb-8">
              {t.subtitle}
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg bg-white/95 backdrop-blur-sm border-0 shadow-xl"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className={selectedCategory === "all" ? "bg-green-600" : ""}
          >
            {t.allCategories}
          </Button>
          {t.categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? "bg-green-600" : ""}
            >
              <cat.icon className="w-4 h-4 mr-2" />
              {cat.name}
            </Button>
          ))}
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t.noResults}</h3>
                <p className="text-gray-600">{t.tryDifferent}</p>
              </CardContent>
            </Card>
          ) : (
            filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                          openIndex === index ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {openIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-600 to-blue-600 text-white">
            <CardContent className="p-8 md:p-12 text-center">
              <Star className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {t.stillNeedHelp}
              </h2>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-green-600 hover:bg-gray-100"
                onClick={() => window.location.href = '/contact'}
              >
                {t.contactSupport}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}