import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Building2, Dog, User, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ProfessionalTypeSelect() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.email) { setChecking(false); return; }

        // Verificar se já tem perfil de walker/trainer/hotel
        const walkers = await base44.entities.WalkerProfile.filter({ created_by: user.email });
        if (walkers.length > 0 && walkers[0].walker_name && walkers[0].verification_status === "verified") {
          // Já tem perfil verificado — redirecionar para o dashboard apropriado
          const wp = walkers[0];
          if (wp.professional_type === "hotel") {
            navigate("/HotelDashboard", { replace: true });
          } else {
            navigate("/ProfessionalHubV2", { replace: true });
          }
          return;
        }

        // Verificar se já tem perfil de cliente completo
        const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        if (profiles.length > 0 && profiles[0].full_name && profiles[0].city) {
          navigate("/", { replace: true });
          return;
        }
      } catch (e) {
        // Não autenticado ou erro — mostrar seleção normalmente
      }
      setChecking(false);
    };
    checkExistingProfile();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const options = [
    {
      type: "walker",
      title: "Passeador / Treinador",
      desc: "Passeios, treino, visitas ao domicílio",
      icon: Dog,
      color: "orange",
      route: "/WalkerOnboarding",
    },
    {
      type: "hotel",
      title: "Hotel Canino",
      desc: "Alojamento, creche e gestão de capacidades",
      icon: Building2,
      color: "purple",
      route: "/HotelOnboarding",
    },
    {
      type: "client",
      title: "Cliente",
      desc: "Regista os teus animais e reserva serviços",
      icon: User,
      color: "blue",
      route: "/ClientSetup",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-10 pt-6">
      <div className="w-full max-w-2xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/")}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
        </motion.button>

        <motion.div className="mb-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full mb-4">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Onboarding Profissional</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Que tipo de profissional és?</h1>
          <p className="text-slate-400 text-base font-light">Escolhe o fluxo de configuração adequado ao teu serviço.</p>
        </motion.div>

        <div className="space-y-4">
          {options.map((opt, idx) => {
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(opt.route)}
                className={`w-full p-6 rounded-3xl border-2 text-left transition-all group relative overflow-hidden ${
                  opt.color === "orange"
                    ? "border-slate-800 bg-slate-900 hover:border-orange-500/50 hover:bg-orange-500/5"
                    : opt.color === "blue"
                    ? "border-slate-800 bg-slate-900 hover:border-blue-500/50 hover:bg-blue-500/5"
                    : "border-slate-800 bg-slate-900 hover:border-purple-500/50 hover:bg-purple-500/5"
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    opt.color === "orange" ? "bg-orange-500/10" : opt.color === "blue" ? "bg-blue-500/10" : "bg-purple-500/10"
                  }`}>
                    <Icon className={`w-8 h-8 ${opt.color === "orange" ? "text-orange-400" : opt.color === "blue" ? "text-blue-400" : "text-purple-400"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-lg">{opt.title}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{opt.desc}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                    opt.color === "orange" ? "text-orange-400" : opt.color === "blue" ? "text-blue-400" : "text-purple-400"
                  }`} />
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-xs text-slate-400 text-center"
        >
          💡 Já tens um perfil? Podes editá-lo a qualquer momento no teu painel profissional.
        </motion.div>
      </div>
    </div>
  );
}