import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Radar, PawPrint } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function PawGoFab() {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
  });

  const isProfessional = user && ['walker', 'trainer', 'both'].includes(user.account_type);
  const targetUrl = isProfessional ? createPageUrl("ProfessionalDashboard") : createPageUrl("PostEmergency");

  // Ocultar o FAB
  return null;
}