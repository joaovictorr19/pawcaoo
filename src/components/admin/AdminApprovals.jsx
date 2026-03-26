import { Check, X, User, ShieldAlert, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export function AdminApprovals({ pendingUsers, onRefresh }) {

  const handleApprove = async (pro) => {
    try {
      // Atualizar professional_profile mantendo todos os campos existentes
      await base44.entities.User.update(pro.id, {
        professional_profile: {
          ...pro.professional_profile,
          verification_status: "verified",
          is_active: true,
        }
      });

      // Sincronizar também o WalkerProfile (retrocompatibilidade)
      try {
        const walkers = await base44.entities.WalkerProfile.filter({ created_by: pro.email });
        if (walkers.length > 0) {
          await base44.entities.WalkerProfile.update(walkers[0].id, {
            is_active: true,
            verification_status: "verified",
            is_verified: true,
          });
        }
      } catch (_) {
        // não crítico
      }

      toast.success("Profissional aprovado com sucesso! 🎉");
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao aprovar.");
    }
  };

  const handleReject = async (pro) => {
    if (!confirm("Tens a certeza que queres rejeitar esta candidatura?")) return;
    try {
      await base44.entities.User.update(pro.id, {
        professional_profile: {
          ...pro.professional_profile,
          verification_status: "rejected",
          is_active: false,
        }
      });
      toast.info("Candidatura rejeitada.");
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao rejeitar.");
    }
  };

  return (
    <div className="space-y-4 px-2 mt-6">
      <div className="flex items-center gap-2 mb-6">
        <ShieldAlert className="text-orange-500" size={20} />
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
          Candidaturas Pendentes
        </h2>
        {pendingUsers.length > 0 && (
          <span className="ml-auto bg-orange-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
            {pendingUsers.length}
          </span>
        )}
      </div>

      {pendingUsers.length === 0 && (
        <div className="text-center py-20 opacity-40">
          <User size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-xs font-bold">Tudo em dia! Sem aprovações pendentes.</p>
        </div>
      )}

      {pendingUsers.map((pro) => (
        <Card key={pro.id} className="p-6 rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden relative">
          {/* Tag de Categoria */}
          <div className="absolute top-4 right-6 bg-slate-50 px-3 py-1 rounded-full">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
              {pro.professional_profile?.category || "Profissional"}
            </span>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
              {pro.profile_photo_url
                ? <img src={pro.profile_photo_url} className="w-full h-full object-cover" alt={pro.full_name} />
                : <User size={24} />
              }
            </div>
            <div>
              <h3 className="font-black text-slate-900 leading-tight">{pro.full_name || "Sem nome"}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{pro.email}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                {pro.city || pro.professional_profile?.city || "—"} • NIF: {pro.professional_profile?.documents?.tax_id || "Não fornecido"}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Award size={14} className="text-orange-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase">Experiência</span>
              <span className="text-[10px] font-bold text-slate-900">
                {pro.professional_profile?.experience_years ?? "—"} anos
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">
              "{pro.professional_profile?.bio || "Sem biografia preenchida."}"
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleReject(pro)}
              variant="outline"
              className="flex-1 rounded-2xl h-14 border-red-100 text-red-500 hover:bg-red-50 font-black uppercase text-[10px] tracking-widest"
            >
              <X size={16} className="mr-2" /> Rejeitar
            </Button>
            <Button
              onClick={() => handleApprove(pro)}
              className="flex-[2] rounded-2xl h-14 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-100"
            >
              <Check size={16} className="mr-2" /> Aprovar Profissional
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}