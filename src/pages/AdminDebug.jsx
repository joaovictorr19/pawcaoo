import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { User, CheckCircle, Play, CheckSquare, Trash, Bell, Shield, Zap } from "lucide-react";

export default function AdminDebug() {
  const queryClient = useQueryClient();
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await base44.auth.me();
      setCurrentUserEmail(user?.email || "");
      return user;
    }
  });

  // --- ACTIONS ---

  const createPendingBooking = async () => {
    if (!currentUserEmail) return;
    try {
      const booking = await base44.entities.Booking.create({
        owner_email: currentUserEmail,
        owner_name: "Admin Tester",
        dog_name: "Rex Teste",
        dog_size: "medium",
        walk_date: new Date().toISOString().split('T')[0],
        walk_time: "10:00",
        duration_hours: 1,
        total_amount: 15.00,
        service_amount: 12.00, // 80%
        platform_fee: 3.00,
        status: "pending",
        payment_status: "held",
        pickup_address: "Rua de Teste, 123, Lisboa",
        pickup_lat: 38.7223,
        pickup_lng: -9.1393,
        type: "walk"
      });
      toast.success(`Pedido Criado! ID: ${booking.id}`);
    } catch (e) { toast.error("Erro: " + e.message); }
  };

  const createActiveWalk = async () => {
    if (!currentUserEmail) return;
    try {
      // First create a pending booking
      const booking = await base44.entities.Booking.create({
        owner_email: currentUserEmail,
        owner_name: "Admin Tester",
        dog_name: "Max Ativo",
        dog_size: "large",
        walk_date: new Date().toISOString().split('T')[0],
        walk_time: "Now",
        duration_hours: 1,
        total_amount: 20.00,
        service_amount: 16.00,
        platform_fee: 4.00,
        status: "in_progress", // DIRECTLY ACTIVE
        payment_status: "held",
        pickup_address: "Parque Eduardo VII",
        pickup_lat: 38.7290,
        pickup_lng: -9.1530,
        type: "walk",
        walker_email: currentUserEmail, // Self-assigned for testing walker view
        walker_id: "admin-walker-id", // Dummy
        walker_name: "Admin Walker"
      });
      toast.success(`Passeio Ativo Criado! ID: ${booking.id}`);
    } catch (e) { toast.error("Erro: " + e.message); }
  };

  const createCompletedUnpaidWalk = async () => {
    if (!currentUserEmail) return;
    try {
      const booking = await base44.entities.Booking.create({
        owner_email: "client@test.com",
        owner_name: "Cliente Fictício",
        dog_name: "Luna Paga",
        dog_size: "small",
        walk_date: new Date().toISOString().split('T')[0],
        duration_hours: 0.5,
        total_amount: 10.00,
        service_amount: 8.00,
        platform_fee: 2.00,
        status: "completed",
        payment_status: "held", // HELD means ready to payout
        pickup_address: "Chiado, Lisboa",
        type: "walk",
        walker_email: currentUserEmail, // Self-assigned to test Wallet
        walker_name: "Admin Walker",
        completed_date: new Date().toISOString()
      });
      toast.success(`Passeio Concluído Criado! Teste a Carteira.`);
    } catch (e) { toast.error("Erro: " + e.message); }
  };

  const createEmergency = async () => {
    if (!currentUserEmail) return;
    try {
      const walk = await base44.entities.EmergencyWalk.create({
        owner_name: "Admin SOS",
        owner_phone: "999999999",
        location: "Rossio, Lisboa",
        latitude: 38.7139,
        longitude: -9.1395,
        needed_time: "AGORA",
        duration_hours: 1,
        offered_amount: 50.00,
        special_notes: "Teste de emergência admin",
        urgency_level: "immediate",
        status: "available",
        dog_name: "SOS Dog",
        dog_size: "medium"
      });
      toast.success(`Emergência Criada! ID: ${walk.id}`);
    } catch (e) { toast.error("Erro: " + e.message); }
  };

  const clearMyData = async () => {
    if (!confirm("Tem a certeza? Isto apaga todos os seus bookings.")) return;
    try {
      const myBookings = await base44.entities.Booking.filter({ 
        $or: [{ owner_email: currentUserEmail }, { walker_email: currentUserEmail }] 
      });
      for (const b of myBookings) {
        await base44.entities.Booking.delete(b.id);
      }
      toast.success("Dados limpos!");
    } catch (e) { toast.error("Erro: " + e.message); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Shield className="w-6 h-6" />
            Admin Debug & Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700 mb-4">
            Ferramentas para testar fluxos sem precisar de dois dispositivos/usuários.
            <br/>
            <strong>Usuário Atual:</strong> {currentUserEmail}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <h3 className="font-bold text-gray-700">Simular Cliente (Owner)</h3>
              <Button onClick={createPendingBooking} className="w-full justify-start bg-white text-gray-800 border hover:bg-gray-100">
                <User className="w-4 h-4 mr-2 text-blue-500" />
                Criar Pedido Pendente
              </Button>
              <Button onClick={createEmergency} className="w-full justify-start bg-white text-gray-800 border hover:bg-gray-100">
                <Zap className="w-4 h-4 mr-2 text-orange-500" />
                Criar Emergência (SOS)
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-700">Simular Profissional (Walker)</h3>
              <Button onClick={createActiveWalk} className="w-full justify-start bg-white text-gray-800 border hover:bg-gray-100">
                <Play className="w-4 h-4 mr-2 text-green-500" />
                Criar Passeio Ativo (Para Cockpit)
              </Button>
              <Button onClick={createCompletedUnpaidWalk} className="w-full justify-start bg-white text-gray-800 border hover:bg-gray-100">
                <CheckSquare className="w-4 h-4 mr-2 text-purple-500" />
                Criar Passeio Concluído (Para Carteira)
              </Button>
            </div>

            <div className="space-y-2 md:col-span-2 mt-4 pt-4 border-t border-red-200">
              <h3 className="font-bold text-red-800">Zona de Perigo</h3>
              <Button onClick={clearMyData} variant="destructive" className="w-full">
                <Trash className="w-4 h-4 mr-2" />
                Limpar Meus Dados de Teste
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}