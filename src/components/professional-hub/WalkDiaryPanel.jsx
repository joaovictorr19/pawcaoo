import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import {
  BookOpen, Camera, Loader2, MapPin, Clock, PawPrint, ChevronDown,
  Image as ImageIcon, Send, CalendarDays, Dog,
} from "lucide-react";

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "Extra Grande" };
const MOOD_LABELS = {
  happy: "Feliz", calm: "Calmo", excited: "Excitado", anxious: "Ansioso", tired: "Cansado", stressed: "Stressado",
};
const SOCIAL_LABELS = {
  friendly: "Sociável", neutral: "Neutro", shy: "Tímido", aggressive: "Reativo",
};
const MOOD_COLORS = {
  happy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  calm: "bg-blue-50 text-blue-700 border-blue-200",
  excited: "bg-amber-50 text-amber-700 border-amber-200",
  anxious: "bg-orange-50 text-orange-700 border-orange-200",
  tired: "bg-slate-50 text-slate-600 border-slate-200",
  stressed: "bg-red-50 text-red-700 border-red-200",
};

function compressImage(file, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) return resolve(file);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      if (scale >= 1 && file.size < 1.5 * 1024 * 1024) return resolve(file);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export default function WalkDiaryPanel({ user, professionalProfile }) {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: completedBookings = [], isLoading } = useQuery({
    queryKey: ["diaryBookings", user?.email],
    queryFn: () =>
      base44.entities.Booking.filter(
        { $or: [{ walker_email: user.email, status: "completed" }, { walker_email: user.email, status: "service_completed" }] },
        "-walk_date",
        100
      ),
    enabled: !!user?.email,
  });

  const { data: records = [] } = useQuery({
    queryKey: ["walkDiaryRecords", user?.email],
    queryFn: () =>
      base44.entities.WalkDiaryRecord.filter({ walker_email: user.email }, "-created_date", 200),
    enabled: !!user?.email,
  });

  const recordsByBooking = records.reduce((acc, r) => {
    (acc[r.booking_id] = acc[r.booking_id] || []).push(r);
    return acc;
  }, {});

  const handleNewRecord = (booking) => {
    setSelectedBooking(booking);
    setShowForm(true);
  };

  const onRecordSaved = () => {
    setShowForm(false);
    setSelectedBooking(null);
    queryClient.invalidateQueries(["walkDiaryRecords"]);
    queryClient.invalidateQueries(["diaryBookings"]);
    queryClient.invalidateQueries(["clientWalkDiary"]);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-orange-500" /> Diário de Passeios
        </h3>
        <p className="text-xs text-slate-400">Publica registos dos teus passeios — o dono vê no painel dele</p>
      </div>

      {showForm && selectedBooking ? (
        <NewRecordForm booking={selectedBooking} user={user} professionalProfile={professionalProfile} onSaved={onRecordSaved} onCancel={() => { setShowForm(false); setSelectedBooking(null); }} />
      ) : (
        <>
          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl py-8 text-center">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
            </div>
          ) : completedBookings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl py-12 text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-200" />
              <p className="text-slate-500 text-sm font-medium">Sem passeios concluídos</p>
              <p className="text-slate-400 text-xs mt-1">Conclui um passeio para publicares um registo no diário</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedBookings.map((booking) => {
                const bookingRecords = recordsByBooking[booking.id] || [];
                const dogs = booking.dogs?.length > 0
                  ? booking.dogs
                  : [{ dog_name: booking.dog_name, dog_breed: booking.dog_breed, dog_size: booking.dog_size, photo_url: null }];
                return (
                  <div key={booking.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-3 flex items-center gap-3">
                      <div className="flex -space-x-2 shrink-0">
                        {dogs.slice(0, 3).map((d, i) => (
                          <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 overflow-hidden flex items-center justify-center shadow-sm">
                            {d.photo_url
                              ? <img src={d.photo_url} alt={d.dog_name} className="w-full h-full object-cover" />
                              : <PawPrint className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {dogs.map(d => d.dog_name).join(", ")}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                          <span className="flex items-center gap-0.5"><CalendarDays className="w-3 h-3" />{booking.walk_date ? format(parseISO(booking.walk_date + "T12:00:00"), "dd/MM/yyyy", { locale: pt }) : "—"}</span>
                          <span>·</span>
                          <span className="truncate">{booking.owner_name}</span>
                        </div>
                      </div>
                      <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs h-8 gap-1 shrink-0" onClick={() => handleNewRecord(booking)}>
                        <Send className="w-3.5 h-3.5" /> Registar
                      </Button>
                    </div>

                    {bookingRecords.length > 0 && (
                      <div className="border-t border-slate-100 p-2.5 space-y-2 bg-slate-50/50">
                        {bookingRecords.map((rec) => (
                          <div key={rec.id} className="bg-white border border-slate-200 rounded-lg p-2.5 flex gap-2.5">
                            {rec.photo_url && (
                              <img src={rec.photo_url} alt={rec.dog_name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-semibold text-slate-900">{rec.dog_name}</span>
                                {rec.mood && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${MOOD_COLORS[rec.mood] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                    {MOOD_LABELS[rec.mood] || rec.mood}
                                  </span>
                                )}
                                {rec.exercise_minutes > 0 && (
                                  <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{rec.exercise_minutes}min</span>
                                )}
                                {rec.distance_km > 0 && (
                                  <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{rec.distance_km}km</span>
                                )}
                              </div>
                              {rec.description && <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{rec.description}</p>}
                              <p className="text-[9px] text-slate-400 mt-0.5">
                                {format(new Date(rec.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NewRecordForm({ booking, user, professionalProfile, onSaved, onCancel }) {
  const [photo_url, setPhotoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [exercise_minutes, setExercise] = useState(booking.duration_hours ? booking.duration_hours * 60 : "");
  const [distance_km, setDistance] = useState(booking.distance_km || "");
  const [mood, setMood] = useState("");
  const [socialization, setSocialization] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = React.useRef(null);

  const dogs = booking.dogs?.length > 0
    ? booking.dogs
    : [{ dog_name: booking.dog_name, dog_breed: booking.dog_breed, dog_size: booking.dog_size, photo_url: null }];
  const [selectedDogIdx, setSelectedDogIdx] = useState(0);
  const selectedDog = dogs[selectedDogIdx] || dogs[0];

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading("A carregar foto...");
    try {
      const optimized = await compressImage(file);
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: optimized });
      setPhotoUrl(file_url);
      toast.success("Foto carregada", { id: toastId });
    } catch {
      toast.error("Erro ao carregar", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!description.trim() && !photo_url) {
      toast.error("Adiciona uma foto ou descrição");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.WalkDiaryRecord.create({
        booking_id: booking.id,
        walker_email: user.email,
        walker_name: professionalProfile?.walker_name || professionalProfile?.trainer_name || user?.full_name || "Profissional",
        owner_email: booking.owner_email,
        owner_name: booking.owner_name,
        dog_name: selectedDog.dog_name,
        dog_breed: selectedDog.dog_breed,
        dog_size: selectedDog.dog_size,
        photo_url,
        description: description.trim(),
        exercise_minutes: exercise_minutes ? parseFloat(exercise_minutes) : null,
        distance_km: distance_km ? parseFloat(distance_km) : null,
        mood: mood || null,
        socialization: socialization || null,
        service_type: booking.type || "walk",
        notify_owner: true,
      });

      // Notificar o dono
      try {
        await base44.entities.Notification.create({
          recipient_email: booking.owner_email,
          title: `📷 Novo registo de passeio — ${selectedDog.dog_name}`,
          message: `${professionalProfile?.walker_name || "O seu passeador"} publicou um registo do passeio de ${selectedDog.dog_name}.`,
          type: "booking",
          related_id: booking.id,
          icon: "📷",
          link: "/ClientDashboard",
        });
      } catch { /* intentionally ignored */ }

      toast.success("Registo publicado! O dono foi notificado.");
      onSaved();
    } catch (err) {
      toast.error("Erro ao guardar registo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <button onClick={onCancel} className="text-xs text-slate-500 font-semibold hover:text-slate-700">← Voltar ao diário</button>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Dog className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-bold text-slate-900">Novo registo — {selectedDog.dog_name}</p>
        </div>

        {dogs.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {dogs.map((d, i) => (
              <button key={i} onClick={() => setSelectedDogIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  i === selectedDogIdx ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
                }`}>
                {d.dog_name}
              </button>
            ))}
          </div>
        )}

        {/* Foto */}
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          {photo_url ? (
            <div className="relative">
              <img src={photo_url} alt="prévia" className="w-full h-48 object-cover rounded-xl" />
              <button onClick={() => fileRef.current?.click()} className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> Trocar
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-slate-300 transition-colors">
              {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-7 h-7" />}
              <span className="text-xs font-medium">Adicionar foto do passeio</span>
            </button>
          )}
        </div>

        {/* Descrição */}
        <div>
          <Label className="text-xs font-semibold text-slate-600">Descrição do passeio</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Conta como correreu o passeio... (ex: Bom passeio no parque, esteve calmo e sociável)"
            className="mt-1 rounded-lg min-h-[80px] resize-none" rows={3} />
        </div>

        {/* Dados do passeio */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold text-slate-600">Duração (min)</Label>
            <div className="relative mt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input type="number" value={exercise_minutes} onChange={(e) => setExercise(e.target.value)} placeholder="30" className="rounded-lg pl-9" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">Distância (km)</Label>
            <div className="relative mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input type="number" step="0.1" value={distance_km} onChange={(e) => setDistance(e.target.value)} placeholder="2.5" className="rounded-lg pl-9" />
            </div>
          </div>
        </div>

        {/* Comportamento */}
        <div>
          <Label className="text-xs font-semibold text-slate-600">Comportamento social</Label>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {Object.entries(SOCIAL_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => setSocialization(socialization === key ? "" : key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  socialization === key ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Humor */}
        <div>
          <Label className="text-xs font-semibold text-slate-600">Humor observado</Label>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {Object.entries(MOOD_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => setMood(mood === key ? "" : key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  mood === key ? (MOOD_COLORS[key] || "bg-slate-900 text-white border-slate-900") : "bg-white border-slate-200 text-slate-600"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publicar e notificar dono
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving} className="border-slate-200 text-slate-600 rounded-lg">
            Cancelar
          </Button>
        </div>
      </div>
    </motion.div>
  );
}