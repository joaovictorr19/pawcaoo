import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CheckCircle, Shield } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function PrivacyPolicy() {
  const { language } = useLanguage();

  const content = {
    pt: {
      title: "Política de Privacidade",
      lastUpdated: "Última atualização: 3 de Novembro de 2025",
      intro: "A PawCão está comprometida em proteger a sua privacidade. Esta Política de Privacidade explica como recolhemos, usamos, divulgamos e protegemos as suas informações pessoais em conformidade com o Regulamento Geral de Proteção de Dados (RGPD).",
      sections: [
        {
          title: "1. Informações que Recolhemos",
          content: "**Informações de Conta:**\n• Nome completo\n• Endereço de email\n• Número de telefone\n• Morada\n• Fotografia de perfil\n\n**Informações de Pagamento:**\n• Detalhes de cartão de crédito/débito (processados via Stripe)\n• Histórico de transações\n• Informações bancárias (para profissionais)\n\n**Informações do Cão:**\n• Nome, raça, idade, tamanho\n• Informações médicas e comportamentais\n• Fotografias\n\n**Dados de Uso:**\n• Endereço IP\n• Tipo de navegador\n• Páginas visitadas\n• Localização GPS (durante passeios)\n• Cookies e tecnologias similares"
        },
        {
          title: "2. Como Usamos as Suas Informações",
          content: "Utilizamos os seus dados para:\n• Fornecer e melhorar os nossos serviços\n• Processar reservas e pagamentos\n• Facilitar comunicação entre utilizadores\n• Enviar notificações e atualizações\n• Prevenir fraude e garantir segurança\n• Cumprir obrigações legais\n• Análise e melhoria da plataforma\n• Marketing (com o seu consentimento)"
        },
        {
          title: "3. Partilha de Informações",
          content: "Partilhamos as suas informações apenas quando necessário:\n\n**Com Profissionais:** Nome, telefone, morada, informações do cão (para prestação do serviço)\n\n**Com Processadores de Pagamento:** Stripe, PayPal (para processar transações)\n\n**Com Autoridades:** Quando exigido por lei\n\n**Nunca vendemos** os seus dados pessoais a terceiros para fins de marketing."
        },
        {
          title: "4. Direitos RGPD",
          content: "Ao abrigo do RGPD, você tem direito a:\n\n✓ **Acesso:** Solicitar cópia dos seus dados\n✓ **Retificação:** Corrigir dados incorretos\n✓ **Apagamento:** Solicitar eliminação dos seus dados\n✓ **Portabilidade:** Receber dados em formato estruturado\n✓ **Oposição:** Opor-se ao processamento\n✓ **Restrição:** Limitar o processamento\n✓ **Retirar Consentimento:** A qualquer momento\n\nPara exercer estes direitos: privacy@pawcao.pt"
        },
        {
          title: "5. Segurança dos Dados",
          content: "Implementamos medidas de segurança rigorosas:\n• Encriptação SSL/TLS para transmissão de dados\n• Encriptação de dados sensíveis em repouso\n• Autenticação de dois fatores (disponível)\n• Acesso restrito aos dados pessoais\n• Auditorias de segurança regulares\n• Servidores em data centers certificados na UE"
        },
        {
          title: "6. Retenção de Dados",
          content: "Retemos os seus dados pelo tempo necessário:\n• **Dados de conta:** Enquanto a conta estiver ativa\n• **Dados de transação:** 7 anos (requisito legal)\n• **Dados de comunicação:** 2 anos\n• **Dados de marketing:** Até retirar consentimento\n\nApós eliminação da conta, anonimizamos ou eliminamos dados em 30 dias, exceto quando exigido por lei."
        },
        {
          title: "7. Cookies",
          content: "Usamos cookies para:\n• Funcionalidade essencial da plataforma\n• Análise de uso (Google Analytics)\n• Preferências de utilizador\n• Segurança e prevenção de fraude\n\nPode gerir preferências de cookies nas configurações do navegador. Ver Política de Cookies para detalhes."
        },
        {
          title: "8. Transferências Internacionais",
          content: "Os seus dados são armazenados principalmente em servidores na União Europeia. Quando transferimos dados para fora da UE, garantimos salvaguardas adequadas conforme RGPD (cláusulas contratuais padrão)."
        },
        {
          title: "9. Menores de Idade",
          content: "A PawCão não se destina a menores de 18 anos. Não recolhemos intencionalmente informações de menores. Se tomar conhecimento de que recolhemos dados de um menor, contacte-nos para remoção imediata."
        },
        {
          title: "10. Alterações a Esta Política",
          content: "Podemos atualizar esta política periodicamente. Notificaremos sobre alterações significativas por email ou através da plataforma. A data da última atualização está no topo desta página."
        },
        {
          title: "11. Contacto",
          content: "Para questões sobre privacidade:\n\n**Encarregado de Proteção de Dados:**\nEmail: dpo@pawcao.pt\nTelefone: +351 21 123 4567\nMorada: Rua Exemplo 123, 1000-000 Lisboa, Portugal\n\n**Autoridade de Supervisão:**\nCNPD - Comissão Nacional de Proteção de Dados\nwww.cnpd.pt"
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: November 3, 2025",
      intro: "PawCão is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your personal information in compliance with the General Data Protection Regulation (GDPR).",
      sections: [
        {
          title: "1. Information We Collect",
          content: "**Account Information:**\n• Full name\n• Email address\n• Phone number\n• Address\n• Profile photo\n\n**Payment Information:**\n• Credit/debit card details (processed via Stripe)\n• Transaction history\n• Bank information (for professionals)\n\n**Dog Information:**\n• Name, breed, age, size\n• Medical and behavioral information\n• Photos\n\n**Usage Data:**\n• IP address\n• Browser type\n• Pages visited\n• GPS location (during walks)\n• Cookies and similar technologies"
        },
        {
          title: "2. How We Use Your Information",
          content: "We use your data to:\n• Provide and improve our services\n• Process bookings and payments\n• Facilitate communication between users\n• Send notifications and updates\n• Prevent fraud and ensure security\n• Comply with legal obligations\n• Platform analysis and improvement\n• Marketing (with your consent)"
        },
        {
          title: "3. Information Sharing",
          content: "We share your information only when necessary:\n\n**With Professionals:** Name, phone, address, dog information (for service provision)\n\n**With Payment Processors:** Stripe, PayPal (to process transactions)\n\n**With Authorities:** When required by law\n\n**We never sell** your personal data to third parties for marketing purposes."
        },
        {
          title: "4. GDPR Rights",
          content: "Under GDPR, you have the right to:\n\n✓ **Access:** Request copy of your data\n✓ **Rectification:** Correct incorrect data\n✓ **Erasure:** Request deletion of your data\n✓ **Portability:** Receive data in structured format\n✓ **Object:** Object to processing\n✓ **Restriction:** Limit processing\n✓ **Withdraw Consent:** At any time\n\nTo exercise these rights: privacy@pawcao.pt"
        },
        {
          title: "5. Data Security",
          content: "We implement strict security measures:\n• SSL/TLS encryption for data transmission\n• Encryption of sensitive data at rest\n• Two-factor authentication (available)\n• Restricted access to personal data\n• Regular security audits\n• Servers in certified EU data centers"
        },
        {
          title: "6. Data Retention",
          content: "We retain your data as long as necessary:\n• **Account data:** While account is active\n• **Transaction data:** 7 years (legal requirement)\n• **Communication data:** 2 years\n• **Marketing data:** Until consent withdrawn\n\nAfter account deletion, we anonymize or delete data within 30 days, except when required by law."
        },
        {
          title: "7. Cookies",
          content: "We use cookies for:\n• Essential platform functionality\n• Usage analysis (Google Analytics)\n• User preferences\n• Security and fraud prevention\n\nYou can manage cookie preferences in browser settings. See Cookie Policy for details."
        },
        {
          title: "8. International Transfers",
          content: "Your data is primarily stored on servers in the European Union. When we transfer data outside the EU, we ensure adequate safeguards per GDPR (standard contractual clauses)."
        },
        {
          title: "9. Minors",
          content: "PawCão is not intended for individuals under 18. We do not intentionally collect information from minors. If you become aware we collected data from a minor, contact us for immediate removal."
        },
        {
          title: "10. Changes to This Policy",
          content: "We may update this policy periodically. We will notify about significant changes via email or platform. The last update date is at the top of this page."
        },
        {
          title: "11. Contact",
          content: "For privacy questions:\n\n**Data Protection Officer:**\nEmail: dpo@pawcao.pt\nPhone: +351 21 123 4567\nAddress: Rua Exemplo 123, 1000-000 Lisbon, Portugal\n\n**Supervisory Authority:**\nCNPD - Portuguese Data Protection Authority\nwww.cnpd.pt"
        }
      ]
    },
    es: {
      title: "Política de Privacidad",
      lastUpdated: "Última actualización: 3 de Noviembre de 2025",
      intro: "PawCão está comprometido en proteger su privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos su información personal conforme al Reglamento General de Protección de Datos (RGPD).",
      sections: [
        {
          title: "1. Información que Recopilamos",
          content: "**Información de Cuenta:**\n• Nombre completo\n• Dirección de correo electrónico\n• Número de teléfono\n• Dirección\n• Foto de perfil\n\n**Información de Pago:**\n• Detalles de tarjeta (procesados vía Stripe)\n• Historial de transacciones\n• Información bancaria (para profesionales)\n\n**Información del Perro:**\n• Nombre, raza, edad, tamaño\n• Información médica y comportamental\n• Fotografías\n\n**Datos de Uso:**\n• Dirección IP\n• Tipo de navegador\n• Páginas visitadas\n• Ubicación GPS (durante paseos)\n• Cookies y tecnologías similares"
        },
        {
          title: "2. Cómo Usamos Su Información",
          content: "Utilizamos sus datos para:\n• Proporcionar y mejorar nuestros servicios\n• Procesar reservas y pagos\n• Facilitar comunicación entre usuarios\n• Enviar notificaciones y actualizaciones\n• Prevenir fraude y garantizar seguridad\n• Cumplir obligaciones legales\n• Análisis y mejora de la plataforma\n• Marketing (con su consentimiento)"
        },
        {
          title: "3. Compartir Información",
          content: "Compartimos su información solo cuando sea necesario:\n\n**Con Profesionales:** Nombre, teléfono, dirección, información del perro (para servicio)\n\n**Con Procesadores de Pago:** Stripe, PayPal (para procesar transacciones)\n\n**Con Autoridades:** Cuando la ley lo requiera\n\n**Nunca vendemos** sus datos personales a terceros para fines de marketing."
        },
        {
          title: "4. Derechos RGPD",
          content: "Bajo el RGPD, tiene derecho a:\n\n✓ **Acceso:** Solicitar copia de sus datos\n✓ **Rectificación:** Corregir datos incorrectos\n✓ **Supresión:** Solicitar eliminación de datos\n✓ **Portabilidad:** Recibir datos en formato estructurado\n✓ **Oposición:** Oponerse al procesamiento\n✓ **Restricción:** Limitar el procesamiento\n✓ **Retirar Consentimiento:** En cualquier momento\n\nPara ejercer estos derechos: privacy@pawcao.pt"
        },
        {
          title: "5. Seguridad de Datos",
          content: "Implementamos medidas de seguridad estrictas:\n• Cifrado SSL/TLS para transmisión de datos\n• Cifrado de datos sensibles en reposo\n• Autenticación de dos factores (disponible)\n• Acceso restringido a datos personales\n• Auditorías de seguridad regulares\n• Servidores en centros de datos certificados UE"
        },
        {
          title: "6. Retención de Datos",
          content: "Retenemos sus datos el tiempo necesario:\n• **Datos de cuenta:** Mientras la cuenta esté activa\n• **Datos de transacción:** 7 años (requisito legal)\n• **Datos de comunicación:** 2 años\n• **Datos de marketing:** Hasta retirar consentimiento\n\nTras eliminar cuenta, anonimizamos o eliminamos datos en 30 días, excepto cuando la ley lo requiera."
        },
        {
          title: "7. Cookies",
          content: "Usamos cookies para:\n• Funcionalidad esencial de la plataforma\n• Análisis de uso (Google Analytics)\n• Preferencias de usuario\n• Seguridad y prevención de fraude\n\nPuede gestionar preferencias de cookies en configuración del navegador. Ver Política de Cookies para detalles."
        },
        {
          title: "8. Transferencias Internacionales",
          content: "Sus datos se almacenan principalmente en servidores en la Unión Europea. Cuando transferimos datos fuera de la UE, garantizamos salvaguardias adecuadas según RGPD (cláusulas contractuales estándar)."
        },
        {
          title: "9. Menores de Edad",
          content: "PawCão no está destinado a menores de 18 años. No recopilamos intencionalmente información de menores. Si tiene conocimiento de que recopilamos datos de un menor, contáctenos para eliminación inmediata."
        },
        {
          title: "10. Cambios a Esta Política",
          content: "Podemos actualizar esta política periódicamente. Notificaremos sobre cambios significativos por correo o plataforma. La fecha de última actualización está al inicio de esta página."
        },
        {
          title: "11. Contacto",
          content: "Para cuestiones de privacidad:\n\n**Oficial de Protección de Datos:**\nEmail: dpo@pawcao.pt\nTeléfono: +351 21 123 4567\nDirección: Rua Exemplo 123, 1000-000 Lisboa, Portugal\n\n**Autoridad de Supervisión:**\nCNPD - Comisión Nacional de Protección de Datos\nwww.cnpd.pt"
        }
      ]
    }
  };

  const t = content[language] || content.pt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-2xl mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8" />
              <div>
                <CardTitle className="text-2xl md:text-3xl">{t.title}</CardTitle>
                <p className="text-white/90 text-sm mt-1">{t.lastUpdated}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">{t.intro}</p>
              </div>
            </div>

            <div className="space-y-6">
              {t.sections.map((section, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    {section.title}
                  </h2>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600" />
                {language === 'pt' && 'Os Seus Dados, Os Seus Direitos'}
                {language === 'en' && 'Your Data, Your Rights'}
                {language === 'es' && 'Sus Datos, Sus Derechos'}
              </h3>
              <p className="text-sm text-gray-700">
                {language === 'pt' && 'A PawCão respeita a sua privacidade e cumpre rigorosamente o RGPD. Tem controlo total sobre os seus dados pessoais e pode exercer os seus direitos a qualquer momento.'}
                {language === 'en' && 'PawCão respects your privacy and strictly complies with GDPR. You have full control over your personal data and can exercise your rights at any time.'}
                {language === 'es' && 'PawCão respeta su privacidad y cumple estrictamente con el RGPD. Tiene control total sobre sus datos personales y puede ejercer sus derechos en cualquier momento.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}