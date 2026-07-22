import React, { useState } from "react";
import {
  Shield,
  Info,
  UserCheck,
  Globe,
  CreditCard,
  RotateCcw,
  ShoppingBag,
  Briefcase,
  Heart,
  ShieldCheck,
  Gift,
  Ban,
  Copyright,
  Lock,
  RefreshCw,
  UserX,
  Scale,
  Mail,
  ChevronDown,
  Check,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function TermsOfService() {
  const { language, setLanguage } = useLanguage();
  const [openSection, setOpenSection] = useState(0);

  const content = {
    pt: {
      title: "Termos de Serviço",
      subtitle: "As regras e condições da plataforma PawCão",
      lastUpdated: "Última atualização: 22 de Dezembro de 2025",
      badge: "Termos Legais",
      intro:
        "A PawCão é uma plataforma de intermediação tecnológica que conecta donos de animais de estimação com prestadores de serviços independentes em Portugal, Espanha e França. Ao utilizar a plataforma, concorda com todos os termos aqui descritos.",
      sections: [
        { icon: Info, title: "Introdução e Natureza da Plataforma", content: "A PawCão é uma plataforma de intermediação tecnológica que conecta donos de animais de estimação com prestadores de serviços independentes (Dog Walkers, treinadores, pet sitters) e estabelecimentos comerciais em Portugal, Espanha e França.\n\n**IMPORTANTE:** A PawCão NÃO é empregadora dos prestadores de serviço listados na plataforma. Atuamos exclusivamente como facilitadores tecnológicos da conexão entre as partes. A relação contratual é estabelecida diretamente entre o cliente e o prestador de serviço." },
        { icon: UserCheck, title: "Elegibilidade e Registo", content: "Para utilizar a PawCão, deve:\n• Ter pelo menos 18 anos de idade\n• Possuir capacidade legal para celebrar contratos\n• Fornecer informações verdadeiras e atualizadas\n\nOs profissionais devem adicionalmente:\n• Passar por verificação de identidade\n• Fornecer documentação válida conforme exigido\n• Manter certificações atualizadas quando aplicável" },
        { icon: Globe, title: "Regras Específicas por País", content: "🇫🇷 **FRANÇA - Regime CESU (Chèque Emploi Service Universel):**\n\nPara serviços contratados em França a prestadores sem número SIRET (Particulares), o Cliente Final assume o papel de empregador particular, estando sujeito às obrigações declarativas via CESU. A PawCão atua apenas como facilitador técnico do pagamento. O cliente é responsável por:\n• Declarar o empregado doméstico via CESU\n• Pagar as contribuições sociais aplicáveis\n• Cumprir as obrigações legais de empregador particular\n\nPrestadores com SIRET seguem o regime normal de auto-entrepreneur ou empresa.\n\n🇵🇹 **PORTUGAL** e 🇪🇸 **ESPANHA:**\n\nOs prestadores de serviço são profissionais independentes ou empresas, sendo inteiramente responsáveis pelas suas próprias obrigações fiscais e legais, incluindo:\n• Emissão de recibos/faturas\n• Declaração de rendimentos\n• Pagamento de contribuições à Segurança Social" },
        { icon: CreditCard, title: "Pagamentos e Taxas", content: "• Os pagamentos são processados através da plataforma de forma segura\n• O valor é retido até confirmação da conclusão do serviço\n• Comissão da plataforma: 15% (ou conforme plano de subscrição do profissional)\n• Taxa de transação: €1 por reserva\n• Todos os preços apresentados incluem IVA quando aplicável\n• Reembolsos são processados em 5-7 dias úteis" },
        { icon: RotateCcw, title: "Política de Cancelamentos - Serviços", content: "**Cancelamento pelo Cliente:**\n• Com mais de 24 horas de antecedência: Reembolso total (100%)\n• Com menos de 24 horas: Sem direito a reembolso (para compensação do profissional)\n• Membros Premium/VIP: Condições especiais conforme plano\n\n**Cancelamento pelo Profissional:**\n• Reembolso total ao cliente\n• Possível penalização na classificação do profissional\n\n**Cancelamentos de Emergência:**\n• Analisados caso a caso pela equipa PawCão\n• Documentação comprovativa pode ser solicitada" },
        { icon: ShoppingBag, title: "Loja PawStore - Produtos Físicos", content: "**Direito de Livre Resolução (Devolução):**\nConforme a Diretiva Europeia 2011/83/UE, o cliente tem direito a devolver produtos físicos no prazo de 14 dias após a receção, sem necessidade de indicar motivo.\n\n**Condições para Devolução:**\n• Produto em estado original, sem uso\n• Embalagem original intacta quando possível\n• Acompanhado de comprovativo de compra\n\n**Garantia Legal:**\n• 3 anos para bens de consumo (conforme legislação portuguesa)\n• 2 anos para produtos comprados por empresas\n\n**Prazos de Envio:**\n• Entregas em 3-5 dias úteis\n• Portes grátis em encomendas superiores a €50" },
        { icon: Briefcase, title: "Responsabilidades dos Profissionais", content: "Os prestadores de serviço comprometem-se a:\n• Prestar serviços com qualidade e profissionalismo\n• Manter documentação e certificações válidas\n• Cumprir toda a legislação local aplicável\n• Tratar os animais com cuidado, respeito e dignidade\n• Comunicar de forma clara e atempada com os clientes\n• Reportar imediatamente qualquer incidente" },
        { icon: Heart, title: "Responsabilidades dos Donos de Animais", content: "Os clientes comprometem-se a:\n• Fornecer informações precisas sobre o animal\n• Divulgar quaisquer problemas de saúde ou comportamento\n• Garantir que o animal está vacinado e em condições de saúde\n• Efetuar os pagamentos conforme acordado\n• Tratar os profissionais com respeito e cordialidade" },
        { icon: ShieldCheck, title: "Seguro e Limitação de Responsabilidade", content: "• A PawCão disponibiliza seguro básico para todos os serviços\n• Seguro adicional está disponível mediante pagamento extra\n• Os donos são responsáveis pelo comportamento dos seus animais\n• Os profissionais devem possuir seguro de responsabilidade civil\n• A PawCão não é responsável por incidentes ocorridos diretamente entre as partes\n• A responsabilidade máxima da PawCão está limitada ao valor pago pelos serviços nos últimos 12 meses" },
        { icon: Gift, title: "Sistema de Fidelização (PawPoints)", content: "• Acumule 10-20 pontos por cada €1 gasto (conforme o seu tier)\n• Os pontos podem ser trocados por descontos em serviços e produtos\n• Os pontos expiram após 12 meses de inatividade na conta\n• A PawCão reserva-se o direito de ajustar os valores de conversão\n• Os pontos não possuem valor monetário e não são transferíveis" },
        { icon: Ban, title: "Condutas Proibidas", content: "É estritamente proibido:\n• Utilizar linguagem ofensiva, discriminatória ou assédio\n• Fornecer informações falsas ou enganosas\n• Contornar o sistema de pagamento da plataforma\n• Copiar ou utilizar propriedade intelectual da PawCão\n• Utilizar a plataforma para fins ilegais\n• Criar múltiplas contas falsas ou fraudulentas" },
        { icon: Copyright, title: "Propriedade Intelectual", content: "Todo o conteúdo da plataforma PawCão, incluindo marca, logotipo, design, textos e software, é propriedade exclusiva da PawCão e está protegido por leis de direitos autorais e propriedade industrial. Qualquer uso não autorizado será objeto de ação legal." },
        { icon: Lock, title: "Proteção de Dados", content: "O tratamento de dados pessoais é regido pela nossa Política de Privacidade, em total conformidade com o Regulamento Geral de Proteção de Dados (RGPD). Processamos apenas os dados estritamente necessários para a prestação dos serviços." },
        { icon: RefreshCw, title: "Alterações aos Termos", content: "A PawCão reserva-se o direito de modificar estes termos a qualquer momento. Os utilizadores serão notificados de alterações significativas por email ou através da plataforma. A continuação do uso após as alterações constitui aceitação dos novos termos." },
        { icon: UserX, title: "Rescisão de Conta", content: "• A PawCão pode suspender ou encerrar contas que violem estes termos\n• Os utilizadores podem encerrar a sua conta a qualquer momento nas definições\n• Os dados pessoais serão tratados conforme a política de privacidade e o direito ao esquecimento" },
        { icon: Scale, title: "Lei Aplicável e Jurisdição", content: "Estes termos são regidos pela legislação portuguesa. Quaisquer litígios serão submetidos à jurisdição exclusiva dos tribunais de Lisboa, Portugal, sem prejuízo dos direitos dos consumidores previstos na legislação aplicável." },
        { icon: Mail, title: "Contacto", content: "Para questões sobre estes Termos de Serviço:\n• Email: support@pawcao.net" },
      ],
      commitmentTitle: "Aceitação dos Termos",
      commitmentText:
        "Ao usar a plataforma PawCão, confirma que leu, compreendeu e concorda em estar vinculado a estes Termos de Serviço e à nossa Política de Privacidade.",
      langLabel: "Idioma",
    },
    en: {
      title: "Terms of Service",
      subtitle: "The rules and conditions of the PawCão platform",
      lastUpdated: "Last updated: December 22, 2025",
      badge: "Legal Terms",
      intro:
        "PawCão is a technology intermediation platform that connects pet owners with independent service providers in Portugal, Spain, and France. By using the platform, you agree to all terms described here.",
      sections: [
        { icon: Info, title: "Introduction and Platform Nature", content: "PawCão is a technology intermediation platform that connects pet owners with independent service providers (walkers, trainers, pet sitters) and commercial establishments in Portugal, Spain, and France.\n\n**IMPORTANT:** PawCão is NOT an employer of the service providers listed on the platform. We act exclusively as technological facilitators of the connection between parties. The contractual relationship is established directly between the client and the service provider." },
        { icon: UserCheck, title: "Eligibility and Registration", content: "To use PawCão, you must:\n• Be at least 18 years old\n• Have legal capacity to enter into contracts\n• Provide true and up-to-date information\n\nProfessionals must additionally:\n• Pass identity verification\n• Provide valid documentation as required\n• Maintain updated certifications when applicable" },
        { icon: Globe, title: "Country-Specific Rules", content: "🇫🇷 **FRANCE - CESU Regime (Chèque Emploi Service Universel):**\n\nFor services contracted in France from providers without a SIRET number (Individuals), the End Client assumes the role of private employer, being subject to declarative obligations via CESU. PawCão acts only as a technical payment facilitator. The client is responsible for:\n• Declaring the domestic employee via CESU\n• Paying applicable social contributions\n• Complying with private employer legal obligations\n\nProviders with SIRET follow the normal auto-entrepreneur or company regime.\n\n🇵🇹 **PORTUGAL** and 🇪🇸 **SPAIN:**\n\nService providers are independent professionals or companies, being entirely responsible for their own fiscal and legal obligations, including:\n• Issuing receipts/invoices\n• Income declaration\n• Payment of Social Security contributions" },
        { icon: CreditCard, title: "Payments and Fees", content: "• Payments are processed securely through the platform\n• Amount is held until service completion confirmation\n• Platform commission: 15% (or per professional's subscription plan)\n• Transaction fee: €1 per booking\n• All displayed prices include VAT when applicable\n• Refunds are processed within 5-7 business days" },
        { icon: RotateCcw, title: "Cancellation Policy - Services", content: "**Cancellation by Client:**\n• More than 24 hours in advance: Full refund (100%)\n• Less than 24 hours: No refund (to compensate the professional)\n• Premium/VIP Members: Special conditions per plan\n\n**Cancellation by Professional:**\n• Full refund to client\n• Possible penalty on professional's rating\n\n**Emergency Cancellations:**\n• Analyzed case by case by PawCão team\n• Supporting documentation may be requested" },
        { icon: ShoppingBag, title: "PawStore - Physical Products", content: "**Right of Withdrawal (Return):**\nAccording to EU Directive 2011/83/EU, the client has the right to return physical products within 14 days of receipt, without needing to provide a reason.\n\n**Return Conditions:**\n• Product in original condition, unused\n• Original packaging intact when possible\n• Accompanied by proof of purchase\n\n**Legal Warranty:**\n• 3 years for consumer goods (per Portuguese law)\n• 2 years for products purchased by companies\n\n**Shipping Times:**\n• Deliveries in 3-5 business days\n• Free shipping on orders over €50" },
        { icon: Briefcase, title: "Professional Responsibilities", content: "Service providers commit to:\n• Provide quality and professional services\n• Maintain valid documentation and certifications\n• Comply with all applicable local legislation\n• Treat animals with care, respect, and dignity\n• Communicate clearly and timely with clients\n• Immediately report any incidents" },
        { icon: Heart, title: "Pet Owner Responsibilities", content: "Clients commit to:\n• Provide accurate information about the pet\n• Disclose any health or behavioral issues\n• Ensure the pet is vaccinated and in healthy condition\n• Make payments as agreed\n• Treat professionals with respect and courtesy" },
        { icon: ShieldCheck, title: "Insurance and Liability Limitation", content: "• PawCão provides basic insurance for all services\n• Additional insurance is available for an extra fee\n• Owners are responsible for their animals' behavior\n• Professionals must have civil liability insurance\n• PawCão is not responsible for incidents occurring directly between parties\n• PawCão's maximum liability is limited to the amount paid for services in the last 12 months" },
        { icon: Gift, title: "Loyalty System (PawPoints)", content: "• Earn 10-20 points per €1 spent (according to your tier)\n• Points can be exchanged for discounts on services and products\n• Points expire after 12 months of account inactivity\n• PawCão reserves the right to adjust conversion values\n• Points have no monetary value and are non-transferable" },
        { icon: Ban, title: "Prohibited Conduct", content: "It is strictly prohibited to:\n• Use offensive, discriminatory language or harassment\n• Provide false or misleading information\n• Bypass the platform's payment system\n• Copy or use PawCão's intellectual property\n• Use the platform for illegal purposes\n• Create multiple fake or fraudulent accounts" },
        { icon: Copyright, title: "Intellectual Property", content: "All content on the PawCão platform, including brand, logo, design, texts, and software, is exclusive property of PawCão and is protected by copyright and industrial property laws. Any unauthorized use will be subject to legal action." },
        { icon: Lock, title: "Data Protection", content: "Personal data processing is governed by our Privacy Policy, in full compliance with the General Data Protection Regulation (GDPR). We process only data strictly necessary for service provision." },
        { icon: RefreshCw, title: "Terms Modifications", content: "PawCão reserves the right to modify these terms at any time. Users will be notified of significant changes by email or through the platform. Continued use after changes constitutes acceptance of the new terms." },
        { icon: UserX, title: "Account Termination", content: "• PawCão may suspend or terminate accounts that violate these terms\n• Users may close their account at any time in settings\n• Personal data will be handled according to the privacy policy and right to erasure" },
        { icon: Scale, title: "Governing Law and Jurisdiction", content: "These terms are governed by Portuguese law. Any disputes will be submitted to the exclusive jurisdiction of the courts of Lisbon, Portugal, without prejudice to consumer rights under applicable legislation." },
        { icon: Mail, title: "Contact", content: "For questions about these Terms of Service:\n• Email: support@pawcao.net" },
      ],
      commitmentTitle: "Acceptance of Terms",
      commitmentText:
        "By using the PawCão platform, you confirm that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.",
      langLabel: "Language",
    },
    es: {
      title: "Términos de Servicio",
      subtitle: "Las reglas y condiciones de la plataforma PawCão",
      lastUpdated: "Última actualización: 22 de Diciembre de 2025",
      badge: "Términos Legales",
      intro:
        "PawCão es una plataforma de intermediación tecnológica que conecta dueños de mascotas con proveedores de servicios independientes en Portugal, España y Francia. Al usar la plataforma, acepta todos los términos aquí descritos.",
      sections: [
        { icon: Info, title: "Introducción y Naturaleza de la Plataforma", content: "PawCão es una plataforma de intermediación tecnológica que conecta dueños de mascotas con proveedores de servicios independientes (paseadores, entrenadores, cuidadores) y establecimientos comerciales en Portugal, España y Francia.\n\n**IMPORTANTE:** PawCão NO es empleador de los proveedores de servicios listados en la plataforma. Actuamos exclusivamente como facilitadores tecnológicos de la conexión entre las partes. La relación contractual se establece directamente entre el cliente y el proveedor del servicio." },
        { icon: UserCheck, title: "Elegibilidad y Registro", content: "Para usar PawCão, debe:\n• Tener al menos 18 años de edad\n• Poseer capacidad legal para celebrar contratos\n• Proporcionar información verdadera y actualizada\n\nLos profesionales deben adicionalmente:\n• Pasar verificación de identidad\n• Proporcionar documentación válida según lo requerido\n• Mantener certificaciones actualizadas cuando aplique" },
        { icon: Globe, title: "Reglas Específicas por País", content: "🇫🇷 **FRANCIA - Régimen CESU (Chèque Emploi Service Universel):**\n\nPara servicios contratados en Francia a proveedores sin número SIRET (Particulares), el Cliente Final asume el papel de empleador particular, estando sujeto a las obligaciones declarativas vía CESU. PawCão actúa solo como facilitador técnico del pago. El cliente es responsable de:\n• Declarar el empleado doméstico vía CESU\n• Pagar las contribuciones sociales aplicables\n• Cumplir las obligaciones legales de empleador particular\n\nProveedores con SIRET siguen el régimen normal de auto-entrepreneur o empresa.\n\n🇵🇹 **PORTUGAL** y 🇪🇸 **ESPAÑA:**\n\nLos proveedores de servicio son profesionales independientes o empresas, siendo enteramente responsables de sus propias obligaciones fiscales y legales, incluyendo:\n• Emisión de recibos/facturas\n• Declaración de ingresos\n• Pago de contribuciones a la Seguridad Social" },
        { icon: CreditCard, title: "Pagos y Tarifas", content: "• Los pagos se procesan de forma segura a través de la plataforma\n• El monto se retiene hasta la confirmación de finalización del servicio\n• Comisión de la plataforma: 15% (o según plan de suscripción del profesional)\n• Tarifa de transacción: €1 por reserva\n• Todos los precios mostrados incluyen IVA cuando aplique\n• Los reembolsos se procesan en 5-7 días hábiles" },
        { icon: RotateCcw, title: "Política de Cancelaciones - Servicios", content: "**Cancelación por el Cliente:**\n• Con más de 24 horas de antelación: Reembolso total (100%)\n• Con menos de 24 horas: Sin derecho a reembolso (para compensar al profesional)\n• Miembros Premium/VIP: Condiciones especiales según plan\n\n**Cancelación por el Profesional:**\n• Reembolso total al cliente\n• Posible penalización en la calificación del profesional\n\n**Cancelaciones de Emergencia:**\n• Analizadas caso por caso por el equipo PawCão\n• Documentación de respaldo puede ser solicitada" },
        { icon: ShoppingBag, title: "Tienda PawStore - Productos Físicos", content: "**Derecho de Desistimiento (Devolución):**\nConforme a la Directiva Europea 2011/83/UE, el cliente tiene derecho a devolver productos físicos en el plazo de 14 días desde la recepción, sin necesidad de indicar motivo.\n\n**Condiciones para Devolución:**\n• Producto en estado original, sin uso\n• Embalaje original intacto cuando sea posible\n• Acompañado de comprobante de compra\n\n**Garantía Legal:**\n• 3 años para bienes de consumo (según legislación portuguesa)\n• 2 años para productos comprados por empresas\n\n**Plazos de Envío:**\n• Entregas en 3-5 días hábiles\n• Envío gratis en pedidos superiores a €50" },
        { icon: Briefcase, title: "Responsabilidades de los Profesionales", content: "Los proveedores de servicio se comprometen a:\n• Prestar servicios con calidad y profesionalismo\n• Mantener documentación y certificaciones válidas\n• Cumplir toda la legislación local aplicable\n• Tratar a los animales con cuidado, respeto y dignidad\n• Comunicarse de forma clara y oportuna con los clientes\n• Reportar inmediatamente cualquier incidente" },
        { icon: Heart, title: "Responsabilidades de los Dueños de Mascotas", content: "Los clientes se comprometen a:\n• Proporcionar información precisa sobre la mascota\n• Divulgar cualquier problema de salud o comportamiento\n• Garantizar que la mascota está vacunada y en condiciones de salud\n• Efectuar los pagos según lo acordado\n• Tratar a los profesionales con respeto y cordialidad" },
        { icon: ShieldCheck, title: "Seguro y Limitación de Responsabilidad", content: "• PawCão ofrece seguro básico para todos los servicios\n• Seguro adicional está disponible mediante pago extra\n• Los dueños son responsables del comportamiento de sus mascotas\n• Los profesionales deben poseer seguro de responsabilidad civil\n• PawCão no es responsable de incidentes ocurridos directamente entre las partes\n• La responsabilidad máxima de PawCão está limitada al valor pagado por servicios en los últimos 12 meses" },
        { icon: Gift, title: "Sistema de Fidelización (PawPoints)", content: "• Acumule 10-20 puntos por cada €1 gastado (según su nivel)\n• Los puntos pueden canjearse por descuentos en servicios y productos\n• Los puntos expiran tras 12 meses de inactividad en la cuenta\n• PawCão se reserva el derecho de ajustar los valores de conversión\n• Los puntos no poseen valor monetario y no son transferibles" },
        { icon: Ban, title: "Conductas Prohibidas", content: "Está estrictamente prohibido:\n• Utilizar lenguaje ofensivo, discriminatorio o acoso\n• Proporcionar información falsa o engañosa\n• Eludir el sistema de pago de la plataforma\n• Copiar o utilizar propiedad intelectual de PawCão\n• Utilizar la plataforma para fines ilegales\n• Crear múltiples cuentas falsas o fraudulentas" },
        { icon: Copyright, title: "Propiedad Intelectual", content: "Todo el contenido de la plataforma PawCão, incluyendo marca, logotipo, diseño, textos y software, es propiedad exclusiva de PawCão y está protegido por leyes de derechos de autor y propiedad industrial. Cualquier uso no autorizado será objeto de acción legal." },
        { icon: Lock, title: "Protección de Datos", content: "El tratamiento de datos personales se rige por nuestra Política de Privacidad, en total conformidad con el Reglamento General de Protección de Datos (RGPD). Procesamos solo los datos estrictamente necesarios para la prestación de los servicios." },
        { icon: RefreshCw, title: "Modificaciones de los Términos", content: "PawCão se reserva el derecho de modificar estos términos en cualquier momento. Los usuarios serán notificados de cambios significativos por email o a través de la plataforma. El uso continuado después de los cambios constituye aceptación de los nuevos términos." },
        { icon: UserX, title: "Rescisión de Cuenta", content: "• PawCão puede suspender o cerrar cuentas que violen estos términos\n• Los usuarios pueden cerrar su cuenta en cualquier momento en configuraciones\n• Los datos personales serán tratados conforme a la política de privacidad y el derecho al olvido" },
        { icon: Scale, title: "Ley Aplicable y Jurisdicción", content: "Estos términos se rigen por la legislación portuguesa. Cualquier litigio será sometido a la jurisdicción exclusiva de los tribunales de Lisboa, Portugal, sin perjuicio de los derechos de los consumidores previstos en la legislación aplicable." },
        { icon: Mail, title: "Contacto", content: "Para preguntas sobre estos Términos de Servicio:\n• Email: support@pawcao.net" },
      ],
      commitmentTitle: "Aceptación de los Términos",
      commitmentText:
        "Al usar la plataforma PawCão, confirma que ha leído, entendido y acepta estar sujeto a estos Términos de Servicio y nuestra Política de Privacidad.",
      langLabel: "Idioma",
    },
    fr: {
      title: "Conditions d'Utilisation",
      subtitle: "Les règles et conditions de la plateforme PawCão",
      lastUpdated: "Dernière mise à jour : 22 Décembre 2025",
      badge: "Conditions Légales",
      intro:
        "PawCão est une plateforme d'intermédiation technologique qui connecte les propriétaires d'animaux avec des prestataires de services indépendants au Portugal, en Espagne et en France. En utilisant la plateforme, vous acceptez toutes les conditions décrites ici.",
      sections: [
        { icon: Info, title: "Introduction et Nature de la Plateforme", content: "PawCão est une plateforme d'intermédiation technologique qui connecte les propriétaires d'animaux avec des prestataires de services indépendants (promeneurs, dresseurs, pet sitters) et des établissements commerciaux au Portugal, en Espagne et en France.\n\n**IMPORTANT:** PawCão N'EST PAS employeur des prestataires de services listés sur la plateforme. Nous agissons exclusivement comme facilitateurs technologiques de la connexion entre les parties. La relation contractuelle est établie directement entre le client et le prestataire de services." },
        { icon: UserCheck, title: "Éligibilité et Inscription", content: "Pour utiliser PawCão, vous devez :\n• Avoir au moins 18 ans\n• Avoir la capacité juridique de conclure des contrats\n• Fournir des informations véridiques et à jour\n\nLes professionnels doivent en outre :\n• Passer une vérification d'identité\n• Fournir une documentation valide selon les exigences\n• Maintenir les certifications à jour le cas échéant" },
        { icon: Globe, title: "Règles Spécifiques par Pays", content: "🇫🇷 **FRANCE - Régime CESU (Chèque Emploi Service Universel) :**\n\nPour les services contractés en France auprès de prestataires sans numéro SIRET (Particuliers), le Client Final assume le rôle d'employeur particulier, étant soumis aux obligations déclaratives via CESU. PawCão agit uniquement comme facilitateur technique du paiement. Le client est responsable de :\n• Déclarer l'employé à domicile via CESU\n• Payer les cotisations sociales applicables\n• Respecter les obligations légales d'employeur particulier\n\nLes prestataires avec SIRET suivent le régime normal d'auto-entrepreneur ou d'entreprise.\n\n🇵🇹 **PORTUGAL** et 🇪🇸 **ESPAGNE :**\n\nLes prestataires de services sont des professionnels indépendants ou des entreprises, étant entièrement responsables de leurs propres obligations fiscales et légales, y compris :\n• L'émission de reçus/factures\n• La déclaration des revenus\n• Le paiement des cotisations de Sécurité Sociale" },
        { icon: CreditCard, title: "Paiements et Frais", content: "• Les paiements sont traités de manière sécurisée via la plateforme\n• Le montant est retenu jusqu'à confirmation de l'achèvement du service\n• Commission de la plateforme : 15% (ou selon le plan d'abonnement du professionnel)\n• Frais de transaction : 1€ par réservation\n• Tous les prix affichés incluent la TVA le cas échéant\n• Les remboursements sont traités sous 5-7 jours ouvrables" },
        { icon: RotateCcw, title: "Politique d'Annulation - Services", content: "**Annulation par le Client :**\n• Plus de 24 heures à l'avance : Remboursement intégral (100%)\n• Moins de 24 heures : Pas de remboursement (pour compenser le professionnel)\n• Membres Premium/VIP : Conditions spéciales selon le plan\n\n**Annulation par le Professionnel :**\n• Remboursement intégral au client\n• Pénalisation possible sur la note du professionnel\n\n**Annulations d'Urgence :**\n• Analysées au cas par cas par l'équipe PawCão\n• Une documentation justificative peut être demandée" },
        { icon: ShoppingBag, title: "Boutique PawStore - Produits Physiques", content: "**Droit de Rétractation (Retour) :**\nConformément à la Directive Européenne 2011/83/UE, le client a le droit de retourner les produits physiques dans un délai de 14 jours après réception, sans avoir à donner de motif.\n\n**Conditions de Retour :**\n• Produit en état original, non utilisé\n• Emballage original intact si possible\n• Accompagné d'une preuve d'achat\n\n**Garantie Légale :**\n• 3 ans pour les biens de consommation (selon la loi portugaise)\n• 2 ans pour les produits achetés par des entreprises\n\n**Délais de Livraison :**\n• Livraisons en 3-5 jours ouvrables\n• Livraison gratuite pour les commandes supérieures à 50€" },
        { icon: Briefcase, title: "Responsabilités des Professionnels", content: "Les prestataires de services s'engagent à :\n• Fournir des services de qualité et professionnels\n• Maintenir une documentation et des certifications valides\n• Respecter toute la législation locale applicable\n• Traiter les animaux avec soin, respect et dignité\n• Communiquer clairement et en temps opportun avec les clients\n• Signaler immédiatement tout incident" },
        { icon: Heart, title: "Responsabilités des Propriétaires d'Animaux", content: "Les clients s'engagent à :\n• Fournir des informations précises sur l'animal\n• Divulguer tout problème de santé ou de comportement\n• S'assurer que l'animal est vacciné et en bonne santé\n• Effectuer les paiements comme convenu\n• Traiter les professionnels avec respect et courtoisie" },
        { icon: ShieldCheck, title: "Assurance et Limitation de Responsabilité", content: "• PawCão fournit une assurance de base pour tous les services\n• Une assurance supplémentaire est disponible moyennant des frais\n• Les propriétaires sont responsables du comportement de leurs animaux\n• Les professionnels doivent avoir une assurance responsabilité civile\n• PawCão n'est pas responsable des incidents survenant directement entre les parties\n• La responsabilité maximale de PawCão est limitée au montant payé pour les services au cours des 12 derniers mois" },
        { icon: Gift, title: "Programme de Fidélité (PawPoints)", content: "• Gagnez 10-20 points par €1 dépensé (selon votre niveau)\n• Les points peuvent être échangés contre des réductions sur les services et produits\n• Les points expirent après 12 mois d'inactivité du compte\n• PawCão se réserve le droit d'ajuster les valeurs de conversion\n• Les points n'ont pas de valeur monétaire et ne sont pas transférables" },
        { icon: Ban, title: "Comportements Interdits", content: "Il est strictement interdit de :\n• Utiliser un langage offensant, discriminatoire ou du harcèlement\n• Fournir des informations fausses ou trompeuses\n• Contourner le système de paiement de la plateforme\n• Copier ou utiliser la propriété intellectuelle de PawCão\n• Utiliser la plateforme à des fins illégales\n• Créer plusieurs comptes faux ou frauduleux" },
        { icon: Copyright, title: "Propriété Intellectuelle", content: "Tout le contenu de la plateforme PawCão, y compris la marque, le logo, le design, les textes et le logiciel, est la propriété exclusive de PawCão et est protégé par les lois sur les droits d'auteur et la propriété industrielle. Toute utilisation non autorisée fera l'objet de poursuites judiciaires." },
        { icon: Lock, title: "Protection des Données", content: "Le traitement des données personnelles est régi par notre Politique de Confidentialité, en pleine conformité avec le Règlement Général sur la Protection des Données (RGPD). Nous ne traitons que les données strictement nécessaires à la fourniture des services." },
        { icon: RefreshCw, title: "Modifications des Conditions", content: "PawCão se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés des changements significatifs par email ou via la plateforme. L'utilisation continue après les modifications constitue l'acceptation des nouvelles conditions." },
        { icon: UserX, title: "Résiliation de Compte", content: "• PawCão peut suspendre ou résilier les comptes qui violent ces conditions\n• Les utilisateurs peuvent fermer leur compte à tout moment dans les paramètres\n• Les données personnelles seront traitées conformément à la politique de confidentialité et au droit à l'effacement" },
        { icon: Scale, title: "Droit Applicable et Juridiction", content: "Ces conditions sont régies par le droit portugais. Tout litige sera soumis à la juridiction exclusive des tribunaux de Lisbonne, Portugal, sans préjudice des droits des consommateurs prévus par la législation applicable." },
        { icon: Mail, title: "Contact", content: "Pour toute question concernant ces Conditions d'Utilisation :\n• Email : support@pawcao.net" },
      ],
      commitmentTitle: "Acceptation des Conditions",
      commitmentText:
        "En utilisant la plateforme PawCão, vous confirmez avoir lu, compris et accepté d'être lié par ces Conditions d'Utilisation et notre Politique de Confidentialité.",
      langLabel: "Langue",
    },
  };

  const t = content[language] || content.pt;

  const languages = [
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
  ];

  const renderContent = (text) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={i} className="font-bold text-slate-900 mt-4 mb-2 text-sm">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      if (line.includes("**")) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="mb-2 text-sm text-slate-600">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="text-slate-900">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      }
      if (line.startsWith("•")) {
        return (
          <div key={i} className="flex items-start gap-2 mb-1.5">
            <Check className="w-4 h-4 text-[#0d9483] mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">{line.replace(/^•\s*/, "")}</span>
          </div>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return (
        <p key={i} className="mb-2 text-sm text-slate-600">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-white to-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0d9483] via-[#14b8a6] to-[#0891b2] text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 py-14 md:py-20">
          {/* Language selector */}
          <div className="flex justify-end mb-6">
            <div className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-sm p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    language === lang.code
                      ? "bg-white text-[#0d9483]"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {lang.flag} {lang.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm mb-5">
            <Shield className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold mb-4">
            <Check className="w-3.5 h-3.5" />
            {t.badge}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2 font-heading tracking-tight">
            {t.title}
          </h1>
          <p className="text-lg text-white/80 mb-4">{t.subtitle}</p>
          <p className="text-sm text-white/70 mb-6">{t.lastUpdated}</p>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
            {t.intro}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 md:-mt-12 pb-16 relative z-10">
        {/* Important notice */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium">
            {language === "pt" && "Por favor, leia atentamente estes termos antes de usar a plataforma. Ao criar uma conta, concorda com todos os termos aqui descritos."}
            {language === "en" && "Please read these terms carefully before using the platform. By creating an account, you agree to all terms described here."}
            {language === "es" && "Por favor, lea estos términos cuidadosamente antes de usar la plataforma. Al crear una cuenta, acepta todos los términos aquí descritos."}
            {language === "fr" && "Veuillez lire attentivement ces conditions avant d'utiliser la plateforme. En créant un compte, vous acceptez toutes les conditions décrites ici."}
          </p>
        </div>

        {/* Accordion sections */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          {t.sections.map((section, index) => {
            const Icon = section.icon;
            const isOpen = openSection === index;
            return (
              <div
                key={index}
                className={`border-b border-slate-200/60 last:border-0 ${
                  isOpen ? "bg-white/40" : ""
                }`}
              >
                <button
                  onClick={() => setOpenSection(isOpen ? -1 : index)}
                  className="w-full flex items-center gap-4 px-5 md:px-7 py-5 text-left hover:bg-white/30 transition-colors"
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isOpen
                        ? "bg-[#0d9483] text-white"
                        : "bg-[#0d9483]/10 text-[#0d9483]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-heading font-bold text-slate-900 text-base md:text-lg leading-tight">
                      {index + 1}. {section.title}
                    </h2>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 md:px-7 pb-6 pl-5 md:pl-7">
                    <div className="ml-0 md:ml-[3.75rem] pt-1">
                      {renderContent(section.content)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Acceptance card */}
        <div className="mt-6 rounded-3xl overflow-hidden shadow-xl shadow-[#0d9483]/10">
          <div className="bg-gradient-to-br from-[#0d9483] to-[#0891b2] text-white p-6 md:p-8 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold mb-1">
                {t.commitmentTitle}
              </h2>
              <p className="text-white/90 text-sm leading-relaxed">
                {t.commitmentText}
              </p>
              <a
                href="mailto:support@pawcao.net"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white text-[#0d9483] font-bold text-sm hover:bg-white/90 transition-colors"
              >
                <Mail className="w-4 h-4" />
                support@pawcao.net
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}