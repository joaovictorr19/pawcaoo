import { useState } from "react";
import { User, Briefcase, FileCheck, ArrowRight, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export function BecomeProMobile() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    city: "Porto",
    category: "Passeador",
    experience_years: "1",
    bio: "",
    nif: "",
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
  });

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.phone) {
      toast.error("Preenche o nome e telemóvel.");
      return;
    }

    setLoading(true);
    try {
      const professionalType = formData.category === 'Treinador' ? 'trainer' : 'walker';

      await base44.auth.updateMe({
        account_type: professionalType,
        professional_profile: {
          is_verified: false,
          verification_status: "pending",
          is_trained: professionalType === 'trainer',
          is_pawcao: false,
          category: formData.category,
          bio: formData.bio || "",
          avatar_url: user?.profile_photo_url || "",
          documents: { tax_id: formData.nif },
          rating: 0,
          services: [],
          platform_fee_percentage: 15,
        },
        wallet: user?.wallet || { free_walks: 0, balance: 0, currency: 'EUR' },
        pawgo_status: user?.pawgo_status || { is_online: false },
      });

      await base44.entities.WalkerProfile.create({
        walker_name: formData.full_name || user?.full_name,
        bio: formData.bio,
        location: formData.city,
        hourly_rate: 15,
        whatsapp_number: formData.phone,
        phone: formData.phone,
        experience_years: Number(formData.experience_years) || 1,
        is_active: false,
        verification_status: "pending",
        tax_id_portugal: formData.nif,
        dog_sizes: [],
        availability: [],
        services_offered: [],
        is_verified_trainer: professionalType === 'trainer',
      });

      setIsSubmitted(true);
      toast.success("Candidatura enviada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar candidatura.");
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <CheckCircle size={64} className="text-orange-500 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Candidatura Recebida!</h2>
        <p className="text-slate-500 text-sm font-medium mb-8">
          A tua conta foi criada, mas precisa ser aprovada pela nossa equipa de segurança.
          Avisaremos por email assim que puderes começar a receber pedidos na PawGo.
        </p>
        <Button className="w-full bg-slate-900 text-white rounded-2xl h-14" onClick={() => window.location.href = '/'}>
          Voltar ao Início
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {/* Progresso Visual */}
      <div className="flex items-center justify-between mb-8 px-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-2 flex-1 mx-1 rounded-full transition-colors ${step >= s ? 'bg-orange-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      <Card className="p-6 rounded-[2.5rem] shadow-sm border-slate-100">
        {/* PASSO 1: DADOS PESSOAIS */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 mb-4 text-orange-500">
              <User size={20} />
              <h3 className="font-black uppercase tracking-widest text-sm">Dados Pessoais</h3>
            </div>
            <input
              type="text"
              placeholder="Nome Completo"
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none"
            />
            <input
              type="tel"
              placeholder="Telemóvel / WhatsApp"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none"
            />
            <input
              type="text"
              placeholder="Cidade (ex: Porto)"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none"
            />
            <Button
              onClick={() => {
                if (!formData.full_name || !formData.phone) {
                  toast.error("Preenche o nome e telemóvel.");
                  return;
                }
                setStep(2);
              }}
              className="w-full bg-slate-900 text-white h-14 rounded-2xl mt-4"
            >
              Próximo Passo <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {/* PASSO 2: PERFIL PROFISSIONAL */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 mb-4 text-orange-500">
              <Briefcase size={20} />
              <h3 className="font-black uppercase tracking-widest text-sm">O Teu Serviço</h3>
            </div>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none"
            >
              <option value="Passeador">Passeador de Cães</option>
              <option value="Pet Sitter">Pet Sitter</option>
              <option value="Treinador">Treinador</option>
            </select>
            <input
              type="number"
              placeholder="Anos de Experiência (ex: 2)"
              value={formData.experience_years}
              onChange={e => setFormData({ ...formData, experience_years: e.target.value })}
              className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none"
            />
            <textarea
              placeholder="Fala um pouco sobre a tua experiência..."
              rows={3}
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none resize-none"
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setStep(1)} variant="outline" className="w-1/3 h-14 rounded-2xl border-slate-200">Voltar</Button>
              <Button onClick={() => setStep(3)} className="w-2/3 bg-slate-900 text-white h-14 rounded-2xl">
                Próximo <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* PASSO 3: SEGURANÇA E ENVIO */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 mb-4 text-orange-500">
              <FileCheck size={20} />
              <h3 className="font-black uppercase tracking-widest text-sm">Segurança</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Para garantir a segurança dos nossos tutores, precisamos do teu NIF para validar a tua identidade.
            </p>
            <input
              type="text"
              placeholder="NIF (Número de Contribuinte)"
              value={formData.nif}
              onChange={e => setFormData({ ...formData, nif: e.target.value })}
              className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={() => setStep(2)} variant="outline" className="w-1/3 h-14 rounded-2xl border-slate-200" disabled={loading}>
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                className="w-2/3 bg-orange-500 hover:bg-orange-600 text-white h-14 rounded-2xl font-black uppercase tracking-widest"
                disabled={loading}
              >
                {loading ? "A enviar..." : "Enviar para Aprovação"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}