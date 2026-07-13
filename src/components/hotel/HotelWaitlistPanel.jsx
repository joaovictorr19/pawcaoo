import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, Plus, Trash2, Bell, X, Users, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "Extra Grande" };
const SERVICE_LABELS = { boarding: "Alojamento", daycare: "Creche", grooming: "Grooming", walk_with_partner: "Passeio", training: "Treino" };
const STATUS_CFG = {
  waiting: { label: "Em espera", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  notified: { label: "Avisado", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  converted: { label: "Convertido", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelado", cls: "bg-slate-50 text-slate-500 border-slate-200" },
};

export default function HotelWaitlistPanel({ hotelProfile }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    owner_name: "", owner_email: "", owner_phone: "",
    dog_name: "", dog_breed: "", dog_size: "medium",
    requested_checkin_date: "", requested_checkout_date: "",
    service_type: "boarding", notes: "",
  });

  const { data: waitlist = [], isLoading } = useQuery({
    queryKey: ["hotelWaitlist", hotelProfile?.id],
    queryFn: () => base44.entities.HotelWaitlist.filter({ hotel_profile_id: hotelProfile.id }, "-created_date", 100),
    enabled: !!hotelProfile?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HotelWaitlist.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotelWaitlist"] });
      toast.success("Adicionado à lista de espera");
      setShowForm(false);
      setForm({ owner_name: "", owner_email: "", owner_phone: "", dog_name: "", dog_breed: "", dog_size: "medium", requested_checkin_date: "", requested_checkout_date: "", service_type: "boarding", notes: "" });
    },
    onError: () => toast.error("Erro ao adicionar à lista"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HotelWaitlist.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotelWaitlist"] });
      toast.success("Estado atualizado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HotelWaitlist.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotelWaitlist"] });
      toast.success("Removido da lista");
    },
  });

  const handleNotify = (entry) => {
    updateMutation.mutate({ id: entry.id, data: { status: "notified", notified_at: new Date().toISOString() } });
    if (entry.owner_email) {
      base44.integrations.Core.SendEmail({
        to: entry.owner_email,
        subject: `Vaga disponível - ${hotelProfile?.hotel_details?.hotel_name || hotelProfile?.walker_name || "Hotel"}`,
        body: `<p>Olá ${entry.owner_name},</p><p>Temos uma vaga disponível para a data solicitada (${entry.requested_checkin_date}).</p><p>Entre em contacto para confirmar a reserva!</p>`,
      }).catch(() => {});
    }
  };

  const handleAdd = () => {
    if (!form.owner_name.trim() || !form.requested_checkin_date) {
      toast.error("Preenche o nome e a data pretendida.");
      return;
    }
    createMutation.mutate({
      ...form,
      hotel_profile_id: hotelProfile.id,
      hotel_email: hotelProfile.created_by,
      num_dogs: 1,
    });
  };

  const active = waitlist.filter(w => w.status === "waiting" || w.status === "notified");

  const inputCls = "w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Lista de Espera</h3>
          <p className="text-xs text-slate-400">{active.length} cliente(s) em espera</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">Novo Registo</p>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} placeholder="Nome do dono *" className={inputCls} />
            <input value={form.owner_phone} onChange={e => setForm(f => ({ ...f, owner_phone: e.target.value }))} placeholder="Telefone" className={inputCls} />
            <input value={form.owner_email} onChange={e => setForm(f => ({ ...f, owner_email: e.target.value }))} placeholder="Email" className={inputCls} />
            <input value={form.dog_name} onChange={e => setForm(f => ({ ...f, dog_name: e.target.value }))} placeholder="Nome do cão" className={inputCls} />
            <input value={form.dog_breed} onChange={e => setForm(f => ({ ...f, dog_breed: e.target.value }))} placeholder="Raça" className={inputCls} />
            <select value={form.dog_size} onChange={e => setForm(f => ({ ...f, dog_size: e.target.value }))} className={inputCls}>
              {Object.entries(SIZE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} className={inputCls}>
              {Object.entries(SERVICE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input type="date" value={form.requested_checkin_date} onChange={e => setForm(f => ({ ...f, requested_checkin_date: e.target.value }))} className={inputCls} />
            <input type="date" value={form.requested_checkout_date} onChange={e => setForm(f => ({ ...f, requested_checkout_date: e.target.value }))} className={inputCls} />
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Notas..." className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 resize-none bg-white" />
          <Button onClick={handleAdd} disabled={createMutation.isPending}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs">
            {createMutation.isPending ? "A adicionar..." : "Adicionar à Lista"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl py-8 text-center">
          <p className="text-slate-400 text-sm">A carregar...</p>
        </div>
      ) : active.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-12 text-center">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm font-medium">Lista de espera vazia</p>
          <p className="text-slate-400 text-xs mt-1">Adicione clientes quando o hotel estiver lotado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map(entry => {
            const cfg = STATUS_CFG[entry.status] || STATUS_CFG.waiting;
            return (
              <div key={entry.id} className="bg-white border border-slate-200 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{entry.owner_name}</p>
                      <Badge variant="outline" className={`text-[10px] border ${cfg.cls}`}>{cfg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 flex-wrap">
                      {entry.dog_name && <span>{entry.dog_name}{entry.dog_breed ? ` · ${entry.dog_breed}` : ""}</span>}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {entry.requested_checkin_date}
                        {entry.requested_checkout_date ? ` → ${entry.requested_checkout_date}` : ""}
                      </span>
                      {entry.service_type && <span>{SERVICE_LABELS[entry.service_type]}</span>}
                    </div>
                    {entry.notes && <p className="text-xs text-slate-500 mt-1.5">{entry.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {entry.status === "waiting" && (
                      <Button size="sm" variant="outline"
                        className="h-7 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-[10px] gap-1"
                        onClick={() => handleNotify(entry)}>
                        <Bell className="w-3 h-3" /> Avisar
                      </Button>
                    )}
                    <Button size="sm" variant="outline"
                      className="h-7 border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg text-[10px]"
                      onClick={() => updateMutation.mutate({ id: entry.id, data: { status: "converted" } })}>
                      Converter
                    </Button>
                    <button onClick={() => deleteMutation.mutate(entry.id)}
                      className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}