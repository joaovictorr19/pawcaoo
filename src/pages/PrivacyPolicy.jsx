import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Trash2, Cookie, Globe } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PrivacyPolicy() {
  const { language, setLanguage } = useLanguage();

  const content = {
    pt: {
      title: "Política de Privacidade",
      lastUpdated: "Última atualização: 20 de Julho de 2026",
      selectLanguage: "Selecionar idioma",
      intro: "A PawCão está comprometida com a proteção dos seus dados pessoais. Esta Política de Privacidade explica como recolhemos, utilizamos e protegemos as suas informações, em total conformidade com o Regulamento Geral de Proteção de Dados (RGPD) da União Europeia.",
      sections: [
        {
          title: "1. Dados que Recolhemos",
          icon: Eye,
          content: "**Dados de Identidade:**\n• Nome completo\n• Endereço de email\n• Número de telefone\n• Fotografia de perfil (opcional)\n• Documento de identificação (apenas para profissionais)\n\n**Dados do Animal:**\n• Nome, raça, idade e peso\n• Fotografias\n• Histórico de saúde e vacinação\n• Comportamento e necessidades especiais\n\n**Coordenação de Localização:**\n• A PawCão NÃO recolhe nem armazena a localização em tempo real\n• A partilha de localização durante o serviço é feita diretamente entre dono e profissional via WhatsApp\n• A PawCão não tem acesso nem responsabilidade sobre essa partilha\n\n**Dados de Pagamento:**\n• Processados de forma encriptada através de parceiros certificados (Stripe)\n• A PawCão NÃO armazena dados completos de cartão de crédito\n• Apenas últimos 4 dígitos para identificação"
        },
        {
          title: "2. Finalidade do Tratamento",
          icon: Shield,
          content: "Os seus dados são utilizados exclusivamente para:\n\n**Execução do Serviço:**\n• Criar e gerir a sua conta\n• Conectar donos de animais com profissionais\n• Processar pagamentos de forma segura\n• Enviar notificações sobre reservas e serviços\n\n**Segurança da Plataforma:**\n• Verificar identidade de profissionais\n• Prevenir fraudes e abusos\n• Resolver disputas entre utilizadores\n\n**Comunicação:**\n• Responder a questões de suporte\n• Enviar atualizações importantes sobre o serviço\n• Newsletter (apenas com consentimento explícito)\n\n**IMPORTANTE:** NÃO vendemos, alugamos ou partilhamos os seus dados pessoais com terceiros para fins publicitários ou de marketing."
        },
        {
          title: "3. Partilha de Dados",
          icon: Lock,
          content: "Os seus dados podem ser partilhados apenas com:\n\n**Outros Utilizadores da Plataforma:**\n• Profissionais veem dados necessários para prestar o serviço\n• Donos veem dados de contacto do profissional após confirmação\n\n**Prestadores de Serviços Técnicos:**\n• Processadores de pagamento (Stripe)\n• Serviços de hosting (infraestrutura cloud)\n• Serviços de email transacional\n\n**Autoridades Legais:**\n• Apenas quando legalmente obrigados por ordem judicial\n• Será notificado sempre que legalmente possível\n\nTodos os terceiros são obrigados contratualmente a proteger os seus dados conforme o RGPD."
        },
        {
          title: "4. Os Seus Direitos (RGPD)",
          icon: Shield,
          content: "Enquanto titular dos dados, tem os seguintes direitos:\n\n**Direito de Acesso:**\nPode solicitar uma cópia de todos os dados que temos sobre si.\n\n**Direito de Retificação:**\nPode corrigir dados incorretos ou desatualizados a qualquer momento.\n\n**Direito ao Esquecimento (Apagar):**\nPode solicitar a eliminação completa da sua conta e todos os dados associados. Processamos pedidos em até 30 dias.\n\n**Direito à Portabilidade:**\nPode solicitar os seus dados num formato estruturado e legível por máquina.\n\n**Direito de Oposição:**\nPode opor-se ao tratamento dos seus dados para fins específicos.\n\n**Direito de Limitação:**\nPode solicitar a limitação do tratamento em determinadas circunstâncias.\n\n**Para exercer estes direitos:** Contacte support@pawcao.net ou utilize as opções em Definições da Conta."
        },
        {
          title: "5. Segurança dos Dados",
          icon: Lock,
          content: "Implementamos medidas técnicas e organizacionais robustas:\n\n• Encriptação SSL/TLS em todas as comunicações\n• Encriptação de dados sensíveis em repouso\n• Autenticação segura com hash de passwords\n• Monitorização contínua de acessos\n• Backups regulares com encriptação\n• Acesso restrito a dados pessoais (princípio do mínimo privilégio)\n• Auditorias de segurança regulares"
        },
        {
          title: "6. Retenção de Dados",
          icon: Trash2,
          content: "Mantemos os seus dados apenas pelo tempo necessário:\n\n**Conta Ativa:**\nDados mantidos enquanto a conta estiver ativa.\n\n**Após Eliminação de Conta:**\n• Dados pessoais: eliminados em 30 dias\n• Dados financeiros: mantidos 7 anos (obrigação legal fiscal)\n• Dados de litígio: mantidos até resolução\n\n**Coordenação de Localização:**\n• A PawCão não recolhe nem armazena localização\n• A partilha de localização é feita diretamente entre dono e profissional via WhatsApp"
        },
        {
          title: "7. Cookies",
          icon: Cookie,
          content: "Utilizamos cookies de forma limitada:\n\n**Estritamente Necessários:**\n• Autenticação e sessão de login\n• Preferências de idioma\n• Segurança (CSRF protection)\n\n**Funcionais (com consentimento):**\n• Lembrar preferências de pesquisa\n• Melhorar experiência de navegação\n\n**NÃO utilizamos:**\n• Cookies de rastreamento publicitário\n• Cookies de terceiros para marketing\n\nPode gerir as suas preferências de cookies nas definições do browser."
        },
        {
          title: "8. Transferências Internacionais",
          icon: Globe,
          content: "Os seus dados são processados principalmente na União Europeia. Quando transferências para fora da UE são necessárias (ex: serviços cloud), garantimos:\n\n• Cláusulas contratuais padrão da UE\n• Certificação de adequação do país de destino\n• Medidas de segurança adicionais conforme necessário"
        },
        {
          title: "9. Menores de Idade",
          icon: Shield,
          content: "A PawCão não se destina a menores de 18 anos. Não recolhemos intencionalmente dados de menores. Se descobrirmos que recolhemos dados de um menor, eliminaremos imediatamente essa informação."
        },
        {
          title: "10. Alterações a esta Política",
          icon: Eye,
          content: "Podemos atualizar esta política periodicamente. Notificaremos sobre alterações significativas através de:\n\n• Email para utilizadores registados\n• Aviso destacado na plataforma\n• Atualização da data de revisão\n\nRecomendamos a revisão periódica desta política."
        },
        {
          title: "11. Contacto e DPO",
          icon: Shield,
          content: "Para questões sobre privacidade ou exercício dos seus direitos:\n\n**Email:** support@pawcao.net\n\n**Autoridade de Controlo:**\nTem o direito de apresentar reclamação à autoridade de proteção de dados do seu país:\n• Portugal: CNPD (www.cnpd.pt)\n• Espanha: AEPD (www.aepd.es)\n• França: CNIL (www.cnil.fr)"
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: July 20, 2026",
      selectLanguage: "Select language",
      intro: "PawCão is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and protect your information, in full compliance with the European Union's General Data Protection Regulation (GDPR).",
      sections: [
        {
          title: "1. Data We Collect",
          icon: Eye,
          content: "**Identity Data:**\n• Full name\n• Email address\n• Phone number\n• Profile photo (optional)\n• Identification document (professionals only)\n\n**Pet Data:**\n• Name, breed, age, and weight\n• Photos\n• Health and vaccination history\n• Behavior and special needs\n\n**Location Coordination:**\n• PawCão does NOT collect or store real-time location\n• Location sharing during the service is done directly between owner and professional via WhatsApp\n• PawCão has no access or responsibility over that sharing\n\n**Payment Data:**\n• Processed encrypted through certified partners (Stripe)\n• PawCão does NOT store complete credit card data\n• Only last 4 digits for identification"
        },
        {
          title: "2. Purpose of Processing",
          icon: Shield,
          content: "Your data is used exclusively for:\n\n**Service Execution:**\n• Create and manage your account\n• Connect pet owners with professionals\n• Process payments securely\n• Send notifications about bookings and services\n\n**Platform Security:**\n• Verify professional identity\n• Prevent fraud and abuse\n• Resolve disputes between users\n\n**Communication:**\n• Respond to support questions\n• Send important service updates\n• Newsletter (only with explicit consent)\n\n**IMPORTANT:** We do NOT sell, rent, or share your personal data with third parties for advertising or marketing purposes."
        },
        {
          title: "3. Data Sharing",
          icon: Lock,
          content: "Your data may only be shared with:\n\n**Other Platform Users:**\n• Professionals see data necessary to provide the service\n• Owners see professional's contact data after confirmation\n\n**Technical Service Providers:**\n• Payment processors (Stripe)\n• Hosting services (cloud infrastructure)\n• Transactional email services\n\n**Legal Authorities:**\n• Only when legally required by court order\n• You will be notified whenever legally possible\n\nAll third parties are contractually obligated to protect your data according to GDPR."
        },
        {
          title: "4. Your Rights (GDPR)",
          icon: Shield,
          content: "As a data subject, you have the following rights:\n\n**Right of Access:**\nYou can request a copy of all data we have about you.\n\n**Right to Rectification:**\nYou can correct incorrect or outdated data at any time.\n\n**Right to Erasure (Right to be Forgotten):**\nYou can request complete deletion of your account and all associated data. We process requests within 30 days.\n\n**Right to Portability:**\nYou can request your data in a structured, machine-readable format.\n\n**Right to Object:**\nYou can object to processing of your data for specific purposes.\n\n**Right to Restriction:**\nYou can request processing limitation in certain circumstances.\n\n**To exercise these rights:** Contact support@pawcao.net or use options in Account Settings."
        },
        {
          title: "5. Data Security",
          icon: Lock,
          content: "We implement robust technical and organizational measures:\n\n• SSL/TLS encryption on all communications\n• Encryption of sensitive data at rest\n• Secure authentication with password hashing\n• Continuous access monitoring\n• Regular encrypted backups\n• Restricted access to personal data (least privilege principle)\n• Regular security audits"
        },
        {
          title: "6. Data Retention",
          icon: Trash2,
          content: "We keep your data only as long as necessary:\n\n**Active Account:**\nData maintained while the account is active.\n\n**After Account Deletion:**\n• Personal data: deleted within 30 days\n• Financial data: kept 7 years (legal tax obligation)\n• Litigation data: kept until resolution\n\n**Location Coordination:**\n• PawCão does not collect or store location\n• Location sharing is done directly between owner and professional via WhatsApp"
        },
        {
          title: "7. Cookies",
          icon: Cookie,
          content: "We use cookies in a limited way:\n\n**Strictly Necessary:**\n• Authentication and login session\n• Language preferences\n• Security (CSRF protection)\n\n**Functional (with consent):**\n• Remember search preferences\n• Improve browsing experience\n\n**We do NOT use:**\n• Advertising tracking cookies\n• Third-party marketing cookies\n\nYou can manage your cookie preferences in browser settings."
        },
        {
          title: "8. International Transfers",
          icon: Globe,
          content: "Your data is processed mainly in the European Union. When transfers outside the EU are necessary (e.g., cloud services), we ensure:\n\n• EU standard contractual clauses\n• Adequacy certification of destination country\n• Additional security measures as needed"
        },
        {
          title: "9. Minors",
          icon: Shield,
          content: "PawCão is not intended for minors under 18. We do not knowingly collect data from minors. If we discover we have collected data from a minor, we will immediately delete that information."
        },
        {
          title: "10. Changes to this Policy",
          icon: Eye,
          content: "We may update this policy periodically. We will notify about significant changes through:\n\n• Email to registered users\n• Prominent notice on the platform\n• Update of the revision date\n\nWe recommend periodic review of this policy."
        },
        {
          title: "11. Contact and DPO",
          icon: Shield,
          content: "For privacy questions or to exercise your rights:\n\n**Email:** support@pawcao.net\n\n**Supervisory Authority:**\nYou have the right to file a complaint with your country's data protection authority:\n• Portugal: CNPD (www.cnpd.pt)\n• Spain: AEPD (www.aepd.es)\n• France: CNIL (www.cnil.fr)"
        }
      ]
    },
    es: {
      title: "Política de Privacidad",
      lastUpdated: "Última actualización: 20 de Julio de 2026",
      selectLanguage: "Seleccionar idioma",
      intro: "PawCão está comprometido con la protección de sus datos personales. Esta Política de Privacidad explica cómo recopilamos, utilizamos y protegemos su información, en total conformidad con el Reglamento General de Protección de Datos (RGPD) de la Unión Europea.",
      sections: [
        {
          title: "1. Datos que Recopilamos",
          icon: Eye,
          content: "**Datos de Identidad:**\n• Nombre completo\n• Dirección de email\n• Número de teléfono\n• Fotografía de perfil (opcional)\n• Documento de identificación (solo profesionales)\n\n**Datos del Animal:**\n• Nombre, raza, edad y peso\n• Fotografías\n• Historial de salud y vacunación\n• Comportamiento y necesidades especiales\n\n**Coordinación de Ubicación:**\n• PawCão NO recopila ni almacena la ubicación en tiempo real\n• La compartición de ubicación durante el servicio se hace directamente entre dueño y profesional vía WhatsApp\n• PawCão no tiene acceso ni responsabilidad sobre esa compartición\n\n**Datos de Pago:**\n• Procesados de forma encriptada a través de socios certificados (Stripe)\n• PawCão NO almacena datos completos de tarjeta de crédito\n• Solo últimos 4 dígitos para identificación"
        },
        {
          title: "2. Finalidad del Tratamiento",
          icon: Shield,
          content: "Sus datos se utilizan exclusivamente para:\n\n**Ejecución del Servicio:**\n• Crear y gestionar su cuenta\n• Conectar dueños de mascotas con profesionales\n• Procesar pagos de forma segura\n• Enviar notificaciones sobre reservas y servicios\n\n**Seguridad de la Plataforma:**\n• Verificar identidad de profesionales\n• Prevenir fraudes y abusos\n• Resolver disputas entre usuarios\n\n**Comunicación:**\n• Responder a preguntas de soporte\n• Enviar actualizaciones importantes sobre el servicio\n• Newsletter (solo con consentimiento explícito)\n\n**IMPORTANTE:** NO vendemos, alquilamos ni compartimos sus datos personales con terceros para fines publicitarios o de marketing."
        },
        {
          title: "3. Compartición de Datos",
          icon: Lock,
          content: "Sus datos pueden compartirse solo con:\n\n**Otros Usuarios de la Plataforma:**\n• Los profesionales ven datos necesarios para prestar el servicio\n• Los dueños ven datos de contacto del profesional tras confirmación\n\n**Proveedores de Servicios Técnicos:**\n• Procesadores de pago (Stripe)\n• Servicios de hosting (infraestructura cloud)\n• Servicios de email transaccional\n\n**Autoridades Legales:**\n• Solo cuando legalmente requerido por orden judicial\n• Será notificado siempre que sea legalmente posible\n\nTodos los terceros están obligados contractualmente a proteger sus datos según el RGPD."
        },
        {
          title: "4. Sus Derechos (RGPD)",
          icon: Shield,
          content: "Como titular de los datos, tiene los siguientes derechos:\n\n**Derecho de Acceso:**\nPuede solicitar una copia de todos los datos que tenemos sobre usted.\n\n**Derecho de Rectificación:**\nPuede corregir datos incorrectos o desactualizados en cualquier momento.\n\n**Derecho al Olvido (Supresión):**\nPuede solicitar la eliminación completa de su cuenta y todos los datos asociados. Procesamos solicitudes en hasta 30 días.\n\n**Derecho a la Portabilidad:**\nPuede solicitar sus datos en un formato estructurado y legible por máquina.\n\n**Derecho de Oposición:**\nPuede oponerse al tratamiento de sus datos para fines específicos.\n\n**Derecho de Limitación:**\nPuede solicitar la limitación del tratamiento en determinadas circunstancias.\n\n**Para ejercer estos derechos:** Contacte support@pawcao.net o utilice las opciones en Configuración de Cuenta."
        },
        {
          title: "5. Seguridad de los Datos",
          icon: Lock,
          content: "Implementamos medidas técnicas y organizativas robustas:\n\n• Encriptación SSL/TLS en todas las comunicaciones\n• Encriptación de datos sensibles en reposo\n• Autenticación segura con hash de contraseñas\n• Monitorización continua de accesos\n• Copias de seguridad regulares encriptadas\n• Acceso restringido a datos personales (principio de mínimo privilegio)\n• Auditorías de seguridad regulares"
        },
        {
          title: "6. Retención de Datos",
          icon: Trash2,
          content: "Mantenemos sus datos solo el tiempo necesario:\n\n**Cuenta Activa:**\nDatos mantenidos mientras la cuenta esté activa.\n\n**Después de Eliminación de Cuenta:**\n• Datos personales: eliminados en 30 días\n• Datos financieros: mantenidos 7 años (obligación legal fiscal)\n• Datos de litigio: mantenidos hasta resolución\n\n**Coordinación de Ubicación:**\n• PawCão no recopila ni almacena ubicación\n• La compartición de ubicación se hace directamente entre dueño y profesional vía WhatsApp"
        },
        {
          title: "7. Cookies",
          icon: Cookie,
          content: "Utilizamos cookies de forma limitada:\n\n**Estrictamente Necesarias:**\n• Autenticación y sesión de login\n• Preferencias de idioma\n• Seguridad (protección CSRF)\n\n**Funcionales (con consentimiento):**\n• Recordar preferencias de búsqueda\n• Mejorar experiencia de navegación\n\n**NO utilizamos:**\n• Cookies de seguimiento publicitario\n• Cookies de terceros para marketing\n\nPuede gestionar sus preferencias de cookies en la configuración del navegador."
        },
        {
          title: "8. Transferencias Internacionales",
          icon: Globe,
          content: "Sus datos se procesan principalmente en la Unión Europea. Cuando son necesarias transferencias fuera de la UE (ej: servicios cloud), garantizamos:\n\n• Cláusulas contractuales estándar de la UE\n• Certificación de adecuación del país de destino\n• Medidas de seguridad adicionales según sea necesario"
        },
        {
          title: "9. Menores de Edad",
          icon: Shield,
          content: "PawCão no está destinado a menores de 18 años. No recopilamos intencionalmente datos de menores. Si descubrimos que hemos recopilado datos de un menor, eliminaremos inmediatamente esa información."
        },
        {
          title: "10. Cambios en esta Política",
          icon: Eye,
          content: "Podemos actualizar esta política periódicamente. Notificaremos sobre cambios significativos a través de:\n\n• Email a usuarios registrados\n• Aviso destacado en la plataforma\n• Actualización de la fecha de revisión\n\nRecomendamos la revisión periódica de esta política."
        },
        {
          title: "11. Contacto y DPO",
          icon: Shield,
          content: "Para preguntas sobre privacidad o ejercicio de sus derechos:\n\n**Email:** support@pawcao.net\n\n**Autoridad de Control:**\nTiene derecho a presentar una reclamación ante la autoridad de protección de datos de su país:\n• Portugal: CNPD (www.cnpd.pt)\n• España: AEPD (www.aepd.es)\n• Francia: CNIL (www.cnil.fr)"
        }
      ]
    },
    fr: {
      title: "Politique de Confidentialité",
      lastUpdated: "Dernière mise à jour : 20 Juillet 2026",
      selectLanguage: "Sélectionner la langue",
      intro: "PawCão s'engage à protéger vos données personnelles. Cette Politique de Confidentialité explique comment nous collectons, utilisons et protégeons vos informations, en pleine conformité avec le Règlement Général sur la Protection des Données (RGPD) de l'Union Européenne.",
      sections: [
        {
          title: "1. Données que Nous Collectons",
          icon: Eye,
          content: "**Données d'Identité :**\n• Nom complet\n• Adresse email\n• Numéro de téléphone\n• Photo de profil (optionnel)\n• Document d'identité (professionnels uniquement)\n\n**Données de l'Animal :**\n• Nom, race, âge et poids\n• Photos\n• Historique de santé et vaccination\n• Comportement et besoins spéciaux\n\n**Coordination de Localisation :**\n• PawCão NE collecte NI ne stocke la localisation en temps réel\n• Le partage de localisation pendant le service se fait directement entre propriétaire et professionnel via WhatsApp\n• PawCão n'a aucun accès ni responsabilité sur ce partage\n\n**Données de Paiement :**\n• Traitées de manière cryptée via des partenaires certifiés (Stripe)\n• PawCão NE stocke PAS les données complètes de carte de crédit\n• Uniquement les 4 derniers chiffres pour identification"
        },
        {
          title: "2. Finalité du Traitement",
          icon: Shield,
          content: "Vos données sont utilisées exclusivement pour :\n\n**Exécution du Service :**\n• Créer et gérer votre compte\n• Connecter propriétaires d'animaux et professionnels\n• Traiter les paiements de manière sécurisée\n• Envoyer des notifications sur les réservations et services\n\n**Sécurité de la Plateforme :**\n• Vérifier l'identité des professionnels\n• Prévenir les fraudes et abus\n• Résoudre les litiges entre utilisateurs\n\n**Communication :**\n• Répondre aux questions de support\n• Envoyer des mises à jour importantes sur le service\n• Newsletter (uniquement avec consentement explicite)\n\n**IMPORTANT :** Nous NE vendons, louons ou partageons PAS vos données personnelles avec des tiers à des fins publicitaires ou marketing."
        },
        {
          title: "3. Partage des Données",
          icon: Lock,
          content: "Vos données ne peuvent être partagées qu'avec :\n\n**Autres Utilisateurs de la Plateforme :**\n• Les professionnels voient les données nécessaires pour fournir le service\n• Les propriétaires voient les données de contact du professionnel après confirmation\n\n**Prestataires de Services Techniques :**\n• Processeurs de paiement (Stripe)\n• Services d'hébergement (infrastructure cloud)\n• Services d'email transactionnel\n\n**Autorités Légales :**\n• Uniquement lorsque légalement requis par ordonnance du tribunal\n• Vous serez notifié chaque fois que légalement possible\n\nTous les tiers sont contractuellement obligés de protéger vos données conformément au RGPD."
        },
        {
          title: "4. Vos Droits (RGPD)",
          icon: Shield,
          content: "En tant que personne concernée, vous avez les droits suivants :\n\n**Droit d'Accès :**\nVous pouvez demander une copie de toutes les données que nous avons sur vous.\n\n**Droit de Rectification :**\nVous pouvez corriger les données incorrectes ou obsolètes à tout moment.\n\n**Droit à l'Effacement (Droit à l'Oubli) :**\nVous pouvez demander la suppression complète de votre compte et de toutes les données associées. Nous traitons les demandes sous 30 jours.\n\n**Droit à la Portabilité :**\nVous pouvez demander vos données dans un format structuré et lisible par machine.\n\n**Droit d'Opposition :**\nVous pouvez vous opposer au traitement de vos données à des fins spécifiques.\n\n**Droit à la Limitation :**\nVous pouvez demander la limitation du traitement dans certaines circonstances.\n\n**Pour exercer ces droits :** Contactez support@pawcao.net ou utilisez les options dans les Paramètres du Compte."
        },
        {
          title: "5. Sécurité des Données",
          icon: Lock,
          content: "Nous mettons en œuvre des mesures techniques et organisationnelles robustes :\n\n• Cryptage SSL/TLS sur toutes les communications\n• Cryptage des données sensibles au repos\n• Authentification sécurisée avec hachage des mots de passe\n• Surveillance continue des accès\n• Sauvegardes régulières cryptées\n• Accès restreint aux données personnelles (principe du moindre privilège)\n• Audits de sécurité réguliers"
        },
        {
          title: "6. Conservation des Données",
          icon: Trash2,
          content: "Nous conservons vos données uniquement le temps nécessaire :\n\n**Compte Actif :**\nDonnées conservées tant que le compte est actif.\n\n**Après Suppression du Compte :**\n• Données personnelles : supprimées sous 30 jours\n• Données financières : conservées 7 ans (obligation légale fiscale)\n• Données de litige : conservées jusqu'à résolution\n\n**Coordination de Localisation :**\n• PawCão ne collecte ni ne stocke la localisation\n• Le partage de localisation se fait directement entre propriétaire et professionnel via WhatsApp"
        },
        {
          title: "7. Cookies",
          icon: Cookie,
          content: "Nous utilisons les cookies de manière limitée :\n\n**Strictement Nécessaires :**\n• Authentification et session de connexion\n• Préférences de langue\n• Sécurité (protection CSRF)\n\n**Fonctionnels (avec consentement) :**\n• Mémoriser les préférences de recherche\n• Améliorer l'expérience de navigation\n\n**Nous N'utilisons PAS :**\n• Cookies de suivi publicitaire\n• Cookies tiers pour le marketing\n\nVous pouvez gérer vos préférences de cookies dans les paramètres du navigateur."
        },
        {
          title: "8. Transferts Internationaux",
          icon: Globe,
          content: "Vos données sont traitées principalement dans l'Union Européenne. Lorsque des transferts hors UE sont nécessaires (ex : services cloud), nous garantissons :\n\n• Clauses contractuelles standard de l'UE\n• Certification d'adéquation du pays de destination\n• Mesures de sécurité supplémentaires si nécessaire"
        },
        {
          title: "9. Mineurs",
          icon: Shield,
          content: "PawCão n'est pas destiné aux mineurs de moins de 18 ans. Nous ne collectons pas sciemment de données de mineurs. Si nous découvrons que nous avons collecté des données d'un mineur, nous supprimerons immédiatement ces informations."
        },
        {
          title: "10. Modifications de cette Politique",
          icon: Eye,
          content: "Nous pouvons mettre à jour cette politique périodiquement. Nous informerons des changements significatifs par :\n\n• Email aux utilisateurs enregistrés\n• Avis visible sur la plateforme\n• Mise à jour de la date de révision\n\nNous recommandons une révision périodique de cette politique."
        },
        {
          title: "11. Contact et DPO",
          icon: Shield,
          content: "Pour les questions de confidentialité ou l'exercice de vos droits :\n\n**Email :** support@pawcao.net\n\n**Autorité de Contrôle :**\nVous avez le droit de déposer une plainte auprès de l'autorité de protection des données de votre pays :\n• Portugal : CNPD (www.cnpd.pt)\n• Espagne : AEPD (www.aepd.es)\n• France : CNIL (www.cnil.fr)"
        }
      ]
    }
  };

  const t = content[language] || content.pt;

  const languages = [
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Globe className="w-4 h-4" />
                {t.selectLanguage}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code} 
                  onClick={() => setLanguage(lang.code)}
                  className="cursor-pointer"
                >
                  {lang.flag} {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="border-0 shadow-2xl mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8" />
              <div>
                <CardTitle className="text-2xl md:text-3xl">{t.title}</CardTitle>
                <p className="text-white/90 text-sm mt-1">{t.lastUpdated}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {/* Introduction */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-8">
              <p className="text-blue-900 leading-relaxed">
                {t.intro}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {t.sections.map((section, index) => {
                const IconComponent = section.icon || Shield;
                return (
                  <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      {section.title}
                    </h2>
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed pl-13 ml-13 prose prose-sm max-w-none">
                      {section.content.split('\n').map((line, i) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <p key={i} className="font-bold text-gray-900 mt-4 mb-2">{line.replace(/\*\*/g, '')}</p>;
                        }
                        if (line.includes('**')) {
                          const parts = line.split(/\*\*(.*?)\*\*/g);
                          return (
                            <p key={i} className="mb-1">
                              {parts.map((part, j) => 
                                j % 2 === 1 ? <strong key={j} className="text-gray-900">{part}</strong> : part
                              )}
                            </p>
                          );
                        }
                        if (line.startsWith('•')) {
                          return <p key={i} className="mb-1 ml-4">{line}</p>;
                        }
                        if (line.trim() === '') {
                          return <br key={i} />;
                        }
                        return <p key={i} className="mb-2">{line}</p>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Final Note */}
            <div className="mt-8 bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                {language === 'pt' && 'O Seu Compromisso com a Privacidade'}
                {language === 'en' && 'Your Privacy Commitment'}
                {language === 'es' && 'Su Compromiso con la Privacidad'}
                {language === 'fr' && 'Votre Engagement de Confidentialité'}
              </h3>
              <p className="text-sm text-gray-700">
                {language === 'pt' && 'A PawCão trata a privacidade dos seus dados com a máxima seriedade. Se tiver qualquer dúvida ou preocupação, não hesite em contactar-nos.'}
                {language === 'en' && 'PawCão treats your data privacy with the utmost seriousness. If you have any questions or concerns, do not hesitate to contact us.'}
                {language === 'es' && 'PawCão trata la privacidad de sus datos con la máxima seriedad. Si tiene alguna duda o preocupación, no dude en contactarnos.'}
                {language === 'fr' && 'PawCão traite la confidentialité de vos données avec le plus grand sérieux. Si vous avez des questions ou des préoccupations, n\'hésitez pas à nous contacter.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}