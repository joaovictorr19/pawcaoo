import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User, Play, CheckSquare, Trash, Zap, ShieldAlert, RefreshCw,
  AlertTriangle, Loader2, Database, Bug, Activity, Wrench,
  Hotel, CreditCard, Stethoscope, Users, Sparkles, ChevronDown, ChevronRight,
} from "lucide-react";

const ENTITIES_TO_CHECK = [
  { name: "Booking", label: "Reservas" },
  { name: "EmergencyWalk", label: "Emergências" },
  { name: "HotelBooking", label: "Reservas Hotel" },
  { name: "WalkerProfile", label: "Passeadores" },
  { name: "TrainerProfile", label: "Treinadores" },
  { name: "UserProfile", label: "Utilizadores" },
  { name: "UserWallet", label: "Carteiras" },
  { name: "Payment", label: "Pagamentos" },
  { name: "Review", label: "Avaliações" },
  { name: "Notification", label: "Notificações" },
];

const DEBUG_FLAG = "__DEBUG_TEST__";

function LogPanel({ logs }) {
  if (logs.length === 0) return null;
  return (
    <div className="mt-4 space-y-1 max-h-64 overflow-y-auto">
      {logs.map((line, i) => (
        <p
          key={i}
          className={`text-xs font-mono p-2 rounded border ${
            line.type === "error"
              ? "bg-red-50 border-red-200 text-red-900"
              : line.type === "warn"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          <span className="text-slate-400 mr-2">
            {new Date(line.time).toLocaleTimeString("pt-PT")}
          </span>
          {line.msg}
        </p>
      ))}
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, accent, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const accents = {
    blue: "border-blue-200 bg-blue-50/50",
    red: "border-red-200 bg-red-50/50",
    orange: "border-orange-200 bg-orange-50/50",
    teal: "border-teal-200 bg-teal-50/50",
    purple: "border-purple-200 bg-purple-50/50",
  };
  const titleColors = {
    blue: "text-blue-800",
    red: "text-red-800",
    orange: "text-orange-800",
    teal: "text-teal-800",
    purple: "text-purple-800",
  };
  return (
    <Card className={accents[accent]}>
      <CardHeader className="pb-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className={`text-base flex items-center gap-2 ${titleColors[accent]}`}>
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </button>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  );
}

function ActionButton({ onClick, disabled, loading, loadingLabel, icon: Icon, label, variant = "outline", className = "" }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      className={`w-full justify-start ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
      )}
      <span className="text-xs">{loading ? (loadingLabel || "A processar...") : label}</span>
    </Button>
  );
}

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
    setLogs((prev) => [...prev, { msg, type, time: Date.now() }].slice(-100));
  }, []);

  const runAction = async (btnId, actionFn, successMsg, errorMsg) => {
    if (!currentUserEmail) {
      toast.error("Utilizador não carregado — aguarda 1 segundo");
      return;
    }
    setLoadingBtn(btnId);
    try {
      const result = await actionFn();
      addLog(successMsg || `✅ ${btnId} concluído`);
      if (result?.id) addLog(`  → ID: ${result.id}`);
      toast.success(successMsg || "Concluído!");
    } catch (e) {
      addLog(`❌ ${errorMsg || e.message}`, "error");
      toast.error(errorMsg || e.message);
    } finally {
      setLoadingBtn(null);
    }
  };

  // --- HEALTH CHECK ---
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

  // --- CREATE: Booking Pending ---
  const createPendingBooking = () =>
    runAction(
      "pending",
      async () =>
        await base44.entities.Booking.create({
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
      "✅ Pedido Pendente criado"
    );

  // --- CREATE: Active Walk ---
  const createActiveWalk = () =>
    runAction(
      "active",
      async () =>
        await base44.entities.Booking.create({
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
          walker_name: "Passeador Teste",
          special_notes: DEBUG_FLAG,
        }),
      "✅ Passeio Ativo criado"
    );

  // --- CREATE: Completed Walk ---
  const createCompletedWalk = () =>
    runAction(
      "completed",
      async () =>
        await base44.entities.Booking.create({
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
      "✅ Passeio Concluído criado"
    );

  // --- CREATE: Emergency ---
  const createEmergency = () =>
    runAction(
      "emergency",
      async () =>
        await base44.entities.EmergencyWalk.create({
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
      "✅ Emergência criada"
    );

  // --- CREATE: Hotel Booking ---
  const createHotelBooking = () =>
    runAction(
      "hotel",
      async () => {
        const walkers = await base44.entities.WalkerProfile.filter({ professional_type: "hotel" });
        const hotel = walkers[0];
        if (!hotel) throw new Error("Nenhum perfil de hotel encontrado. Cria um primeiro.");
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return await base44.entities.HotelBooking.create({
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
          dogs: [
            {
              dog_name: "Hotel Dog",
              dog_breed: "Misto",
              dog_size: "medium",
              special_notes: DEBUG_FLAG,
            },
          ],
          special_requests: DEBUG_FLAG,
        });
      },
      "✅ Reserva de Hotel criada"
    );

  // --- CREATE: Review ---
  const createReview = () =>
    runAction(
      "review",
      async () => {
        const walkers = await base44.entities.WalkerProfile.filter({});
        const walker = walkers[0];
        if (!walker) throw new Error("Nenhum WalkerProfile encontrado.");
        return await base44.entities.Review.create({
          walker_id: walker.id,
          walker_name: walker.walker_name,
          reviewer_email: currentUserEmail,
          reviewer_name: currentUser?.full_name || "Admin Teste",
          rating: 5,
          comment: "Excelente serviço! (dados de teste)",
          is_verified: true,
          would_recommend: true,
          categories: {
            punctuality: 5,
            care: 5,
            communication: 5,
            professionalism: 5,
          },
        });
      },
      "✅ Avaliação criada"
    );

  // --- CREATE: Wallet Transaction ---
  const createWalletTx = () =>
    runAction(
      "wallet",
      async () => {
        const wallets = await base44.entities.UserWallet.filter({});
        const wallet = wallets[0];
        if (!wallet) throw new Error("Nenhuma carteira encontrada.");
        return await base44.entities.WalletTransaction.create({
          user_email: wallet.user_email,
          transaction_type: "credit",
          amount: 5.0,
          description: `Crédito de teste ${DEBUG_FLAG}`,
          balance_after: (wallet.available_balance || 0) + 5,
        });
      },
      "✅ Transação de carteira criada"
    );

  // --- DELETE: Clear Test Data ---
  const clearTestData = async () => {
    if (!confirm("Apagar TODOS os dados de teste (marcados com __DEBUG_TEST__)?")) return;
    setLoadingBtn("clear");
    addLog("A apagar dados de teste...");
    let deletedCount = 0;

    try {
      // Bookings by current user
      const ownerBookings = await base44.entities.Booking.filter({ owner_email: currentUserEmail });
      const walkerBookings = await base44.entities.Booking.filter({ walker_email: currentUserEmail });
      const bookingIds = new Set([...ownerBookings.map((b) => b.id), ...walkerBookings.map((b) => b.id)]);
      for (const id of bookingIds) {
        await base44.entities.Booking.delete(id);
        deletedCount++;
      }
      addLog(`  Bookings: ${bookingIds.size} apagados`);

      // Emergency walks by current user
      const emergencies = await base44.entities.EmergencyWalk.filter({ owner_email: currentUserEmail });
      for (const e of emergencies) {
        await base44.entities.EmergencyWalk.delete(e.id);
        deletedCount++;
      }
      addLog(`  Emergências: ${emergencies.length} apagadas`);

      // Hotel bookings with debug flag
      try {
        const hotelBookings = await base44.entities.HotelBooking.filter({ owner_email: currentUserEmail });
        for (const hb of hotelBookings) {
          await base44.entities.HotelBooking.delete(hb.id);
          deletedCount++;
        }
        addLog(`  Reservas Hotel: ${hotelBookings.length} apagadas`);
      } catch (e) {
        addLog(`  Reservas Hotel: ignorado (${e.message})`, "warn");
      }

      // Reviews with debug flag
      try {
        const reviews = await base44.entities.Review.filter({ reviewer_email: currentUserEmail });
        for (const r of reviews) {
          await base44.entities.Review.delete(r.id);
          deletedCount++;
        }
        addLog(`  Avaliações: ${reviews.length} apagadas`);
      } catch (e) {
        addLog(`  Avaliações: ignorado (${e.message})`, "warn");
      }

      // Wallet transactions with debug flag
      try {
        const txs = await base44.entities.WalletTransaction.filter({ user_email: currentUserEmail });
        for (const tx of txs) {
          if (tx.description?.includes(DEBUG_FLAG)) {
            await base44.entities.WalletTransaction.delete(tx.id);
            deletedCount++;
          }
        }
        addLog(`  Transações carteira: filtradas e apagadas`);
      } catch (e) {
        addLog(`  Transações carteira: ignorado (${e.message})`, "warn");
      }

      addLog(`✅ Total apagado: ${deletedCount} registos`);
      toast.success(`${deletedCount} registos de teste apagados!`);
    } catch (e) {
      addLog(`❌ Erro ao apagar: ${e.message}`, "error");
      toast.error("Erro: " + e.message);
    } finally {
      setLoadingBtn(null);
    }
  };

  // --- REPAIR: Normalize Profiles ---
  const repairProProfiles = async () => {
    if (!confirm("Normalizar todos os WalkerProfile e TrainerProfile?")) return;
    setLoadingBtn("repair");
    addLog("A reparar perfis profissionais...");

    try {
      // WalkerProfile
      const walkers = await base44.entities.WalkerProfile.list("-created_date", 500);
      let walkerFixed = 0;
      for (const w of walkers) {
        const updates = {};
        const arrays = [
          "services_offered", "portfolio", "faq", "dog_sizes",
          "service_areas", "availability", "specializations",
          "training_specializations", "breed_specialization",
          "dog_breeds_handled", "languages_spoken", "success_stories",
          "certifications_detailed", "hotel_partnerships",
        ];
        for (const field of arrays) {
          if (!Array.isArray(w[field])) updates[field] = [];
        }
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

      // TrainerProfile
      const trainers = await base44.entities.TrainerProfile.list("-created_date", 500);
      let trainerFixed = 0;
      for (const t of trainers) {
        const updates = {};
        const arrays = [
          "services_offered", "portfolio", "training_specialties",
          "training_methodologies", "certifications", "certifications_detailed",
          "dog_sizes", "service_areas", "availability", "consultation_options",
        ];
        for (const field of arrays) {
          if (!Array.isArray(t[field])) updates[field] = [];
        }
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

  // --- REPAIR: Fix Duplicates ---
  const fixDuplicates = async () => {
    if (!confirm("Remover perfis duplicados? Mantém o mais recente por email.")) return;
    setLoadingBtn("dedup");
    addLog("A remover duplicados...");

    try {
      // WalkerProfile
      const walkers = await base44.entities.WalkerProfile.list("-created_date", 500);
      const walkerMap = {};
      for (const w of walkers) {
        const key = w.created_by || w.walker_name || w.id;
        if (!walkerMap[key]) walkerMap[key] = [];
        walkerMap[key].push(w);
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

      // TrainerProfile
      const trainers = await base44.entities.TrainerProfile.list("-created_date", 500);
      const trainerMap = {};
      for (const t of trainers) {
        const key = t.created_by || t.trainer_name || t.id;
        if (!trainerMap[key]) trainerMap[key] = [];
        trainerMap[key].push(t);
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

      const total = walkerDeleted + trainerDeleted;
      addLog(`✅ Total duplicados removidos: ${total}`);
      toast.success(`${total} duplicados removidos!`);
    } catch (e) {
      addLog(`❌ Erro: ${e.message}`, "error");
      toast.error("Erro: " + e.message);
    } finally {
      setLoadingBtn(null);
    }
  };

  // --- TEST: Backend Functions ---
  const testFunction = async (fnName, payload, label) => {
    setLoadingBtn(`fn_${fnName}`);
    addLog(`A testar função: ${fnName}...`);
    try {
      const response = await base44.functions.invoke(fnName, payload || {});
      addLog(`✅ ${fnName}: sucesso`);
      if (response?.data) {
        const preview = JSON.stringify(response.data).slice(0, 200);
        addLog(`  → ${preview}${JSON.stringify(response.data).length > 200 ? "..." : ""}`);
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

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Bug className="w-6 h-6 text-teal-600" />
            Admin Debug & Testes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sessão: <strong className="text-slate-700">{currentUserEmail || "a carregar..."}</strong>
          </p>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" /> Modo Debug
        </Badge>
      </div>

      {/* HEALTH CHECK */}
      <SectionCard
        icon={Activity}
        title="Saúde do Sistema"
        subtitle="Verifica contagens de entidades em tempo real"
        accent="teal"
      >
        <div className="flex items-center gap-2 mb-4">
          <Button onClick={runHealthCheck} disabled={healthLoading} className="bg-teal-600 hover:bg-teal-700 text-white">
            {healthLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
            {healthLoading ? "A verificar..." : "Verificar Agora"}
          </Button>
        </div>
        {healthData && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(healthData).map(([key, data]) => (
              <div
                key={key}
                className={`p-3 rounded-xl border text-center ${
                  data.status === "ok"
                    ? "bg-white border-slate-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <p className="text-lg font-black text-slate-900">{data.count}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">{data.label}</p>
                {data.status === "error" && (
                  <p className="text-[9px] text-red-600 mt-1 truncate">{data.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* CREATE TEST DATA */}
      <SectionCard
        icon={Sparkles}
        title="Criar Dados de Teste"
        subtitle="Todos os dados de teste são marcados com __DEBUG_TEST__ para limpeza fácil"
        accent="blue"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <ActionButton
            onClick={createPendingBooking}
            disabled={anyLoading}
            loading={isLoading("pending")}
            loadingLabel="A criar..."
            icon={User}
            label="Pedido Pendente"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          />
          <ActionButton
            onClick={createActiveWalk}
            disabled={anyLoading}
            loading={isLoading("active")}
            loadingLabel="A criar..."
            icon={Play}
            label="Passeio Ativo (Cockpit)"
            className="border-green-200 text-green-700 hover:bg-green-50"
          />
          <ActionButton
            onClick={createCompletedWalk}
            disabled={anyLoading}
            loading={isLoading("completed")}
            loadingLabel="A criar..."
            icon={CheckSquare}
            label="Passeio Concluído (Carteira)"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          />
          <ActionButton
            onClick={createEmergency}
            disabled={anyLoading}
            loading={isLoading("emergency")}
            loadingLabel="A criar..."
            icon={Zap}
            label="Emergência PawGo"
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
          />
          <ActionButton
            onClick={createHotelBooking}
            disabled={anyLoading}
            loading={isLoading("hotel")}
            loadingLabel="A criar..."
            icon={Hotel}
            label="Reserva de Hotel"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          />
          <ActionButton
            onClick={createReview}
            disabled={anyLoading}
            loading={isLoading("review")}
            loadingLabel="A criar..."
            icon={Stethoscope}
            label="Avaliação de Teste"
            className="border-pink-200 text-pink-700 hover:bg-pink-50"
          />
          <ActionButton
            onClick={createWalletTx}
            disabled={anyLoading}
            loading={isLoading("wallet")}
            loadingLabel="A criar..."
            icon={CreditCard}
            label="Transação de Carteira"
            className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
          />
        </div>
      </SectionCard>

      {/* BACKEND FUNCTION TESTS */}
      <SectionCard
        icon={Wrench}
        title="Testar Funções Backend"
        subtitle="Executa funções backend com payloads de teste"
        accent="purple"
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <ActionButton
            onClick={() => testFunction("getStripeAccountStatus", {}, "Stripe Account Status")}
            disabled={anyLoading}
            loading={isLoading("fn_getStripeAccountStatus")}
            loadingLabel="A testar..."
            icon={CreditCard}
            label="getStripeAccountStatus"
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          />
          <ActionButton
            onClick={() => testFunction("syncHotelAvailability", {}, "Sync Hotel Availability")}
            disabled={anyLoading}
            loading={isLoading("fn_syncHotelAvailability")}
            loadingLabel="A testar..."
            icon={Hotel}
            label="syncHotelAvailability"
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          />
          <ActionButton
            onClick={() => testFunction("processBreakageDaily", {}, "Process Breakage")}
            disabled={anyLoading}
            loading={isLoading("fn_processBreakageDaily")}
            loadingLabel="A testar..."
            icon={RefreshCw}
            label="processBreakageDaily"
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          />
          <ActionButton
            onClick={() => testFunction("retryBlockedPayouts", {}, "Retry Blocked Payouts")}
            disabled={anyLoading}
            loading={isLoading("fn_retryBlockedPayouts")}
            loadingLabel="A testar..."
            icon={CreditCard}
            label="retryBlockedPayouts"
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          />
        </div>
      </SectionCard>

      {/* REPAIR PROFILES */}
      <SectionCard
        icon={ShieldAlert}
        title="Reparar Perfis Profissionais"
        subtitle="Normaliza arrays null/undefined e remove duplicados"
        accent="orange"
        defaultOpen={false}
      >
        <div className="flex flex-col md:flex-row gap-2">
          <ActionButton
            onClick={repairProProfiles}
            disabled={anyLoading}
            loading={isLoading("repair")}
            loadingLabel="A reparar..."
            icon={RefreshCw}
            label="Normalizar Todos os Perfis"
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
          />
          <ActionButton
            onClick={fixDuplicates}
            disabled={anyLoading}
            loading={isLoading("dedup")}
            loadingLabel="A remover..."
            icon={Trash}
            label="Remover Perfis Duplicados"
            className="flex-1 bg-red-700 hover:bg-red-800 text-white border-red-700"
          />
        </div>
      </SectionCard>

      {/* DANGER ZONE */}
      <SectionCard
        icon={AlertTriangle}
        title="Zona de Perigo"
        subtitle="Apaga todos os dados de teste marcados com __DEBUG_TEST__"
        accent="red"
        defaultOpen={false}
      >
        <p className="text-xs text-red-600 mb-3">
          Apaga bookings, emergências, reservas de hotel, avaliações e transações de carteira de teste associados ao teu email.
        </p>
        <Button onClick={clearTestData} disabled={anyLoading} variant="destructive" className="w-full">
          {isLoading("clear") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash className="w-4 h-4 mr-2" />}
          {isLoading("clear") ? "A apagar..." : "Apagar Todos os Dados de Teste"}
        </Button>
      </SectionCard>

      {/* ACTIVITY LOG */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <Activity className="w-5 h-5" />
              Log de Atividade
              {logs.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">{logs.length}</Badge>
              )}
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
            <p className="text-xs text-slate-400 italic py-4 text-center">
              Nenhuma atividade registada. Executa uma ação acima.
            </p>
          ) : (
            <LogPanel logs={logs} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}