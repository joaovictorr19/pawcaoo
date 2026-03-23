import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function ImpersonationBanner() {
  const navigate = useNavigate();
  const impersonationData = JSON.parse(localStorage.getItem('impersonation') || 'null');

  if (!impersonationData) return null;

  const handleStopImpersonation = () => {
    localStorage.removeItem('impersonation');
    window.location.href = createPageUrl('AdminDashboard');
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-[999999] bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-2xl pb-safe"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm md:text-base">
              🔴 YOU ARE IMPERSONATING: {impersonationData.targetUserName}
            </p>
            <p className="text-xs opacity-90">
              {impersonationData.targetUserEmail}
            </p>
          </div>
        </div>
        <Button
          onClick={handleStopImpersonation}
          size="sm"
          className="bg-white text-red-600 hover:bg-gray-100 font-bold flex-shrink-0"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Switch Back to Admin
        </Button>
      </div>
    </motion.div>
  );
}