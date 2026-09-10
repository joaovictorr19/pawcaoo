import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, Mail, Users, PawPrint } from "lucide-react";
import { getProfileCompleteness } from "@/lib/profileCompleteness";
import ProfileUpdateRequestDialog from "./ProfileUpdateRequestDialog";

const KIND_LABEL = { walker: "Walker", trainer: "Treinador", hotel: "Hotel", client: "Cliente" };

export default function AdminProfileModeration() {
  const [filter, setFilter] = useState("all"); // all | professional | client
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["profileModerationQueue"],
    queryFn: async () => {
      const [walkers, trainers, users, userProfiles] = await Promise.all([
        base44.entities.WalkerProfile.list("-created_date", 500),
        base44.entities.TrainerProfile.list("-created_date", 500),
        base44.entities.User.list("-created_date", 2000),
        base44.entities.UserProfile.list("-created_date", 2000),
      ]);

      const profileByEmail = {};
      (userProfiles || []).forEach((p) => {
        if (p.user_email) profileByEmail[p.user_email] = p;
      });

      const proWalkers = (walkers || [])
        .filter((w) => w.professional_type !== "shop")
        .map((w) => ({
          email: w.created_by,
          name: w.hotel_details?.hotel_name || w.walker_name,
          kind: w.professional_type === "hotel" ? "hotel" : "walker",
          profile: w,
          profileId: w.id,
          editUrl: "/ProfessionalSetup",
        }));

      const proTrainers = (trainers || []).map((t) => ({
        email: t.created_by,
        name: t.trainer_name,
        kind: "trainer",
        profile: t,
        profileId: t.id,
        editUrl: "/ProfessionalSetup",
      }));

      const proEmails = new Set([...proWalkers.map((p) => p.email), ...proTrainers.map((p) => p.email)]);

      const clients = (users || [])
        .filter((u) => u.email && !proEmails.has(u.email))
        .map((u) => {
          const up = profileByEmail[u.email];
          return {
            email: u.email,
            name: u.full_name || up?.full_name || u.email,
            kind: "client",
            profile: up || { full_name: u.full_name, profile_photo_url: u.profile_photo_url, city: u.city },
            profileId: up?.id,
            editUrl: "/AccountSettings",
          };
        });

      return [...proWalkers, ...proTrainers, ...clients];
    },
    staleTime: 60 * 1000,
  });

  const rows = useMemo(() => {
    if (!data) return [];
    return data
      .map((d) => {
        const c = getProfileCompleteness(d.profile, d.kind);
        return { ...d, percentage: c.percentage, missingItems: c.missingItems };
      })
      .filter((d) => {
        if (filter === "professional" && d.kind === "client") return false;
        if (filter === "client" && d.kind !== "client") return false;
        if (search) {
          const q = search.toLowerCase();
          if (!`${d.name || ""} ${d.email || ""}`.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.percentage - b.percentage);
  }, [data, filter, search]);

  const barColor = (p) => (p >= 80 ? "#10b981" : p >= 50 ? "#f59e0b" : "#ef4444");

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-extrabold text-slate-900">Moderação de Perfis</h2>
        </div>
        <p className="text-xs text-slate-500">
          Lista de perfis ordenada por completude. Clique num perfil para enviar um email a pedir a atualização das secções em falta.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou email..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-teal-400"
          />
        </div>
        <div className="flex gap-1.5 rounded-xl border border-slate-200 bg-white p-1">
          {[["all", "Todos"], ["professional", "Profissionais"], ["client", "Clientes"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === v ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-teal-500" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">Nenhum perfil encontrado.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => {
            const Icon = r.kind === "client" ? Users : PawPrint;
            return (
              <button
                key={(r.email || "") + "-" + i}
                onClick={() => setSelected(r)}
                className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left hover:border-teal-300 hover:shadow-sm transition"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-800">{r.name || "Sem nome"}</p>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      {KIND_LABEL[r.kind]}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-400">{r.email}</p>
                </div>
                <div className="hidden sm:block w-32 shrink-0">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-500">{r.missingItems.length} em falta</span>
                    <span className="font-black text-teal-700">{r.percentage}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.percentage}%`, background: barColor(r.percentage) }} />
                  </div>
                </div>
                <Mail className="w-4 h-4 text-teal-600 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <ProfileUpdateRequestDialog
          isOpen={true}
          onClose={() => setSelected(null)}
          recipientEmail={selected.email}
          recipientName={selected.name}
          profileKind={selected.kind}
          profile={selected.profile}
          profileId={selected.profileId}
          editUrl={selected.editUrl}
        />
      )}
    </div>
  );
}