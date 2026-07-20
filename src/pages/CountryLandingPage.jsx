import React, { useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, ShieldCheck, Search, PawPrint, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { COUNTRY_CONFIG, resolveLang } from "@/components/i18n/countryContent";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BackButton from "@/components/ui/BackButton";

const ProfessionalCard = React.lazy(() =>
  import("../components/marketplace/ProfessionalCard").then((m) => ({
    default: m.ProfessionalCard,
  }))
);

const SERVICE_TYPE_LABELS = {
  walk: { pt: "Passeios", es: "Paseos", fr: "Promenades", en: "Walks" },
  training: { pt: "Treino", es: "Entrenamiento", fr: "Éducation", en: "Training" },
  boarding: { pt: "Hotel", es: "Hotel", fr: "Hôtel", en: "Boarding" },
  daycare: { pt: "Creche", es: "Guardería", fr: "Garde", en: "Daycare" },
  grooming: { pt: "Tosquia", es: "Peluquería", fr: "Toilettage", en: "Grooming" },
};

export default function CountryLandingPage() {
  const { country } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const lang = resolveLang(language);

  const config = COUNTRY_CONFIG[country];
  const city = searchParams.get("cidade") || "";

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["countryProfessionals", config?.dbValue],
    queryFn: async () => {
      if (!config) return [];
      const result = await base44.entities.WalkerProfile.filter(
        { is_active: true, country_of_operation: config.dbValue },
        "-rating",
        60
      );
      return Array.isArray(result) ? result : [];
    },
    enabled: !!config,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filtered = useMemo(() => {
    if (!city) return professionals;
    const c = city.toLowerCase();
    return professionals.filter((p) => {
      const loc = (p.location || "").toLowerCase();
      const areas = (p.service_areas || []).some(
        (a) => (a.area_name || "").toLowerCase().includes(c)
      );
      return loc.includes(c) || areas;
    });
  }, [professionals, city]);

  const servicesInLocality = useMemo(() => {
    const set = new Set();
    filtered.forEach((p) => {
      (p.services_offered || []).forEach((s) => {
        if (s.service_type) set.add(s.service_type);
      });
      if (p.professional_type === "hotel") set.add("boarding");
    });
    return Array.from(set);
  }, [filtered]);

  if (!config) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-slate-600">País não encontrado.</p>
        <Link to="/" className="text-teal-600 font-semibold mt-4 inline-block">
          ← Voltar ao início
        </Link>
      </div>
    );
  }

  const c = config.content[lang];

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{c.title}</title>
        <meta name="description" content={c.meta} />
        <meta property="og:title" content={c.title} />
        <meta property="og:description" content={c.meta} />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <BackButton />
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-4">
            <MapPin className="w-3.5 h-3.5" />
            {config.cities.length > 0 && city ? city : config.dbValue}
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            {c.hero}
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-600 max-w-2xl">{c.heroSub}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 bg-white/70 px-3 py-1.5 rounded-full border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              {lang === "pt" ? "Profissionais verificados" : lang === "es" ? "Profesionales verificados" : lang === "fr" ? "Professionnels vérifiés" : "Verified professionals"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 bg-white/70 px-3 py-1.5 rounded-full border border-slate-200">
              <PawPrint className="w-4 h-4 text-teal-600" />
              {filtered.length} {lang === "pt" ? "profissionais disponíveis" : lang === "es" ? "profesionales disponibles" : lang === "fr" ? "professionnels disponibles" : "professionals available"}
            </span>
          </div>
        </div>
      </section>

      {/* City navigation */}
      <section className="px-6 pb-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-lg font-bold text-slate-800 mb-3">{c.citiesTitle}</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSearchParams({})}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                !city
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
              }`}
            >
              {lang === "pt" ? "Todas" : lang === "es" ? "Todas" : lang === "fr" ? "Toutes" : "All"}
            </button>
            {config.cities.map((cityName) => (
              <button
                key={cityName}
                onClick={() => setSearchParams({ cidade: cityName })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  city === cityName
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                }`}
              >
                {cityName}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Services available in this locality */}
      {servicesInLocality.length > 0 && (
        <section className="px-6 pb-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">
                {lang === "pt" ? "Serviços disponíveis nesta localidade" : lang === "es" ? "Servicios disponibles en esta localidad" : lang === "fr" ? "Services disponibles dans cette localité" : "Services available in this location"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {servicesInLocality.map((st) => (
                <span
                  key={st}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100"
                >
                  {SERVICE_TYPE_LABELS[st]?.[lang] || st}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Intro / SEO text */}
      <section className="px-6 pb-8">
        <div className="max-w-5xl mx-auto bg-white/60 backdrop-blur rounded-2xl border border-slate-100 p-5">
          <p className="text-sm text-slate-600 leading-relaxed">{c.intro}</p>
        </div>
      </section>

      {/* Professionals list */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <React.Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-teal-600" />}>
            {isLoading ? (
              <div className="grid gap-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <PawPrint className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">
                  {lang === "pt"
                    ? "Ainda não há profissionais nesta localidade."
                    : lang === "es"
                    ? "Aún no hay profesionales en esta localidad."
                    : lang === "fr"
                    ? "Pas encore de professionnels dans cette localité."
                    : "No professionals in this location yet."}
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/">{lang === "pt" ? "Ver todos os profissionais" : "View all professionals"}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {filtered.map((w) => (
                  <ProfessionalCard key={w.id} walker={w} />
                ))}
              </div>
            )}
          </React.Suspense>
        </div>
      </section>
    </div>
  );
}