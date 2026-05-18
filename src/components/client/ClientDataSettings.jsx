import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, User, Save } from "lucide-react";
import { toast } from "sonner";

export default function ClientDataSettings({ user }) {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ['clientDashboardProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const [form, setForm] = React.useState({
    full_name: '',
    phone: '',
    street: '',
    door_number: '',
    floor_apt: '',
    postal_code: '',
    city: '',
    country: 'Portugal',
    access_notes: '',
  });

  React.useEffect(() => {
    if (!user) return;
    const stats = profile?.profile_stats || {};
    setForm({
      full_name: profile?.full_name || user?.full_name || '',
      phone: stats.phone || user?.phone || '',
      street: stats.street || '',
      door_number: stats.door_number || '',
      floor_apt: stats.floor_apt || '',
      postal_code: stats.postal_code || '',
      city: stats.city || profile?.city || user?.city || '',
      country: stats.country || 'Portugal',
      access_notes: stats.access_notes || '',
    });
  }, [profile, user]);

  const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fullAddress = [form.street, form.door_number, form.floor_apt]
        .filter(Boolean)
        .join(', ') + (form.postal_code ? `, ${form.postal_code}` : '') + (form.city ? ` ${form.city}` : '') + (form.country ? `, ${form.country}` : '');

      await base44.auth.updateMe({
        full_name: form.full_name,
        phone: form.phone,
        city: form.city,
      });

      if (!profile?.id) return;

      await base44.entities.UserProfile.update(profile.id, {
        full_name: form.full_name,
        city: form.city,
        profile_stats: {
          ...(profile.profile_stats || {}),
          street: form.street,
          door_number: form.door_number,
          floor_apt: form.floor_apt,
          postal_code: form.postal_code,
          city: form.city,
          country: form.country,
          pickup_address: fullAddress,
          address: fullAddress,
          phone: form.phone,
          access_notes: form.access_notes,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['clientDashboardProfile'] });
      toast.success('Dados atualizados com sucesso.');
    },
    onError: () => {
      toast.error('Não foi possível atualizar os dados.');
    }
  });

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border border-white/5 shadow-lg">
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="text-lg font-black text-white">Dados enviados ao profissional</h3>
            <p className="text-xs text-slate-400 mt-1">Estes dados são usados na recolha do animal após a reserva ser aceite.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Nome completo
            </label>
            <Input value={form.full_name} onChange={(e) => setValue('full_name', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" /> Telefone / WhatsApp
            </label>
            <Input value={form.phone} onChange={(e) => setValue('phone', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Rua
              </label>
              <Input value={form.street} onChange={(e) => setValue('street', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nº porta</label>
              <Input value={form.door_number} onChange={(e) => setValue('door_number', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Andar / Apt.</label>
              <Input value={form.floor_apt} onChange={(e) => setValue('floor_apt', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Código postal</label>
              <Input value={form.postal_code} onChange={(e) => setValue('postal_code', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cidade</label>
              <Input value={form.city} onChange={(e) => setValue('city', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">País</label>
              <Input value={form.country} onChange={(e) => setValue('country', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Instruções de acesso</label>
            <Textarea value={form.access_notes} onChange={(e) => setValue('access_notes', e.target.value)} className="bg-slate-800 border-slate-700 text-white min-h-[96px]" />
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black rounded-2xl">
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'A guardar...' : 'Guardar dados de recolha'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}