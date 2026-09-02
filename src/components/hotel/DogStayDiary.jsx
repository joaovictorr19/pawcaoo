// Diário de Estadia — linha temporal de registos (HotelPetRecord) de um cão,
// renderizada dentro da ficha canina (CaninoDetail).
import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { toast } from "sonner";
import { Plus, Stethoscope, Clock, CheckCircle2 } from "lucide-react";
import { NewRecordDrawer, RecordTimelineItem, RECORD_TYPES, tr } from "./petRecordsShared";

export default function DogStayDiary({ hotelProfile, dogName, booking }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["hotelPetRecords", hotelProfile?.id, dogName],
    queryFn: () => base44.entities.HotelPetRecord.filter({ hotel_profile_id: hotelProfile?.id, dog_name: dogName }, "-created_date", 200),
    enabled: !!hotelProfile?.id && !!dogName,
  });

  const { data: diaryMessages = [] } = useQuery({
    queryKey: ["diaryMessages", hotelProfile?.id],
    queryFn: () => base44.entities.HotelDiaryMessage.filter({ hotel_email: user?.email }, "created_date", 200),
    enabled: !!user?.email,
  });

  const commentsByRecord = useMemo(() => {
    const map = {};
    diaryMessages.forEach((m) => { (map[m.record_id] = map[m.record_id] || []).push(m); });
    return map;
  }, [diaryMessages]);

  const sendComment = useMutation({
    mutationFn: async ({ record, message, photo_url }) => {
      const msg = await base44.entities.HotelDiaryMessage.create({
        booking_id: record.booking_id,
        record_id: record.id,
        hotel_profile_id: record.hotel_profile_id,
        hotel_email: record.hotel_email,
        owner_email: record.owner_email,
        author_email: user?.email,
        author_name: user?.full_name || (user?.email || "").split("@")[0],
        author_role: "hotel",
        message: message || undefined,
        photo_url: photo_url || undefined,
      });
      try {
        if (record.owner_email) {
          await base44.entities.Notification.create({
            recipient_email: record.owner_email,
            title: `💬 Resposta do hotel — ${record.dog_name || "estadia"}`,
            message: message || "O hotel enviou uma foto no diário.",
            type: "booking",
            icon: "💬",
            link: "/ClientDashboard",
            related_id: record.id,
          });
        }
      } catch (e) { console.warn("Falha ao notificar dono:", e); }
      return msg;
    },
    onSuccess: () => queryClient.invalidateQueries(["diaryMessages", hotelProfile?.id]),
  });

  const resolveMutation = useMutation({
    mutationFn: async (record) => base44.entities.HotelPetRecord.update(record.id, { follow_up_resolved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(["hotelPetRecords", hotelProfile?.id]);
      toast.success(language === "pt" ? "Marcado como resolvido" : "Marked as resolved");
    },
  });

  const pendingFollowUps = records.filter((r) => r.follow_up_needed && !r.follow_up_resolved).length;
  const visibleRecords = showAll ? records : records.slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-50">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Stethoscope className="w-3 h-3" /> {language === "pt" ? "Diário de Estadia" : "Stay Diary"} ({records.length})
          {pendingFollowUps > 0 && (
            <span className="text-orange-600 normal-case tracking-normal">— {pendingFollowUps} {language === "pt" ? "a acompanhar" : "follow-up"}</span>
          )}
        </p>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-bold hover:bg-teal-500 transition-colors active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> {language === "pt" ? "Registo" : "Record"}
        </button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : records.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">
            {language === "pt" ? "Sem registos. Adicione o primeiro registo desta estadia ou de visitas anteriores." : "No records yet."}
          </p>
        ) : (
          <>
            {visibleRecords.map((record) => (
              <RecordTimelineItem
                key={record.id}
                record={record}
                language={language}
                onResolve={resolveMutation.mutate}
                comments={commentsByRecord?.[record.id] || []}
                onSendComment={sendComment.mutate}
                sending={sendComment.isPending}
              />
            ))}
            {records.length > 5 && (
              <button onClick={() => setShowAll((s) => !s)} className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {showAll
                  ? (language === "pt" ? "Ver menos" : "Show less")
                  : (language === "pt" ? `Ver todos os ${records.length} registos` : `Show all ${records.length} records`)}
              </button>
            )}
          </>
        )}
      </div>

      <NewRecordDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        hotelProfile={hotelProfile}
        booking={booking}
        dogName={dogName}
        user={user}
      />
    </div>
  );
}