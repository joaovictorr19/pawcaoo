import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function TermsOfService() {
  const { language } = useLanguage();

  const content = {
    pt: {
      title: "Termos de Serviço",
      lastUpdated: "Última atualização: 22 de Dezembro de 2024",
      sections: [
        {
          title: "1. Aceitação dos Termos",
          content: "Ao aceder e utilizar a plataforma PawCão, você concorda em estar vinculado a estes Termos de Serviço. Se não concordar com qualquer parte destes termos, não deve utilizar os nossos serviços."
        },
        {
          title: "2. Descrição do Serviço",
          content: "PawCão é uma plataforma intermediária que conecta donos de animais com passeadores, treinadores, lojas e serviços veterinários em Portugal, Espanha e França. Não somos empregadores dos profissionais listados, funcionamos exclusivamente como facilitadores de conexões."
        },
        {
          title: "3. Elegibilidade",
          content: "Para usar o PawCão, você deve ter pelo menos 18 anos de idade e capacidade legal para celebrar contratos vinculativos. Os profissionais devem passar por verificação de antecedentes e fornecer documentação válida."
        },
        {
          title: "4. Contas de Utilizador",
          content: "Você é responsável por manter a confidencialidade da sua conta e senha. Você concorda em nos notificar imediatamente de qualquer uso não autorizado da sua conta. Não partilhe as suas credenciais de login."
        },
        {
          title: "5. Pagamentos e Taxas",
          content: "• Os proprietários pagam pelos serviços através da plataforma\n• Retemos o pagamento até a conclusão do serviço\n• PawCão cobra uma comissão de 15% (ou conforme plano de subscrição)\n• Taxa de transação de €1 por reserva\n• Todos os preços incluem IVA quando aplicável\n• Reembolsos processados em 5-7 dias úteis"
        },
        {
          title: "6. Cancelamentos e Reembolsos",
          content: "**Serviços de Passeio/Treino:**\n• Cancelamento gratuito até 24h antes do serviço\n• Cancelamentos com menos de 24h: sem reembolso\n• Cancelamentos pelo profissional: reembolso total\n• Cancelamentos devido a emergências: analisados caso a caso\n• Proprietários Premium/VIP têm cancelamentos grátis conforme plano\n\n**Loja PawStore (Produtos Físicos):**\n• Direito de livre resolução em 14 dias (Lei Europeia)\n• Produtos devem estar em condição original\n• Envios: 3-5 dias úteis\n• Garantia: 2 anos para produtos físicos"
        },
        {
          title: "7. Responsabilidades dos Profissionais",
          content: "Os profissionais concordam em:\n• Fornecer serviços de qualidade profissional\n• Manter certificações e documentos válidos\n• Seguir todas as leis e regulamentos locais\n• Tratar os animais com cuidado e respeito\n• Comunicar claramente com os proprietários\n• Reportar qualquer incidente imediatamente"
        },
        {
          title: "8. Responsabilidades dos Proprietários",
          content: "Os proprietários concordam em:\n• Fornecer informações precisas sobre o cão\n• Divulgar quaisquer problemas de saúde ou comportamento\n• Garantir que o cão está vacinado e saudável\n• Pagar pelos serviços conforme acordado\n• Tratar os profissionais com respeito"
        },
        {
          title: "9. Seguro e Responsabilidade",
          content: "• PawCão oferece seguro básico para todos os serviços\n• Seguro adicional disponível mediante pagamento\n• Proprietários responsáveis por comportamento do cão\n• Profissionais devem ter seguro de responsabilidade civil\n• PawCão não é responsável por incidentes entre partes"
        },
        {
          title: "10. Sistema de PawPoints",
          content: "• Ganhe 10-20 pontos por cada €1 gasto (conforme tier)\n• Pontos podem ser resgatados por descontos\n• Pontos expiram após 12 meses de inatividade\n• PawCão reserva-se o direito de ajustar valores de pontos\n• Pontos não têm valor monetário"
        },
        {
          title: "11. Conduta Proibida",
          content: "É proibido:\n• Usar linguagem ofensiva ou assédio\n• Fornecer informações falsas\n• Contornar o sistema de pagamento da plataforma\n• Copiar ou usar propriedade intelectual da PawCão\n• Usar a plataforma para fins ilegais\n• Criar múltiplas contas falsas"
        },
        {
          title: "12. Propriedade Intelectual",
          content: "Todo o conteúdo da plataforma PawCão, incluindo logotipo, design e software, é propriedade da PawCão e protegido por leis de direitos autorais. Não pode ser usado sem autorização."
        },
        {
          title: "13. Privacidade de Dados",
          content: "O uso de dados pessoais é regido pela nossa Política de Privacidade, em conformidade com o RGPD. Processamos apenas os dados necessários para fornecer os serviços."
        },
        {
          title: "14. Modificações dos Termos",
          content: "Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos os utilizadores de alterações significativas. O uso continuado após alterações constitui aceitação."
        },
        {
          title: "15. Rescisão",
          content: "Podemos suspender ou encerrar contas que violem estes termos. Você pode encerrar sua conta a qualquer momento através das configurações. Dados pessoais serão tratados conforme política de privacidade."
        },
        {
          title: "16. Limitação de Responsabilidade",
          content: "PawCão não é responsável por danos indiretos, incidentais ou consequenciais. Nossa responsabilidade máxima está limitada ao valor pago pelos serviços nos últimos 12 meses."
        },
        {
          title: "17. Cláusula Especial - França (CESU)",
          content: "🇫🇷 **Para utilizadores em França:**\n\nA PawCão permite a conexão entre particulares e prestadores de serviços. Se o prestador não tiver SIRET (auto-entrepreneur ou empresa), o cliente (dono do animal) é responsável pela declaração via CESU (Chèque emploi service universel).\n\n**Responsabilidade Legal:**\nA PawCão atua apenas como facilitador técnico. A relação contratual e fiscal entre cliente e prestador particular é de responsabilidade exclusiva das partes envolvidas, conforme legislação francesa sobre serviços domésticos.\n\n**Prestadores Profissionais em França:**\nPrestadores com SIRET seguem regime normal de auto-entrepreneur ou empresa, emitindo faturas diretamente ao cliente."
        },
        {
          title: "18. Lei Aplicável",
          content: "Estes termos são regidos pelas leis de Portugal. Quaisquer disputas serão resolvidas nos tribunais de Lisboa, Portugal."
        },
        {
          title: "19. Contacto",
          content: "Para questões sobre estes Termos:\n• Email: support@pawcao.net"
        }
      ]
    },
    en: {
      title: "Terms of Service",
      lastUpdated: "Last updated: December 22, 2024",
      sections: [
        {
          title: "1. Acceptance of Terms",
          content: "By accessing and using the PawCão platform, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you should not use our services."
        },
        {
          title: "2. Service Description",
          content: "PawCão is an intermediary platform connecting pet owners with walkers, trainers, shops, and veterinary services in Portugal, Spain, and France. We are not employers of listed professionals; we function exclusively as connection facilitators."
        },
        {
          title: "3. Eligibility",
          content: "To use PawCão, you must be at least 18 years old and legally capable of entering binding contracts. Professionals must pass background checks and provide valid documentation."
        },
        {
          title: "4. User Accounts",
          content: "You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized use. Do not share your login credentials."
        },
        {
          title: "5. Payments and Fees",
          content: "• Owners pay for services through the platform\n• We hold payment until service completion\n• PawCão charges a 15% commission (or per subscription plan)\n• €1 transaction fee per booking\n• All prices include VAT when applicable\n• Refunds processed in 5-7 business days"
        },
        {
          title: "6. Cancellations and Refunds",
          content: "**Walk/Training Services:**\n• Free cancellation up to 24h before service\n• Cancellations under 24h: no refund\n• Professional cancellations: full refund\n• Emergency cancellations: case-by-case review\n• Premium/VIP owners have free cancellations per plan\n\n**PawStore (Physical Products):**\n• 14-day right of withdrawal (EU Law)\n• Products must be in original condition\n• Shipping: 3-5 business days\n• Warranty: 2 years for physical products"
        },
        {
          title: "7. Professional Responsibilities",
          content: "Professionals agree to:\n• Provide professional quality services\n• Maintain valid certifications and documents\n• Follow all local laws and regulations\n• Treat animals with care and respect\n• Communicate clearly with owners\n• Report any incidents immediately"
        },
        {
          title: "8. Owner Responsibilities",
          content: "Owners agree to:\n• Provide accurate information about the dog\n• Disclose any health or behavioral issues\n• Ensure dog is vaccinated and healthy\n• Pay for services as agreed\n• Treat professionals with respect"
        },
        {
          title: "9. Insurance and Liability",
          content: "• PawCão offers basic insurance for all services\n• Additional insurance available for a fee\n• Owners responsible for dog behavior\n• Professionals must have liability insurance\n• PawCão not liable for incidents between parties"
        },
        {
          title: "10. PawPoints System",
          content: "• Earn 10-20 points per €1 spent (per tier)\n• Points redeemable for discounts\n• Points expire after 12 months of inactivity\n• PawCão reserves right to adjust point values\n• Points have no monetary value"
        },
        {
          title: "11. Prohibited Conduct",
          content: "Prohibited:\n• Using offensive language or harassment\n• Providing false information\n• Bypassing platform payment system\n• Copying or using PawCão intellectual property\n• Using platform for illegal purposes\n• Creating multiple fake accounts"
        },
        {
          title: "12. Intellectual Property",
          content: "All PawCão platform content, including logo, design, and software, is owned by PawCão and protected by copyright laws. Cannot be used without authorization."
        },
        {
          title: "13. Data Privacy",
          content: "Personal data use is governed by our Privacy Policy, in compliance with GDPR. We process only data necessary to provide services."
        },
        {
          title: "14. Terms Modifications",
          content: "We reserve the right to modify these terms at any time. We will notify users of significant changes. Continued use after changes constitutes acceptance."
        },
        {
          title: "15. Termination",
          content: "We may suspend or terminate accounts violating these terms. You may close your account anytime through settings. Personal data will be handled per privacy policy."
        },
        {
          title: "16. Limitation of Liability",
          content: "PawCão is not liable for indirect, incidental, or consequential damages. Our maximum liability is limited to amount paid for services in last 12 months."
        },
        {
          title: "17. Special Clause - France (CESU)",
          content: "🇫🇷 **For users in France:**\n\nPawCão enables connections between individuals and service providers. If the provider does not have a SIRET (auto-entrepreneur or company), the client (pet owner) is responsible for declaration via CESU (Chèque emploi service universel).\n\n**Legal Responsibility:**\nPawCão acts only as a technical facilitator. The contractual and fiscal relationship between client and individual provider is the exclusive responsibility of the parties involved, according to French legislation on domestic services.\n\n**Professional Providers in France:**\nProviders with SIRET follow normal auto-entrepreneur or company regime, issuing invoices directly to the client."
        },
        {
          title: "18. Governing Law",
          content: "These terms are governed by the laws of Portugal. Any disputes will be resolved in the courts of Lisbon, Portugal."
        },
        {
          title: "19. Contact",
          content: "Questions about these Terms:\n• Email: support@pawcao.net"
        }
      ]
    },
    es: {
      title: "Términos de Servicio",
      lastUpdated: "Última actualización: 22 de Diciembre de 2024",
      sections: [
        {
          title: "1. Aceptación de los Términos",
          content: "Al acceder y utilizar la plataforma PawCão, acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte, no debe usar nuestros servicios."
        },
        {
          title: "2. Descripción del Servicio",
          content: "PawCão es una plataforma intermediaria que conecta dueños de mascotas con paseadores, entrenadores, tiendas y servicios veterinarios en Portugal, España y Francia. No somos empleadores de los profesionales listados, funcionamos exclusivamente como facilitadores de conexiones."
        },
        {
          title: "3. Elegibilidad",
          content: "Para usar PawCão, debe tener al menos 18 años y capacidad legal para celebrar contratos vinculantes. Los profesionales deben pasar verificaciones de antecedentes."
        },
        {
          title: "4. Cuentas de Usuario",
          content: "Es responsable de mantener la confidencialidad de su cuenta y contraseña. Acepta notificarnos inmediatamente de cualquier uso no autorizado. No comparta sus credenciales."
        },
        {
          title: "5. Pagos y Tarifas",
          content: "• Los propietarios pagan por servicios a través de la plataforma\n• Retenemos el pago hasta completar el servicio\n• PawCão cobra 15% de comisión (o según plan)\n• Tarifa de transacción de €1 por reserva\n• Todos los precios incluyen IVA cuando aplique\n• Reembolsos procesados en 5-7 días hábiles"
        },
        {
          title: "6. Cancelaciones y Reembolsos",
          content: "**Servicios de Paseo/Entrenamiento:**\n• Cancelación gratuita hasta 24h antes\n• Cancelaciones bajo 24h: sin reembolso\n• Cancelaciones por profesional: reembolso total\n• Cancelaciones de emergencia: revisión caso por caso\n• Propietarios Premium/VIP tienen cancelaciones gratis según plan\n\n**Tienda PawStore (Productos Físicos):**\n• Derecho de desistimiento en 14 días (Ley Europea)\n• Productos deben estar en condición original\n• Envíos: 3-5 días hábiles\n• Garantía: 2 años para productos físicos"
        },
        {
          title: "7. Responsabilidades de Profesionales",
          content: "Los profesionales aceptan:\n• Proporcionar servicios de calidad profesional\n• Mantener certificaciones y documentos válidos\n• Seguir todas las leyes locales\n• Tratar a los animales con cuidado\n• Comunicarse claramente con propietarios\n• Reportar incidentes inmediatamente"
        },
        {
          title: "8. Responsabilidades de Propietarios",
          content: "Los propietarios aceptan:\n• Proporcionar información precisa del perro\n• Divulgar problemas de salud o comportamiento\n• Asegurar que el perro esté vacunado\n• Pagar por servicios según acordado\n• Tratar a profesionales con respeto"
        },
        {
          title: "9. Seguro y Responsabilidad",
          content: "• PawCão ofrece seguro básico para todos los servicios\n• Seguro adicional disponible por tarifa\n• Propietarios responsables del comportamiento del perro\n• Profesionales deben tener seguro de responsabilidad\n• PawCão no es responsable de incidentes entre partes"
        },
        {
          title: "10. Sistema PawPoints",
          content: "• Gane 10-20 puntos por cada €1 gastado (según nivel)\n• Puntos canjeables por descuentos\n• Puntos expiran tras 12 meses de inactividad\n• PawCão se reserva el derecho de ajustar valores\n• Puntos no tienen valor monetario"
        },
        {
          title: "11. Conducta Prohibida",
          content: "Está prohibido:\n• Usar lenguaje ofensivo o acoso\n• Proporcionar información falsa\n• Eludir el sistema de pago\n• Copiar propiedad intelectual de PawCão\n• Usar plataforma para fines ilegales\n• Crear múltiples cuentas falsas"
        },
        {
          title: "12. Propiedad Intelectual",
          content: "Todo el contenido de PawCão, incluido logotipo, diseño y software, es propiedad de PawCão y protegido por leyes de derechos de autor. No puede usarse sin autorización."
        },
        {
          title: "13. Privacidad de Datos",
          content: "El uso de datos personales se rige por nuestra Política de Privacidad, conforme al RGPD. Procesamos solo datos necesarios para proporcionar servicios."
        },
        {
          title: "14. Modificaciones de Términos",
          content: "Nos reservamos el derecho de modificar estos términos. Notificaremos a usuarios de cambios significativos. El uso continuado tras cambios constituye aceptación."
        },
        {
          title: "15. Terminación",
          content: "Podemos suspender o terminar cuentas que violen estos términos. Puede cerrar su cuenta en cualquier momento. Los datos se manejarán según política de privacidad."
        },
        {
          title: "16. Limitación de Responsabilidad",
          content: "PawCão no es responsable de daños indirectos, incidentales o consecuentes. Nuestra responsabilidad máxima está limitada al monto pagado en los últimos 12 meses."
        },
        {
          title: "17. Cláusula Especial - Francia (CESU)",
          content: "🇫🇷 **Para usuarios en Francia:**\n\nPawCão permite la conexión entre particulares y prestadores de servicios. Si el prestador no tiene SIRET (auto-entrepreneur o empresa), el cliente (dueño del animal) es responsable de la declaración vía CESU (Chèque emploi service universel).\n\n**Responsabilidad Legal:**\nPawCão actúa solo como facilitador técnico. La relación contractual y fiscal entre cliente y prestador particular es responsabilidad exclusiva de las partes involucradas, según legislación francesa sobre servicios domésticos.\n\n**Prestadores Profesionales en Francia:**\nPrestadores con SIRET siguen régimen normal de auto-entrepreneur o empresa, emitiendo facturas directamente al cliente."
        },
        {
          title: "18. Ley Aplicable",
          content: "Estos términos se rigen por las leyes de Portugal. Las disputas se resolverán en los tribunales de Lisboa, Portugal."
        },
        {
          title: "19. Contacto",
          content: "Preguntas sobre estos Términos:\n• Email: support@pawcao.net"
        }
      ]
    }
  };

  const t = content[language] || content.pt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-2xl mb-6">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <CardTitle className="text-2xl md:text-3xl">{t.title}</CardTitle>
                <p className="text-white/90 text-sm mt-1">{t.lastUpdated}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  {language === 'pt' && 'Por favor, leia atentamente estes termos antes de usar a plataforma PawCão. Ao criar uma conta, você concorda com todos os termos aqui descritos.'}
                  {language === 'en' && 'Please read these terms carefully before using the PawCão platform. By creating an account, you agree to all terms described here.'}
                  {language === 'es' && 'Por favor, lea estos términos cuidadosamente antes de usar la plataforma PawCão. Al crear una cuenta, acepta todos los términos aquí descritos.'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {t.sections.map((section, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    {section.title}
                  </h2>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                {language === 'pt' && 'Aceitação'}
                {language === 'en' && 'Acceptance'}
                {language === 'es' && 'Aceptación'}
              </h3>
              <p className="text-sm text-gray-700">
                {language === 'pt' && 'Ao usar a plataforma PawCão, você confirma que leu, compreendeu e concorda em estar vinculado a estes Termos de Serviço e à nossa Política de Privacidade.'}
                {language === 'en' && 'By using the PawCão platform, you confirm that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.'}
                {language === 'es' && 'Al usar la plataforma PawCão, confirma que ha leído, entendido y acepta estar sujeto a estos Términos de Servicio y nuestra Política de Privacidad.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}