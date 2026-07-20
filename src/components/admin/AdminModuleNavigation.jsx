import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Globe2, CalendarDays, BadgeCheck, Users, Zap, Trophy, PawPrint, ShieldAlert, Bug, WalletCards } from "lucide-react";

const modules = [
  ["overview", "Visão Geral", LayoutDashboard], ["godmode", "Análises", Globe2],
  ["calendar", "Agenda", CalendarDays], ["approvals", "Aprovações", BadgeCheck],
  ["users", "Utilizadores", Users], ["operations", "Operações", Zap],
  ["gamification", "Gamificação", Trophy], ["professionals", "Profissionais", PawPrint],
  ["moderation", "Moderação", ShieldAlert], ["debug", "Diagnóstico", Bug],
  ["financeiro", "Financeiro", WalletCards],
];

export default function AdminModuleNavigation({ approvalCount = 0 }) {
  return (
    <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {modules.map(([value, label, Icon]) => (
        <TabsTrigger key={value} value={value} className="group relative min-h-[76px] justify-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 shadow-sm transition-colors duration-200 hover:border-teal-200 hover:bg-teal-50/60 data-[state=active]:border-teal-500 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-800 data-[state=active]:shadow-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors duration-200 group-data-[state=active]:bg-teal-600 group-data-[state=active]:text-white">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0 text-sm font-bold leading-tight">{label}</span>
          {value === "approvals" && approvalCount > 0 && <span className="absolute right-2 top-2 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">{approvalCount}</span>}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}