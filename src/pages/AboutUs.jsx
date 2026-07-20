import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import {
  Heart, Shield, Users, Award, Zap, Star, PawPrint, MapPin, TrendingUp, Sparkles, ArrowRight, Dog,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const PAWCAO_LOGO_URL = "https://media.base44.com/images/public/6907b3be1ec43db5676a2085/e3013a5a7_IMG_3975.jpg";

function AnimatedCounter({ value, duration = 1200, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = typeof value === "number" ? value : 0;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  const isFloat = typeof value === "string" && value.includes(".");
  if (isFloat) {
    return <span ref={ref}>{value}{suffix}</span>;
  }
  return <span ref={ref}>{display.toLocaleString("pt-PT")}{suffix}</span>;
}

export default function AboutUs() {
  const { language } = useLanguage();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["aboutUsStats"],
    queryFn: async () => {
      const [walkers, trainers, completedBookings, reviews] = await Promise.all([
        base44.entities.WalkerProfile.filter({ is_active: true }, undefined, 5000),
        base44.entities.TrainerProfile.filter({ is_active: true }, undefined, 5000),
        base44.entities.Booking.filter({ status: "completed" }, undefined, 5000),
        base44.entities.Review.list(undefined, 5000),
      ]);

      const totalProfessionals = walkers.length + trainers.length;
      const totalWalks = completedBookings.length;
      const avgRating =
        reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
          : "0.0";

      return {
        happyDogs: totalWalks,
        totalProfessionals,
        totalWalks,
        avgRating,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const t = {
    pt: {
      heroBadge: "Plataforma de Cuidados para Cães",
      heroTitle1: "Sobre o",
      heroTitle2: "PawCão",
      heroSubtitle: "A plataforma que conecta donos de cães a profissionais verificados, hotéis caninos e serviços pet — de forma simples, segura e eficiente.",
      statsTitle: "PawCão em Números",
      statsSubtitle: "Dados em tempo real, sempre atualizados",
      missionLabel: "A NOSSA MISSÃO",
      missionTitle: "Simplificar o cuidado animal",
      missionText: "Existimos para eliminar a frustração das plataformas confusas. Conectamos donos de cães a profissionais qualificados em segundos — com segurança, transparência e zero burocracia.",
      storyLabel: "A NOSSA HISTÓRIA",
      storyTitle: "Nascido de uma frustração real",
      storyP1: "O PawCão nasceu porque as plataformas existentes são lentas, confusas e cheias de passos desnecessários. Vimos donos frustrados, profissionais perdidos em interfaces complicadas e hotéis a perder horas em processos que deviam levar minutos.",
      storyP2: "Decidimos fazer diferente. Construímos uma plataforma onde a eficiência nunca compromete a segurança — reservas em segundos, profissionais verificados e pagamentos protegidos. Começámos em Portugal e Espanha, com a ambição de ser a plataforma número 1 globalmente.",
      valuesTitle: "Os Nossos Pilares",
      valuesSubtitle: "Princípios que guiam cada decisão",
      ctaTitle: "Junte-se ao PawCão",
      ctaText: "Quer seja dono, profissional ou hotel — há um lugar para si na maior comunidade de cuidados para cães.",
      ctaButton: "Começar Agora",
      statLabels: {
        happyDogs: "Cães Felizes",
        professionals: "Profissionais",
        walks: "Passeios",
        rating: "Avaliação",
      },
    },
    es: {
      heroBadge: "Plataforma de Cuidados para Perros",
      heroTitle1: "Sobre",
      heroTitle2: "PawCão",
      heroSubtitle: "La plataforma que conecta dueños de perros con profesionales verificados, hoteles caninos y servicios pet — de forma simple, segura y eficiente.",
      statsTitle: "PawCão en Números",
      statsSubtitle: "Datos en tiempo real, siempre actualizados",
      missionLabel: "NUESTRA MISIÓN",
      missionTitle: "Simplificar el cuidado animal",
      missionText: "Existimos para eliminar la frustración de las plataformas confusas. Conectamos dueños de perros con profesionales cualificados en segundos — con seguridad, transparencia y cero burocracia.",
      storyLabel: "NUESTRA HISTORIA",
      storyTitle: "Nacido de una frustración real",
      storyP1: "PawCão nació porque las plataformas existentes son lentas, confusas y llenas de pasos innecesarios. Vimos dueños frustrados, profesionales perdidos en interfaces complicadas y hoteles perdiendo horas en procesos que deberían tomar minutos.",
      storyP2: "Decidimos hacerlo diferente. Construimos una plataforma donde la eficiencia nunca compromete la seguridad — reservas en segundos, profesionales verificados y pagos protegidos. Empezamos en Portugal y España, con la ambición de ser la plataforma número 1 globalmente.",
      valuesTitle: "Nuestros Pilares",
      valuesSubtitle: "Principios que guían cada decisión",
      ctaTitle: "Únete a PawCão",
      ctaText: "Ya seas dueño, profesional u hotel — hay un lugar para ti en la mayor comunidad de cuidados para perros.",
      ctaButton: "Empezar Ahora",
      statLabels: {
        happyDogs: "Perros Felices",
        professionals: "Profesionales",
        walks: "Paseos",
        rating: "Calificación",
      },
    },
    en: {
      heroBadge: "Dog Care Platform",
      heroTitle1: "About",
      heroTitle2: "PawCão",
      heroSubtitle: "The platform that connects dog owners with verified professionals, dog hotels and pet services — simply, securely and efficiently.",
      statsTitle: "PawCão in Numbers",
      statsSubtitle: "Real-time data, always up to date",
      missionLabel: "OUR MISSION",
      missionTitle: "Simplifying pet care",
      missionText: "We exist to eliminate the frustration of confusing platforms. We connect dog owners with qualified professionals in seconds — with security, transparency and zero bureaucracy.",
      storyLabel: "OUR STORY",
      storyTitle: "Born from real frustration",
      storyP1: "PawCão was born because existing platforms are slow, confusing and full of unnecessary steps. We saw frustrated owners, professionals lost in complicated interfaces and hotels wasting hours on processes that should take minutes.",
      storyP2: "We decided to do it differently. We built a platform where efficiency never compromises security — bookings in seconds, verified professionals and protected payments. We started in Portugal and Spain, with the ambition to be the #1 platform globally.",
      valuesTitle: "Our Pillars",
      valuesSubtitle: "Principles that guide every decision",
      ctaTitle: "Join PawCão",
      ctaText: "Whether you're an owner, professional or hotel — there's a place for you in the largest dog care community.",
      ctaButton: "Get Started",
      statLabels: {
        happyDogs: "Happy Dogs",
        professionals: "Professionals",
        walks: "Walks",
        rating: "Rating",
      },
    },
  };

  const tr = t[language] || t.pt;

  const values = [
    {
      icon: Zap,
      title: language === "pt" ? "Eficiência Sem Compromissos" : language === "es" ? "Eficiencia Sin Compromiso" : "Efficiency Without Compromise",
      description: language === "pt"
        ? "Reservas em segundos, registos simplificados. Sem formulários longos nem processos confusos."
        : language === "es"
          ? "Reservas en segundos, registros simplificados. Sin formularios largos ni procesos confusos."
          : "Bookings in seconds, simplified registration. No long forms or confusing processes.",
      color: "from-teal-500 to-cyan-600",
      bg: "bg-teal-50",
    },
    {
      icon: Shield,
      title: language === "pt" ? "Segurança Reforçada" : language === "es" ? "Seguridad Reforzada" : "Reinforced Security",
      description: language === "pt"
        ? "Verificação rigorosa, pagamentos encriptados e confiança total em cada transação."
        : language === "es"
          ? "Verificación rigurosa, pagos encriptados y confianza total en cada transacción."
          : "Rigorous verification, encrypted payments and complete trust in every transaction.",
      color: "from-slate-600 to-slate-800",
      bg: "bg-slate-50",
    },
    {
      icon: Heart,
      title: language === "pt" ? "Bem-Estar Animal" : language === "es" ? "Bienestar Animal" : "Animal Welfare",
      description: language === "pt"
        ? "Cão em primeiro lugar. Tracking GPS em tempo real, fotos diárias e acompanhamento constante."
        : language === "es"
          ? "El perro primero. Tracking GPS en tiempo real, fotos diarias y seguimiento constante."
          : "Dog first. Real-time GPS tracking, daily photos and constant monitoring.",
      color: "from-rose-500 to-pink-600",
      bg: "bg-rose-50",
    },
    {
      icon: Users,
      title: language === "pt" ? "Comunidade Global" : language === "es" ? "Comunidad Global" : "Global Community",
      description: language === "pt"
        ? "Conectamos donos, profissionais, hotéis e pet shops num ecossistema onde todos prosperam."
        : language === "es"
          ? "Conectamos dueños, profesionales, hoteles y tiendas pet en un ecosistema donde todos prosperan."
          : "We connect owners, professionals, hotels and pet shops in an ecosystem where everyone thrives.",
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
    },
  ];

  const statCards = [
    {
      icon: Dog,
      label: tr.statLabels.happyDogs,
      value: stats?.happyDogs ?? 0,
      suffix: "",
      gradient: "from-teal-500 to-emerald-600",
    },
    {
      icon: Users,
      label: tr.statLabels.professionals,
      value: stats?.totalProfessionals ?? 0,
      suffix: "",
      gradient: "from-slate-600 to-slate-800",
    },
    {
      icon: PawPrint,
      label: tr.statLabels.walks,
      value: stats?.totalWalks ?? 0,
      suffix: "",
      gradient: "from-rose-500 to-pink-600",
    },
    {
      icon: Star,
      label: tr.statLabels.rating,
      value: stats?.avgRating ?? "0.0",
      suffix: "/5",
      gradient: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* HERO */}
      <section className="relative pt-28 md:pt-36 pb-16 md:pb-24 px-4">
        {/* Decorative floating paws */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
          {[...Array(8)].map((_, i) => (
            <PawPrint
              key={i}
              className="absolute text-teal-900"
              style={{
                width: `${30 + i * 12}px`,
                height: `${30 + i * 12}px`,
                top: `${(i * 37) % 90}%`,
                left: `${(i * 53) % 95}%`,
                transform: `rotate(${i * 45}deg)`,
              }}
            />
          ))}
        </div>

        {/* Subtle gradient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: "linear-gradient(135deg, #0d9483, #2dd4bf)" }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full shadow-2xl ring-4 ring-white overflow-hidden relative group">
              <img
                src={PAWCAO_LOGO_URL}
                alt="PawCão"
                className="w-full h-full object-cover scale-110 transition-transform duration-700 group-hover:scale-125"
              />
              <div className="absolute inset-0 rounded-full ring-1 ring-black/5" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs font-bold text-teal-700 tracking-wide uppercase">{tr.heroBadge}</span>
          </div>

          {/* Title */}
          <h1 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl text-slate-900 mb-6 tracking-tight leading-none">
            {tr.heroTitle1}{" "}
            <span className="relative inline-block">
              Paw<span className="text-[#0d9483]">Cão</span>
              <PawPrint className="absolute -top-2 -right-6 w-5 h-5 md:w-7 md:h-7 text-teal-400 rotate-12" />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-light mb-8">
            {tr.heroSubtitle}
          </p>

          {/* CTA */}
          <Link
            to={createPageUrl("Home")}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-br from-[#0d9483] to-[#0f766e] text-white font-bold text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {tr.ctaButton}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* STATS — Real-time */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-slate-900 mb-2 tracking-tight">
              {tr.statsTitle}
            </h2>
            <p className="text-sm md:text-base text-slate-500 font-light">{tr.statsSubtitle}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {statCards.map((stat, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-lg group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient}`} />
                <div className="relative z-10">
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  {isLoading ? (
                    <div className="h-10 md:h-12 w-20 bg-white/20 rounded-lg animate-pulse" />
                  ) : (
                    <div className="text-3xl md:text-4xl lg:text-5xl font-heading font-extrabold mb-1 tracking-tight">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </div>
                  )}
                  <p className="text-xs md:text-sm font-semibold text-white/80 uppercase tracking-wide">
                    {stat.label}
                  </p>
                </div>
                {/* Decorative paw */}
                <PawPrint className="absolute -bottom-3 -right-3 w-16 h-16 text-white/10 rotate-12" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100/60 p-8 md:p-14 lg:p-16">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-200/30 rounded-full blur-3xl" />
            <div className="relative z-10">
              <span className="text-xs font-bold text-teal-600 tracking-widest uppercase mb-3 block">
                {tr.missionLabel}
              </span>
              <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-slate-900 mb-6 tracking-tight leading-tight">
                {tr.missionTitle}
              </h2>
              <p className="text-lg md:text-xl text-slate-700 leading-relaxed font-light max-w-3xl">
                {tr.missionText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold text-teal-600 tracking-widest uppercase mb-3 block">
            {tr.storyLabel}
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-slate-900 mb-8 tracking-tight leading-tight">
            {tr.storyTitle}
          </h2>
          <div className="space-y-5">
            <p className="text-lg md:text-xl text-slate-700 leading-relaxed font-light">{tr.storyP1}</p>
            <p className="text-lg md:text-xl text-slate-700 leading-relaxed font-light">{tr.storyP2}</p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-slate-900 mb-2 tracking-tight">
              {tr.valuesTitle}
            </h2>
            <p className="text-sm md:text-base text-slate-500 font-light">{tr.valuesSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {values.map((value, idx) => (
              <div
                key={idx}
                className="group bg-white border border-slate-100 rounded-3xl p-7 md:p-8 hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex gap-5"
              >
                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-lg md:text-xl text-slate-900 mb-2 tracking-tight">
                    {value.title}
                  </h3>
                  <p className="text-sm md:text-base text-slate-600 font-light leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 md:pb-28">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f766e] via-[#0d9483] to-[#0f766e] p-10 md:p-16 text-center text-white shadow-2xl">
            {/* Decorative paws */}
            <PawPrint className="absolute top-6 left-8 w-8 h-8 text-white/10 rotate-12" />
            <PawPrint className="absolute bottom-6 right-8 w-10 h-10 text-white/10 -rotate-12" />
            <PawPrint className="absolute top-1/2 right-12 w-6 h-6 text-white/10 rotate-45" />

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm mb-6">
                <PawPrint className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl mb-4 tracking-tight leading-tight">
                {tr.ctaTitle}
              </h2>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed mb-8">
                {tr.ctaText}
              </p>
              <Link
                to={createPageUrl("Home")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#0d9483] font-bold text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {tr.ctaButton}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}