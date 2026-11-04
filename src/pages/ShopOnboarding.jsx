import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Store, Camera, MapPin, ChevronRight, ChevronLeft, CheckCircle, Upload, Phone,
} from "lucide-react";
import { DOCUMENT_RULES, geocodeLocation, uploadFile } from "@/lib/professionalOnboarding";
import { registerOwnAccount } from "@/lib/accountRegime";
import CardPhotoAdjuster from "@/components/ui/CardPhotoAdjuster";

const STEPS = ["A Loja", "Documentos", "Confirmação"];

export default function ShopOnboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem("shop_onboarding_form");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      shop_name: "",
      location: "",
      bio: "",
      photo_url: "",
      photo_focus_x: 50,
      photo_focus_y: 0,
      whatsapp_number: "",
      country_of_operation: "portugal",
      tax_id_portugal: "",
      tax_id_spain: "",
      tax_id_france: "",
      id_document_url: "",
      proof_of_address_url: "",
    };
  });

  const { data: user, isError: userError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    retry: 1,
  });

  const { data: existingProfile, isError: profileError } = useQuery({
    queryKey: ["existingShopProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const profiles = await base44.entities.WalkerProfile.filter({
        user_id: user.id,
        professional_type: "shop",
      });
      return profiles[0] || null;
    },
    enabled: !!user?.id,
    staleTime: 0,
    retry: 1,
  });

  useEffect(() => {
    if (formInitialized) return;
    if (!user) {
      if (userError) setFormInitialized(true);
      return;
    }
    if (existingProfile === undefined) {
      if (profileError) setFormInitialized(true);
      return;
    }
    setFormInitialized(true);

    if (existingProfile) {
      setForm((prev) => ({
        ...prev,
        shop_name: existingProfile.walker_name || prev.shop_name,
        location: existingProfile.location || prev.location,
        bio: existingProfile.bio || prev.bio,
        photo_url: existingProfile.photo_url || prev.photo_url,
        photo_focus_x: existingProfile.photo_focus_x ?? 50,
        photo_focus_y: existingProfile.photo_focus_y ?? 0,
        whatsapp_number: existingProfile.whatsapp_number || prev.whatsapp_number,
        country_of_operation: existingProfile.country_of_operation || "portugal",
        tax_id_portugal: existingProfile.tax_id_portugal || "",
        tax_id_spain: existingProfile.tax_id_spain || "",
        tax_id_france: existingProfile.tax_id_france || "",
        id_document_url: existingProfile.id_document_url || "",
        proof_of_address_url: existingProfile.proof_of_address_url || "",
      }));
    } else if (user.full_name) {
      setForm((prev) => ({ ...prev, shop_name: user.full_name }));
    }
  }, [existingProfile, user, formInitialized, userError, profileError]);

  const set = (key, val) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: val };
      try {
        sessionStorage.setItem("shop_onboarding_form", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleUpload = async (e, field, successMsg) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      set(field, url);
      toast.success(successMsg);
    } catch {
      toast.error("Erro no upload.");
    }
    setUploading(false);
  };

  const isEditing = !!(formInitialized && existingProfile);

  const canProceed = () => {
    if (step === 0) return form.shop_name.trim() && form.location.trim();
    return true;
  };

  const handleFinish = async () => {
    if (!user) {
      toast.info("Precisas de criar uma conta para guardar a tua loja.");
      navigate(`/register?from=${encodeURIComponent("/ShopOnboarding")}`);
      return;
    }
    setLoading(true);
    try {
      const { lat, lng } = await geocodeLocation(form.location);
      const profileData = {
        walker_name: form.shop_name,
        professional_type: "shop",
        user_id: user.id,
        location: form.location,
        latitude: lat,
        longitude: lng,
        bio: form.bio || "",
        photo_url: form.photo_url || "",
        photo_focus_x: form.photo_focus_x ?? 50,
        photo_focus_y: form.photo_focus_y ?? 0,
        whatsapp_number: form.whatsapp_number || "",
        phone: form.whatsapp_number || "",
        service_areas: [{ area_name: form.location, radius_km: 15, latitude: lat, longitude: lng }],
        country_of_operation: form.country_of_operation,
        tax_id_portugal: form.tax_id_portugal || "",
        tax_id_spain: form.tax_id_spain || "",
        tax_id_france: form.tax_id_france || "",
        id_document_url: form.id_document_url || "",
        proof_of_address_url: form.proof_of_address_url || "",
        // Uma loja já aprovada mantém-se ativa ao editar os dados.
        // Só uma loja nova, pendente ou rejeitada volta para análise.
        ...(existingProfile?.verification_status === "verified"
          ? { is_active: true, is_verified: true, verification_status: "verified" }
          : { is_active: false, is_online: false, is_verified: false, verification_status: "pending" }),
      };

      if (existingProfile) {
        await base44.entities.WalkerProfile.update(existingProfile.id, profileData);
      } else {
        await base44.entities.WalkerProfile.create(profileData);
      }

      // O role 'shop' é atribuído pela equipa PawCão na aprovação do perfil.
      // Aqui guardamos apenas account_type, que já identifica a loja no painel e na navegação.
      await base44.auth.updateMe({
        account_type: "shop",
        city: form.location,
      });

      queryClient.invalidateQueries(["currentUser"]);
      queryClient.invalidateQueries(["existingShopProfile"]);
      sessionStorage.removeItem("shop_onboarding_form");
      await registerOwnAccount();

      toast.success(
        isEditing
          ? "Alterações da loja guardadas! ⏳"
          : "Loja criada! Aguarda verificação da equipa PawCão. 🛍️"
      );
      navigate("/StoreDashboard", { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar a loja: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!formInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-10 pt-6">
      <div className="w-full max-w-2xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => (step === 0 ? navigate("/ProfessionalTypeSelect") : setStep((s) => s - 1))}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </motion.button>

        <motion.div className="mb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex gap-2 mb-4">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-teal-500" : "bg-slate-200"}`}
              />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
              Passo {step + 1} de {STEPS.length}
            </p>
            <p className="text-white font-bold text-lg">{STEPS[step]}</p>
          </div>
        </motion.div>

        {step === 0 && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">A tua Loja 🛍️</h2>
              <p className="text-slate-400 text-base mt-2 font-light">
                Vende ração, brinquedos e acessórios na vitrine da Loja PawCão.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 flex-shrink-0">
                {form.photo_url ? (
                  <img src={form.photo_url} className="w-full h-full object-cover" alt="logo" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-8 h-8 text-slate-600" />
                  </div>
                )}
              </div>
              <label className="flex-1">
                <div
                  className={`w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium cursor-pointer text-center ${uploading ? "opacity-50" : ""}`}
                >
                  <Upload className="inline w-4 h-4 mr-2" />
                  {uploading ? "A carregar..." : "Logotipo da loja"}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => { handleUpload(e, "photo_url", "Logotipo carregado!"); set("photo_focus_x", 50); set("photo_focus_y", 0); }}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {form.photo_url && (
              <CardPhotoAdjuster
                imageUrl={form.photo_url}
                focusX={form.photo_focus_x}
                focusY={form.photo_focus_y}
                onChange={(x, y) => { set("photo_focus_x", x); set("photo_focus_y", y); }}
                label="Ajustar Enquadramento do Card da Loja"
              />
            )}

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Store className="w-3 h-3" /> Nome da Loja *
              </label>
              <input
                value={form.shop_name}
                onChange={(e) => set("shop_name", e.target.value)}
                placeholder="Ex: PetShop Amigos Fiel"
                className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-teal-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Cidade / Região *
              </label>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Lisboa, Porto..."
                className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-teal-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Contacto / WhatsApp
              </label>
              <input
                value={form.whatsapp_number}
                onChange={(e) => set("whatsapp_number", e.target.value)}
                placeholder="351912345678"
                className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-teal-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                Descrição da Loja
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="O que vendes? Produtos artesanais, ração premium, acessórios..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-teal-500 outline-none text-sm resize-none"
              />
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Documentos & País</h2>
              <p className="text-slate-400 text-base mt-2 font-light">
                A equipa PawCão verifica os dados antes de a loja vender.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                País de operação
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "portugal", label: "Portugal" },
                  { value: "spain", label: "Espanha" },
                  { value: "france", label: "França" },
                ].map((c) => (
                  <button
                    key={c.value}
                    onClick={() => set("country_of_operation", c.value)}
                    className={`p-3 rounded-xl border-2 text-xs font-bold ${form.country_of_operation === c.value ? "border-teal-500 bg-teal-500/10 text-white" : "border-slate-800 bg-slate-900 text-slate-300"}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                {DOCUMENT_RULES[form.country_of_operation].taxLabel}
              </label>
              <input
                value={form[DOCUMENT_RULES[form.country_of_operation].taxField] || ""}
                onChange={(e) => set(DOCUMENT_RULES[form.country_of_operation].taxField, e.target.value)}
                placeholder={`Inserir ${DOCUMENT_RULES[form.country_of_operation].taxLabel}`}
                className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-teal-500 outline-none text-sm"
              />
            </div>

            <div className="grid gap-3">
              <label
                className={`w-full p-4 rounded-2xl border-2 ${form.id_document_url ? "border-green-500 bg-green-500/10" : "border-slate-800 bg-slate-900"} cursor-pointer`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">Documento de identificação</p>
                    <p className="text-xs text-slate-400">CC, Passaporte ou NIF da empresa</p>
                  </div>
                  <span className="text-xs text-teal-400 font-bold">
                    {form.id_document_url ? "Carregado" : "Carregar"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleUpload(e, "id_document_url", "Documento carregado!")}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              <label
                className={`w-full p-4 rounded-2xl border-2 ${form.proof_of_address_url ? "border-green-500 bg-green-500/10" : "border-slate-800 bg-slate-900"} cursor-pointer`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">Comprovativo de morada</p>
                    <p className="text-xs text-slate-400">Documento recente do país escolhido</p>
                  </div>
                  <span className="text-xs text-teal-400 font-bold">
                    {form.proof_of_address_url ? "Carregado" : "Carregar"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleUpload(e, "proof_of_address_url", "Comprovativo carregado!")}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center">
              <motion.div
                className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <CheckCircle className="w-10 h-10 text-teal-600" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Tudo pronto!</h2>
              <p className="text-slate-400 text-base mt-2 font-light">Confirma os dados da tua loja.</p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-4">
                {form.photo_url && <img src={form.photo_url} className="w-14 h-14 rounded-xl object-cover" alt="logo" />}
                <div>
                  <p className="text-white font-black text-lg">{form.shop_name}</p>
                  <p className="text-slate-400 text-sm">{form.location}</p>
                  {form.whatsapp_number && (
                    <p className="text-slate-500 text-xs mt-0.5">{form.whatsapp_number}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-teal-500/20 rounded-xl p-3 text-xs text-slate-400">
              ⚠️ A tua loja ficará em análise. A equipa PawCão verificará os documentos e serás notificado quando aprovado.
              Podes criar produtos já agora — ficam visíveis na Loja após aprovação.
            </div>
          </motion.div>
        )}

        <motion.div className="flex gap-3 mt-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {step > 0 && (
            <Button
              onClick={() => setStep((s) => s - 1)}
              variant="outline"
              className="flex-1 h-12 border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 bg-white rounded-2xl font-semibold"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-semibold disabled:opacity-50 shadow-lg shadow-teal-600/30"
            >
              Continuar <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-semibold shadow-lg shadow-teal-600/30 disabled:opacity-50"
            >
              {loading ? "A guardar..." : isEditing ? "Guardar Alterações ✅" : "Criar Loja 🛍️"}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}