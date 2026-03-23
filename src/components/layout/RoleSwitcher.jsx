import React from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { User, Briefcase, Zap, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RoleSwitcher({ authUser }) {
  // Role switcher movido para a Home conforme pedido do usuário.
  // Mantemos o componente vazio ou com display none para não quebrar referências no Layout
  return null;
}