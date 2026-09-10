import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickCreateDummy({ onCreated }) {
  const [loading, setLoading] = useState(false);

  const createDummy = async () => {
    setLoading(true);
    const dummyId = `test_${Math.floor(Math.random() * 1000)}`;
    const email = `${dummyId}@pawgo.pt`;
    
    const newDummy = {
      full_name: `PRO Teste ${dummyId}`,
      email: email,
      account_type: 'both',
      role: 'user',
      photo_url: `https://i.pravatar.cc/300?img=${Math.floor(Math.random() * 70)}`,
      professional_profile: {
        verification_status: 'verified',
        is_trained: true,
        is_pawcao: true,
        bio: "Perfil de teste para validação de sistema."
      },
      pawgo_status: {
        is_online: true
      },
      // Localização na zona do Porto / Lisboa (aleatório em torno do Porto aqui)
      latitude: 41.1579 + (Math.random() * 0.05 - 0.025), 
      longitude: -8.6291 + (Math.random() * 0.05 - 0.025)
    };

    try {
      const user = await base44.entities.User.create(newDummy);
      
      await base44.entities.WalkerProfile.create({
        user_id: user.id,
        created_by: user.email,
        walker_name: user.full_name,
        location: "Porto",
        latitude: newDummy.latitude,
        longitude: newDummy.longitude,
        hourly_rate: 15,
        whatsapp_number: "912345678",
        verification_status: "verified",
        is_active: true,
        is_online: true,
        has_pawcao_seal: true,
        is_verified_trainer: true,
        photo_url: user.photo_url,
        bio: newDummy.professional_profile.bio
      });

      toast.success("Profissional de Teste Criado! 🚀", {
        description: "Ele já aparece no mapa com todos os selos ativos."
      });
      if (onCreated) onCreated();
    } catch (e) {
      toast.error("Erro ao criar perfil de teste.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={createDummy}
      disabled={loading}
      className="bg-teal-600 text-white rounded-2xl h-12 px-6 flex items-center gap-2 shadow-xl active:scale-95 transition-all w-full md:w-auto"
    >
      {loading ? (
        <Loader2 className="animate-spin w-5 h-5" />
      ) : (
        <>
          <UserPlus className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest">Criar Teste</span>
        </>
      )}
    </Button>
  );
}