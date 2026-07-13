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
  Activity,
  Heart,
  Utensils,
  Pill,
  AlertTriangle,
  Eye,
  Plus,
  Stethoscope,
  Thermometer,
  Scale,
  ChevronDown,
  ChevronRight,
  CircleDot,
  CheckCircle2,
  Clock,
} from "lucide-react";

const RECORD_TYPES = [
  { key: "health", label: { pt: "Saúde", es: "Salud", en: "Health" }, icon: Heart, color: "text-red-600 bg-red-50 border-red-100" },
  { key: "behavior", label: { pt: "Comportamento", es: "Comportamiento", en: "Behavior" }, icon: Activity, color: "text-amber-600 bg-amber-50 border-amber-100" },
  { key: "feeding", label: { pt: "Alimentação", es: "Alimentación", en: "Feeding" }, icon: Utensils, color: "text-green-600 bg-green-50 border-green-100" },
  { key: "medication", label: { pt: "Medicação", es: "Medicación", en: "Medication" }, icon: Pill, color: "text-purple-600 bg-purple-50 border-purple-100" },
  { key: "incident", label: { pt: "Incidente", es: "Incidente", en: "Incident" }, icon: AlertTriangle, color: "text-orange-600 bg-orange-50 border-orange-100" },
  { key: "observation", label: { pt: "Observação", es: "Observación", en: "Observation" }, icon: Eye, color: "text-blue-600 bg-blue-50 border-blue-100" },
];

const SEVERITY = [
  { key: "low", label: { pt: "Baixa", es: "Baja", en: "Low" }, color: "bg-green-100 text-green-700" },
  { key: "medium", label: { pt: "Média", es: "Media", en: "Medium" }, color: "bg-amber-100 text-amber-700" },
  { key: "high", label: { pt: "Alta", es: "Alta", en: "High" }, color: "bg-red-100 text-red-700" },
];

const APPETITE_OPTS = [
  { key: "normal", label: { pt: "Normal", es: "Normal", en: "Normal" } },
  { key: "reduced", label: { pt: "Reduzido", es: "Reducido", en: "Reduced" } },
  { key: "none", label: { pt: "Nenhum", es: "Ninguno", en: "None" } },
  { key: "increased", label: { pt: "Aumentado", es: "Aumentado", en: "Increased" } },
];

