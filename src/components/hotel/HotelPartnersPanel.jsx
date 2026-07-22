import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, ToggleLeft, ToggleRight, Plus, ChevronDown, ChevronUp,
  Shield, ShieldCheck, ShieldAlert, Pencil
} from "lucide-react";

const TITLE_OPTIONS = [
  "Funcionário",
  "Treinador",
  "Veterinário",
  "Passeador",
  "Groomer",
  "Rececionista",
  "Gerente",
  "Voluntário",
];

const SERVICE_LABELS = {
  walk: "Passeio",
  boarding: "Alojamento",
  daycare: "Creche",
  grooming: "Grooming",
  training: "Treino",
  dropin: "Visita",
  other: "Outro",
};

const ROLE_CONFIG = {
  simple: {
    label: "Acesso Simples",
    desc: "Vê apenas reservas atribuídas a si",
    icon: Shield,
    iconCls: "text-slate-400",
    badgeCls: "bg-slate-100 text-slate-500 border-slate-200",
  },
  limited: {
    label: "Acesso Limitado",
    desc: "Vê todas as reservas do hotel",
    icon: ShieldAlert,
    iconCls: "text-amber-500",
    badgeCls: "bg-amber-50 text-amber-600 border-amber-200",
  },
  full: {
    label: "Acesso Total",
    desc: "Pode criar passeios, gerir reservas e aceder a funções do hotel",
    icon: ShieldCheck,
    iconCls: "text-emerald-600",
    badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export default function HotelPartnersPanel({ partners = [], bookings = [], onToggleAvailability, onAddPartner, onUpdatePartnerRole, onUpdatePartnerTitle }) {
  const [expandedPartner, setExpandedPartner] = useState(null);

  const partnerBookingCount = (email) =>
    bookings.filter(b => b.assigned_walker_email === email && !["cancelled", "rejected", "completed"].includes(b.status)).length;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-slate-800">Profissionais Parceiros</h3>
          <p className="text-xs text-slate-400">{partners.length} parceiro(s) registado(s)</p>
        </div>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1.5"
          onClick={onAddPartner}>
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </Button>
      </div>

      {partners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-purple-200 py-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-purple-200" />
          <p className="text-slate-500 font-medium text-sm">Sem profissionais parceiros</p>
          <p className="text-slate-400 text-xs mt-1">Adiciona passeadores, groomers e treinadores ao teu hotel</p>
          <Button size="sm" className="mt-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1.5"
            onClick={onAddPartner}>
            <Plus className="w-3.5 h-3.5" /> Adicionar Profissional
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map(partner => {
            const activeJobs = partnerBookingCount(partner.walker_email);
            const isExpanded = expandedPartner === partner.walker_email;
            const role = partner.partner_role || "simple";
            const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.simple;
            const RoleIcon = roleCfg.icon;

            return (
              <div key={partner.walker_email}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${partner.is_available_today ? "border-green-200" : "border-slate-100"}`}>
                <div className="p-4 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-purple-100 to-purple-200">
                    {partner.walker_photo_url ? (
                      <img src={partner.walker_photo_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm">{partner.walker_name}</p>
                      {partner.custom_title && (
                        <Badge className="bg-purple-100 text-purple-700 text-[9px] border-0 px-1.5 font-bold">
                          {partner.custom_title}
                        </Badge>
                      )}
                      {activeJobs > 0 && (
                        <Badge className="bg-orange-100 text-orange-700 text-[9px] border-0 px-1.5">{activeJobs} ativas</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{partner.walker_email}</p>
                    {/* Role badge */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <RoleIcon className={`w-3 h-3 ${roleCfg.iconCls}`} />
                      <Badge variant="outline" className={`text-[9px] ${roleCfg.badgeCls}`}>
                        {roleCfg.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Toggle + expand */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onToggleAvailability(partner.walker_email)}
                      title={partner.is_available_today ? "Disponível hoje — clica para desativar" : "Indisponível hoje — clica para ativar"}
                    >
                      {partner.is_available_today
                        ? <ToggleRight className="w-8 h-8 text-green-500" />
                        : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                    </button>
                    <button onClick={() => setExpandedPartner(isExpanded ? null : partner.walker_email)}
                      className="text-slate-400 hover:text-purple-600 transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded: role management + bookings assigned */}
                {isExpanded && (
                  <div className="border-t border-slate-50 bg-slate-50 px-4 pb-3 pt-3 space-y-3">
                    {/* Title Selector */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-2 flex items-center gap-1.5">
                        <Pencil className="w-3 h-3" /> Título / Cargo
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {TITLE_OPTIONS.map(title => {
                          const isActive = (partner.custom_title || "Funcionário") === title;
                          return (
                            <button key={title}
                              onClick={() => onUpdatePartnerTitle?.(partner.walker_email, title)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border-2 transition-all ${
                                isActive
                                  ? "border-purple-500 bg-purple-100 text-purple-700"
                                  : "border-slate-100 bg-white/50 text-slate-400 hover:border-purple-200"
                              }`}>
                              {title}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Role Selector */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-2 flex items-center gap-1.5">
                        <Shield className="w-3 h-3" /> Nível de Acesso
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
                          const Icon = cfg.icon;
                          const isActive = role === key;
                          return (
                            <button key={key}
                              onClick={() => onUpdatePartnerRole?.(partner.walker_email, key)}
                              className={`text-left p-2.5 rounded-xl border-2 transition-all ${
                                isActive
                                  ? "border-slate-900 bg-white shadow-sm"
                                  : "border-slate-100 bg-white/50 hover:border-slate-200"
                              }`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Icon className={`w-3.5 h-3.5 ${isActive ? cfg.iconCls : "text-slate-300"}`} />
                                <span className={`text-[11px] font-bold ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                                  {cfg.label}
                                </span>
                                {isActive && (
                                  <span className="ml-auto w-2 h-2 rounded-full bg-slate-900" />
                                )}
                              </div>
                              <p className="text-[9px] text-slate-400 leading-tight">{cfg.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bookings assigned */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-2">Reservas atribuídas</p>
                      {bookings.filter(b => b.assigned_walker_email === partner.walker_email && !["cancelled", "rejected"].includes(b.status)).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Nenhuma reserva atribuída</p>
                      ) : (
                        <div className="space-y-1.5">
                          {bookings.filter(b => b.assigned_walker_email === partner.walker_email && !["cancelled", "rejected"].includes(b.status)).map(b => (
                            <div key={b.id} className="bg-white rounded-lg px-3 py-2 flex items-center justify-between border border-slate-100">
                              <div>
                                <p className="text-xs font-bold text-slate-800">{b.owner_name}</p>
                                <p className="text-[10px] text-slate-400">{b.checkin_date} · {b.total_dogs || 1} cão(ões)</p>
                              </div>
                              <Badge className={`text-[9px] border-0 ${b.status === "confirmed" ? "bg-blue-100 text-blue-700" : b.status === "checked_in" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                {b.status === "confirmed" ? "Confirmado" : b.status === "checked_in" ? "Check-in" : b.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}