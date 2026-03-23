import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Dog, ShieldCheck, Banknote, Map, Check, ChevronRight, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProfessionalSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: "",
    base_price: "",
    services: [], // Array de objetos {name, price, type}
    document_url: null,
    iban: ""
  });

  const nextStep = () => setStep(s => s + 1);

  const finishSetup = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        account_type: "both",
        professional_profile: {
          bio: formData.bio,
          services: formData.services.length > 0 ? formData.services : [{ name: "Passeio (1h)", price: Number(formData.base_price) || 15, type: "walk" }],
          verification_status: "pending",
          rating: 5.0,
          joined_at: new Date().toISOString()
        },
        financial_info: {
          iban: formData.iban,
          total_earned: 0
        }
      });
      toast.success("Perfil enviado para aprovação!");
      navigate(createPageUrl("ProfessionalHubV2"));
    } catch (e) {
      toast.error("Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white min-h-screen flex flex-col justify-center pt-20">
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${step >= i ? 'bg-orange-500' : 'bg-slate-100'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-3xl font-black tracking-tighter mb-2">Sua Bio Profissional</h2>
            <p className="text-slate-500 mb-6 text-sm">Conte aos tutores por que você é a melhor escolha para os patudos deles.</p>
            <textarea 
              className="w-full h-40 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-orange-500 outline-none text-slate-700"
              placeholder="Ex: Sou apaixonado por cães há 10 anos e tenho certificação em treino positivo..."
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
            />
            <Button onClick={nextStep} className="w-full h-14 mt-8 bg-slate-900 rounded-2xl text-lg font-bold text-white hover:bg-slate-800">Continuar</Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-3xl font-black tracking-tighter mb-2">Serviços & Preços</h2>
            <p className="text-slate-500 mb-6 text-sm">Defina o valor base para o seu serviço principal.</p>
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-2xl border-2 border-orange-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Dog className="text-orange-600 w-5 h-5" />
                  <span className="font-bold">Passeio (1h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    className="w-16 bg-transparent text-right font-black text-orange-600 outline-none" 
                    placeholder="15"
                    value={formData.base_price}
                    onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                  />
                  <span className="font-bold text-orange-600">€</span>
                </div>
              </div>
            </div>
            <Button onClick={nextStep} className="w-full h-14 mt-8 bg-slate-900 rounded-2xl text-lg font-bold text-white hover:bg-slate-800">Próximo Passo</Button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-3xl font-black tracking-tighter mb-2">Segurança</h2>
            <p className="text-slate-500 mb-6 text-sm">Precisamos validar sua identidade para permitir pagamentos.</p>
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:border-orange-500 transition-colors cursor-pointer bg-slate-50">
              <UploadCloud className="mx-auto w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-400">UPLOAD DO CC / PASSAPORTE</p>
            </div>
            <div className="mt-6">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Seu IBAN (Para Receber)</label>
              <Input 
                className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-orange-500" 
                placeholder="PT50 0000..." 
                value={formData.iban}
                onChange={(e) => setFormData({...formData, iban: e.target.value})}
              />
            </div>
            <Button 
              onClick={finishSetup} 
              disabled={loading}
              className="w-full h-14 mt-8 bg-orange-600 hover:bg-orange-700 rounded-2xl text-lg font-bold text-white shadow-lg shadow-orange-200"
            >
              {loading ? "Processando..." : "Concluir Perfil"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}