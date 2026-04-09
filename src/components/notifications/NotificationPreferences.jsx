import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Bell, Mail, Smartphone, Zap, Calendar, CreditCard, AlertTriangle, MapPin, Star, Megaphone, Settings } from "lucide-react";

const TYPES = [
  { key: "booking",       label: "Reservas",       icon: Calendar,      desc: "Nova reserva, confirmação, cancelamento" },
  { key: "payment",       label: "Pagamentos",      icon: CreditCard,    desc: "Pagamentos recebidos, reembolsos" },
  { key: "pawgo_request", label: "PawGo",           icon: Zap,           desc: "Pedidos urgentes de passeio" },
  { key: "walk_update",   label: "Atualizações",    icon: MapPin,        desc: "Início/fim de passeio, localização" },
  { key: "alert",         label: "Alertas",         icon: AlertTriangle, desc: "Situações críticas e urgentes" },
  { key: "review",        label: "Avaliações",      icon: Star,          desc: "Nova avaliação ao teu perfil" },
  { key: "system",        label: "Sistema",         icon: Megaphone,     desc: "Atualizações da plataforma" },
  { key: "promo",         label: "Promoções",       icon: Bell,          desc: "Ofertas e novidades" },
];

const CHANNELS = [
  { key: "in_app", label: "In-app",  icon: Bell,        desc: "Notificações dentro da app" },
  { key: "email",  label: "Email",   icon: Mail,        desc: "Enviado para o teu email" },
  { key: "push",   label: "Push",    icon: Smartphone,  desc: "Notificação no dispositivo" },
];

const DEFAULT_PREFS = {
  booking:       { in_app: true,  email: true,  push: true  },
  payment:       { in_app: true,  email: true,  push: true  },
  pawgo_request: { in_app: true,  email: true,  push: true  },
  walk_update:   { in_app: true,  email: false, push: true  },
  alert:         { in_app: true,  email: true,  push: true  },
  review:        { in_app: true,  email: true,  push: false },
  system:        { in_app: true,  email: false, push: false },
  promo:         { in_app: true,  email: false, push: false },
};

export default function NotificationPreferences() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: records = [] } = useQuery({
    queryKey: ['notifPrefs', user?.email],
    queryFn: () => base44.entities.NotificationPreference.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [recordId, setRecordId] = useState(null);

  useEffect(() => {
    if (records.length > 0) {
      setRecordId(records[0].id);
      setPrefs({ ...DEFAULT_PREFS, ...records[0].preferences });
    }
  }, [records]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (recordId) {
        return base44.entities.NotificationPreference.update(recordId, { preferences: prefs });
      } else {
        return base44.entities.NotificationPreference.create({ user_email: user.email, preferences: prefs });
      }
    },
    onSuccess: (data) => {
      if (!recordId && data?.id) setRecordId(data.id);
      queryClient.invalidateQueries(['notifPrefs']);
      toast.success("Preferências guardadas!");
    },
  });

  const toggle = (type, channel) => {
    setPrefs(prev => ({
      ...prev,
      [type]: { ...prev[type], [channel]: !prev[type]?.[channel] },
    }));
  };

  const toggleAll = (channel, value) => {
    setPrefs(prev => {
      const next = { ...prev };
      TYPES.forEach(t => { next[t.key] = { ...next[t.key], [channel]: value }; });
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-bold text-gray-800">Preferências de Notificações</h2>
      </div>

      {/* Ações rápidas por canal */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Ativar/desativar canal completo</p>
          <div className="flex gap-3 flex-wrap">
            {CHANNELS.map(ch => {
              const Icon = ch.icon;
              const allOn = TYPES.every(t => prefs[t.key]?.[ch.key]);
              return (
                <button
                  key={ch.key}
                  onClick={() => toggleAll(ch.key, !allOn)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                    allOn ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {allOn ? `${ch.label} ✓` : ch.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabela por tipo */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase">Tipo de evento</span>
            {CHANNELS.map(ch => {
              const Icon = ch.icon;
              return (
                <div key={ch.key} className="flex flex-col items-center gap-1 px-3">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{ch.label}</span>
                </div>
              );
            })}
          </div>

          {TYPES.map((type, idx) => {
            const Icon = type.icon;
            return (
              <div
                key={type.key}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-0 px-4 py-3 items-center ${idx < TYPES.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{type.label}</p>
                    <p className="text-[11px] text-gray-400 hidden sm:block">{type.desc}</p>
                  </div>
                </div>
                {CHANNELS.map(ch => (
                  <div key={ch.key} className="flex items-center justify-center px-3">
                    <Switch
                      checked={!!prefs[type.key]?.[ch.key]}
                      onCheckedChange={() => toggle(type.key, ch.key)}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
      >
        {saveMutation.isPending ? "A guardar..." : "Guardar preferências"}
      </Button>
    </div>
  );
}