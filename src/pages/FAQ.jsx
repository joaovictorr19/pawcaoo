import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search, HelpCircle, Dog, CreditCard, Shield, Users, Star, Building2, MapPin, Zap, Wallet } from "lucide-react";
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
        { id: "hotel", name: "Hotéis", icon: Building2 },
        { id: "pawgo", name: "PawGo", icon: Zap },
        { id: "payment", name: "Pagamentos", icon: CreditCard },
        { id: "safety", name: "Segurança", icon: Shield },
        { id: "professional", name: "Profissionais", icon: Users }
      ],

      faqs: [
        {
          category: "general",
          question: "O que é o PawCão?",
          answer: "O PawCão é a plataforma de cuidados caninos que opera em Portugal, Espanha e França. Conectamos donos de cães com Dog Walkers, treinadores e hotéis caninos profissionais verificados. Oferecemos passeios, treino, alojamento (boarding), creche (daycare), tosquia e muito mais."
        },
        {
          category: "general",
          question: "Em que países o PawCão está disponível?",
          answer: "Atualmente operamos em Portugal, Espanha e França. Cada país tem a sua própria página com profissionais locais. Pode trocar de país através das bandeiras no rodapé da página."
        },
        {
          category: "general",
          question: "Como funciona o PawCão?",
          answer: "É simples! 1) Crie uma conta gratuita, 2) Procure profissionais na sua área (Dog Walkers, treinadores ou hotéis), 3) Reserve o serviço que precisa, 4) Pague de forma segura através da plataforma, 5) Aproveite o serviço! O pagamento fica retido até à conclusão do serviço para sua segurança."
        },
        {
          category: "booking",
          question: "Como faço uma reserva?",
          answer: "Navegue pelos perfis dos profissionais, escolha o que melhor se adequa, clique em 'Reservar', preencha os detalhes (data, hora, cão) e confirme o pagamento. Receberá uma confirmação imediata por email e notificação na app."
        },
        {
          category: "booking",
          question: "Posso cancelar uma reserva?",
          answer: "Sim! Cancelamentos gratuitos até 24h antes do serviço. Após esse período, aplicam-se taxas de cancelamento. Para reservas de hotel, a política depende do estabelecimento — consulte as condições no perfil do hotel."
        },
        {
          category: "booking",
          question: "E se o profissional cancelar?",
          answer: "Se o profissional cancelar, receberá um reembolso completo imediato e ajudaremos a encontrar um substituto. Profissionais com muitos cancelamentos são penalizados e podem ser removidos da plataforma."
        },
        {
          category: "booking",
          question: "Posso reservar passeios em grupo?",
          answer: "Sim! Alguns profissionais organizam passeios em grupo onde o seu cão socializa com outros. Verifique no perfil do profissional se disponibiliza passeios em grupo e o número máximo de cães. O preço por cão é geralmente mais baixo em grupo."
        },
        {
          category: "hotel",
          question: "Como funciona o alojamento em hotéis caninos?",
          answer: "Os hotéis caninos verificados no PawCão oferecem estadia (boarding) e creche (daycare). Escolha o hotel, selecione as datas de check-in e check-out, indique o(s) seu(s) cão(ões) e confirme. Cada hotel define a sua capacidade, horários de check-in/out e preços por noite."
        },
        {
          category: "hotel",
          question: "Que documentos preciso para o hotel?",
          answer: "A vacina da raiva tem de estar válida. Durante a reserva pode anexar o comprovativo de vacinação (PDF/imagem). Alguns hotéis exigem informação sobre dieta, medicação e rotina do animal — quanto mais detalhes fornecer, melhor o cuidado."
        },
        {
          category: "hotel",
          question: "Posso adicionar serviços extra durante a estadia?",
          answer: "Sim! Pode adicionar passeios, sessões de treino, tosquia, banhos e outros cuidados diretamente no hotel. O hotel pode também atribuir estas tarefas a parceiros (Dog Walkers colaboradores) e o pagamento é processado de forma segura na plataforma."
        },
        {
          category: "pawgo",
          question: "O que é o PawGo?",
          answer: "O PawGo é o nosso sistema de acompanhamento ao vivo. Durante um passeio, pode ver a localização do seu cão em tempo real no mapa, receber atualizações com fotos, e acompanhar a rota percorrida. Tudo com verificação por QR code no início e fim do passeio."
        },
        {
          category: "pawgo",
          question: "Como funciona a verificação por QR code?",
          answer: "No início do passeio, o profissional digitaliza um QR code para confirmar a recolha do cão. No fim, digitaliza novamente para confirmar a entrega. Isto garante transparência e segurança em todo o processo."
        },
        {
          category: "payment",
          question: "Como funciona o pagamento?",
          answer: "Aceitamos cartões de crédito/débito via Stripe. O pagamento é processado de forma segura e fica retido em cofre até à conclusão do serviço. A plataforma cobra uma comissão sobre o valor do serviço — o profissional recebe o valor combinado após a conclusão."
        },
        {
          category: "payment",
          question: "Como recebo os meus ganhos como profissional?",
          answer: "Os pagamentos são processados via Stripe Connect. Após concluir o serviço, o valor é libertado para a sua conta. Pode configurar o Stripe Connect no seu painel profissional e acompanhar todos os pagamentos na secção Carteira."
        },
        {
          category: "payment",
          question: "O que é a Carteira PawCão?",
          answer: "A carteira reúne os seus tokens de passeio, cashback e saldo de ganhos (para profissionais). Os tokens podem ser usados para reservar passeios e o cashback acumula com as suas reservas. Profissionais acompanham ganhos pendentes e disponíveis para levantamento."
        },
        {
          category: "payment",
          question: "O que são PawPoints e gamificação?",
          answer: "Ganha PawPoints em cada reserva e ao completar desafios. Os pontos determinam o seu nível e desbloqueiam badges (emblemas). Membros com planos pagos ganham pontos a dobrar e têm acesso a recompensas exclusivas."
        },
        {
          category: "safety",
          question: "Os profissionais são verificados?",
          answer: "Sim! Todos os profissionais passam por verificação: documento de identidade e comprovativo de morada. Profissionais verificados têm um badge no perfil. O selo PawCão distingue profissionais de confiança com histórico comprovado."
        },
        {
          category: "safety",
          question: "O que fazer em caso de emergência?",
          answer: "Em emergência médica, contacte imediatamente o veterinário mais próximo. Para emergências relacionadas com um serviço ativo, use o botão SOS na app que alerta o suporte. Recomendamos sempre ter à mão o contacto do veterinário habitual do seu animal."
        },
        {
          category: "safety",
          question: "Os serviços têm seguro?",
          answer: "Os pagamentos são processados de forma segura via Stripe com proteção contra fraude. Para coberturas específicas de responsabilidade civil, verifique as informações no perfil de cada profissional ou hotel."
        },
        {
          category: "professional",
          question: "Como me torno um profissional?",
          answer: "Escolha o tipo de profissional (Dog Walker, treinador ou hotel), complete o onboarding, faça upload dos documentos e aguarde aprovação. É gratuito começar — a comissão da plataforma aplica-se apenas quando recebe pagamentos."
        },
        {
          category: "professional",
          question: "Quanto posso ganhar como profissional?",
          answer: "Depende da sua experiência, localização e dedicação. Profissionais a tempo inteiro podem ter rendimentos sólidos. Pode definir os seus próprios preços e horários. Com o selo PawCão e boas avaliações, ganha visibilidade e confiança."
        },
        {
          category: "professional",
          question: "Preciso de certifications ou NIF?",
          answer: "Para faturação correta, necessita de NIF (Portugal), NIE (Espanha) ou SIRET (França). Pode configurar os seus dados fiscais no painel. Para treinadores, certificações profissionais são altamente valorizadas e aumentam a confiança dos clientes."
        },
        {
          category: "professional",
          question: "Como recebo pagamentos como hotel?",
          answer: "Hotéis usam Stripe Connect. Os ganhos ficam pendentes durante a estadia e são libertados após o check-out. Pode gerir capacidades, bloquear datas de folga, configurar horários de check-in/out e atribuir tarefas a parceiros — tudo a partir do Painel do Hotel."
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
        { id: "hotel", name: "Hotels", icon: Building2 },
        { id: "pawgo", name: "PawGo", icon: Zap },
        { id: "payment", name: "Payments", icon: CreditCard },
        { id: "safety", name: "Safety", icon: Shield },
        { id: "professional", name: "Professionals", icon: Users }
      ],

      faqs: [
        {
          category: "general",
          question: "What is PawCão?",
          answer: "PawCão is a dog care platform operating in Portugal, Spain and France. We connect dog owners with verified professional walkers, trainers and dog hotels. We offer walking, training, boarding, daycare, grooming and more."
        },
        {
          category: "general",
          question: "In which countries is PawCão available?",
          answer: "We currently operate in Portugal, Spain and France. Each country has its own page with local professionals. You can switch countries using the flags in the page footer."
        },
        {
          category: "general",
          question: "How does PawCão work?",
          answer: "It's simple! 1) Create a free account, 2) Search for professionals in your area (walkers, trainers or hotels), 3) Book the service you need, 4) Pay securely through the platform, 5) Enjoy the service! Payment is held until service completion for your safety."
        },
        {
          category: "booking",
          question: "How do I make a booking?",
          answer: "Browse professional profiles, choose the best fit, click 'Book', fill in details (date, time, dog) and confirm payment. You'll receive an immediate confirmation by email and app notification."
        },
        {
          category: "booking",
          question: "Can I cancel a booking?",
          answer: "Yes! Free cancellations up to 24h before the service. After that, cancellation fees apply. For hotel bookings, the policy depends on the establishment — check the conditions on the hotel profile."
        },
        {
          category: "booking",
          question: "What if the professional cancels?",
          answer: "If the professional cancels, you receive an immediate full refund and we'll help find a replacement. Professionals with many cancellations are penalized and may be removed from the platform."
        },
        {
          category: "booking",
          question: "Can I book group walks?",
          answer: "Yes! Some professionals organize group walks where your dog socializes with others. Check the professional's profile to see if they offer group walks and the maximum number of dogs. The price per dog is usually lower in groups."
        },
        {
          category: "hotel",
          question: "How does dog hotel boarding work?",
          answer: "Verified dog hotels on PawCão offer boarding and daycare. Choose the hotel, select check-in and check-out dates, indicate your dog(s) and confirm. Each hotel sets its capacity, check-in/out times and nightly rates."
        },
        {
          category: "hotel",
          question: "What documents do I need for the hotel?",
          answer: "The rabies vaccine must be valid. During booking you can attach the vaccination record (PDF/image). Some hotels require info about diet, medication and the dog's routine — the more details you provide, the better the care."
        },
        {
          category: "hotel",
          question: "Can I add extra services during the stay?",
          answer: "Yes! You can add walks, training sessions, grooming, baths and other care directly at the hotel. The hotel can also assign these tasks to partners (collaborating walkers) and payment is processed securely on the platform."
        },
        {
          category: "pawgo",
          question: "What is PawGo?",
          answer: "PawGo is our live tracking system. During a walk, you can see your dog's real-time location on the map, receive photo updates, and follow the route taken. All verified with QR code scanning at the start and end of the walk."
        },
        {
          category: "pawgo",
          question: "How does QR code verification work?",
          answer: "At the start of the walk, the professional scans a QR code to confirm dog pickup. At the end, they scan again to confirm drop-off. This ensures transparency and safety throughout the process."
        },
        {
          category: "payment",
          question: "How does payment work?",
          answer: "We accept credit/debit cards via Stripe. Payment is securely processed and held in escrow until service completion. The platform charges a commission on the service value — the professional receives the agreed amount after completion."
        },
        {
          category: "payment",
          question: "How do I receive my earnings as a professional?",
          answer: "Payments are processed via Stripe Connect. After completing the service, the amount is released to your account. You can set up Stripe Connect in your professional dashboard and track all payments in the Wallet section."
        },
        {
          category: "payment",
          question: "What is the PawCão Wallet?",
          answer: "The wallet brings together your walk tokens, cashback and earnings balance (for professionals). Tokens can be used to book walks and cashback accumulates with your bookings. Professionals track pending and available earnings for withdrawal."
        },
        {
          category: "payment",
          question: "What are PawPoints and gamification?",
          answer: "You earn PawPoints on every booking and by completing challenges. Points determine your level and unlock badges. Paid plan members earn double points and get access to exclusive rewards."
        },
        {
          category: "safety",
          question: "Are professionals verified?",
          answer: "Yes! All professionals undergo verification: ID document and proof of address. Verified professionals have a badge on their profile. The PawCão Seal distinguishes trusted professionals with a proven track record."
        },
        {
          category: "safety",
          question: "What to do in an emergency?",
          answer: "In a medical emergency, immediately contact the nearest vet. For emergencies related to an active service, use the SOS button in the app that alerts support. We always recommend keeping your dog's regular vet contact handy."
        },
        {
          category: "safety",
          question: "Do services have insurance?",
          answer: "Payments are securely processed via Stripe with fraud protection. For specific liability coverage, check the information on each professional or hotel profile."
        },
        {
          category: "professional",
          question: "How do I become a professional?",
          answer: "Choose your professional type (walker, trainer or hotel), complete onboarding, upload documents and wait for approval. It's free to start — the platform commission only applies when you receive payments."
        },
        {
          category: "professional",
          question: "How much can I earn as a professional?",
          answer: "It depends on your experience, location and dedication. Full-time professionals can have solid earnings. You set your own prices and schedule. With the PawCão Seal and good reviews, you gain visibility and trust."
        },
        {
          category: "professional",
          question: "Do I need certifications or a tax ID?",
          answer: "For correct invoicing, you need NIF (Portugal), NIE (Spain) or SIRET (France). You can configure your tax data in the dashboard. For trainers, professional certifications are highly valued and increase client trust."
        },
        {
          category: "professional",
          question: "How do I receive payments as a hotel?",
          answer: "Hotels use Stripe Connect. Earnings remain pending during the stay and are released after check-out. You can manage capacities, block dates off, configure check-in/out times and assign tasks to partners — all from the Hotel Dashboard."
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
        { id: "hotel", name: "Hoteles", icon: Building2 },
        { id: "pawgo", name: "PawGo", icon: Zap },
        { id: "payment", name: "Pagos", icon: CreditCard },
        { id: "safety", name: "Seguridad", icon: Shield },
        { id: "professional", name: "Profesionales", icon: Users }
      ],

      faqs: [
        {
          category: "general",
          question: "¿Qué es PawCão?",
          answer: "PawCão es la plataforma de cuidado canino que opera en Portugal, España y Francia. Conectamos a dueños de perros con paseadores, entrenadores y hoteles caninos profesionales verificados. Ofrecemos paseos, entrenamiento, alojamiento (boarding), guardería (daycare), peluquería y más."
        },
        {
          category: "general",
          question: "¿En qué países está disponible PawCão?",
          answer: "Actualmente operamos en Portugal, España y Francia. Cada país tiene su propia página con profesionales locales. Puedes cambiar de país usando las banderas en el pie de página."
        },
        {
          category: "general",
          question: "¿Cómo funciona PawCão?",
          answer: "¡Es simple! 1) Crea una cuenta gratuita, 2) Busca profesionales en tu área (paseadores, entrenadores u hoteles), 3) Reserva el servicio que necesitas, 4) Paga de forma segura a través de la plataforma, 5) ¡Disfruta del servicio! El pago se retiene hasta la finalización del servicio para tu seguridad."
        },
        {
          category: "booking",
          question: "¿Cómo hago una reserva?",
          answer: "Navega por los perfiles de profesionales, elige el más adecuado, haz clic en 'Reservar', completa los detalles (fecha, hora, perro) y confirma el pago. Recibirás una confirmación inmediata por correo y notificación en la app."
        },
        {
          category: "booking",
          question: "¿Puedo cancelar una reserva?",
          answer: "¡Sí! Cancelaciones gratuitas hasta 24h antes del servicio. Después de ese período, se aplican tarifas de cancelación. Para reservas de hotel, la política depende del establecimiento — consulta las condiciones en el perfil del hotel."
        },
        {
          category: "booking",
          question: "¿Y si el profesional cancela?",
          answer: "Si el profesional cancela, recibirás un reembolso completo inmediato y te ayudaremos a encontrar un reemplazo. Los profesionales con muchas cancelaciones son penalizados y pueden ser eliminados de la plataforma."
        },
        {
          category: "booking",
          question: "¿Puedo reservar paseos en grupo?",
          answer: "¡Sí! Algunos profesionales organizan paseos en grupo donde tu perro se socializa con otros. Verifica en el perfil del profesional si ofrece paseos en grupo y el número máximo de perros. El precio por perro suele ser menor en grupo."
        },
        {
          category: "hotel",
          question: "¿Cómo funciona el alojamiento en hoteles caninos?",
          answer: "Los hoteles caninos verificados en PawCão ofrecen alojamiento (boarding) y guardería (daycare). Elige el hotel, selecciona las fechas de check-in y check-out, indica tu(s) perro(s) y confirma. Cada hotel define su capacidad, horarios de check-in/out y precios por noche."
        },
        {
          category: "hotel",
          question: "¿Qué documentos necesito para el hotel?",
          answer: "La vacuna antirrábica debe estar vigente. Durante la reserva puedes adjuntar el comprobante de vacunación (PDF/imagen). Algunos hoteles exigen información sobre dieta, medicación y rutina del animal — cuantos más detalles proporciones, mejor será el cuidado."
        },
        {
          category: "hotel",
          question: "¿Puedo añadir servicios extra durante la estancia?",
          answer: "¡Sí! Puedes añadir paseos, sesiones de entrenamiento, peluquería, baños y otros cuidados directamente en el hotel. El hotel también puede asignar estas tareas a socios (paseadores colaboradores) y el pago se procesa de forma segura en la plataforma."
        },
        {
          category: "pawgo",
          question: "¿Qué es PawGo?",
          answer: "PawGo es nuestro sistema de seguimiento en vivo. Durante un paseo, puedes ver la ubicación de tu perro en tiempo real en el mapa, recibir actualizaciones con fotos y seguir la ruta recorrida. Todo con verificación por código QR al inicio y al final del paseo."
        },
        {
          category: "pawgo",
          question: "¿Cómo funciona la verificación por código QR?",
          answer: "Al inicio del paseo, el profesional escanea un código QR para confirmar la recogida del perro. Al final, escanea de nuevo para confirmar la entrega. Esto garantiza transparencia y seguridad durante todo el proceso."
        },
        {
          category: "payment",
          question: "¿Cómo funciona el pago?",
          answer: "Aceptamos tarjetas de crédito/débito vía Stripe. El pago se procesa de forma segura y se retiene en depósito hasta la finalización del servicio. La plataforma cobra una comisión sobre el valor del servicio — el profesional recibe el monto acordado tras la finalización."
        },
        {
          category: "payment",
          question: "¿Cómo recibo mis ganancias como profesional?",
          answer: "Los pagos se procesan vía Stripe Connect. Tras completar el servicio, el monto se libera a tu cuenta. Puedes configurar Stripe Connect en tu panel profesional y seguir todos los pagos en la sección Billetera."
        },
        {
          category: "payment",
          question: "¿Qué es la Billetera PawCão?",
          answer: "La billetera reúne tus tokens de paseo, cashback y saldo de ganancias (para profesionales). Los tokens se pueden usar para reservar paseos y el cashback se acumula con tus reservas. Los profesionales siguen los ingresos pendientes y disponibles para retiro."
        },
        {
          category: "payment",
          question: "¿Qué son los PawPoints y la gamificación?",
          answer: "Ganas PawPoints en cada reserva y al completar desafíos. Los puntos determinan tu nivel y desbloquean insignias (badges). Los miembros con planes de pago ganan el doble de puntos y tienen acceso a recompensas exclusivas."
        },
        {
          category: "safety",
          question: "¿Los profesionales están verificados?",
          answer: "¡Sí! Todos los profesionales pasan por verificación: documento de identidad y comprobante de domicilio. Los profesionales verificados tienen una insignia en su perfil. El Sello PawCão distingue a profesionales de confianza con historial comprobado."
        },
        {
          category: "safety",
          question: "¿Qué hacer en caso de emergencia?",
          answer: "En una emergencia médica, contacta inmediatamente al veterinario más cercano. Para emergencias relacionadas con un servicio activo, usa el botón SOS en la app que alerta al soporte. Siempre recomendamos tener a mano el contacto del veterinario habitual de tu animal."
        },
        {
          category: "safety",
          question: "¿Los servicios tienen seguro?",
          answer: "Los pagos se procesan de forma segura vía Stripe con protección contra fraude. Para coberturas específicas de responsabilidad civil, consulta la información en el perfil de cada profesional u hotel."
        },
        {
          category: "professional",
          question: "¿Cómo me convierto en profesional?",
          answer: "Elige tu tipo de profesional (paseador, entrenador u hotel), completa el onboarding, sube los documentos y espera la aprobación. Es gratis comenzar — la comisión de la plataforma solo se aplica cuando recibes pagos."
        },
        {
          category: "professional",
          question: "¿Cuánto puedo ganar como profesional?",
          answer: "Depende de tu experiencia, ubicación y dedicación. Los profesionales de tiempo completo pueden tener ingresos sólidos. Tú fijas tus propios precios y horarios. Con el Sello PawCão y buenas reseñas, ganas visibilidad y confianza."
        },
        {
          category: "professional",
          question: "¿Necesito certificaciones o NIF?",
          answer: "Para facturación correcta, necesitas NIF (Portugal), NIE (España) o SIRET (Francia). Puedes configurar tus datos fiscales en el panel. Para entrenadores, las certificaciones profesionales son muy valoradas y aumentan la confianza del cliente."
        },
        {
          category: "professional",
          question: "¿Cómo recibo pagos como hotel?",
          answer: "Los hoteles usan Stripe Connect. Las ganancias quedan pendientes durante la estancia y se liberan tras el check-out. Puedes gestionar capacidades, bloquear días de descanso, configurar horarios de check-in/out y asignar tareas a socios — todo desde el Panel del Hotel."
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0d9483] via-[#14b8a6] to-[#0891b2] text-white py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <HelpCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 font-heading">
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
        <div className="flex flex-wrap gap-2 md:gap-3 mb-8 justify-center">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className={selectedCategory === "all" ? "bg-[#0d9483]" : ""}
          >
            {t.allCategories}
          </Button>
          {t.categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? "bg-[#0d9483]" : ""}
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
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-[#0d9483] to-[#0891b2] text-white">
            <CardContent className="p-8 md:p-12 text-center">
              <Star className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
                {t.stillNeedHelp}
              </h2>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-[#0d9483] hover:bg-gray-100"
                onClick={() => window.location.href = '/Contact'}
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