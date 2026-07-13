import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import {
  Hotel,
  Dog,
  ArrowRight,
  BedDouble,
  Sun,
  Scissors,
  PawPrint,
  Calendar,
  Wallet,
  Users,
  MapPin,
} from "lucide-react";

const HOTEL_FEATURES = [
  { icon: BedDouble, label: "Alojamento e creche" },
  { icon: Calendar, label: "Gestão de reservas" },
  { icon: Users, label: "Hóspedes e capacidades" },
  { icon: Wallet, label: "Finanças integradas" },
];

const WALKER_FEATURES = [
  { icon: PawPrint, label: "Passeios individuais e em grupo" },
  { icon: Sun, label: "Visitas ao domicílio" },
  { icon: Scissors, label: "Treino e serviços extra" },
  { icon: MapPin, label: "Áreas de serviço personalizadas" },
];

function OptionCard({ icon: Icon, title, desc, features, cta, highlighted, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4 }}
      className={`flex flex-col rounded-2xl border p-5 text-left transition-all ${
        highlighted
          ? "border-slate-900 bg-white shadow-lg shadow-slate-200/60"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
          highlighted ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
        }`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-slate-900 text-base mb-1">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-4">{desc}</p>
      <ul className="flex flex-col gap-2 mb-5 flex-1">
        {features.map(({ icon: FIcon, label }) => (
          <li key={label} className="flex items-center gap-2 text-xs text-slate-600">
            <FIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {label}
          </li>
        ))}
      </ul>
      <Button
        onClick={onClick}
        className={`w-full h-11 rounded-xl font-semibold ${
          highlighted
            ? "bg-slate-900 hover:bg-slate-800 text-white"
            : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {cta}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}

export default function HotelOnboardingEmpty({ userName }) {
  const navigate = useNavigate();
  const firstName = userName?.split(" ")[0] || "";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-4">
            <Hotel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {firstName ? `Olá, ${firstName}!` : "Bem-vindo!"}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
            Ainda não tens um perfil profissional criado. Escolhe o tipo de conta que queres
            configurar para começar a gerir o teu negócio.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OptionCard
            icon={Hotel}
            title="Hotel Canino"
            desc="Alojamento, creche e gestão completa de capacidades, hóspedes e reservas."
            features={HOTEL_FEATURES}
            cta="Criar Conta de Hotel"
            highlighted
            onClick={() => navigate(createPageUrl("HotelOnboarding"))}
          />
          <OptionCard
            icon={Dog}
            title="Passeador / Treinador"
            desc="Passeios, visitas ao domicílio, treino e serviços personalizados para cães."
            features={WALKER_FEATURES}
            cta="Criar Conta de Passeador"
            onClick={() => navigate(createPageUrl("WalkerOnboarding"))}
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-slate-400 mt-6"
        >
          Podes alterar o teu tipo de conta mais tarde nas definições.
        </motion.p>
      </div>
    </div>
  );
}