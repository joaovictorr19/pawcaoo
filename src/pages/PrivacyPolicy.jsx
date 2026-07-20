import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  Eye,
  Trash2,
  Cookie,
  Globe,
  Mail,
  ChevronDown,
  Check,
  FileText,
  Database,
  Users,
  Scale,
  Clock,
  ShieldCheck,
  Baby,
  Bell,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function PrivacyPolicy() {
  const { language, setLanguage } = useLanguage();
  const [openSection, setOpenSection] = useState(0);

  const content = {
    pt: {
      title: "Política de Privacidade",
      subtitle: "Como recolhemos, utilizamos e protegemos os seus dados",
      lastUpdated: "Última atualização: 20 de Julho de 2026",
      intro:
        "A PawCão está comprometida com a proteção dos seus dados pessoais. Esta política explica de forma clara como tratamos as suas informações, em total conformidade com o RGPD da União Europeia.",
      badge: "Conforme RGPD",
      sections: [
        {
          icon: Eye,
          title: "Dados que Recolhemos",
          blocks: [
            { label: "Dados de Identidade", items: ["Nome completo", "Endereço de email", "Número de telefone", "Fotografia de perfil (opcional)", "Documento de identificação (profissionais)"] },
            { label: "Dados do Animal", items: ["Nome, raça, idade e peso", "Fotografias", "Histórico de saúde e vacinação", "Comportamento e necessidades especiais"] },
            { label: "Coordenação de Localização", items: ["A PawCão NÃO recolhe nem armazena localização em tempo real", "Partilha feita diretamente entre dono e profissional via WhatsApp", "Sem acesso nem responsabilidade sobre essa partilha"] },
            { label: "Dados de Pagamento", items: ["Processados de forma encriptada (Stripe)", "Não armazenamos dados completos do cartão", "Apenas últimos 4 dígitos para identificação"] },
          ],
        },
        {
          icon: Database,
          title: "Finalidade do Tratamento",
          blocks: [
            { label: "Execução do Serviço", items: ["Criar e gerir a sua conta", "Conectar donos com profissionais", "Processar pagamentos com segurança", "Notificações sobre reservas e serviços"] },
            { label: "Segurança da Plataforma", items: ["Verificar identidade de profissionais", "Prevenir fraudes e abusos", "Resolver disputas entre utilizadores"] },
            { label: "Comunicação", items: ["Responder a questões de suporte", "Atualizações importantes do serviço", "Newsletter (apenas com consentimento)"] },
          ],
          highlight: "NÃO vendemos, alugamos nem partilhamos os seus dados com terceiros para fins publicitários ou de marketing.",
        },
        {
          icon: Users,
          title: "Partilha de Dados",
          blocks: [
            { label: "Outros Utilizadores", items: ["Profissionais veem dados necessários ao serviço", "Donos veem contactos do profissional após confirmação"] },
            { label: "Prestadores Técnicos", items: ["Processadores de pagamento (Stripe)", "Serviços de hosting (cloud)", "Serviços de email transacional"] },
            { label: "Autoridades Legais", items: ["Apenas por ordem judicial", "Notificado sempre que legalmente possível"] },
          ],
          highlight: "Todos os terceiros estão obrigados contratualmente a proteger os seus dados conforme o RGPD.",
        },
        {
          icon: ShieldCheck,
          title: "Os Seus Direitos (RGPD)",
          blocks: [
            { label: "Direito de Acesso", items: ["Solicitar cópia de todos os dados que temos sobre si"] },
            { label: "Direito de Retificação", items: ["Corrigir dados incorretos ou desatualizados a qualquer momento"] },
            { label: "Direito ao Esquecimento", items: ["Eliminar completamente a conta e dados associados", "Processamos pedidos em até 30 dias"] },
            { label: "Direito à Portabilidade", items: ["Receber dados num formato estruturado e legível por máquina"] },
            { label: "Direito de Oposição", items: ["Opor-se ao tratamento para fins específicos"] },
            { label: "Direito de Limitação", items: ["Solicitar limitação do tratamento em certas circunstâncias"] },
          ],
          highlight: "Para exercer estes direitos: support@pawcao.net ou opções em Definições da Conta.",
        },
        {
          icon: Lock,
          title: "Segurança dos Dados",
          blocks: [
            { label: "Medidas Técnicas", items: ["Encriptação SSL/TLS em todas as comunicações", "Encriptação de dados sensíveis em repouso", "Autenticação segura com hash de passwords", "Backups regulares encriptados"] },
            { label: "Medidas Organizacionais", items: ["Monitorização contínua de acessos", "Acesso restrito (princípio do mínimo privilégio)", "Auditorias de segurança regulares"] },
          ],
        },
        {
          icon: Clock,
          title: "Retenção de Dados",
          blocks: [
            { label: "Conta Ativa", items: ["Dados mantidos enquanto a conta estiver ativa"] },
            { label: "Após Eliminação", items: ["Dados pessoais: eliminados em 30 dias", "Dados financeiros: mantidos 7 anos (obrigação fiscal)", "Dados de litígio: mantidos até resolução"] },
            { label: "Localização", items: ["PawCão não recolhe nem armazena localização", "Partilha feita diretamente via WhatsApp"] },
          ],
        },
        {
          icon: Cookie,
          title: "Cookies",
          blocks: [
            { label: "Estritamente Necessários", items: ["Autenticação e sessão de login", "Preferências de idioma", "Segurança (proteção CSRF)"] },
            { label: "Funcionais (com consentimento)", items: ["Lembrar preferências de pesquisa", "Melhorar experiência de navegação"] },
          ],
          highlight: "NÃO utilizamos cookies de rastreamento publicitário nem cookies de terceiros para marketing.",
        },
        {
          icon: Globe,
          title: "Transferências Internacionais",
          blocks: [
            { label: "Processamento na UE", items: ["Os seus dados são processados principalmente na União Europeia"] },
            { label: "Fora da UE (quando necessário)", items: ["Cláusulas contratuais padrão da UE", "Certificação de adequação do país de destino", "Medidas de segurança adicionais"] },
          ],
        },
        {
          icon: Baby,
          title: "Menores de Idade",
          blocks: [
            { label: "Idade Mínima", items: ["A PawCão não se destina a menores de 18 anos", "Não recolhemos intencionalmente dados de menores", "Dados de menores serão eliminados imediatamente"] },
          ],
        },
        {
          icon: Bell,
          title: "Alterações a esta Política",
          blocks: [
            { label: "Notificação de Alterações", items: ["Email para utilizadores registados", "Aviso destacado na plataforma", "Atualização da data de revisão"] },
          ],
        },
        {
          icon: Mail,
          title: "Contacto e DPO",
          blocks: [
            { label: "Contacto Direto", items: ["support@pawcao.net"] },
            { label: "Autoridades de Controlo", items: ["Portugal: CNPD — www.cnpd.pt", "Espanha: AEPD — www.aepd.es", "França: CNIL — www.cnil.fr"] },
          ],
        },
      ],
      commitmentTitle: "O nosso compromisso com a sua privacidade",
      commitmentText:
        "A PawCão trata a privacidade dos seus dados com a máxima seriedade. Se tiver qualquer dúvida ou preocupação, não hesite em contactar-nos.",
      langLabel: "Idioma",
    },
    en: {
      title: "Privacy Policy",
      subtitle: "How we collect, use, and protect your data",
      lastUpdated: "Last updated: July 20, 2026",
      intro:
        "PawCão is committed to protecting your personal data. This policy clearly explains how we handle your information, in full compliance with the EU GDPR.",
      badge: "GDPR Compliant",
      sections: [
        {
          icon: Eye,
          title: "Data We Collect",
          blocks: [
            { label: "Identity Data", items: ["Full name", "Email address", "Phone number", "Profile photo (optional)", "ID document (professionals only)"] },
            { label: "Pet Data", items: ["Name, breed, age, and weight", "Photos", "Health and vaccination history", "Behavior and special needs"] },
            { label: "Location Coordination", items: ["PawCão does NOT collect or store real-time location", "Sharing done directly between owner and professional via WhatsApp", "No access or responsibility over that sharing"] },
            { label: "Payment Data", items: ["Processed encrypted (Stripe)", "We do not store full card details", "Only last 4 digits for identification"] },
          ],
        },
        {
          icon: Database,
          title: "Purpose of Processing",
          blocks: [
            { label: "Service Execution", items: ["Create and manage your account", "Connect owners with professionals", "Process payments securely", "Booking and service notifications"] },
            { label: "Platform Security", items: ["Verify professional identity", "Prevent fraud and abuse", "Resolve disputes between users"] },
            { label: "Communication", items: ["Respond to support questions", "Important service updates", "Newsletter (only with consent)"] },
          ],
          highlight: "We do NOT sell, rent, or share your data with third parties for advertising or marketing purposes.",
        },
        {
          icon: Users,
          title: "Data Sharing",
          blocks: [
            { label: "Other Users", items: ["Professionals see data needed to provide the service", "Owners see professional contacts after confirmation"] },
            { label: "Technical Providers", items: ["Payment processors (Stripe)", "Hosting services (cloud)", "Transactional email services"] },
            { label: "Legal Authorities", items: ["Only when required by court order", "You will be notified when legally possible"] },
          ],
          highlight: "All third parties are contractually bound to protect your data under GDPR.",
        },
        {
          icon: ShieldCheck,
          title: "Your Rights (GDPR)",
          blocks: [
            { label: "Right of Access", items: ["Request a copy of all data we hold about you"] },
            { label: "Right to Rectification", items: ["Correct inaccurate or outdated data at any time"] },
            { label: "Right to Erasure", items: ["Delete your account and all associated data", "Requests processed within 30 days"] },
            { label: "Right to Portability", items: ["Receive data in a structured, machine-readable format"] },
            { label: "Right to Object", items: ["Object to processing for specific purposes"] },
            { label: "Right to Restriction", items: ["Request processing limitation in certain circumstances"] },
          ],
          highlight: "To exercise these rights: support@pawcao.net or options in Account Settings.",
        },
        {
          icon: Lock,
          title: "Data Security",
          blocks: [
            { label: "Technical Measures", items: ["SSL/TLS encryption on all communications", "Encryption of sensitive data at rest", "Secure authentication with password hashing", "Regular encrypted backups"] },
            { label: "Organizational Measures", items: ["Continuous access monitoring", "Restricted access (least privilege)", "Regular security audits"] },
          ],
        },
        {
          icon: Clock,
          title: "Data Retention",
          blocks: [
            { label: "Active Account", items: ["Data kept while the account is active"] },
            { label: "After Deletion", items: ["Personal data: deleted within 30 days", "Financial data: kept 7 years (tax obligation)", "Litigation data: kept until resolution"] },
            { label: "Location", items: ["PawCão does not collect or store location", "Sharing done directly via WhatsApp"] },
          ],
        },
        {
          icon: Cookie,
          title: "Cookies",
          blocks: [
            { label: "Strictly Necessary", items: ["Authentication and login session", "Language preferences", "Security (CSRF protection)"] },
            { label: "Functional (with consent)", items: ["Remember search preferences", "Improve browsing experience"] },
          ],
          highlight: "We do NOT use advertising tracking cookies or third-party marketing cookies.",
        },
        {
          icon: Globe,
          title: "International Transfers",
          blocks: [
            { label: "EU Processing", items: ["Your data is processed mainly within the European Union"] },
            { label: "Outside EU (when necessary)", items: ["EU standard contractual clauses", "Adequacy certification of destination country", "Additional security measures"] },
          ],
        },
        {
          icon: Baby,
          title: "Minors",
          blocks: [
            { label: "Minimum Age", items: ["PawCão is not intended for users under 18", "We do not knowingly collect data from minors", "Minors' data will be deleted immediately"] },
          ],
        },
        {
          icon: Bell,
          title: "Changes to this Policy",
          blocks: [
            { label: "Change Notification", items: ["Email to registered users", "Prominent notice on the platform", "Update of the revision date"] },
          ],
        },
        {
          icon: Mail,
          title: "Contact and DPO",
          blocks: [
            { label: "Direct Contact", items: ["support@pawcao.net"] },
            { label: "Supervisory Authorities", items: ["Portugal: CNPD — www.cnpd.pt", "Spain: AEPD — www.aepd.es", "France: CNIL — www.cnil.fr"] },
          ],
        },
      ],
      commitmentTitle: "Our commitment to your privacy",
      commitmentText:
        "PawCão takes your data privacy with the utmost seriousness. If you have any questions or concerns, do not hesitate to contact us.",
      langLabel: "Language",
    },
    es: {
      title: "Política de Privacidad",
      subtitle: "Cómo recopilamos, usamos y protegemos sus datos",
      lastUpdated: "Última actualización: 20 de Julio de 2026",
      intro:
        "PawCão está comprometido con la protección de sus datos personales. Esta política explica de forma clara cómo tratamos su información, en total conformidad con el RGPD de la Unión Europea.",
      badge: "Conforme RGPD",
      sections: [
        {
          icon: Eye,
          title: "Datos que Recopilamos",
          blocks: [
            { label: "Datos de Identidad", items: ["Nombre completo", "Dirección de Email", "Número de teléfono", "Foto de perfil (opcional)", "Documento de identidad (profesionales)"] },
            { label: "Datos del Animal", items: ["Nombre, raza, edad y peso", "Fotografías", "Historial de salud y vacunación", "Comportamiento y necesidades especiales"] },
            { label: "Coordinación de Ubicación", items: ["PawCão NO recopila ni almacena ubicación en tiempo real", "Compartición directa entre dueño y profesional vía WhatsApp", "Sin acceso ni responsabilidad sobre esa compartición"] },
            { label: "Datos de Pago", items: ["Procesados de forma encriptada (Stripe)", "No almacenamos datos completos de la tarjeta", "Solo últimos 4 dígitos para identificación"] },
          ],
        },
        {
          icon: Database,
          title: "Finalidad del Tratamiento",
          blocks: [
            { label: "Ejecución del Servicio", items: ["Crear y gestionar su cuenta", "Conectar dueños con profesionales", "Procesar pagos con seguridad", "Notificaciones sobre reservas y servicios"] },
            { label: "Seguridad de la Plataforma", items: ["Verificar identidad de profesionales", "Prevenir fraudes y abusos", "Resolver disputas entre usuarios"] },
            { label: "Comunicación", items: ["Responder preguntas de soporte", "Actualizaciones importantes del servicio", "Newsletter (solo con consentimiento)"] },
          ],
          highlight: "NO vendemos, alquilamos ni compartimos sus datos con terceros para fines publicitarios o de marketing.",
        },
        {
          icon: Users,
          title: "Compartición de Datos",
          blocks: [
            { label: "Otros Usuarios", items: ["Profesionales ven datos necesarios para el servicio", "Dueños ven contactos del profesional tras confirmación"] },
            { label: "Proveedores Técnicos", items: ["Procesadores de pago (Stripe)", "Servicios de hosting (cloud)", "Servicios de email transaccional"] },
            { label: "Autoridades Legales", items: ["Solo por orden judicial", "Será notificado cuando sea legalmente posible"] },
          ],
          highlight: "Todos los terceros están obligados contractualmente a proteger sus datos según el RGPD.",
        },
        {
          icon: ShieldCheck,
          title: "Sus Derechos (RGPD)",
          blocks: [
            { label: "Derecho de Acceso", items: ["Solicitar copia de todos los datos que tenemos sobre usted"] },
            { label: "Derecho de Rectificación", items: ["Corregir datos incorrectos o desactualizados en cualquier momento"] },
            { label: "Derecho al Olvido", items: ["Eliminar completamente su cuenta y datos asociados", "Procesamos solicitudes en hasta 30 días"] },
            { label: "Derecho a la Portabilidad", items: ["Recibir datos en formato estructurado y legible por máquina"] },
            { label: "Derecho de Oposición", items: ["Oponerse al tratamiento para fines específicos"] },
            { label: "Derecho de Limitación", items: ["Solicitar limitación del tratamiento en ciertas circunstancias"] },
          ],
          highlight: "Para ejercer estos derechos: support@pawcao.net o opciones en Configuración de Cuenta.",
        },
        {
          icon: Lock,
          title: "Seguridad de los Datos",
          blocks: [
            { label: "Medidas Técnicas", items: ["Encriptación SSL/TLS en todas las comunicaciones", "Encriptación de datos sensibles en reposo", "Autenticación segura con hash de contraseñas", "Copias de seguridad encriptadas"] },
            { label: "Medidas Organizativas", items: ["Monitorización continua de accesos", "Acceso restringido (mínimo privilegio)", "Auditorías de seguridad regulares"] },
          ],
        },
        {
          icon: Clock,
          title: "Retención de Datos",
          blocks: [
            { label: "Cuenta Activa", items: ["Datos mantenidos mientras la cuenta esté activa"] },
            { label: "Tras Eliminación", items: ["Datos personales: eliminados en 30 días", "Datos financieros: mantenidos 7 años (obligación fiscal)", "Datos de litigio: mantenidos hasta resolución"] },
            { label: "Ubicación", items: ["PawCão no recopila ni almacena ubicación", "Compartición directa vía WhatsApp"] },
          ],
        },
        {
          icon: Cookie,
          title: "Cookies",
          blocks: [
            { label: "Estrictamente Necesarias", items: ["Autenticación y sesión de login", "Preferencias de idioma", "Seguridad (protección CSRF)"] },
            { label: "Funcionales (con consentimiento)", items: ["Recordar preferencias de búsqueda", "Mejorar experiencia de navegación"] },
          ],
          highlight: "NO utilizamos cookies de seguimiento publicitario ni cookies de terceros para marketing.",
        },
        {
          icon: Globe,
          title: "Transferencias Internacionales",
          blocks: [
            { label: "Procesamiento en la UE", items: ["Sus datos se procesan principalmente en la Unión Europea"] },
            { label: "Fuera de la UE (cuando necesario)", items: ["Cláusulas contractuales estándar de la UE", "Certificación de adecuación del país de destino", "Medidas de seguridad adicionales"] },
          ],
        },
        {
          icon: Baby,
          title: "Menores de Edad",
          blocks: [
            { label: "Edad Mínima", items: ["PawCão no está destinado a menores de 18 años", "No recopilamos intencionalmente datos de menores", "Datos de menores se eliminarán inmediatamente"] },
          ],
        },
        {
          icon: Bell,
          title: "Cambios en esta Política",
          blocks: [
            { label: "Notificación de Cambios", items: ["Email a usuarios registrados", "Aviso destacado en la plataforma", "Actualización de la fecha de revisión"] },
          ],
        },
        {
          icon: Mail,
          title: "Contacto y DPO",
          blocks: [
            { label: "Contacto Directo", items: ["support@pawcao.net"] },
            { label: "Autoridades de Control", items: ["Portugal: CNPD — www.cnpd.pt", "España: AEPD — www.aepd.es", "Francia: CNIL — www.cnil.fr"] },
          ],
        },
      ],
      commitmentTitle: "Nuestro compromiso con su privacidad",
      commitmentText:
        "PawCão trata la privacidad de sus datos con la máxima seriedad. Si tiene alguna duda o preocupación, no dude en contactarnos.",
      langLabel: "Idioma",
    },
    fr: {
      title: "Politique de Confidentialité",
      subtitle: "Comment nous collectons, utilisons et protégeons vos données",
      lastUpdated: "Dernière mise à jour : 20 Juillet 2026",
      intro:
        "PawCão s'engage à protéger vos données personnelles. Cette politique explique clairement comment nous traitons vos informations, en pleine conformité avec le RGPD de l'Union Européenne.",
      badge: "Conforme RGPD",
      sections: [
        {
          icon: Eye,
          title: "Données Collectées",
          blocks: [
            { label: "Données d'Identité", items: ["Nom complet", "Adresse Email", "Numéro de téléphone", "Photo de profil (optionnel)", "Pièce d'identité (professionnels)"] },
            { label: "Données de l'Animal", items: ["Nom, race, âge et poids", "Photos", "Historique de santé et vaccination", "Comportement et besoins spéciaux"] },
            { label: "Coordination de Localisation", items: ["PawCão NE collecte NI ne stocke la localisation en temps réel", "Partage direct entre propriétaire et professionnel via WhatsApp", "Aucun accès ni responsabilité sur ce partage"] },
            { label: "Données de Paiement", items: ["Traitées de manière cryptée (Stripe)", "Nous ne stockons pas les données complètes de carte", "Seuls les 4 derniers chiffres pour identification"] },
          ],
        },
        {
          icon: Database,
          title: "Finalité du Traitement",
          blocks: [
            { label: "Exécution du Service", items: ["Créer et gérer votre compte", "Connecter propriétaires et professionnels", "Traiter les paiements sécurité", "Notifications sur réservations et services"] },
            { label: "Sécurité de la Plateforme", items: ["Vérifier l'identité des professionnels", "Prévenir fraudes et abus", "Résoudre les litiges entre utilisateurs"] },
            { label: "Communication", items: ["Répondre aux questions de support", "Mises à jour importantes du service", "Newsletter (uniquement avec consentement)"] },
          ],
          highlight: "Nous NE vendons, louons ou partageons PAS vos données avec des tiers à des fins publicitaires ou marketing.",
        },
        {
          icon: Users,
          title: "Partage des Données",
          blocks: [
            { label: "Autres Utilisateurs", items: ["Les professionnels voient les données nécessaires au service", "Les propriétaires voient les contacts du professionnel après confirmation"] },
            { label: "Prestataires Techniques", items: ["Processeurs de paiement (Stripe)", "Services d'hébergement (cloud)", "Services d'email transactionnel"] },
            { label: "Autorités Légales", items: ["Uniquement par ordonnance du tribunal", "Vous serez notifié lorsque légalement possible"] },
          ],
          highlight: "Tous les tiers sont obligés contractuellement de protéger vos données selon le RGPD.",
        },
        {
          icon: ShieldCheck,
          title: "Vos Droits (RGPD)",
          blocks: [
            { label: "Droit d'Accès", items: ["Demander une copie de toutes les données que nous détenons sur vous"] },
            { label: "Droit de Rectification", items: ["Corriger les données incorrectes ou obsolètes à tout moment"] },
            { label: "Droit à l'Oubli", items: ["Supprimer complètement votre compte et données associées", "Demandes traitées sous 30 jours"] },
            { label: "Droit à la Portabilité", items: ["Recevoir vos données dans un format structuré et lisible par machine"] },
            { label: "Droit d'Opposition", items: ["S'opposer au traitement à des fins spécifiques"] },
            { label: "Droit à la Limitation", items: ["Demander la limitation du traitement dans certaines circonstances"] },
          ],
          highlight: "Pour exercer ces droits : support@pawcao.net ou options dans les Paramètres du Compte.",
        },
        {
          icon: Lock,
          title: "Sécurité des Données",
          blocks: [
            { label: "Mesures Techniques", items: ["Cryptage SSL/TLS sur toutes les communications", "Cryptage des données sensibles au repos", "Authentification sécurisée avec hachage des mots de passe", "Sauvegardes régulières cryptées"] },
            { label: "Mesures Organisationnelles", items: ["Surveillance continue des accès", "Accès restreint (moindre privilège)", "Audits de sécurité réguliers"] },
          ],
        },
        {
          icon: Clock,
          title: "Conservation des Données",
          blocks: [
            { label: "Compte Actif", items: ["Données conservées tant que le compte est actif"] },
            { label: "Après Suppression", items: ["Données personnelles : supprimées sous 30 jours", "Données financières : conservées 7 ans (obligation fiscale)", "Données de litige : conservées jusqu'à résolution"] },
            { label: "Localisation", items: ["PawCão ne collecte ni ne stocke la localisation", "Partage direct via WhatsApp"] },
          ],
        },
        {
          icon: Cookie,
          title: "Cookies",
          blocks: [
            { label: "Strictement Nécessaires", items: ["Authentification et session de connexion", "Préférences de langue", "Sécurité (protection CSRF)"] },
            { label: "Fonctionnels (avec consentement)", items: ["Mémoriser les préférences de recherche", "Améliorer l'expérience de navigation"] },
          ],
          highlight: "Nous N'utilisons PAS de cookies de suivi publicitaire ni de cookies tiers pour le marketing.",
        },
        {
          icon: Globe,
          title: "Transferts Internationaux",
          blocks: [
            { label: "Traitement dans l'UE", items: ["Vos données sont traitées principalement dans l'Union Européenne"] },
            { label: "Hors UE (si nécessaire)", items: ["Clauses contractuelles standard de l'UE", "Certification d'adéquation du pays de destination", "Mesures de sécurité supplémentaires"] },
          ],
        },
        {
          icon: Baby,
          title: "Mineurs",
          blocks: [
            { label: "Âge Minimum", items: ["PawCão n'est pas destiné aux moins de 18 ans", "Nous ne collectons pas sciemment de données de mineurs", "Les données de mineurs seront supprimées immédiatement"] },
          ],
        },
        {
          icon: Bell,
          title: "Modifications de cette Politique",
          blocks: [
            { label: "Notification des Changements", items: ["Email aux utilisateurs enregistrés", "Avis visible sur la plateforme", "Mise à jour de la date de révision"] },
          ],
        },
        {
          icon: Mail,
          title: "Contact et DPO",
          blocks: [
            { label: "Contact Direct", items: ["support@pawcao.net"] },
            { label: "Autorités de Contrôle", items: ["Portugal : CNPD — www.cnpd.pt", "Espagne : AEPD — www.aepd.es", "France : CNIL — www.cnil.fr"] },
          ],
        },
      ],
      commitmentTitle: "Notre engagement envers votre confidentialité",
      commitmentText:
        "PawCão traite la confidentialité de vos données avec le plus grand sérieux. Si vous avez des questions ou des préoccupations, n'hésitez pas à nous contacter.",
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
                    <div className="ml-0 md:ml-[3.75rem] space-y-5 pt-1">
                      {section.blocks.map((block, bi) => (
                        <div key={bi}>
                          <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                            <span className="w-1 h-4 rounded-full bg-[#0d9483]" />
                            {block.label}
                          </h3>
                          <ul className="space-y-1.5 ml-3">
                            {block.items.map((item, ii) => (
                              <li
                                key={ii}
                                className="flex items-start gap-2 text-sm text-slate-600"
                              >
                                <Check className="w-4 h-4 text-[#0d9483] mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {section.highlight && (
                        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
                          <Scale className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-amber-800 font-medium">
                            {section.highlight}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Commitment card */}
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