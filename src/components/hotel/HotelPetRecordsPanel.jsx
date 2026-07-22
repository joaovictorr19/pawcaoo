import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import {
  Activity, Heart, Utensils, Pill, AlertTriangle, Eye, Plus,
  Stethoscope, Thermometer, Scale, ChevronDown, ChevronRight,
  CheckCircle2, Clock, Droplets, Moon, PawPrint, Bell, Camera, Loader2, Syringe,
} from "lucide-react";

const RECORD_TYPES = [
  { key: "health",       label: { pt: "Saúde",         es: "Salud",         en: "Health" },      icon: Heart,          color: "text-red-600 bg-red-50 border-red-100" },
  { key: "behavior",     label: { pt: "Comportamento", es: "Comportamiento", en: "Behavior" },    icon: Activity,       color: "text-amber-600 bg-amber-50 border-amber-100" },
  { key: "feeding",      label: { pt: "Alimentação",   es: "Alimentación",  en: "Feeding" },     icon: Utensils,       color: "text-green-600 bg-green-50 border-green-100" },
  { key: "medication",   label: { pt: "Medicação",    es: "Medicación",    en: "Medication" },  icon: Pill,           color: "text-purple-600 bg-purple-50 border-purple-100" },
  { key: "incident",     label: { pt: "Incidente",     es: "Incidente",     en: "Incident" },    icon: AlertTriangle,  color: "text-orange-600 bg-orange-50 border-orange-100" },
  { key: "observation",  label: { pt: "Observação",   es: "Observación",   en: "Observation" }, icon: Eye,            color: "text-blue-600 bg-blue-50 border-blue-100" },
  { key: "elimination",  label: { pt: "Eliminação",   es: "Eliminación",  en: "Elimination" }, icon: Droplets,       color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
  { key: "exercise",     label: { pt: "Exercício",    es: "Ejercicio",     en: "Exercise" },    icon: PawPrint,       color: "text-teal-600 bg-teal-50 border-teal-100" },
  { key: "grooming",     label: { pt: "Grooming",     es: "Estética",      en: "Grooming" },    icon: Activity,       color: "text-pink-600 bg-pink-50 border-pink-100" },
  { key: "veterinary",   label: { pt: "Veterinário",  es: "Veterinario",   en: "Veterinary" },  icon: Stethoscope,    color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
];

const SEVERITY = [
  { key: "low",    label: { pt: "Baixa",  es: "Baja",  en: "Low" },    color: "bg-green-100 text-green-700" },
  { key: "medium", label: { pt: "Média",  es: "Media", en: "Medium" }, color: "bg-amber-100 text-amber-700" },
  { key: "high",   label: { pt: "Alta",   es: "Alta",  en: "High" },   color: "bg-red-100 text-red-700" },
];

const APPETITE_OPTS = [
  { key: "normal",    label: { pt: "Normal",    es: "Normal",    en: "Normal" } },
  { key: "reduced",   label: { pt: "Reduzido", es: "Reducido",  en: "Reduced" } },
  { key: "none",      label: { pt: "Nenhum",   es: "Ninguno",   en: "None" } },
  { key: "increased", label: { pt: "Aumentado", es: "Aumentado", en: "Increased" } },
];

const ENERGY_OPTS = [
  { key: "normal",      label: { pt: "Normal",     es: "Normal",     en: "Normal" } },
  { key: "lethargic",   label: { pt: "Letárgico", es: "Letárgico",  en: "Lethargic" } },
  { key: "hyperactive", label: { pt: "Hiperativo", es: "Hiperactivo", en: "Hyperactive" } },
  { key: "calm",        label: { pt: "Calmo",     es: "Tranquilo",  en: "Calm" } },
];

const STOOL_OPTS = [
  { key: "normal",      label: { pt: "Normal",      es: "Normal",      en: "Normal" } },
  { key: "loose",       label: { pt: "Moles",        es: "Blandas",     en: "Loose" } },
  { key: "constipated", label: { pt: "Obstipado",   es: "Estreñido",   en: "Constipated" } },
  { key: "none",        label: { pt: "Sem registos", es: "Sin registros", en: "None" } },
  { key: "blood",       label: { pt: "Sangue",       es: "Sangre",      en: "Blood" } },
];

const MOOD_OPTS = [
  { key: "happy",    label: { pt: "Feliz",     es: "Feliz",     en: "Happy" } },
  { key: "calm",     label: { pt: "Calmo",     es: "Tranquilo", en: "Calm" } },
  { key: "excited",  label: { pt: "Animado",   es: "Emocionado", en: "Excited" } },
  { key: "anxious",  label: { pt: "Ansioso",   es: "Ansioso",   en: "Anxious" } },
  { key: "tired",    label: { pt: "Cansado",   es: "Cansado",   en: "Tired" } },
  { key: "stressed", label: { pt: "Stressado", es: "Estresado", en: "Stressed" } },
];

const SOCIAL_OPTS = [
  { key: "friendly",   label: { pt: "Sociável",   es: "Sociable",  en: "Friendly" } },
  { key: "neutral",    label: { pt: "Neutro",     es: "Neutral",   en: "Neutral" } },
  { key: "shy",        label: { pt: "Tímido",     es: "Tímido",    en: "Shy" } },
  { key: "aggressive", label: { pt: "Agressivo",  es: "Agresivo",  en: "Aggressive" } },
  { key: "anxious",    label: { pt: "Ansioso",    es: "Ansioso",   en: "Anxious" } },
];

const tr = (obj, lang) => obj?.[lang] || obj?.pt || obj?.en;

function NewRecordDrawer({ open, onOpenChange, hotelProfile, booking, dogName, user }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    record_type: "observation",
    title: "",
    description: "",
    severity: "low",
    temperature: "",
    weight_kg: "",
    appetite: "",
    energy_level: "",
    stool_status: "",
    mood: "",
    socialization: "",
    water_intake: "",
    exercise_minutes: "",
    sleep_hours: "",
    grooming_notes: "",
    vaccination_checked: false,
    deworming_date: "",
    flea_tick_treatment: false,
    follow_up_needed: false,
    notify_owner: false,
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.HotelPetRecord.create(data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries(["hotelPetRecords", hotelProfile?.id]);

      if (form.notify_owner && booking?.owner_email) {
        try {
          const typeMeta = RECORD_TYPES.find(r => r.key === form.record_type);
          const detailParts = [];
          if (form.temperature) detailParts.push(`🌡 ${form.temperature}°C`);
          if (form.weight_kg) detailParts.push(`⚖ ${form.weight_kg}kg`);
          if (form.appetite) detailParts.push(`🍽 Apetite: ${tr(APPETITE_OPTS.find(a => a.key === form.appetite)?.label, language)}`);
          if (form.energy_level) detailParts.push(`⚡ Energia: ${tr(ENERGY_OPTS.find(a => a.key === form.energy_level)?.label, language)}`);
          if (form.mood) detailParts.push(`😊 Humor: ${tr(MOOD_OPTS.find(a => a.key === form.mood)?.label, language)}`);
          if (form.stool_status) detailParts.push(`💧 Fezes: ${tr(STOOL_OPTS.find(a => a.key === form.stool_status)?.label, language)}`);
          if (form.socialization) detailParts.push(`🐾 Social: ${tr(SOCIAL_OPTS.find(a => a.key === form.socialization)?.label, language)}`);

          await base44.entities.Notification.create({
            recipient_email: booking.owner_email,
            title: `${typeMeta?.label?.pt || "Registo"} — ${dogName}`,
            message: `${form.title}\n\n${form.description}${detailParts.length > 0 ? "\n\n" + detailParts.join(" · ") : ""}${form.follow_up_needed ? "\n\n⚠ Necessita acompanhamento" : ""}`,
            type: form.record_type === "health" || form.record_type === "veterinary" ? "alert" : "booking",
            icon: "📋",
            link: "/ClientDashboard",
            related_id: booking?.id,
            is_read: false,
          });
        } catch (e) {
          console.warn("Failed to create notification:", e);
        }
      }

      toast.success(language === "pt" ? "Registo adicionado" : "Record added");
      setForm({
        record_type: "observation", title: "", description: "", severity: "low",
        temperature: "", weight_kg: "", appetite: "", energy_level: "", stool_status: "",
        mood: "", socialization: "", water_intake: "", exercise_minutes: "", sleep_hours: "",
        grooming_notes: "", vaccination_checked: false, deworming_date: "", flea_tick_treatment: false,
        follow_up_needed: false, notify_owner: false,
      });
      setPhotoUrl("");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch {
      toast.error(language === "pt" ? "Erro no upload da foto" : "Photo upload error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error(language === "pt" ? "Preencha título e descrição" : "Fill title and description");
      return;
    }
    createMutation.mutate({
      hotel_profile_id: hotelProfile?.id,
      hotel_email: user?.email,
      booking_id: booking?.id,
      owner_name: booking?.owner_name,
      owner_email: booking?.owner_email,
      dog_name: dogName,
      dog_breed: booking?.dogs?.find((d) => d.dog_name === dogName)?.dog_breed,
      dog_size: booking?.dogs?.find((d) => d.dog_name === dogName)?.dog_size,
      recorded_by: user?.email,
      recorded_by_name: user?.full_name || user?.email,
      record_type: form.record_type,
      title: form.title.trim(),
      description: form.description.trim(),
      severity: form.severity,
      temperature: form.temperature ? parseFloat(form.temperature) : undefined,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
      appetite: form.appetite || undefined,
      energy_level: form.energy_level || undefined,
      stool_status: form.stool_status || undefined,
      mood: form.mood || undefined,
      socialization: form.socialization || undefined,
      water_intake: form.water_intake || undefined,
      exercise_minutes: form.exercise_minutes ? parseInt(form.exercise_minutes) : undefined,
      sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : undefined,
      grooming_notes: form.grooming_notes.trim() || undefined,
      vaccination_checked: form.vaccination_checked,
      deworming_date: form.deworming_date || undefined,
      flea_tick_treatment: form.flea_tick_treatment,
      photo_url: photoUrl || undefined,
      follow_up_needed: form.follow_up_needed,
      notify_owner: form.notify_owner,
    });
  };

  const isHealthLike = ["health", "incident", "veterinary"].includes(form.record_type);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-slate-700" />
            {language === "pt" ? "Novo Registo" : language === "es" ? "Nuevo Registro" : "New Record"}
            <span className="text-sm font-normal text-slate-400">— {dogName}</span>
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* Type + Severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{language === "pt" ? "Tipo" : "Type"}</Label>
              <Select value={form.record_type} onValueChange={(v) => setForm({ ...form, record_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((r) => (
                    <SelectItem key={r.key} value={r.key}>
                      <span className="flex items-center gap-2"><r.icon className="w-4 h-4" /> {tr(r.label, language)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isHealthLike && (
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{language === "pt" ? "Gravidade" : "Severity"}</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEVERITY.map((s) => <SelectItem key={s.key} value={s.key}>{tr(s.label, language)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Title + Description */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{language === "pt" ? "Título" : "Title"}</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={language === "pt" ? "Ex: Tosse seca após o passeio" : "E.g.: Dry cough after walk"} />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{language === "pt" ? "Descrição" : "Description"}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder={language === "pt" ? "Descreva o que observou..." : "Describe what you observed..."}
            />
          </div>

          {/* Vitals */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><Thermometer className="w-3 h-3" /> {language === "pt" ? "Temp (°C)" : "Temp (°C)"}</Label>
              <Input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} placeholder="38.5" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><Scale className="w-3 h-3" /> {language === "pt" ? "Peso (kg)" : "Weight (kg)"}</Label>
              <Input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} placeholder="12.5" />
            </div>
          </div>

          {/* Appetite + Energy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{language === "pt" ? "Apetite" : "Appetite"}</Label>
              <Select value={form.appetite} onValueChange={(v) => setForm({ ...form, appetite: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{APPETITE_OPTS.map((o) => <SelectItem key={o.key} value={o.key}>{tr(o.label, language)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{language === "pt" ? "Energia" : "Energy"}</Label>
              <Select value={form.energy_level} onValueChange={(v) => setForm({ ...form, energy_level: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{ENERGY_OPTS.map((o) => <SelectItem key={o.key} value={o.key}>{tr(o.label, language)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Stool + Water */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{language === "pt" ? "Fezes" : "Stool"}</Label>
              <Select value={form.stool_status} onValueChange={(v) => setForm({ ...form, stool_status: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{STOOL_OPTS.map((o) => <SelectItem key={o.key} value={o.key}>{tr(o.label, language)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{language === "pt" ? "Água" : "Water"}</Label>
              <Select value={form.water_intake} onValueChange={(v) => setForm({ ...form, water_intake: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">{language === "pt" ? "Normal" : "Normal"}</SelectItem>
                  <SelectItem value="reduced">{language === "pt" ? "Reduzida" : "Reduced"}</SelectItem>
                  <SelectItem value="excessive">{language === "pt" ? "Excessiva" : "Excessive"}</SelectItem>
                  <SelectItem value="none">{language === "pt" ? "Não bebeu" : "None"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mood + Socialization */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{language === "pt" ? "Humor" : "Mood"}</Label>
              <Select value={form.mood} onValueChange={(v) => setForm({ ...form, mood: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{MOOD_OPTS.map((o) => <SelectItem key={o.key} value={o.key}>{tr(o.label, language)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{language === "pt" ? "Social" : "Social"}</Label>
              <Select value={form.socialization} onValueChange={(v) => setForm({ ...form, socialization: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{SOCIAL_OPTS.map((o) => <SelectItem key={o.key} value={o.key}>{tr(o.label, language)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Exercise + Sleep */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><PawPrint className="w-3 h-3" /> {language === "pt" ? "Exercício (min)" : "Exercise (min)"}</Label>
              <Input type="number" value={form.exercise_minutes} onChange={(e) => setForm({ ...form, exercise_minutes: e.target.value })} placeholder="45" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><Moon className="w-3 h-3" /> {language === "pt" ? "Sono (h)" : "Sleep (h)"}</Label>
              <Input type="number" step="0.5" value={form.sleep_hours} onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })} placeholder="8" />
            </div>
          </div>

          {/* Grooming notes */}
          {(form.record_type === "grooming" || form.record_type === "observation") && (
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{language === "pt" ? "Notas de Grooming" : "Grooming Notes"}</Label>
              <Textarea value={form.grooming_notes} onChange={(e) => setForm({ ...form, grooming_notes: e.target.value })} rows={2} placeholder={language === "pt" ? "Ex: Banho completo, unhas cortadas..." : "E.g.: Full bath, nails trimmed..."} />
            </div>
          )}

          {/* Photo upload */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><Camera className="w-3 h-3" /> {language === "pt" ? "Foto (opcional)" : "Photo (optional)"}</Label>
            {photoUrl ? (
              <div className="relative inline-block">
                <img src={photoUrl} alt="" className="w-24 h-24 rounded-xl object-cover border border-slate-200" />
                <button onClick={() => setPhotoUrl("")} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow">
                  <span className="text-white text-xs font-bold">✕</span>
                </button>
              </div>
            ) : (
              <label className={`flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl cursor-pointer text-sm font-medium ${uploadingPhoto ? "border-slate-200 text-slate-300" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {uploadingPhoto ? (language === "pt" ? "A carregar..." : "Uploading...") : (language === "pt" ? "Adicionar foto" : "Add photo")}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
              </label>
            )}
          </div>

          {/* Preventive care */}
          {(form.record_type === "veterinary" || form.record_type === "health") && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1"><Syringe className="w-3 h-3" /> {language === "pt" ? "Cuidados Preventivos" : "Preventive Care"}</p>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.vaccination_checked} onChange={(e) => setForm({ ...form, vaccination_checked: e.target.checked })} className="w-4 h-4 rounded accent-indigo-600" />
                  <span className="text-xs font-medium text-slate-700">{language === "pt" ? "Vacina verificada" : "Vaccine checked"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.flea_tick_treatment} onChange={(e) => setForm({ ...form, flea_tick_treatment: e.target.checked })} className="w-4 h-4 rounded accent-indigo-600" />
                  <span className="text-xs font-medium text-slate-700">{language === "pt" ? "Tratamento pulgas/carrapatos" : "Flea/tick treatment"}</span>
                </label>
                <div>
                  <Label className="text-[10px] font-semibold text-slate-500 block mb-1">{language === "pt" ? "Desparasitação" : "Deworming date"}</Label>
                  <Input type="date" value={form.deworming_date} onChange={(e) => setForm({ ...form, deworming_date: e.target.value })} className="h-9" />
                </div>
              </div>
            </div>
          )}

          {/* Follow-up + Notify */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
              <input type="checkbox" checked={form.follow_up_needed} onChange={(e) => setForm({ ...form, follow_up_needed: e.target.checked })} className="w-4 h-4 rounded accent-slate-700" />
              <span className="text-sm font-medium text-slate-700">{language === "pt" ? "Necessita acompanhamento" : "Follow-up needed"}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-teal-50 border border-teal-100">
              <input type="checkbox" checked={form.notify_owner} onChange={(e) => setForm({ ...form, notify_owner: e.target.checked })} className="w-4 h-4 rounded accent-teal-600" />
              <div className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-sm font-medium text-slate-700">{language === "pt" ? "Notificar dono no site" : "Notify owner on site"}</span>
              </div>
            </label>
          </div>
        </div>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? (language === "pt" ? "A guardar..." : "Saving...") : (language === "pt" ? "Guardar Registo" : "Save Record")}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{language === "pt" ? "Cancelar" : "Cancel"}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function RecordTimelineItem({ record, language, onResolve }) {
  const typeMeta = RECORD_TYPES.find((r) => r.key === record.record_type) || RECORD_TYPES[5];
  const sevMeta = SEVERITY.find((s) => s.key === record.severity) || SEVERITY[0];
  const Icon = typeMeta.icon;

  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${typeMeta.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="w-px flex-1 bg-slate-100 mt-1" />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900">{record.title}</h4>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${sevMeta.color}`}>{tr(sevMeta.label, language)}</span>
              {record.follow_up_needed && !record.follow_up_resolved && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase bg-orange-100 text-orange-700 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> {language === "pt" ? "Acompanhar" : "Follow-up"}
                </span>
              )}
              {record.follow_up_resolved && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase bg-green-100 text-green-700 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> {language === "pt" ? "Resolvido" : "Resolved"}
                </span>
              )}
              {record.notify_owner && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase bg-teal-100 text-teal-700 flex items-center gap-0.5">
                  <Bell className="w-2.5 h-2.5" /> {language === "pt" ? "Dono avisado" : "Owner notified"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{record.description}</p>

            {record.photo_url && (
              <img src={record.photo_url} alt="" className="w-20 h-20 rounded-lg object-cover border border-slate-200 mt-2" />
            )}

            {(record.temperature || record.weight_kg || record.appetite || record.energy_level || record.stool_status || record.mood || record.socialization || record.water_intake || record.exercise_minutes || record.sleep_hours) && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {record.temperature && <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Thermometer className="w-2.5 h-2.5" /> {record.temperature}°C</span>}
                {record.weight_kg && <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Scale className="w-2.5 h-2.5" /> {record.weight_kg}kg</span>}
                {record.appetite && <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{tr(APPETITE_OPTS.find(a => a.key === record.appetite)?.label, language)}</span>}
                {record.energy_level && <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{tr(ENERGY_OPTS.find(a => a.key === record.energy_level)?.label, language)}</span>}
                {record.stool_status && <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{tr(STOOL_OPTS.find(a => a.key === record.stool_status)?.label, language)}</span>}
                {record.mood && <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{tr(MOOD_OPTS.find(a => a.key === record.mood)?.label, language)}</span>}
                {record.socialization && <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{tr(SOCIAL_OPTS.find(a => a.key === record.socialization)?.label, language)}</span>}
                {record.water_intake && <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{record.water_intake}</span>}
                {record.exercise_minutes && <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><PawPrint className="w-2.5 h-2.5" /> {record.exercise_minutes}min</span>}
                {record.sleep_hours && <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Moon className="w-2.5 h-2.5" /> {record.sleep_hours}h</span>}
              </div>
            )}

            {(record.vaccination_checked || record.flea_tick_treatment || record.deworming_date) && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {record.vaccination_checked && <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Syringe className="w-2.5 h-2.5" /> Vacina ✓</span>}
                {record.flea_tick_treatment && <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Pulgas/Carrapatos ✓</span>}
                {record.deworming_date && <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Desparasitação: {record.deworming_date}</span>}
              </div>
            )}

            <p className="text-[10px] text-slate-400 mt-1.5">
              {new Date(record.created_date).toLocaleString(language === "pt" ? "pt-PT" : "en-EN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              {record.recorded_by_name && ` — ${record.recorded_by_name}`}
            </p>
          </div>
        </div>
        {record.follow_up_needed && !record.follow_up_resolved && (
          <button onClick={() => onResolve(record)} className="text-[10px] font-bold text-green-600 hover:text-green-700 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {language === "pt" ? "Marcar como resolvido" : "Mark as resolved"}
          </button>
        )}
      </div>
    </div>
  );
}

function PetCard({ dog, records, language, onAddRecord, onResolve }) {
  const [expanded, setExpanded] = useState(true);
  const followUpCount = records.filter((r) => r.follow_up_needed && !r.follow_up_resolved).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100 flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-900">{dog}</h3>
            <p className="text-[11px] text-slate-400">
              {records.length} {language === "pt" ? "registos" : "records"}
              {followUpCount > 0 && <span className="text-orange-500 font-semibold ml-1">— {followUpCount} {language === "pt" ? "acompanhamento" : "follow-up"}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span onClick={(e) => { e.stopPropagation(); onAddRecord(dog); }} className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
            <Plus className="w-4 h-4 text-slate-600" />
          </span>
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-50">
          {records.length > 0 ? (
            <div className="mt-3">
              {records.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map((record) => (
                <RecordTimelineItem key={record.id} record={record} language={language} onResolve={onResolve} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-4">{language === "pt" ? "Sem registos. Adicione o primeiro." : "No records yet."}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function HotelPetRecordsPanel({ hotelProfile }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDog, setSelectedDog] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me(), staleTime: 10 * 60 * 1000 });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["hotelBookings", hotelProfile?.id],
    queryFn: () => base44.entities.HotelBooking.filter({ hotel_profile_id: hotelProfile?.id, status: { $in: ["checked_in", "in_progress", "confirmed"] } }, "-created_date", 100),
    enabled: !!hotelProfile?.id,
  });

  const { data: records = [], isLoading: loadingRecords } = useQuery({
    queryKey: ["hotelPetRecords", hotelProfile?.id],
    queryFn: () => base44.entities.HotelPetRecord.filter({ hotel_profile_id: hotelProfile?.id }, "-created_date", 200),
    enabled: !!hotelProfile?.id,
  });

  const resolveMutation = useMutation({
    mutationFn: async (record) => base44.entities.HotelPetRecord.update(record.id, { follow_up_resolved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(["hotelPetRecords", hotelProfile?.id]);
      toast.success(language === "pt" ? "Marcado como resolvido" : "Marked as resolved");
    },
  });

  const dogsFromBookings = React.useMemo(() => {
    const dogSet = new Map();
    bookings.forEach((b) => {
      (b.dogs || []).forEach((d) => {
        if (d.dog_name && !dogSet.has(d.dog_name)) dogSet.set(d.dog_name, { name: d.dog_name, booking: b });
      });
    });
    records.forEach((r) => {
      if (r.dog_name && !dogSet.has(r.dog_name)) dogSet.set(r.dog_name, { name: r.dog_name, booking: null });
    });
    return Array.from(dogSet.values());
  }, [bookings, records]);

  const handleAddRecord = (dogName) => { setSelectedDog(dogName); setDrawerOpen(true); };
  const filteredRecords = filterType === "all" ? records : records.filter((r) => r.record_type === filterType);

  const stats = React.useMemo(() => {
    const followUps = records.filter((r) => r.follow_up_needed && !r.follow_up_resolved).length;
    const incidents = records.filter((r) => r.record_type === "incident").length;
    const health = records.filter((r) => r.record_type === "health").length;
    const notified = records.filter((r) => r.notify_owner).length;
    return { total: records.length, followUps, incidents, health, notified };
  }, [records]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{language === "pt" ? "Total Registos" : "Total Records"}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-2xl font-black text-red-600">{stats.health}</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{language === "pt" ? "Saúde" : "Health"}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-2xl font-black text-orange-600">{stats.incidents}</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{language === "pt" ? "Incidentes" : "Incidents"}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-2xl font-black text-amber-600">{stats.followUps}</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{language === "pt" ? "Acompanhar" : "Follow-ups"}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-2xl font-black text-teal-600">{stats.notified}</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{language === "pt" ? "Donos avisados" : "Owners notified"}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <button onClick={() => setFilterType("all")} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterType === "all" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{language === "pt" ? "Todos" : "All"}</button>
        {RECORD_TYPES.map((r) => (
          <button key={r.key} onClick={() => setFilterType(r.key)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ${filterType === r.key ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            <r.icon className="w-3.5 h-3.5 shrink-0" /> {tr(r.label, language)}
          </button>
        ))}
      </div>

      {/* Pet cards */}
      {loadingBookings || loadingRecords ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
      ) : dogsFromBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-200" />
          <p className="text-sm text-slate-400 font-medium">{language === "pt" ? "Sem hóspedes ativos. Os registos aparecerão aqui quando houver cães em estadia." : "No active guests."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dogsFromBookings.map((dogInfo) => {
            const dogRecords = filteredRecords.filter((r) => r.dog_name === dogInfo.name);
            return <PetCard key={dogInfo.name} dog={dogInfo.name} records={dogRecords} language={language} onAddRecord={handleAddRecord} onResolve={resolveMutation.mutate} />;
          })}
        </div>
      )}

      <NewRecordDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        hotelProfile={hotelProfile}
        booking={dogsFromBookings.find((d) => d.name === selectedDog)?.booking}
        dogName={selectedDog}
        user={user}
      />
    </div>
  );
}