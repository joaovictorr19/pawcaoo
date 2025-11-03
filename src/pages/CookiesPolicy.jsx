import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cookie, CheckCircle, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { Badge } from "@/components/ui/badge";

export default function CookiesPolicy() {
  const { language } = useLanguage();
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always true, cannot be disabled
    analytics: true,
    marketing: false,
    preferences: true
  });

  const handleSavePreferences = () => {
    localStorage.setItem('pawcao_cookie_preferences', JSON.stringify(cookiePreferences));
    alert(language === 'pt' ? 'Preferências guardadas!' : language === 'en' ? 'Preferences saved!' : '¡Preferencias guardadas!');
  };

  const content = {
    pt: {
      title: "Política de Cookies",
      lastUpdated: "Última atualização: 3 de Novembro de 2025",
      intro: "A PawCão utiliza cookies para melhorar a sua experiência na plataforma. Esta política explica o que são cookies, como os utilizamos e como pode controlá-los.",
      sections: [
        {
          title: "O que são Cookies?",
          content: "Cookies são pequenos ficheiros de texto armazenados no seu dispositivo quando visita o nosso website. Permitem-nos reconhecê-lo, lembrar as suas preferências e fornecer uma experiência personalizada."
        },
        {
          title: "Tipos de Cookies que Utilizamos",
          types: [
            {
              name: "Cookies Essenciais",
              required: true,
              description: "Necessários para o funcionamento básico da plataforma. Sem estes, não pode usar funcionalidades essenciais como login e reservas.",
              examples: "Sessão de utilizador, autenticação, segurança"
            },
            {
              name: "Cookies de Análise",
              required: false,
              description: "Ajudam-nos a entender como utiliza a plataforma para que possamos melhorar a experiência. Usamos Google Analytics.",
              examples: "Páginas visitadas, tempo no site, origem do tráfego"
            },
            {
              name: "Cookies de Preferências",
              required: false,
              description: "Lembram as suas escolhas e preferências para proporcionar uma experiência personalizada.",
              examples: "Idioma, moeda, layout preferido"
            },
            {
              name: "Cookies de Marketing",
              required: false,
              description: "Usados para mostrar anúncios relevantes e medir eficácia das campanhas de marketing.",
              examples: "Publicidade personalizada, retargeting"
            }
          ]
        },
        {
          title: "Cookies de Terceiros",
          content: "Utilizamos serviços de terceiros que podem definir os seus próprios cookies:\n\n• **Google Analytics** - Análise de tráfego\n• **Stripe** - Processamento de pagamentos\n• **PayPal** - Processamento de pagamentos\n• **Google Maps** - Serviços de localização\n\nEstas empresas têm as suas próprias políticas de cookies e privacidade."
        },
        {
          title: "Duração dos Cookies",
          content: "• **Cookies de sessão:** Eliminados quando fecha o navegador\n• **Cookies persistentes:** Permanecem no dispositivo por um período definido (máximo 12 meses)\n\nCookies essenciais são eliminados após 30 dias de inatividade."
        },
        {
          title: "Como Gerir Cookies",
          content: "Pode controlar e gerir cookies de várias formas:\n\n**1. Através desta página:** Use as definições abaixo para escolher que cookies aceita\n\n**2. Através do navegador:**\n• Chrome: Definições > Privacidade e segurança > Cookies\n• Firefox: Opções > Privacidade e Segurança\n• Safari: Preferências > Privacidade\n• Edge: Definições > Privacidade\n\n**Nota:** Desativar cookies essenciais pode afetar a funcionalidade da plataforma."
        },
        {
          title: "Atualizações a Esta Política",
          content: "Podemos atualizar esta política periodicamente. A data da última atualização está no topo. Notificaremos sobre alterações significativas."
        }
      ],
      preferences: {
        title: "Gerir Preferências de Cookies",
        subtitle: "Escolha que tipos de cookies deseja aceitar",
        essential: { name: "Essenciais", desc: "Necessários - sempre ativos" },
        analytics: { name: "Análise", desc: "Ajuda-nos a melhorar" },
        preferences: { name: "Preferências", desc: "Lembra as suas escolhas" },
        marketing: { name: "Marketing", desc: "Anúncios personalizados" },
        saveButton: "Guardar Preferências",
        acceptAll: "Aceitar Todos",
        rejectAll: "Rejeitar Opcionais"
      }
    },
    en: {
      title: "Cookie Policy",
      lastUpdated: "Last updated: November 3, 2025",
      intro: "PawCão uses cookies to improve your experience on the platform. This policy explains what cookies are, how we use them, and how you can control them.",
      sections: [
        {
          title: "What are Cookies?",
          content: "Cookies are small text files stored on your device when you visit our website. They allow us to recognize you, remember your preferences, and provide a personalized experience."
        },
        {
          title: "Types of Cookies We Use",
          types: [
            {
              name: "Essential Cookies",
              required: true,
              description: "Necessary for basic platform functionality. Without these, you cannot use essential features like login and bookings.",
              examples: "User session, authentication, security"
            },
            {
              name: "Analytics Cookies",
              required: false,
              description: "Help us understand how you use the platform so we can improve the experience. We use Google Analytics.",
              examples: "Pages visited, time on site, traffic source"
            },
            {
              name: "Preference Cookies",
              required: false,
              description: "Remember your choices and preferences to provide a personalized experience.",
              examples: "Language, currency, preferred layout"
            },
            {
              name: "Marketing Cookies",
              required: false,
              description: "Used to show relevant ads and measure marketing campaign effectiveness.",
              examples: "Personalized advertising, retargeting"
            }
          ]
        },
        {
          title: "Third-Party Cookies",
          content: "We use third-party services that may set their own cookies:\n\n• **Google Analytics** - Traffic analysis\n• **Stripe** - Payment processing\n• **PayPal** - Payment processing\n• **Google Maps** - Location services\n\nThese companies have their own cookie and privacy policies."
        },
        {
          title: "Cookie Duration",
          content: "• **Session cookies:** Deleted when you close browser\n• **Persistent cookies:** Remain on device for defined period (maximum 12 months)\n\nEssential cookies are deleted after 30 days of inactivity."
        },
        {
          title: "How to Manage Cookies",
          content: "You can control and manage cookies in several ways:\n\n**1. Through this page:** Use settings below to choose which cookies you accept\n\n**2. Through browser:**\n• Chrome: Settings > Privacy and security > Cookies\n• Firefox: Options > Privacy and Security\n• Safari: Preferences > Privacy\n• Edge: Settings > Privacy\n\n**Note:** Disabling essential cookies may affect platform functionality."
        },
        {
          title: "Updates to This Policy",
          content: "We may update this policy periodically. Last update date is at top. We will notify about significant changes."
        }
      ],
      preferences: {
        title: "Manage Cookie Preferences",
        subtitle: "Choose which types of cookies you want to accept",
        essential: { name: "Essential", desc: "Required - always active" },
        analytics: { name: "Analytics", desc: "Helps us improve" },
        preferences: { name: "Preferences", desc: "Remembers your choices" },
        marketing: { name: "Marketing", desc: "Personalized ads" },
        saveButton: "Save Preferences",
        acceptAll: "Accept All",
        rejectAll: "Reject Optional"
      }
    },
    es: {
      title: "Política de Cookies",
      lastUpdated: "Última actualización: 3 de Noviembre de 2025",
      intro: "PawCão utiliza cookies para mejorar su experiencia en la plataforma. Esta política explica qué son las cookies, cómo las usamos y cómo puede controlarlas.",
      sections: [
        {
          title: "¿Qué son las Cookies?",
          content: "Las cookies son pequeños archivos de texto almacenados en su dispositivo cuando visita nuestro sitio web. Nos permiten reconocerlo, recordar sus preferencias y proporcionar una experiencia personalizada."
        },
        {
          title: "Tipos de Cookies que Usamos",
          types: [
            {
              name: "Cookies Esenciales",
              required: true,
              description: "Necesarias para la funcionalidad básica de la plataforma. Sin estas, no puede usar funciones esenciales como inicio de sesión y reservas.",
              examples: "Sesión de usuario, autenticación, seguridad"
            },
            {
              name: "Cookies de Análisis",
              required: false,
              description: "Nos ayudan a entender cómo usa la plataforma para que podamos mejorar la experiencia. Usamos Google Analytics.",
              examples: "Páginas visitadas, tiempo en sitio, origen tráfico"
            },
            {
              name: "Cookies de Preferencias",
              required: false,
              description: "Recuerdan sus elecciones y preferencias para proporcionar una experiencia personalizada.",
              examples: "Idioma, moneda, diseño preferido"
            },
            {
              name: "Cookies de Marketing",
              required: false,
              description: "Usadas para mostrar anuncios relevantes y medir efectividad de campañas de marketing.",
              examples: "Publicidad personalizada, retargeting"
            }
          ]
        },
        {
          title: "Cookies de Terceros",
          content: "Usamos servicios de terceros que pueden establecer sus propias cookies:\n\n• **Google Analytics** - Análisis de tráfico\n• **Stripe** - Procesamiento de pagos\n• **PayPal** - Procesamiento de pagos\n• **Google Maps** - Servicios de ubicación\n\nEstas empresas tienen sus propias políticas de cookies y privacidad."
        },
        {
          title: "Duración de Cookies",
          content: "• **Cookies de sesión:** Eliminadas al cerrar navegador\n• **Cookies persistentes:** Permanecen en dispositivo por período definido (máximo 12 meses)\n\nCookies esenciales se eliminan tras 30 días de inactividad."
        },
        {
          title: "Cómo Gestionar Cookies",
          content: "Puede controlar y gestionar cookies de varias formas:\n\n**1. A través de esta página:** Use configuración abajo para elegir qué cookies acepta\n\n**2. A través del navegador:**\n• Chrome: Configuración > Privacidad y seguridad > Cookies\n• Firefox: Opciones > Privacidad y Seguridad\n• Safari: Preferencias > Privacidad\n• Edge: Configuración > Privacidad\n\n**Nota:** Desactivar cookies esenciales puede afectar funcionalidad de la plataforma."
        },
        {
          title: "Actualizaciones a Esta Política",
          content: "Podemos actualizar esta política periódicamente. La fecha de última actualización está arriba. Notificaremos sobre cambios significativos."
        }
      ],
      preferences: {
        title: "Gestionar Preferencias de Cookies",
        subtitle: "Elija qué tipos de cookies desea aceptar",
        essential: { name: "Esenciales", desc: "Requeridas - siempre activas" },
        analytics: { name: "Análisis", desc: "Nos ayuda a mejorar" },
        preferences: { name: "Preferencias", desc: "Recuerda sus elecciones" },
        marketing: { name: "Marketing", desc: "Anuncios personalizados" },
        saveButton: "Guardar Preferencias",
        acceptAll: "Aceptar Todas",
        rejectAll: "Rechazar Opcionales"
      }
    }
  };

  const t = content[language] || content.pt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-2xl mb-6">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white">
            <div className="flex items-center gap-3">
              <Cookie className="w-8 h-8" />
              <div>
                <CardTitle className="text-2xl md:text-3xl">{t.title}</CardTitle>
                <p className="text-white/90 text-sm mt-1">{t.lastUpdated}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <p className="text-gray-700 mb-6">{t.intro}</p>

            <div className="space-y-6">
              {t.sections.map((section, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-orange-600" />
                    {section.title}
                  </h2>
                  {section.content && (
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {section.content}
                    </p>
                  )}
                  {section.types && (
                    <div className="space-y-4 mt-4">
                      {section.types.map((type, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-900">{type.name}</h3>
                            <Badge variant={type.required ? "default" : "outline"}>
                              {type.required ? (language === 'pt' ? 'Obrigatório' : language === 'en' ? 'Required' : 'Requerido') : (language === 'pt' ? 'Opcional' : language === 'en' ? 'Optional' : 'Opcional')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{type.description}</p>
                          <p className="text-xs text-gray-600">
                            <strong>{language === 'pt' ? 'Exemplos' : language === 'en' ? 'Examples' : 'Ejemplos'}:</strong> {type.examples}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cookie Preferences Manager */}
        <Card className="border-2 border-orange-200 shadow-2xl">
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-xl flex items-center gap-2">
              <Cookie className="w-6 h-6 text-orange-600" />
              {t.preferences.title}
            </CardTitle>
            <p className="text-sm text-gray-600">{t.preferences.subtitle}</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 mb-6">
              {/* Essential */}
              <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">{t.preferences.essential.name}</h4>
                  <p className="text-sm text-gray-600">{t.preferences.essential.desc}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                <div>
                  <h4 className="font-semibold text-gray-900">{t.preferences.analytics.name}</h4>
                  <p className="text-sm text-gray-600">{t.preferences.analytics.desc}</p>
                </div>
                <Button
                  variant={cookiePreferences.analytics ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCookiePreferences({...cookiePreferences, analytics: !cookiePreferences.analytics})}
                >
                  {cookiePreferences.analytics ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </Button>
              </div>

              {/* Preferences */}
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                <div>
                  <h4 className="font-semibold text-gray-900">{t.preferences.preferences.name}</h4>
                  <p className="text-sm text-gray-600">{t.preferences.preferences.desc}</p>
                </div>
                <Button
                  variant={cookiePreferences.preferences ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCookiePreferences({...cookiePreferences, preferences: !cookiePreferences.preferences})}
                >
                  {cookiePreferences.preferences ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </Button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                <div>
                  <h4 className="font-semibold text-gray-900">{t.preferences.marketing.name}</h4>
                  <p className="text-sm text-gray-600">{t.preferences.marketing.desc}</p>
                </div>
                <Button
                  variant={cookiePreferences.marketing ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCookiePreferences({...cookiePreferences, marketing: !cookiePreferences.marketing})}
                >
                  {cookiePreferences.marketing ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={handleSavePreferences}
              >
                {t.preferences.saveButton}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCookiePreferences({essential: true, analytics: true, preferences: true, marketing: true});
                  handleSavePreferences();
                }}
              >
                {t.preferences.acceptAll}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCookiePreferences({essential: true, analytics: false, preferences: false, marketing: false});
                  handleSavePreferences();
                }}
              >
                {t.preferences.rejectAll}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}