const ENERGY_OPTS = [
  { key: "normal", label: { pt: "Normal", es: "Normal", en: "Normal" } },
  { key: "lethargic", label: { pt: "Letárgico", es: "Letárgico", en: "Lethargic" } },
  { key: "hyperactive", label: { pt: "Hiperativo", es: "Hiperactivo", en: "Hyperactive" } },
  { key: "calm", label: { pt: "Calmo", es: "Tranquilo", en: "Calm" } },
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
    follow_up_needed: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.HotelPetRecord.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["hotelPetRecords", hotelProfile?.id]);
      toast.success(language === "pt" ? "Registo adicionado" : "Record added");
      setForm({ record_type: "observation", title: "", description: "", severity: "low", temperature: "", weight_kg: "", appetite: "", energy_level: "", follow_up_needed: false });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error(language === "pt" ? "Preencha título e descrição" : "Fill title and description");
      return;
    }
    createMutation.mutate({
      hotel_profile_id: hotelProfile?.id,
      hotel_email: hotelProfile?.created_by,
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
      follow_up_needed: form.follow_up_needed,
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-slate-700" />
            {language === "pt" ? "Novo Registo" : language === "es" ? "Nuevo Registro" : "New Record"}
            <span className="text-sm font-normal text-slate-400">— {dogName}</span>
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                {language === "pt" ? "Tipo" : "Type"}
              </Label>
              <Select value={form.record_type} onValueChange={(v) => setForm({ ...form, record_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((r) => (
                    <SelectItem key={r.key} value={r.key}>
                      <span className="flex items-center gap-2">
                        <r.icon className="w-4 h-4" /> {tr(r.label, language)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                {language === "pt" ? "Gravidade" : "Severity"}
              </Label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITY.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{tr(s.label, language)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              {language === "pt" ? "Título" : "Title"}
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={language === "pt" ? "Ex: Tosse seca após o passeio" : "E.g.: Dry cough after walk"}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              {language === "pt" ? "Descrição" : "Description"}
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder={language === "pt" ? "Descreva o que observou..." : "Describe what you observed..."}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Thermometer className="w-3 h-3" /> {language === "pt" ? "Temperatura (°C)" : "Temp (°C)"}
              </Label>
              <Input
                type="number"
                step="0.1"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                placeholder="38.5"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Scale className="w-3 h-3" /> {language === "pt" ? "Peso (kg)" : "Weight (kg)"}
              </Label>
              <Input
                type="number"
                step="0.1"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                placeholder="12.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                {language === "pt" ? "Apetite" : "Appetite"}
              </Label>
              <Select value={form.appetite} onValueChange={(v) => setForm({ ...form, appetite: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {APPETITE_OPTS.map((o) => (
                    <SelectItem key={o.key} value={o.key}>{tr(o.label, language)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                {language === "pt" ? "Energia" : "Energy"}
              </Label>
              <Select value={form.energy_level} onValueChange={(v) => setForm({ ...form, energy_level: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {ENERGY_OPTS.map((o) => (
                    <SelectItem key={o.key} value={o.key}>{tr(o.label, language)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
            <input
              type="checkbox"
              checked={form.follow_up_needed}
              onChange={(e) => setForm({ ...form, follow_up_needed: e.target.checked })}
              className="w-4 h-4 rounded accent-slate-700"
            />
            <span className="text-sm font-medium text-slate-700">
              {language === "pt" ? "Necessita acompanhamento" : language === "es" ? "Requiere seguimiento" : "Follow-up needed"}
            </span>
          </label>
        </div>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending
              ? (language === "pt" ? "A guardar..." : "Saving...")
              : (language === "pt" ? "Guardar Registo" : "Save Record")}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "pt" ? "Cancelar" : "Cancel"}
          </Button>
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
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${sevMeta.color}`}>
                {tr(sevMeta.label, language)}
              </span>
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
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{record.description}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {(record.temperature || record.weight_kg || record.appetite || record.energy_level) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {record.temperature && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Thermometer className="w-2.5 h-2.5" /> {record.temperature}°C
                    </span>
                  )}
                  {record.weight_kg && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Scale className="w-2.5 h-2.5" /> {record.weight_kg}kg
                    </span>
                  )}
                  {record.appetite && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                      {language === "pt" ? "Apetite" : "Appetite"}: {tr(APPETITE_OPTS.find(a => a.key === record.appetite)?.label, language)}
                    </span>
                  )}
                  {record.energy_level && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                      {language === "pt" ? "Energia" : "Energy"}: {tr(ENERGY_OPTS.find(a => a.key === record.energy_level)?.label, language)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              {new Date(record.created_date).toLocaleString(language === "pt" ? "pt-PT" : "en-EN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              {record.recorded_by_name && ` — ${record.recorded_by_name}`}
            </p>
          </div>
        </div>
        {record.follow_up_needed && !record.follow_up_resolved && (
          <button
            onClick={() => onResolve(record)}
            className="text-[10px] font-bold text-green-600 hover:text-green-700 mt-1 flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" /> {language === "pt" ? "Marcar como resolvido" : "Mark as resolved"}
          </button>
        )}
      </div>
    </div>
  );
}

function PetCard({ dog, records, language, onAddRecord, onResolve, user, hotelProfile, bookings }) {
  const [expanded, setExpanded] = useState(true);
  const booking = bookings.find((b) => b.dogs?.some((d) => d.dog_name === dog));

  const followUpCount = records.filter((r) => r.follow_up_needed && !r.follow_up_resolved).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100 flex items-center justify-center">
            <PawPrintIcon />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-900">{dog}</h3>
            <p className="text-[11px] text-slate-400">
              {records.length} {language === "pt" ? "registos" : "records"}
              {followUpCount > 0 && (
                <span className="text-orange-500 font-semibold ml-1">— {followUpCount} {language === "pt" ? "acompanhamento" : "follow-up"}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            onClick={(e) => { e.stopPropagation(); onAddRecord(dog); }}
            className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-600" />
          </span>
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-50">
          {records.length > 0 ? (
            <div className="mt-3">
              {records
                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                .map((record) => (
                  <RecordTimelineItem key={record.id} record={record} language={language} onResolve={onResolve} />
                ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-4">
              {language === "pt" ? "Sem registos. Adicione o primeiro." : "No records yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PawPrintIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-400" fill="currentColor">
      <circle cx="5.5" cy="11" r="2.5" />
      <circle cx="18.5" cy="11" r="2.5" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="6" r="2" />
      <path d="M12 12c-3 0-5 2-5 4.5 0 1.5 1 2.5 2.5 2.5h5c1.5 0 2.5-1 2.5-2.5 0-2.5-2-4.5-5-4.5z" />
    </svg>
  );
}

export default function HotelPetRecordsPanel({ hotelProfile }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDog, setSelectedDog] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["hotelBookings", hotelProfile?.id],
    queryFn: () =>
      base44.entities.HotelBooking.filter(
        { hotel_profile_id: hotelProfile?.id, status: { $in: ["checked_in", "in_progress", "confirmed"] } },
        "-created_date",
        100
      ),
    enabled: !!hotelProfile?.id,
  });

  const { data: records = [], isLoading: loadingRecords } = useQuery({
    queryKey: ["hotelPetRecords", hotelProfile?.id],
    queryFn: () =>
      base44.entities.HotelPetRecord.filter(
        { hotel_profile_id: hotelProfile?.id },
        "-created_date",
        200
      ),
    enabled: !!hotelProfile?.id,
  });

  const resolveMutation = useMutation({
    mutationFn: async (record) => {
      return await base44.entities.HotelPetRecord.update(record.id, { follow_up_resolved: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["hotelPetRecords", hotelProfile?.id]);
      toast.success(language === "pt" ? "Marcado como resolvido" : "Marked as resolved");
    },
  });

  const dogsFromBookings = React.useMemo(() => {
    const dogSet = new Map();
    bookings.forEach((b) => {
      (b.dogs || []).forEach((d) => {
        if (d.dog_name && !dogSet.has(d.dog_name)) {
          dogSet.set(d.dog_name, { name: d.dog_name, booking: b });
        }
      });
    });
    // Also include dogs from records (for past stays)
    records.forEach((r) => {
      if (r.dog_name && !dogSet.has(r.dog_name)) {
        dogSet.set(r.dog_name, { name: r.dog_name, booking: null });
      }
    });
    return Array.from(dogSet.values());
  }, [bookings, records]);

  const handleAddRecord = (dogName) => {
    setSelectedDog(dogName);
    setDrawerOpen(true);
  };

  const filteredRecords = filterType === "all" ? records : records.filter((r) => r.record_type === filterType);

  const stats = React.useMemo(() => {
    const followUps = records.filter((r) => r.follow_up_needed && !r.follow_up_resolved).length;
    const incidents = records.filter((r) => r.record_type === "incident").length;
    const health = records.filter((r) => r.record_type === "health").length;
    return { total: records.length, followUps, incidents, health };
  }, [records]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterType === "all" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          {language === "pt" ? "Todos" : "All"}
        </button>
        {RECORD_TYPES.map((r) => (
          <button
            key={r.key}
            onClick={() => setFilterType(r.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-colors ${filterType === r.key ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <r.icon className="w-3 h-3" /> {tr(r.label, language)}
          </button>
        ))}
      </div>

      {/* Pet cards */}
      {loadingBookings || loadingRecords ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : dogsFromBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-200" />
          <p className="text-sm text-slate-400 font-medium">
            {language === "pt" ? "Sem hóspedes ativos. Os registos aparecerão aqui quando houver cães em estadia." : "No active guests. Records will appear here when dogs are staying."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dogsFromBookings.map((dogInfo) => {
            const dogRecords = filteredRecords.filter((r) => r.dog_name === dogInfo.name);
            return (
              <PetCard
                key={dogInfo.name}
                dog={dogInfo.name}
                records={dogRecords}
                language={language}
                onAddRecord={handleAddRecord}
                onResolve={resolveMutation.mutate}
                user={user}
                hotelProfile={hotelProfile}
                bookings={bookings}
              />
            );
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