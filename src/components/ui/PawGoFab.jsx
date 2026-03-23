import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Radar, PawPrint } from "lucide-react";

export default function PawGoFab() {
  const navigate = useNavigate();
  const location = useLocation();

  // Ocultar o FAB se já estivermos na página do PawGo
  if (location.pathname === createPageUrl("PostEmergency")) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-[100000]">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            "0px 0px 0px 0px rgba(249, 115, 22, 0.5)",
            "0px 0px 0px 20px rgba(249, 115, 22, 0)",
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        onClick={() => navigate(createPageUrl("PostEmergency"))}
        className="flex items-center justify-center h-14 w-14 md:w-auto md:px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-2xl hover:shadow-orange-500/50 transition-all border-2 border-white/20"
      >
        <div className="relative flex items-center justify-center">
          <PawPrint className="w-6 h-6 z-10" fill="currentColor" />
          <Radar className="w-8 h-8 absolute inset-0 -ml-1 -mt-1 text-white animate-ping opacity-60" style={{ animationDuration: '1.5s' }} />
        </div>
        <span className="hidden md:block ml-2 font-black tracking-wider text-lg">PawGo</span>
      </motion.button>
    </div>
  );
}