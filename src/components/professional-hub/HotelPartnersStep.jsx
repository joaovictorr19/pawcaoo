import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, Trash2, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function HotelPartnersStep({ formData, set, onBack, onNext }) {
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);

  const partners = formData.hotel_details?.partner_walkers || [];

  const handleAddPartner = async () => {
    if (!searchEmail.trim()) return;
    const email = searchEmail.trim().toLowerCase();
    if (partners.some(p => p.walker_email === email)) {
      toast.error("Este passeador já está adicionado.");
      return;
    }
    setSearching(true);
    try {
      const profiles = await base44.entities.WalkerProfile.filter({ walker_email: email });
      const walkerProfile = profiles[0];
      if (!walkerProfile) {
        toast.error("Nenhum passeador encontrado com este email.");
        setSearching(false);
        return;
      }
      const newPartner = {
        walker_email: email,
        walker_name: walkerProfile.walker_name || email,
        walker_photo_url: walkerProfile.photo_url || "",
        walker_profile_id: walkerProfile.id,
        is_available_today: false,
        services: ["Passeio", "Entrega/Recolha"],
      };
      set("hotel_details", {
        ...formData.hotel_details,
        partner_walkers: [...partners, newPartner],
      });
      setSearchEmail("");
      toast.success(`${newPartner.walker_name} adicionado como parceiro!`);
    } catch {
      toast.error("Erro ao procurar passeador.");
    }
    setSearching(false);
  };

  const handleRemove = (email) => {
    set("hotel_details", {
      ...formData.hotel_details,
      partner_walkers: partners.filter(p => p.walker_email !== email),
    });
  };

  const toggleAvailable = (email) => {
    set("hotel_details", {
      ...formData.hotel_details,
      partner_walkers: partners.map(p =>
        p.walker_email === email ? { ...p, is_available_today: !p.is_available_today } : p
      ),
    });
  };

  return (
    <motion.div key="s2h" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter">Passeadores Parceiros</h2>
        <p className="text-slate-400 text-sm mt-1">Adiciona passeadores que trabalham com o hotel. Aparecerão no teu perfil público.</p>
      </div>

      {/* Adicionar por email */}
      <div className="p-4 bg-slate-800 rounded-2xl space-y-3">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adicionar por Email</Label>
        <div className="flex gap-2">
          <input
            value={searchEmail}
            onChange={e => setSearchEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddPartner())}
            placeholder="email@passeador.com"
            className="flex-1 h-10 px-3 bg-slate-900 text-white rounded-xl border border-slate-700 outline-none text-sm"
          />
          <Button type="button" onClick={handleAddPartner} disabled={searching || !searchEmail.trim()}
            className="h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm">
            {searching ? "..." : <><Plus className="w-4 h-4 mr-1" /> Adicionar</>}
          </Button>
        </div>
        <p className="text-xs text-slate-500">O passeador já deve estar registado na plataforma.</p>
      </div>

      {/* Lista de parceiros */}
      {partners.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum passeador parceiro adicionado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Parceiros ({partners.length})</Label>
          {partners.map(partner => (
            <div key={partner.walker_email} className="flex items-center gap-3 p-3 bg-slate-800 rounded-2xl border border-slate-700">
              <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0">
                {partner.walker_photo_url ? (
                  <img src={partner.walker_photo_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg">🐕</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{partner.walker_name}</p>
                <p className="text-slate-400 text-xs truncate">{partner.walker_email}</p>
              </div>
              {/* Toggle disponível hoje */}
              <button type="button" onClick={() => toggleAvailable(partner.walker_email)} title="Disponível hoje?">
                {partner.is_available_today
                  ? <ToggleRight className="w-6 h-6 text-green-400" />
                  : <ToggleLeft className="w-6 h-6 text-slate-500" />}
              </button>
              <button type="button" onClick={() => handleRemove(partner.walker_email)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <p className="text-xs text-slate-500">O ícone verde indica que o passeador está disponível hoje no hotel.</p>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <Button type="button" onClick={onBack} variant="outline" className="flex-1 h-12 border-slate-700 text-slate-400 hover:text-white bg-transparent rounded-2xl">
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <Button type="button" onClick={onNext} className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold">
          Continuar <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}