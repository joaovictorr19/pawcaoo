import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut, Home, Building2, BarChart3, Calendar, User, Wallet, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const QUICK_LINKS = [
  { id: "Home", label: "Início", icon: Home },
  { id: "UserProfile", label: "Perfil", icon: User },
  { id: "HotelDashboard", label: "Hotel", icon: Building2 },
  { id: "ProfessionalHubV2", label: "Painel Pro", icon: BarChart3 },
  { id: "ProfessionalCalendar", label: "Calendário", icon: Calendar },
  { id: "MyWallet", label: "Carteira", icon: Wallet },
];

export default function ImpersonationBanner() {
  const navigate = useNavigate();
  const [showLinks, setShowLinks] = useState(false);
  const impersonationData = JSON.parse(localStorage.getItem('impersonation') || 'null');

  if (!impersonationData) return null;

  const handleStopImpersonation = () => {
    localStorage.removeItem('impersonation');
    window.location.href = createPageUrl('AdminDashboard');
  };

  const go = (page) => {
    setShowLinks(false);
    navigate(createPageUrl(page));
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-[999999] bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-2xl pb-safe"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm md:text-base">
              🔴 A OPERAR COMO: {impersonationData.targetUserName}
            </p>
            <p className="text-xs opacity-90">
              {impersonationData.targetUserEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick navigation */}
          <div className="relative">
            <Button
              onClick={() => setShowLinks(!showLinks)}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 font-semibold"
            >
              Navegar
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showLinks ? 'rotate-180' : ''}`} />
            </Button>
            <AnimatePresence>
              {showLinks && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 min-w-[200px]"
                >
                  {QUICK_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                      <button
                        key={link.id}
                        onClick={() => go(link.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-slate-500" />
                        {link.label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            onClick={handleStopImpersonation}
            size="sm"
            className="bg-white text-red-600 hover:bg-gray-100 font-bold flex-shrink-0"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Voltar a Admin
          </Button>
        </div>
      </div>
    </motion.div>
  );
}