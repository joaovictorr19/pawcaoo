import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Cookie,
  Shield,
  BarChart3,
  Settings,
  Megaphone,
  Lock,
  Clock,
  ExternalLink,
  Save,
  Check,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { toast } from "sonner";

export default function CookiesPolicy() {
  const { language } = useLanguage();
  const [prefs, setPrefs] = useState({
    essential: true,
    analytics: true,
    preferences: true,
    marketing: false,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pawcao_cookie_preferences");
      if (saved) setPrefs(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const handleSave = () => {
    localStorage.setItem("pawcao_cookie_preferences", JSON.stringify(prefs));
    toast.success(t.saved);
  };

  const acceptAll = () => {
    const all = { essential: true, analytics: true, preferences: true, marketing: true };
    setPrefs(all);
    localStorage.setItem("pawcao_cookie_preferences", JSON.stringify(all));
    toast.success(t.saved);
  };

  const rejectOptional = () => {
    const min = { essential: true, analytics: false, preferences: false, marketing: false };
    setPrefs(min);
    localStorage.setItem("pawcao_cookie_preferences", JSON.stringify(min));
    toast.success(t.saved);
  };

  const content = {
    pt: {
      title: "Política de Cookies",
      lastUpdated: "Última atualização: 20 de Julho de 2026",
      intro:
        "A PawCão utiliza cookies para melhorar a sua experiência, garantir segurança e compreender como a plataforma é utilizada. Esta política explica quais usamos e como pode controlá-los.",
      whatTitle: "O que são cookies?",
      whatText:
        "Cookies são pequenos ficheiros de texto armazenados no seu dispositivo quando visita o nosso website. Permitem reconhecê-lo, lembrar as suas preferências e oferecer uma experiência mais fluida e personalizada.",
      typesTitle: "Tipos de cookies que utilizamos",
      thirdPartyTitle: "Cookies de terceiros",
      thirdPartyText:
        "Alguns serviços externos que integramos podem definir os seus próprios cookies:",
      thirdParties: [
        "Google Analytics — análise de tráfego e desempenho",
        "Stripe — processamento seguro de pagamentos",
        "Google Maps — serviços de localização",
      ],
      thirdPartyNote:
        "Cada um destes serviços tem a sua própria política de cookies e privacidade.",
      durationTitle: "Duração dos cookies",
      durationText:
        "Os cookies de sessão são eliminados quando fecha o navegador. Os cookies persistentes permanecem no dispositivo por um período definido, no máximo 12 meses. Os cookies essenciais são eliminados após 30 dias de inatividade.",
      manageTitle: "Como gerir cookies",
      manageText:
        "Pode controlar os cookies nesta página ou através das definições do seu navegador.",
      browsers: [
        "Chrome — Privacidade e segurança > Cookies",
        "Firefox — Privacidade e Segurança",
        "Safari — Preferências > Privacidade",
        "Edge — Definições > Privacidade",
      ],
      manageNote:
        "Desativar cookies essenciais pode afetar o funcionamento da plataforma.",
      updatesTitle: "Atualizações a esta política",
      updatesText:
        "Esta política pode ser atualizada periodicamente. A data da última revisão encontra-se no topo da página.",
      prefsTitle: "Gerir preferências de cookies",
      prefsSubtitle: "Escolha os tipos de cookies que pretende aceitar",
      essential: { name: "Essenciais", desc: "Necessários para o funcionamento — sempre ativos" },
      analytics: { name: "Análise", desc: "Ajudam-nos a melhorar a plataforma" },
      preferences: { name: "Preferências", desc: "Lembram as suas escolhas e idioma" },
      marketing: { name: "Marketing", desc: "Anúncios relevantes e personalizados" },
      saveButton: "Guardar preferências",
      acceptAll: "Aceitar todos",
      rejectAll: "Rejeitar opcionais",
      saved: "Preferências guardadas com sucesso!",
      required: "Obrigatório",
      optional: "Opcional",
      examples: "Exemplos",
      essExamples: "Sessão, autenticação, segurança",
      anaExamples: "Páginas visitadas, tempo no site, origem do tráfego",
      prefExamples: "Idioma, moeda, layout",
      markExamples: "Publicidade personalizada, retargeting",
    },
    en: {
      title: "Cookie Policy",
      lastUpdated: "Last updated: July 20, 2026",
      intro:
        "PawCão uses cookies to improve your experience, ensure security, and understand how the platform is used. This policy explains which ones we use and how you can control them.",
      whatTitle: "What are cookies?",
      whatText:
        "Cookies are small text files stored on your device when you visit our website. They allow us to recognize you, remember your preferences, and provide a smoother, more personalized experience.",
      typesTitle: "Types of cookies we use",
      thirdPartyTitle: "Third-party cookies",
      thirdPartyText:
        "Some external services we integrate may set their own cookies:",
      thirdParties: [
        "Google Analytics — traffic and performance analysis",
        "Stripe — secure payment processing",
        "Google Maps — location services",
      ],
      thirdPartyNote:
        "Each of these services has its own cookie and privacy policy.",
      durationTitle: "Cookie duration",
      durationText:
        "Session cookies are deleted when you close your browser. Persistent cookies remain on the device for a defined period, up to 12 months. Essential cookies are deleted after 30 days of inactivity.",
      manageTitle: "How to manage cookies",
      manageText:
        "You can control cookies on this page or through your browser settings.",
      browsers: [
        "Chrome — Privacy and security > Cookies",
        "Firefox — Privacy and Security",
        "Safari — Preferences > Privacy",
        "Edge — Settings > Privacy",
      ],
      manageNote:
        "Disabling essential cookies may affect platform functionality.",
      updatesTitle: "Updates to this policy",
      updatesText:
        "This policy may be updated periodically. The last revision date is shown at the top of the page.",
      prefsTitle: "Manage cookie preferences",
      prefsSubtitle: "Choose which types of cookies you want to accept",
      essential: { name: "Essential", desc: "Required for functionality — always active" },
      analytics: { name: "Analytics", desc: "Help us improve the platform" },
      preferences: { name: "Preferences", desc: "Remember your choices and language" },
      marketing: { name: "Marketing", desc: "Relevant, personalized ads" },
      saveButton: "Save preferences",
      acceptAll: "Accept all",
      rejectAll: "Reject optional",
      saved: "Preferences saved successfully!",
      required: "Required",
      optional: "Optional",
      examples: "Examples",
      essExamples: "Session, authentication, security",
      anaExamples: "Pages visited, time on site, traffic source",
      prefExamples: "Language, currency, layout",
      markExamples: "Personalized advertising, retargeting",
    },
    es: {
      title: "Política de Cookies",
      lastUpdated: "Última actualización: 20 de Julio de 2026",
      intro:
        "PawCão utiliza cookies para mejorar su experiencia, garantizar seguridad y comprender cómo se utiliza la plataforma. Esta política explica cuáles usamos y cómo puede controlarlos.",
      whatTitle: "¿Qué son las cookies?",
      whatText:
        "Las cookies son pequeños archivos de texto almacenados en su dispositivo cuando visita nuestro sitio web. Nos permiten reconocerlo, recordar sus preferencias y ofrecer una experiencia más fluida y personalizada.",
      typesTitle: "Tipos de cookies que usamos",
      thirdPartyTitle: "Cookies de terceros",
      thirdPartyText:
        "Algunos servicios externos que integramos pueden establecer sus propias cookies:",
      thirdParties: [
        "Google Analytics — análisis de tráfico y rendimiento",
        "Stripe — procesamiento seguro de pagos",
        "Google Maps — servicios de ubicación",
      ],
      thirdPartyNote:
        "Cada uno de estos servicios tiene su propia política de cookies y privacidad.",
      durationTitle: "Duración de las cookies",
      durationText:
        "Las cookies de sesión se eliminan al cerrar el navegador. Las cookies persistentes permanecen en el dispositivo por un período definido, máximo 12 meses. Las cookies esenciales se eliminan tras 30 días de inactividad.",
      manageTitle: "Cómo gestionar las cookies",
      manageText:
        "Puede controlar las cookies en esta página o a través de la configuración de su navegador.",
      browsers: [
        "Chrome — Privacidad y seguridad > Cookies",
        "Firefox — Privacidad y Seguridad",
        "Safari — Preferencias > Privacidad",
        "Edge — Configuración > Privacidad",
      ],
      manageNote:
        "Desactivar cookies esenciales puede afectar la funcionalidad de la plataforma.",
      updatesTitle: "Actualizaciones a esta política",
      updatesText:
        "Esta política puede actualizarse periódicamente. La fecha de la última revisión se muestra en la parte superior.",
      prefsTitle: "Gestionar preferencias de cookies",
      prefsSubtitle: "Elija qué tipos de cookies desea aceptar",
      essential: { name: "Esenciales", desc: "Necesarias para el funcionamiento — siempre activas" },
      analytics: { name: "Análisis", desc: "Nos ayudan a mejorar la plataforma" },
      preferences: { name: "Preferencias", desc: "Recuerdan sus elecciones e idioma" },
      marketing: { name: "Marketing", desc: "Anuncios relevantes y personalizados" },
      saveButton: "Guardar preferencias",
      acceptAll: "Aceptar todas",
      rejectAll: "Rechazar opcionales",
      saved: "¡Preferencias guardadas con éxito!",
      required: "Obligatorio",
      optional: "Opcional",
      examples: "Ejemplos",
      essExamples: "Sesión, autenticación, seguridad",
      anaExamples: "Páginas visitadas, tiempo en el sitio, origen del tráfico",
      prefExamples: "Idioma, moneda, diseño",
      markExamples: "Publicidad personalizada, retargeting",
    },
  };

  const t = content[language] || content.pt;

  const cookieTypes = [
    {
      key: "essential",
      icon: Shield,
      required: true,
      examples: t.essExamples,
    },
    {
      key: "analytics",
      icon: BarChart3,
      required: false,
      examples: t.anaExamples,
    },
    {
      key: "preferences",
      icon: Settings,
      required: false,
      examples: t.prefExamples,
    },
    {
      key: "marketing",
      icon: Megaphone,
      required: false,
      examples: t.markExamples,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0d9483] via-[#14b8a6] to-[#0891b2] text-white">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-14 md:py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm mb-5">
            <Cookie className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 font-heading tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm md:text-base text-white/80 mb-6">{t.lastUpdated}</p>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
            {t.intro}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 md:-mt-12 pb-16 relative z-10 space-y-6">
        {/* What are cookies */}
        <section className="glass-panel rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#0d9483]/10 flex items-center justify-center">
              <Cookie className="w-5 h-5 text-[#0d9483]" />
            </div>
            <h2 className="text-xl font-heading font-bold text-slate-900">{t.whatTitle}</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">{t.whatText}</p>
        </section>

        {/* Cookie types */}
        <section className="glass-panel rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-5">
            {t.typesTitle}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {cookieTypes.map((type) => (
              <div
                key={type.key}
                className="rounded-2xl border border-slate-200 bg-white/60 p-5 hover:border-[#0d9483]/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0d9483]/10 flex items-center justify-center">
                    <type.icon className="w-5 h-5 text-[#0d9483]" />
                  </div>
                  <Badge
                    variant={type.required ? "default" : "outline"}
                    className={
                      type.required
                        ? "bg-[#0d9483] text-white"
                        : "border-slate-300 text-slate-500"
                    }
                  >
                    {type.required ? t.required : t.optional}
                  </Badge>
                </div>
                <h3 className="font-heading font-bold text-slate-900 mb-1">
                  {t[type.key].name}
                </h3>
                <p className="text-sm text-slate-500 mb-2">{t[type.key].desc}</p>
                <p className="text-xs text-slate-400">
                  <span className="font-semibold">{t.examples}:</span> {type.examples}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Third party + Duration */}
        <div className="grid md:grid-cols-2 gap-6">
          <section className="glass-panel rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#0d9483]/10 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-[#0d9483]" />
              </div>
              <h2 className="text-lg font-heading font-bold text-slate-900">
                {t.thirdPartyTitle}
              </h2>
            </div>
            <p className="text-sm text-slate-600 mb-3">{t.thirdPartyText}</p>
            <ul className="space-y-2 mb-3">
              {t.thirdParties.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-[#0d9483] mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-400">{t.thirdPartyNote}</p>
          </section>

          <section className="glass-panel rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#0d9483]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#0d9483]" />
              </div>
              <h2 className="text-lg font-heading font-bold text-slate-900">
                {t.durationTitle}
              </h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{t.durationText}</p>
          </section>
        </div>

        {/* Manage cookies */}
        <section className="glass-panel rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#0d9483]/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#0d9483]" />
            </div>
            <h2 className="text-xl font-heading font-bold text-slate-900">{t.manageTitle}</h2>
          </div>
          <p className="text-slate-600 mb-4">{t.manageText}</p>
          <div className="grid sm:grid-cols-2 gap-2 mb-4">
            {t.browsers.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-slate-600 rounded-xl bg-white/60 px-3 py-2 border border-slate-200"
              >
                <Check className="w-4 h-4 text-[#0d9483] flex-shrink-0" />
                {b}
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
            ⚠️ {t.manageNote}
          </p>
        </section>

        {/* Preferences Manager */}
        <section className="rounded-3xl overflow-hidden shadow-xl shadow-[#0d9483]/10">
          <div className="bg-gradient-to-br from-[#0d9483] to-[#0891b2] text-white p-6 md:p-8">
            <h2 className="text-xl font-heading font-bold mb-1">{t.prefsTitle}</h2>
            <p className="text-white/80 text-sm">{t.prefsSubtitle}</p>
          </div>
          <div className="bg-white p-6 md:p-8 space-y-4">
            {cookieTypes.map((type) => (
              <div
                key={type.key}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 hover:border-[#0d9483]/30 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#0d9483]/10 flex items-center justify-center flex-shrink-0">
                    <type.icon className="w-5 h-5 text-[#0d9483]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900">{t[type.key].name}</h4>
                    <p className="text-sm text-slate-500 truncate">{t[type.key].desc}</p>
                  </div>
                </div>
                <Switch
                  checked={prefs[type.key]}
                  disabled={type.required}
                  onCheckedChange={(val) =>
                    setPrefs((p) => ({ ...p, [type.key]: val }))
                  }
                />
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleSave}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#0d9483] to-[#0891b2] hover:from-[#0f766e] hover:to-[#0e7490] font-bold shadow-lg shadow-[#0d9483]/25"
              >
                <Save className="w-4 h-4 mr-2" />
                {t.saveButton}
              </Button>
              <Button
                variant="outline"
                onClick={acceptAll}
                className="flex-1 h-11 rounded-xl font-semibold border-[#0d9483]/30 text-[#0d9483] hover:bg-[#0d9483]/5"
              >
                {t.acceptAll}
              </Button>
              <Button
                variant="ghost"
                onClick={rejectOptional}
                className="flex-1 h-11 rounded-xl font-semibold text-slate-500 hover:bg-slate-100"
              >
                {t.rejectAll}
              </Button>
            </div>
          </div>
        </section>

        {/* Updates */}
        <section className="glass-panel rounded-3xl p-6 md:p-8 text-center">
          <h2 className="text-lg font-heading font-bold text-slate-900 mb-2">
            {t.updatesTitle}
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">{t.updatesText}</p>
        </section>
      </div>
    </div>
  );
}