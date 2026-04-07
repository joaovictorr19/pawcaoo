import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, Play, CheckSquare, Trash, Zap, ShieldAlert, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";

export default function AdminDebug() {
  const [loadingBtn, setLoadingBtn] = useState(null); // tracks which button is loading
  const [repairLog, setRepairLog] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  const isLoading = (btn) => loadingBtn === btn;
  const anyLoading = loadingBtn !== null;

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const currentUserEmail = currentUser?.email || "";

  // --- CREATE ACTIONS ---

  const createPendingBooking = async () => {
    if (!currentUserEmail) return toast.error("Utilizador não carregado — aguarda 1 segundo e tenta de novo");
    setLoadingBtn('pending');
    setLastResult(null);
    try {
      const booking = await base44.entities.Booking.create({
        owner_email: "cliente-teste@debug.com",
        owner_name: "Cliente Fictício",
        dog_name: "Rex Teste",
        dog_size: "medium",
        walk_date: new Date().toISOString().split('T')[0],
        walk_time: "10:00",
        duration_hours: 1,
        total_amount: 15.00,
        service_amount: 12.00,
        platform_fee: 3.00,
        status: "pending",
        payment_status: "held",
        pickup_address: "Rua de Teste, 123, Lisboa",
        pickup_lat: 38.7223,
        pickup_lng: -9.1393,
        type: "walk",
        special_notes: "__DEBUG_TEST__"
      });
      setLastResult({ type: 'success', msg: `✅ Pedido Pendente criado! ID: ${booking.id}` });
      toast.success(`✅ Pedido Pendente criado!`);
    } catch (e) {
      setLastResult({ type: 'error', msg: `❌ Erro: ${e.message}` });
      toast.error("Erro: " + e.message);
    }
    finally { setLoadingBtn(null); }
  };

  const createActiveWalk = async () => {
    if (!currentUserEmail) return toast.error("Utilizador não carregado — aguarda 1 segundo e tenta de novo");
    setLoadingBtn('active');
    setLastResult(null);
    try {
      const booking = await base44.entities.Booking.create({
        owner_email: "cliente-teste@debug.com",
        owner_name: "Cliente Fictício",
        dog_name: "Max Ativo",
        dog_size: "large",
        walk_date: new Date().toISOString().split('T')[0],
        walk_time: "Now",
        duration_hours: 1,
        total_amount: 20.00,
        service_amount: 16.00,
        platform_fee: 4.00,
        status: "in_progress",
        payment_status: "held",
        pickup_address: "Parque Eduardo VII",
        pickup_lat: 38.7290,
        pickup_lng: -9.1530,
        type: "walk",
        walker_email: currentUserEmail,
        walker_name: "Passeador Teste",
        special_notes: "__DEBUG_TEST__"
      });
      setLastResult({ type: 'success', msg: `✅ Passeio Ativo criado! ID: ${booking.id}` });
      toast.success('✅ Passeio Ativo criado!');
    } catch (e) {
      setLastResult({ type: 'error', msg: `❌ Erro: ${e.message}` });
      toast.error("Erro: " + e.message);
    }
    finally { setLoadingBtn(null); }
  };

  const createCompletedWalk = async () => {
    if (!currentUserEmail) return toast.error("Utilizador não carregado — aguarda 1 segundo e tenta de novo");
    setLoadingBtn('completed');
    setLastResult(null);
    try {
      await base44.entities.Booking.create({
        owner_email: "client-test@debug.com",
        owner_name: "Cliente Fictício",
        dog_name: "Luna Paga",
        dog_size: "small",
        walk_date: new Date().toISOString().split('T')[0],
        duration_hours: 0.5,
        total_amount: 10.00,
        service_amount: 8.00,
        platform_fee: 2.00,
        status: "completed",
        payment_status: "held",
        pickup_address: "Chiado, Lisboa",
        type: "walk",
        walker_email: currentUserEmail,
        walker_name: "Admin Walker",
        completed_date: new Date().toISOString(),
        special_notes: "__DEBUG_TEST__"
      });
      setLastResult({ type: 'success', msg: '✅ Passeio Concluído criado! Abre a Carteira para confirmar.' });
      toast.success("✅ Passeio Concluído criado!");
    } catch (e) {
      setLastResult({ type: 'error', msg: `❌ Erro: ${e.message}` });
      toast.error("Erro: " + e.message);
    }
    finally { setLoadingBtn(null); }
  };

  const createEmergency = async () => {
    if (!currentUserEmail) return toast.error("Utilizador não carregado — aguarda 1 segundo e tenta de novo");
    setLoadingBtn('emergency');
    setLastResult(null);
    try {
      const walk = await base44.entities.EmergencyWalk.create({
        owner_name: "Cliente SOS Teste",
        owner_phone: "999999999",
        owner_email: "sos-teste@debug.com",
        location: "Rossio, Lisboa",
        needed_time: "AGORA",
        duration_hours: 1,
        offered_amount: 50.00,
        special_notes: "__DEBUG_TEST__",
        urgency_level: "immediate",
        status: "available",
        dog_name: "SOS Dog",
        dog_size: "medium"
      });
      setLastResult({ type: 'success', msg: `✅ Emergência criada! ID: ${walk.id}` });
      toast.success('✅ Emergência criada!');
    } catch (e) {
      setLastResult({ type: 'error', msg: `❌ Erro: ${e.message}` });
      toast.error("Erro: " + e.message);
    }
    finally { setLoadingBtn(null); }
  };

  // --- DELETE ACTIONS ---

  const clearTestData = async () => {
    if (!confirm("Apagar TODOS os dados de teste? (bookings e emergências com __DEBUG_TEST__)")) return;
    setLoadingBtn('clear');
    setLastResult(null);
    let deletedCount = 0;
    try {
      // Delete bookings where owner is current user OR walker is current user
      const ownerBookings = await base44.entities.Booking.filter({ owner_email: currentUserEmail });
      const walkerBookings = await base44.entities.Booking.filter({ walker_email: currentUserEmail });
      
      // Combine and deduplicate
      const allBookingIds = new Set([
        ...ownerBookings.map(b => b.id),
        ...walkerBookings.map(b => b.id)
      ]);

      for (const id of allBookingIds) {
        await base44.entities.Booking.delete(id);
        deletedCount++;
      }

      // Delete emergency walks created by current user
      const emergencies = await base44.entities.EmergencyWalk.filter({ owner_email: currentUserEmail });
      for (const e of emergencies) {
        await base44.entities.EmergencyWalk.delete(e.id);
        deletedCount++;
      }

      setLastResult({ type: 'success', msg: `✅ ${deletedCount} registos apagados com sucesso.` });
      toast.success(`✅ ${deletedCount} registos de teste apagados`);
    } catch (e) {
      setLastResult({ type: 'error', msg: `❌ Erro ao apagar: ${e.message}` });
      toast.error("Erro ao apagar: " + e.message);
    }
    finally { setLoadingBtn(null); }
  };

  // --- REPAIR PROFILES ---

  const repairProProfiles = async () => {
    if (!confirm("Normalizar todos os perfis de WalkerProfile e TrainerProfile?")) return;
    setLoadingBtn('repair');

    const log = [];
    setRepairLog([]);

    try {
      // Fix WalkerProfile: ensure arrays aren't null
      const walkers = await base44.entities.WalkerProfile.list('-created_date', 500);
      let walkerFixed = 0;
      for (const w of walkers) {
        const updates = {};
        if (!Array.isArray(w.route_coordinates)) updates.route_coordinates = [];
        if (!Array.isArray(w.services_offered)) updates.services_offered = [];
        if (!Array.isArray(w.portfolio)) updates.portfolio = [];
        if (!Array.isArray(w.faq)) updates.faq = [];
        if (!Array.isArray(w.dog_sizes)) updates.dog_sizes = [];
        if (!Array.isArray(w.service_areas)) updates.service_areas = [];
        if (!Array.isArray(w.accepted_animals)) updates.accepted_animals = ["dogs"];
        if (!Array.isArray(w.availability)) updates.availability = [];
        if (!Array.isArray(w.specializations)) updates.specializations = [];
        if (!Array.isArray(w.training_specializations)) updates.training_specializations = [];
        if (typeof w.rating !== 'number') updates.rating = 0;
        if (typeof w.total_walks !== 'number') updates.total_walks = 0;
        if (typeof w.total_earnings !== 'number') updates.total_earnings = 0;

        if (Object.keys(updates).length > 0) {
          await base44.entities.WalkerProfile.update(w.id, updates);
          walkerFixed++;
        }
      }
      log.push(`✅ WalkerProfile: ${walkerFixed}/${walkers.length} perfis normalizados`);

      // Fix TrainerProfile: ensure arrays aren't null
      const trainers = await base44.entities.TrainerProfile.list('-created_date', 500);
      let trainerFixed = 0;
      for (const t of trainers) {
        const updates = {};
        if (!Array.isArray(t.services_offered)) updates.services_offered = [];
        if (!Array.isArray(t.portfolio)) updates.portfolio = [];
        if (!Array.isArray(t.training_specialties)) updates.training_specialties = [];
        if (!Array.isArray(t.training_methodologies)) updates.training_methodologies = [];
        if (!Array.isArray(t.certifications)) updates.certifications = [];
        if (!Array.isArray(t.certifications_detailed)) updates.certifications_detailed = [];
        if (!Array.isArray(t.dog_sizes)) updates.dog_sizes = [];
        if (!Array.isArray(t.service_areas)) updates.service_areas = [];
        if (!Array.isArray(t.accepted_animals)) updates.accepted_animals = ["dogs"];
        if (!Array.isArray(t.availability)) updates.availability = [];
        if (!Array.isArray(t.consultation_options)) updates.consultation_options = [];
        if (typeof t.rating !== 'number') updates.rating = 5;
        if (typeof t.total_clients !== 'number') updates.total_clients = 0;
        if (typeof t.total_earnings !== 'number') updates.total_earnings = 0;

        if (Object.keys(updates).length > 0) {
          await base44.entities.TrainerProfile.update(t.id, updates);
          trainerFixed++;
        }
      }
      log.push(`✅ TrainerProfile: ${trainerFixed}/${trainers.length} perfis normalizados`);

      setRepairLog(log);
      toast.success("Reparação concluída!");
    } catch (error) {
      toast.error("Erro na reparação: " + error.message);
      log.push(`❌ Erro: ${error.message}`);
      setRepairLog(log);
    } finally {
      setLoadingBtn(null);
    }
  };

  const fixDuplicates = async () => {
    if (!confirm("Detectar e remover perfis duplicados? Mantém o mais recente para cada email.")) return;
    setLoadingBtn('dedup');
    setLastResult(null);
    const log = [];

    try {
      // --- WalkerProfile deduplication ---
      const walkers = await base44.entities.WalkerProfile.list('-created_date', 500);
      // Group by created_by (email)
      const walkerMap = {};
      for (const w of walkers) {
        const key = w.created_by || w.walker_name || w.id;
        if (!walkerMap[key]) walkerMap[key] = [];
        walkerMap[key].push(w);
      }
      let walkerDeleted = 0;
      for (const [email, profiles] of Object.entries(walkerMap)) {
        if (profiles.length > 1) {
          // Sort by updated_date desc, keep first (most recent)
          profiles.sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));
          const toDelete = profiles.slice(1);
          for (const p of toDelete) {
            await base44.entities.WalkerProfile.delete(p.id);
            walkerDeleted++;
          }
          log.push(`🐾 Walker [${email}]: ${profiles.length} encontrados → ${toDelete.length} duplicados removidos (mantido: ${profiles[0].id})`);
        }
      }
      if (walkerDeleted === 0) log.push('✅ WalkerProfile: sem duplicados encontrados');

      // --- TrainerProfile deduplication ---
      const trainers = await base44.entities.TrainerProfile.list('-created_date', 500);
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
          const toDelete = profiles.slice(1);
          for (const p of toDelete) {
            await base44.entities.TrainerProfile.delete(p.id);
            trainerDeleted++;
          }
          log.push(`🎓 Trainer [${email}]: ${profiles.length} encontrados → ${toDelete.length} duplicados removidos (mantido: ${profiles[0].id})`);
        }
      }
      if (trainerDeleted === 0) log.push('✅ TrainerProfile: sem duplicados encontrados');

      const total = walkerDeleted + trainerDeleted;
      setRepairLog(log);
      setLastResult({ type: 'success', msg: `✅ ${total} perfis duplicados removidos.` });
      toast.success(`✅ ${total} duplicados removidos!`);
    } catch (error) {
      const msg = `❌ Erro: ${error.message}`;
      setRepairLog([msg]);
      setLastResult({ type: 'error', msg });
      toast.error("Erro: " + error.message);
    } finally {
      setLoadingBtn(null);
    }
  };

  return (

    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-black text-gray-900">🛠️ Admin Debug & Testing</h1>
        <p className="text-sm text-gray-500">Utilizador: <strong>{currentUserEmail || "carregando..."}</strong></p>
      </div>

      {/* Last Result Banner */}
      {lastResult && (
        <div className={`p-3 rounded-xl text-sm font-medium border ${
          lastResult.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {lastResult.msg}
        </div>
      )}

      {/* Create Data */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 text-base">📦 Criar Dados de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button onClick={createPendingBooking} disabled={anyLoading} className="w-full justify-start bg-white text-gray-800 border hover:bg-gray-50">
              {isLoading('pending') ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2 text-blue-500" />}
              {isLoading('pending') ? 'A criar...' : 'Criar Pedido Pendente'}
            </Button>
            <Button onClick={createActiveWalk} disabled={anyLoading} className="w-full justify-start bg-white text-gray-800 border hover:bg-gray-50">
              {isLoading('active') ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 text-green-500" />}
              {isLoading('active') ? 'A criar...' : 'Criar Passeio Ativo (Cockpit)'}
            </Button>
            <Button onClick={createCompletedWalk} disabled={anyLoading} className="w-full justify-start bg-white text-gray-800 border hover:bg-gray-50">
              {isLoading('completed') ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckSquare className="w-4 h-4 mr-2 text-purple-500" />}
              {isLoading('completed') ? 'A criar...' : 'Criar Passeio Concluído (Carteira)'}
            </Button>
            <Button onClick={createEmergency} disabled={anyLoading} className="w-full justify-start bg-white text-gray-800 border hover:bg-gray-50">
              {isLoading('emergency') ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2 text-orange-500" />}
              {isLoading('emergency') ? 'A criar...' : 'Criar Emergência PawGo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Data */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Zona de Perigo — Apagar Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-3">
            Apaga todos os bookings e emergências associados ao teu e-mail (<strong>{currentUserEmail}</strong>).
          </p>
          <Button onClick={clearTestData} disabled={anyLoading} variant="destructive" className="w-full">
            {isLoading('clear') ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash className="w-4 h-4 mr-2" />}
            {isLoading('clear') ? 'A apagar...' : 'Apagar Todos os Meus Dados de Teste'}
          </Button>
        </CardContent>
      </Card>

      {/* Repair Profiles */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800 text-base flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Reparar Perfis Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-700 mb-3">
            Normaliza arrays null/undefined em WalkerProfile e TrainerProfile para evitar erros de rendering.
          </p>
          <div className="flex gap-2">
            <Button onClick={repairProProfiles} disabled={anyLoading} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
              {isLoading('repair') ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {isLoading('repair') ? 'A reparar perfis...' : 'Normalizar Todos os Perfis'}
            </Button>
            <Button onClick={fixDuplicates} disabled={anyLoading} className="flex-1 bg-red-700 hover:bg-red-800 text-white">
              {isLoading('dedup') ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash className="w-4 h-4 mr-2" />}
              {isLoading('dedup') ? 'A remover duplicados...' : 'Remover Perfis Duplicados'}
            </Button>
          </div>

          {repairLog.length > 0 && (
            <div className="mt-4 space-y-1">
              {repairLog.map((line, i) => (
                <p key={i} className="text-sm font-mono bg-white p-2 rounded border border-orange-200 text-orange-900">
                  {line}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}