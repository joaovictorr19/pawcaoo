import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Play, CheckSquare, Trash, Zap, ShieldAlert, RefreshCw,
  AlertTriangle, Loader2, Database, Bug, Activity, Wrench,
  Hotel, CreditCard, Stethoscope, Users, Sparkles,
} from "lucide-react";
import { SectionCard, ActionButton, LogPanel } from "@/components/admin/debug/DebugPrimitives";
import { runEphemeral, cleanupBookingSideEffects, DEBUG_FLAG } from "@/lib/ephemeralTestRunner";

const ENTITIES_TO_CHECK = [
  { name: "Booking", label: "Reservas" },
  { name: "EmergencyWalk", label: "Emergências" },
  { name: "HotelBooking", label: "Reservas Hotel" },
  { name: "WalkerProfile", label: "Dog Walkers" },
  { name: "TrainerProfile", label: "Treinadores" },
  { name: "UserProfile", label: "Utilizadores" },
  { name: "UserWallet", label: "Carteiras" },
  { name: "Payment", label: "Pagamentos" },
  { name: "Review", label: "Avaliações" },
  { name: "Notification", label: "Notificações" },
];

export default function AdminDebug() {
  const [loadingBtn, setLoadingBtn] = useState(null);
  const [logs, setLogs] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const currentUserEmail = currentUser?.email || "";
  const isLoading = (btn) => loadingBtn === btn;
  const anyLoading = loadingBtn !== null;

  const addLog = useCallback((msg, type = "info") => {
    setLogs((prev) => [...prev, { msg, type, time: Date.now() }].slice(-150));
  }, []);

  // Runner genérico para funções backend read-only
  const testFunction = async (fnName, payload, label) => {
    setLoadingBtn(`fn_${fnName}`);
    addLog(`A testar função: ${fnName}...`);
    try {
      const response = await base44.functions.invoke(fnName, payload || {});
      addLog(`✅ ${fnName}: sucesso`);
      const data = response?.data ?? response;
      if (data) {
        const preview = JSON.stringify(data).slice(0, 200);
        addLog(`  → ${preview}${JSON.stringify(data).length > 200 ? "..." : ""}`);
      }
      toast.success(`${label || fnName}: OK!`);
    } catch (e) {
      addLog(`❌ ${fnName}: ${e.message}`, "error");
      toast.error(`${fnName}: ${e.message}`);
    } finally {
      setLoadingBtn(null);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    toast.info("Log limpo.");
  };

  // ─── HEALTH CHECK ───
  const runHealthCheck = async () => {
    setHealthLoading(true);
    addLog("A verificar saúde das entidades...");
    const results = {};
    for (const ent of ENTITIES_TO_CHECK) {
      try {
        const all = await base44.entities[ent.name].filter({}, "-created_date", 200);
        results[ent.name] = { label: ent.label, count: all.length, status: "ok" };
        addLog(`  ${ent.label}: ${all.length} registos`);
      } catch (e) {
        results[ent.name] = { label: ent.label, count: 0, status: "error", error: e.message };
        addLog(`  ${ent.label}: ERRO — ${e.message}`, "error");
      }
    }
    setHealthData(results);
    setHealthLoading(false);
    toast.success("Verificação concluída!");
  };

  // ─── TESTES EFÉMEROS DE DADOS (criar → verificar → apagar) ───
  const ephemeral = (cfg) =>
    runEphemeral({ ...cfg, addLog, setLoadingBtn, toast });

  const testPendingBooking = () =>
    ephemeral({
      btnId: "pending",
      label: "Reserva Pendente",
      createFn: () =>
        base44.entities.Booking.create({
          owner_email: currentUserEmail,
          owner_name: "Cliente Fictício",
          dog_name: "Rex Teste",
          dog_size: "medium",
          walk_date: new Date().toISOString().split("T")[0],
          walk_time: "10:00",
          duration_hours: 1,
          total_amount: 15.0,
          service_amount: 12.0,
          platform_fee: 3.0,
          status: "pending",
          payment_status: "held",
          pickup_address: "Rua de Teste, 123, Lisboa",
          pickup_lat: 38.7223,
          pickup_lng: -9.1393,
          type: "walk",
          special_notes: DEBUG_FLAG,
        }),
      verifyFn: async (rec) => {
        const got = await base44.entities.Booking.get(rec.id);
        if (got.status !== "pending") throw new Error(`estado inesperado: ${got.status}`);
      },
      deleteFn: (rec) => base44.entities.Booking.delete(rec.id),
    });

  const testActiveWalk = () =>
    ephemeral({
      btnId: "active",
      label: "Passeio Ativo",
      createFn: () =>
        base44.entities.Booking.create({
          owner_email: currentUserEmail,
          owner_name: "Cliente Fictício",
          dog_name: "Max Ativo",
          dog_size: "large",
          walk_date: new Date().toISOString().split("T")[0],
          walk_time: "Now",
          duration_hours: 1,
          total_amount: 20.0,
          service_amount: 16.0,
          platform_fee: 4.0,
          status: "in_progress",
          payment_status: "held",
          pickup_address: "Parque Eduardo VII",
          pickup_lat: 38.729,
          pickup_lng: -9.153,
          type: "walk",
          walker_email: currentUserEmail,
          walker_name: "Dog Walker Teste",
          special_notes: DEBUG_FLAG,
        }),
      verifyFn: async (rec) => {
        const got = await base44.entities.Booking.get(rec.id);
        if (got.status !== "in_progress") throw new Error(`estado inesperado: ${got.status}`);
      },
      deleteFn: (rec) => base44.entities.Booking.delete(rec.id),
    });

  const testCompletedWalk = () =>
    ephemeral({
      btnId: "completed",
      label: "Passeio Concluído",
      createFn: () =>
        base44.entities.Booking.create({
          owner_email: currentUserEmail,
          owner_name: "Cliente Fictício",
          dog_name: "Luna Paga",
          dog_size: "small",
          walk_date: new Date().toISOString().split("T")[0],
          duration_hours: 0.5,
          total_amount: 10.0,
          service_amount: 8.0,
          platform_fee: 2.0,
          status: "completed",
          payment_status: "held",
          pickup_address: "Chiado, Lisboa",
          type: "walk",
          walker_email: currentUserEmail,
          walker_name: "Admin Walker",
          completed_date: new Date().toISOString(),
          special_notes: DEBUG_FLAG,
        }),
      verifyFn: async (rec) => {
        const got = await base44.entities.Booking.get(rec.id);
        if (got.status !== "completed") throw new Error(`estado inesperado: ${got.status}`);
      },
      deleteFn: (rec) => base44.entities.Booking.delete(rec.id),
    });

  const testEmergency = () =>
    ephemeral({
      btnId: "emergency",
      label: "Emergência PawGo",
      createFn: () =>
        base44.entities.EmergencyWalk.create({
          owner_name: "Cliente SOS Teste",
          owner_phone: "999999999",
          owner_email: currentUserEmail,
          location: "Rossio, Lisboa",
          needed_time: "AGORA",
          duration_hours: 1,
          offered_amount: 50.0,
          special_notes: DEBUG_FLAG,
          urgency_level: "immediate",
          status: "available",
          dog_name: "SOS Dog",
          dog_size: "medium",
        }),
      verifyFn: async (rec) => {
        const got = await base44.entities.EmergencyWalk.get(rec.id);
        if (got.status !== "available") throw new Error(`estado inesperado: ${got.status}`);
      },
      deleteFn: (rec) => base44.entities.EmergencyWalk.delete(rec.id),
    });

  const testHotelBooking = () =>
    ephemeral({
      btnId: "hotel",
      label: "Reserva de Hotel",
      createFn: async () => {
        const walkers = await base44.entities.WalkerProfile.filter({ professional_type: "hotel" });
        const hotel = walkers[0];
        if (!hotel) throw new Error("Nenhum perfil de hotel encontrado. Cria um primeiro.");
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return base44.entities.HotelBooking.create({
          hotel_profile_id: hotel.id,
          hotel_name: hotel.walker_name,
          hotel_email: hotel.created_by,
          owner_name: "Cliente Hotel Teste",
          owner_email: currentUserEmail,
          owner_phone: "912345678",
          service_type: "boarding",
          checkin_date: today.toISOString().split("T")[0],
          checkout_date: tomorrow.toISOString().split("T")[0],
          total_nights: 1,
          total_dogs: 1,
          price_per_night: 25,
          total_amount: 25,
          platform_fee: 3.75,
          service_amount: 21.25,
          status: "pending",
          payment_status: "pending",
          dogs: [{ dog_name: "Hotel Dog", dog_breed: "Misto", dog_size: "medium", special_notes: DEBUG_FLAG }],
          special_requests: DEBUG_FLAG,
        });
      },
      verifyFn: async (rec) => {
        const got = await base44.entities.HotelBooking.get(rec.id);
        if (got.status !== "pending") throw new Error(`estado inesperado: ${got.status}`);
      },
      deleteFn: (rec) => base44.entities.HotelBooking.delete(rec.id),
    });

  const testReview = () =>
    ephemeral({
      btnId: "review",
      label: "Avaliação",
      createFn: async () => {
        const walkers = await base44.entities.WalkerProfile.filter({});
        const walker = walkers[0];
        if (!walker) throw new Error("Nenhum WalkerProfile encontrado.");
        return base44.entities.Review.create({
          walker_id: walker.id,
          walker_name: walker.walker_name,
          reviewer_email: currentUserEmail,
          reviewer_name: currentUser?.full_name || "Admin Teste",
          rating: 5,
          comment: "Excelente serviço! (dados de teste)",
          is_verified: true,
          would_recommend: true,
          categories: { punctuality: 5, care: 5, communication: 5, professionalism: 5 },
        });
      },
      verifyFn: async (rec) => {
        const got = await base44.entities.Review.get(rec.id);
        if (got.rating !== 5) throw new Error(`rating inesperado: ${got.rating}`);
      },
      deleteFn: (rec) => base44.entities.Review.delete(rec.id),
    });

  const testWalletTx = () =>
    ephemeral({
      btnId: "wallet",
      label: "Transação de Carteira",
      createFn: async () => {
        const wallets = await base44.entities.UserWallet.filter({});
        const wallet = wallets[0];
        if (!wallet) throw new Error("Nenhuma carteira encontrada.");
        return base44.entities.WalletTransaction.create({
          user_email: wallet.user_email,
          transaction_type: "credit",
          amount: 5.0,
          description: `Crédito de teste ${DEBUG_FLAG}`,
          balance_after: (wallet.available_balance || 0) + 5,
        });
      },
      verifyFn: async (rec) => {
        const got = await base44.entities.WalletTransaction.get(rec.id);
        if (got.amount !== 5) throw new Error(`montante inesperado: ${got.amount}`);
      },
      deleteFn: (rec) => base44.entities.WalletTransaction.delete(rec.id),
    });

  // ─── TESTES DE FLUXO DE PAGAMENTO CRÍTICOS ───
  // Criam um booking efémero, invocam a função e limpam tudo (booking + side-effects).
  // Desenhados com service_amount=0 / sem payment_intent_id para NUNCA mover dinheiro real.

  const testReleaseHotelPayout = () =>
    ephemeral({
      btnId: "payout",
      label: "releaseHotelPayout",
      createFn: async () => {
        const walkers = await base44.entities.WalkerProfile.filter({ professional_type: "hotel" });
        const hotel = walkers[0];
        if (!hotel) throw new Error("Nenhum hotel encontrado para o teste.");
        return base44.entities.HotelBooking.create({
          hotel_profile_id: hotel.id,
          hotel_name: hotel.walker_name,
          hotel_email: hotel.created_by,
          owner_name: "Teste Payout",
          owner_email: currentUserEmail,
          service_type: "boarding",
          checkin_date: new Date().toISOString().split("T")[0],
          checkout_date: new Date().toISOString().split("T")[0],
          total_nights: 1,
          total_amount: 0,
          platform_fee: 0,
          service_amount: 0, // 0 → early-return "No amount to release", sem transferência
          status: "checked_out", // necessário para passar a guarda de estados
          payment_status: "paid",
          special_requests: DEBUG_FLAG,
        });
      },
      verifyFn: async (rec) => {
        const res = await base44.functions.invoke("releaseHotelPayout", { bookingId: rec.id });
        const data = res?.data ?? res;
        addLog(`  → resposta: ${JSON.stringify(data).slice(0, 160)}`);
        if (!data?.success) throw new Error("função não retornou success");
        addLog(`  ✓ releaseHotelPayout executou sem mover dinheiro (service_amount=0)`);
      },
      deleteFn: async (rec) => {
        await cleanupBookingSideEffects(rec.id, addLog);
        await base44.entities.HotelBooking.delete(rec.id);
      },
    });

  const testProcessHotelNoShow = () =>
    ephemeral({
      btnId: "noshow",
      label: "processHotelNoShow",
      createFn: async () => {
        const walkers = await base44.entities.WalkerProfile.filter({ professional_type: "hotel" });
        const hotel = walkers[0];
        if (!hotel) throw new Error("Nenhum hotel encontrado para o teste.");
        return base44.entities.HotelBooking.create({
          hotel_profile_id: hotel.id,
          hotel_name: hotel.walker_name,
          hotel_email: hotel.created_by,
          owner_name: "Teste NoShow",
          owner_email: currentUserEmail,
          service_type: "boarding",
          checkin_date: new Date().toISOString().split("T")[0],
          checkout_date: new Date().toISOString().split("T")[0],
          total_nights: 1,
          total_amount: 0, // 0 → sem reembolso Stripe
          platform_fee: 0,
          service_amount: 0,
          status: "confirmed", // não pode estar checked_in/in_progress/checked_out/completed
          payment_status: "paid", // necessário para passar a guarda
          special_requests: DEBUG_FLAG,
          // sem stripe_payment_intent_id → sem refund real
        });
      },
      verifyFn: async (rec) => {
        const res = await base44.functions.invoke("processHotelNoShow", { bookingId: rec.id });
        const data = res?.data ?? res;
        addLog(`  → resposta: ${JSON.stringify(data).slice(0, 160)}`);
        if (!data?.success) throw new Error("função não retornou success");
        addLog(`  ✓ processHotelNoShow executou sem reembolso real (total_amount=0)`);
      },
      deleteFn: async (rec) => {
        await cleanupBookingSideEffects(rec.id, addLog);
        await base44.entities.HotelBooking.delete(rec.id);
      },
    });

  const testRetryHotelPayment = () =>
    ephemeral({
      btnId: "retry",
      label: "retryHotelPayment",
      createFn: async () => {
        const walkers = await base44.entities.WalkerProfile.filter({ professional_type: "hotel" });
        const hotel = walkers[0];
        if (!hotel) throw new Error("Nenhum hotel encontrado para o teste.");
        return base44.entities.HotelBooking.create({
          hotel_profile_id: hotel.id,
          hotel_name: hotel.walker_name,
          hotel_email: hotel.created_by,
          owner_name: "Teste Retry",
          owner_email: currentUserEmail,
          service_type: "boarding",
          checkin_date: new Date().toISOString().split("T")[0],
          checkout_date: new Date().toISOString().split("T")[0],
          total_nights: 1,
          total_amount: 1, // valor simbólico — cria checkout session, não captura
          platform_fee: 0.15,
          service_amount: 0.85,
          status: "pending",
          payment_status: "pending",
          special_requests: DEBUG_FLAG,
        });
      },
      verifyFn: async (rec) => {
        const res = await base44.functions.invoke("retryHotelPayment", { hotel_booking_id: rec.id });
        const data = res?.data ?? res;
        addLog(`  → resposta: ${JSON.stringify(data).slice(0, 160)}`);
        if (!data?.url && !data?.session_id) throw new Error("função não retornou URL de checkout");
        addLog(`  ✓ retryHotelPayment gerou sessão de checkout (não captura dinheiro)`);
      },
      deleteFn: async (rec) => {
        await cleanupBookingSideEffects(rec.id, addLog);
        await base44.entities.HotelBooking.delete(rec.id);
      },
    });

  // ─── REPARAÇÃO ───
  const repairProProfiles = async () => {
    if (!confirm("Normalizar todos os WalkerProfile e TrainerProfile?")) return;
    setLoadingBtn("repair");
    addLog("A reparar perfis profissionais...");
    try {
      const walkers = await base44.entities.WalkerProfile.list("-created_date", 500);
      let walkerFixed = 0;
      for (const w of walkers) {
        const updates = {};
        const arrays = ["services_offered", "portfolio", "faq", "dog_sizes", "service_areas", "availability", "specializations", "training_specializations", "breed_specialization", "dog_breeds_handled", "languages_spoken", "success_stories", "certifications_detailed", "hotel_partnerships"];
        for (const field of arrays) if (!Array.isArray(w[field])) updates[field] = [];
        if (!Array.isArray(w.accepted_animals)) updates.accepted_animals = ["dogs"];
        if (typeof w.rating !== "number") updates.rating = 0;
        if (typeof w.total_walks !== "number") updates.total_walks = 0;
        if (typeof w.total_earnings !== "number") updates.total_earnings = 0;
        if (!w.walker_name) updates.walker_name = "Sem nome";
        if (Object.keys(updates).length > 0) {
          await base44.entities.WalkerProfile.update(w.id, updates);
          walkerFixed++;
        }
      }
      addLog(`  WalkerProfile: ${walkerFixed}/${walkers.length} normalizados`);
      const trainers = await base44.entities.TrainerProfile.list("-created_date", 500);
      let trainerFixed = 0;
      for (const t of trainers) {
        const updates = {};
        const arrays = ["services_offered", "portfolio", "training_specialties", "training_methodologies", "certifications", "certifications_detailed", "dog_sizes", "service_areas", "availability", "consultation_options"];
        for (const field of arrays) if (!Array.isArray(t[field])) updates[field] = [];
        if (!Array.isArray(t.accepted_animals)) updates.accepted_animals = ["dogs"];
        if (typeof t.rating !== "number") updates.rating = 5;
        if (typeof t.total_earnings !== "number") updates.total_earnings = 0;
        if (!t.trainer_name) updates.trainer_name = "Sem nome";
        if (Object.keys(updates).length > 0) {
          await base44.entities.TrainerProfile.update(t.id, updates);
          trainerFixed++;
        }
      }
      addLog(`  TrainerProfile: ${trainerFixed}/${trainers.length} normalizados`);
      addLog("✅ Reparação concluída!");
      toast.success("Perfis normalizados!");
    } catch (e) {
      addLog(`❌ Erro: ${e.message}`, "error");
      toast.error("Erro: " + e.message);
    } finally {
      setLoadingBtn(null);
    }
  };

  const fixDuplicates = async () => {
    if (!confirm("Remover perfis duplicados? Mantém o mais recente por email.")) return;
    setLoadingBtn("dedup");
    addLog("A remover duplicados...");
    try {
      const walkers = await base44.entities.WalkerProfile.list("-created_date", 500);
      const walkerMap = {};
      for (const w of walkers) {
        const key = w.created_by || w.walker_name || w.id;
        (walkerMap[key] = walkerMap[key] || []).push(w);
      }
      let walkerDeleted = 0;
      for (const [email, profiles] of Object.entries(walkerMap)) {
        if (profiles.length > 1) {
          profiles.sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));
          for (const p of profiles.slice(1)) {
            await base44.entities.WalkerProfile.delete(p.id);
            walkerDeleted++;
          }
          addLog(`  Walker [${email}]: ${profiles.length - 1} duplicados removidos`);
        }
      }
      const trainers = await base44.entities.TrainerProfile.list("-created_date", 500);
      const trainerMap = {};
      for (const t of trainers) {
        const key = t.created_by || t.trainer_name || t.id;
        (trainerMap[key] = trainerMap[key] || []).push(t);
      }
      let trainerDeleted = 0;
      for (const [email, profiles] of Object.entries(trainerMap)) {
        if (profiles.length > 1) {
          profiles.sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));
          for (const p of profiles.slice(1)) {
            await base44.entities.TrainerProfile.delete(p.id);
            trainerDeleted++;
          }
          addLog(`  Trainer [${email}]: ${profiles.length - 1} duplicados removidos`);
        }
      }
      addLog(`✅ Total duplicados removidos: ${walkerDeleted + trainerDeleted}`);
      toast.success(`${walkerDeleted + trainerDeleted} duplicados removidos!`);
    } catch (e) {
      addLog(`❌ Erro: ${e.message}`, "error");
      toast.error("Erro: " + e.message);
    } finally {
      setLoadingBtn(null);
    }
  };

  // ─── LIMPEZA RESIDUAL (rede de segurança) ───
  const clearResidual = async () => {
    if (!confirm("Apagar TODOS os dados de teste residuais marcados com __DEBUG_TEST__?")) return;
    setLoadingBtn("clear");
    addLog("A procurar e apagar residuais de teste...");
    let deletedCount = 0;
    try {
      const ownerBookings = await base44.entities.Booking.filter({ owner_email: currentUserEmail });
      for (const b of ownerBookings) {
        if (b.special_notes?.includes(DEBUG_FLAG)) {
          await base44.entities.Booking.delete(b.id);
          deletedCount++;
        }
      }
      const emergencies = await base44.entities.EmergencyWalk.filter({ owner_email: currentUserEmail });
      for (const e of emergencies) {
        if (e.special_notes?.includes(DEBUG_FLAG)) {
          await base44.entities.EmergencyWalk.delete(e.id);
          deletedCount++;
        }
      }
      try {
        const hotelBookings = await base44.entities.HotelBooking.filter({ owner_email: currentUserEmail });
        for (const hb of hotelBookings) {
          if (hb.special_requests?.includes(DEBUG_FLAG)) {
            await cleanupBookingSideEffects(hb.id, addLog);
            await base44.entities.HotelBooking.delete(hb.id);
            deletedCount++;
          }
        }
      } catch (e) {
        addLog(`  Reservas Hotel: ignorado (${e.message})`, "warn");
      }
      try {
        const reviews = await base44.entities.Review.filter({ reviewer_email: currentUserEmail });
        for (const r of reviews) {
          if (r.comment?.includes(DEBUG_FLAG)) {
            await base44.entities.Review.delete(r.id);
            deletedCount++;
          }
        }
      } catch (e) {
        addLog(`  Avaliações: ignorado (${e.message})`, "warn");
      }
      try {
        const txs = await base44.entities.WalletTransaction.filter({ user_email: currentUserEmail });
        for (const tx of txs) {
          if (tx.description?.includes(DEBUG_FLAG)) {
            await base44.entities.WalletTransaction.delete(tx.id);
            deletedCount++;
          }
        }
      } catch (e) {
        addLog(`  Transações carteira: ignorado (${e.message})`, "warn");
      }
      addLog(`✅ Total residuais apagados: ${deletedCount}`);
      toast.success(`${deletedCount} residuais apagados!`);
    } catch (e) {
      addLog(`❌ Erro ao apagar: ${e.message}`, "error");
      toast.error("Erro: " + e.message);
    } finally {
      setLoadingBtn(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Bug className="w-6 h-6 text-teal-600" />
            Diagnóstico & Testes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sessão: <strong className="text-slate-700">{currentUserEmail || "a carregar..."}</strong> · testes efémeros (criar→verificar→apagar)
          </p>
        </div>
        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
          <Activity className="w-3 h-3 mr-1" /> Efémero
        </Badge>
      </div>

      {/* SAÚDE */}
      <SectionCard icon={Activity} title="Saúde do Sistema" subtitle="Verifica contagens de entidades em tempo real" accent="teal">
        <div className="flex items-center gap-2 mb-4">
          <Button onClick={runHealthCheck} disabled={healthLoading} className="bg-teal-600 hover:bg-teal-700 text-white">
            {healthLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
            {healthLoading ? "A verificar..." : "Verificar Agora"}
          </Button>
        </div>
        {healthData && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(healthData).map(([key, data]) => (
              <div key={key} className={`p-3 rounded-xl border text-center ${data.status === "ok" ? "bg-white border-slate-200" : "bg-red-50 border-red-200"}`}>
                <p className="text-lg font-black text-slate-900">{data.count}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">{data.label}</p>
                {data.status === "error" && <p className="text-[9px] text-red-600 mt-1 truncate">{data.error}</p>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* TESTES EFÉMEROS DE DADOS */}
      <SectionCard icon={Sparkles} title="Testes de Dados (efémeros)" subtitle="Cada teste cria um registo, verifica-o e apaga-o automaticamente — não deixa lixo" accent="blue">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <ActionButton onClick={testPendingBooking} disabled={anyLoading} loading={isLoading("pending")} loadingLabel="A testar..." icon={Users} label="Reserva Pendente" className="border-blue-200 text-blue-700 hover:bg-blue-50" />
          <ActionButton onClick={testActiveWalk} disabled={anyLoading} loading={isLoading("active")} loadingLabel="A testar..." icon={Play} label="Passeio Ativo" className="border-green-200 text-green-700 hover:bg-green-50" />
          <ActionButton onClick={testCompletedWalk} disabled={anyLoading} loading={isLoading("completed")} loadingLabel="A testar..." icon={CheckSquare} label="Passeio Concluído" className="border-purple-200 text-purple-700 hover:bg-purple-50" />
          <ActionButton onClick={testEmergency} disabled={anyLoading} loading={isLoading("emergency")} loadingLabel="A testar..." icon={Zap} label="Emergência PawGo" className="border-orange-200 text-orange-700 hover:bg-orange-50" />
          <ActionButton onClick={testHotelBooking} disabled={anyLoading} loading={isLoading("hotel")} loadingLabel="A testar..." icon={Hotel} label="Reserva de Hotel" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" />
          <ActionButton onClick={testReview} disabled={anyLoading} loading={isLoading("review")} loadingLabel="A testar..." icon={Stethoscope} label="Avaliação" className="border-pink-200 text-pink-700 hover:bg-pink-50" />
          <ActionButton onClick={testWalletTx} disabled={anyLoading} loading={isLoading("wallet")} loadingLabel="A testar..." icon={CreditCard} label="Transação de Carteira" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50" />
        </div>
      </SectionCard>

      {/* FLUXOS DE PAGAMENTO CRÍTICOS */}
      <SectionCard icon={CreditCard} title="Fluxos de Pagamento Críticos" subtitle="Criam booking efémero + invocam a função + limpam tudo. Desenhados para nunca mover dinheiro real (service_amount=0 / sem payment_intent)" accent="purple" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <ActionButton onClick={testReleaseHotelPayout} disabled={anyLoading} loading={isLoading("payout")} loadingLabel="A testar..." icon={CreditCard} label="releaseHotelPayout (payout)" className="border-slate-200 text-slate-700 hover:bg-slate-50" />
          <ActionButton onClick={testProcessHotelNoShow} disabled={anyLoading} loading={isLoading("noshow")} loadingLabel="A testar..." icon={ShieldAlert} label="processHotelNoShow (no-show)" className="border-slate-200 text-slate-700 hover:bg-slate-50" />
          <ActionButton onClick={testRetryHotelPayment} disabled={anyLoading} loading={isLoading("retry")} loadingLabel="A testar..." icon={RefreshCw} label="retryHotelPayment (checkout)" className="border-slate-200 text-slate-700 hover:bg-slate-50" />
        </div>
      </SectionCard>

      {/* FUNÇÕES BACKEND READ-ONLY */}
      <SectionCard icon={Wrench} title="Funções Backend (read-only)" subtitle="Invoca funções backend sem criar dados" accent="purple" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <ActionButton onClick={() => testFunction("stripeHealthCheck", {}, "Stripe Health Check")} disabled={anyLoading} loading={isLoading("fn_stripeHealthCheck")} loadingLabel="A testar..." icon={CreditCard} label="stripeHealthCheck" className="border-slate-200 text-slate-700 hover:bg-slate-50" />
          <ActionButton onClick={() => testFunction("getStripeAccountStatus", {}, "Stripe Account Status")} disabled={anyLoading} loading={isLoading("fn_getStripeAccountStatus")} loadingLabel="A testar..." icon={CreditCard} label="getStripeAccountStatus" className="border-slate-200 text-slate-700 hover:bg-slate-50" />
          <ActionButton onClick={() => testFunction("syncHotelAvailability", {}, "Sync Hotel Availability")} disabled={anyLoading} loading={isLoading("fn_syncHotelAvailability")} loadingLabel="A testar..." icon={Hotel} label="syncHotelAvailability" className="border-slate-200 text-slate-700 hover:bg-slate-50" />
          <ActionButton onClick={() => testFunction("retryBlockedPayouts", {}, "Retry Blocked Payouts")} disabled={anyLoading} loading={isLoading("fn_retryBlockedPayouts")} loadingLabel="A testar..." icon={CreditCard} label="retryBlockedPayouts" className="border-slate-200 text-slate-700 hover:bg-slate-50" />
          <ActionButton onClick={() => testFunction("checkHotelCapacity", {}, "Check Hotel Capacity")} disabled={anyLoading} loading={isLoading("fn_checkHotelCapacity")} loadingLabel="A testar..." icon={Hotel} label="checkHotelCapacity" className="border-slate-200 text-slate-700 hover:bg-slate-50" />
        </div>
      </SectionCard>

      {/* REPARAÇÃO */}
      <SectionCard icon={ShieldAlert} title="Reparar Perfis Profissionais" subtitle="Normaliza arrays null/undefined e remove duplicados" accent="orange" defaultOpen={false}>
        <div className="flex flex-col md:flex-row gap-2">
          <ActionButton onClick={repairProProfiles} disabled={anyLoading} loading={isLoading("repair")} loadingLabel="A reparar..." icon={RefreshCw} label="Normalizar Todos os Perfis" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-orange-600" />
          <ActionButton onClick={fixDuplicates} disabled={anyLoading} loading={isLoading("dedup")} loadingLabel="A remover..." icon={Trash} label="Remover Perfis Duplicados" className="flex-1 bg-red-700 hover:bg-red-800 text-white border-red-700" />
        </div>
      </SectionCard>

      {/* LIMPEZA RESIDUAL */}
      <SectionCard icon={AlertTriangle} title="Limpeza Residual" subtitle="Apaga registos de teste que tenham ficado por apagar (interrupções)" accent="red" defaultOpen={false}>
        <p className="text-xs text-red-600 mb-3">Procura bookings, emergências, reservas de hotel, avaliações e transações marcados com __DEBUG_TEST__ associados ao teu email e apaga-os.</p>
        <Button onClick={clearResidual} disabled={anyLoading} variant="destructive" className="w-full">
          {isLoading("clear") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash className="w-4 h-4 mr-2" />}
          {isLoading("clear") ? "A apagar..." : "Apagar Residuais de Teste"}
        </Button>
      </SectionCard>

      {/* LOG */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <Activity className="w-5 h-5" />
              Log de Atividade
              {logs.length > 0 && <Badge variant="secondary" className="text-[10px]">{logs.length}</Badge>}
            </CardTitle>
            {logs.length > 0 && (
              <Button onClick={clearLogs} variant="ghost" size="sm" className="text-xs h-8">
                <Trash className="w-3 h-3 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">Nenhuma atividade registada. Executa um teste acima.</p>
          ) : (
            <LogPanel logs={logs} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}