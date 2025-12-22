import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, CalendarOff, CheckCircle2, ArrowLeft, Navigation } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import AvailabilityCalendar from "../components/calendar/AvailabilityCalendar";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ManageAvailability() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDayOff, setIsDayOff] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- BUSCA DO UTILIZADOR ---
  const { data: authUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // --- BUSCA DAS FOLGAS/DISPONIBILIDADE ---
  const { data: availabilityData = [], refetch: refetchAvailability } = useQuery({
    queryKey: ['availability', authUser?.email],
    queryFn: async () => {
      if (!authUser?.email) return [];
      return await base44.entities.CalendarAvailability.filter({ 
        professional_email: authUser.email 
      });
    },
    enabled: !!authUser?.email,
  });

  // --- BUSCA DAS RESERVAS ---
  const { data: bookings = [] } = useQuery({
    queryKey: ['professionalBookings', authUser?.email],
    queryFn: async () => {
      if (!authUser?.email) return [];
      const walkerBookings = await base44.entities.Booking.filter({ walker_email: authUser.email });
      return walkerBookings;
    },
    enabled: !!authUser?.email,
  });

  // --- FILTRAR RESERVAS DO DIA SELECIONADO ---
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  
  const daysBookings = bookings.filter(b => {
      const bDate = b.walk_date ? (b.walk_date.includes('T') ? b.walk_date.split('T')[0] : b.walk_date) : null;
      return bDate === selectedDateStr;
  });

  // --- QUANDO CLICA NO DIA, ATUALIZA O ESTADO DO SWITCH ---
  useEffect(() => {
    if (selectedDate && availabilityData.length > 0) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existing = availabilityData.find(a => {
         const dbDate = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
         return dbDate === dateStr;
      });
      
      setIsDayOff(existing?.is_day_off === true);
    } else {
      setIsDayOff(false);
    }
  }, [selectedDate, availabilityData]);

  // --- GUARDAR A FOLGA ---
  const handleToggleDayOff = async (checked) => {
    if (!selectedDate || !authUser?.email) return;

    setIsDayOff(checked);
    setIsSaving(true);
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      const existingRecords = await base44.entities.CalendarAvailability.filter({ 
        professional_email: authUser.email,
        date: dateStr
      });

      const exactRecord = existingRecords.find(r => r.date?.startsWith(dateStr));

      if (exactRecord) {
        await base44.entities.CalendarAvailability.update(exactRecord.id, {
          is_day_off: checked,
          is_fully_booked: checked,
          time_slots: checked ? [] : [{ start_time: "09:00", end_time: "18:00", is_available: true }]
        });
      } else {
        await base44.entities.CalendarAvailability.create({
          professional_email: authUser.email,
          professional_name: authUser.full_name,
          date: dateStr,
          is_day_off: checked,
          is_fully_booked: checked,
          time_slots: checked ? [] : [{ start_time: "09:00", end_time: "18:00", is_available: true }]
        });
      }

      await refetchAvailability();
      toast.success(checked ? "Dia bloqueado com sucesso!" : "Dia desbloqueado!");

    } catch (error) {
      console.error(error);
      toast.error("Erro ao guardar. Tenta novamente.");
      setIsDayOff(!checked);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Agenda</h1>
                <p className="text-gray-500">Gere as tuas folgas e visualiza a rota do dia.</p>
            </div>
            <Button variant="outline" onClick={() => navigate(createPageUrl('ProfessionalDashboard'))}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* COLUNA 1: CALENDÁRIO E CONTROLO */}
          <div className="space-y-6">
            
            {/* O Calendário */}
            <Card className="border-0 shadow-lg overflow-hidden">
                <div className="p-4 bg-white">
                    <AvailabilityCalendar
                        availabilityData={availabilityData}
                        bookings={bookings}
                        onDateSelect={setSelectedDate}
                        selectedDate={selectedDate}
                        walkerEmail={authUser?.email}
                        isInteractive={true}
                    />
                </div>
            </Card>

            {/* O Cartão de Controlo do Dia */}
            <Card className={`border-2 transition-all shadow-md ${isDayOff ? 'border-red-200 bg-red-50' : 'border-green-200 bg-white'}`}>
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-1">
                        {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: pt }) : 'Seleciona um dia'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">Estado atual da tua agenda para este dia.</p>

                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            {isDayOff ? (
                                <div className="p-2 bg-red-100 rounded-full"><CalendarOff className="w-6 h-6 text-red-600" /></div>
                            ) : (
                                <div className="p-2 bg-green-100 rounded-full"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>
                            )}
                            <div className="flex flex-col">
                                <span className={`font-bold ${isDayOff ? 'text-red-700' : 'text-green-700'}`}>
                                    {isDayOff ? 'Dia de Folga' : 'Disponível'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {isDayOff ? 'Clientes não podem agendar' : 'A receber pedidos'}
                                </span>
                            </div>
                        </div>
                        
                        <Switch 
                            checked={isDayOff}
                            onCheckedChange={handleToggleDayOff}
                            disabled={isSaving || !selectedDate}
                            className="data-[state=checked]:bg-red-500"
                        />
                    </div>
                </CardContent>
            </Card>
          </div>

          {/* COLUNA 2: MAPA E LISTA */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ÁREA DO MAPA */}
            <Card className="h-[400px] border-0 shadow-lg overflow-hidden relative group">
                <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                    <MapPin className="w-12 h-12 mb-2 opacity-20" />
                    <p className="font-medium">O Mapa da Rota aparecerá aqui</p>
                    <p className="text-sm opacity-60">Mostrando rota para {daysBookings.length} passeios</p>
                </div>

                {/* Overlay Informativo sobre o mapa */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-white/50">
                    <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-bold text-gray-800">Rota do Dia</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {daysBookings.length === 0 ? 'Sem passeios marcados' : `${daysBookings.length} paragens previstas`}
                    </div>
                </div>
            </Card>

            {/* LISTA DE RESERVAS DO DIA */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    Reservas para {selectedDate ? format(selectedDate, 'dd/MM') : 'este dia'}
                    <Badge variant="secondary" className="ml-2">{daysBookings.length}</Badge>
                </h3>

                {daysBookings.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-400">Nenhum serviço agendado para este dia.</p>
                        {isDayOff && <p className="text-red-400 text-sm mt-1 font-medium">Este é um dia de folga.</p>}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {daysBookings.map(booking => (
                            <div key={booking.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl">
                                        🐕
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{booking.dog_name}</h4>
                                        <p className="text-sm text-gray-500">{booking.service_type || 'Passeio'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-gray-900">
                                        {booking.walk_time || 'Hora a definir'}
                                    </div>
                                    <Badge className={
                                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                                    }>
                                        {booking.status === 'confirmed' ? 'Confirmado' : booking.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}