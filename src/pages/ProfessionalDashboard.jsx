import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, DollarSign, TrendingUp, Users, Star, MessageCircle,
  MapPin, Clock, CheckCircle, AlertCircle, BarChart3, Activity,
  Package, Edit, Trash2, Plus, Bell, ArrowUp, ArrowDown, Loader2, Home
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Download, ExternalLink, Share2, Calendar as CalendarIcon, FileText } from "lucide-react";
import { bookingToEvent, generateMultiICS, downloadICS } from "../components/calendar/calendarHelpers";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateNotification } from "../components/NotificationService";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AvailabilityCalendar from "../components/calendar/AvailabilityCalendar";
import ReviewCard from "../components/reviews/ReviewCard";
import VerificationBanner from "../components/professionals/VerificationBanner";
// TimeOffManager removed (integrated into calendar)
import FiscalComplianceBanner from "../components/fiscal/FiscalComplianceBanner";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function ProfessionalDashboard() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const createNotification = useCreateNotification();
  const [activeTab, setActiveTab] = useState("overview");
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [dateRange, setDateRange] = useState("7days");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // User and Profile queries with real-time updates
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const { data: walkerProfile } = useQuery({
    queryKey: ['myWalkerProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: user?.email });
      const profile = profiles[0];
      
      // Auto-update account_type if user has walker profile but wrong account type
      if (profile && user && user.account_type !== 'walker' && user.account_type !== 'both') {
        try {
          await base44.auth.updateMe({ account_type: 'walker' });
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        } catch (e) {
          console.error("Failed to update account_type:", e);
        }
      }
      
      return profile;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: trainerProfile } = useQuery({
    queryKey: ['myTrainerProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.TrainerProfile.filter({ created_by: user?.email });
      const profile = profiles[0];
      
      // Auto-update account_type if user has trainer profile but wrong account type
      if (profile && user && user.account_type !== 'trainer' && user.account_type !== 'both') {
        try {
          const newType = walkerProfile ? 'both' : 'trainer';
          await base44.auth.updateMe({ account_type: newType });
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        } catch (e) {
          console.error("Failed to update account_type:", e);
        }
      }
      
      return profile;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Real-time bookings - PEGA TODOS OS PEDIDOS para este Walker
  const { data: walkBookings = [] } = useQuery({
    queryKey: ['myWalkBookings'],
    queryFn: async () => {
      console.log('🔍 Buscando pedidos para walker:', user?.email);
      const bookings = await base44.entities.Booking.filter({ walker_email: user?.email }, '-created_date');
      console.log('📊 Pedidos encontrados:', bookings.length, bookings);
      return bookings;
    },
    enabled: !!user && !!walkerProfile,
    initialData: [],
    refetchInterval: 5000, // Real-time: refresh every 5s (mais agressivo)
  });

  // Detect NEW direct requests (apenas para este walker) e mostrar alerta
  const prevDirectCountRef = React.useRef(0);
  React.useEffect(() => {
    const currentDirects = walkBookings.filter(b => b.status === 'pending' && b.walker_id === walkerProfile?.id);
    const currentCount = currentDirects.length;
    
    if (currentCount > prevDirectCountRef.current && prevDirectCountRef.current >= 0) {
      const newBooking = currentDirects[0];
      if (newBooking) {
        toast.success(`🎯 Solicitação Direta! ${newBooking.owner_name} escolheu VOCÊ`, {
          description: `${newBooking.dog_name} - ${format(new Date(newBooking.walk_date), 'dd/MM/yyyy')}`,
          action: {
            label: 'Aceitar Agora',
            onClick: () => setActiveTab('bookings')
          },
          duration: 10000
        });
        
        // Browser Push
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🎯 Nova Solicitação Direta!', {
            body: `${newBooking.owner_name} escolheu você para passear ${newBooking.dog_name}`,
            icon: '/logo.png',
            badge: '/favicon.png',
            requireInteraction: true
          });
        }
        
        try {
          new Audio('/notification.mp3').play().catch(() => {});
        } catch(e) {}
      }
    }
    
    prevDirectCountRef.current = currentCount;
  }, [walkBookings, walkerProfile?.id]);

  const { data: trainingBookings = [] } = useQuery({
    queryKey: ['myTrainingBookings'],
    queryFn: () => base44.entities.TrainingBooking.filter({ trainer_email: user?.email }, '-created_date'),
    enabled: !!user && !!trainerProfile,
    initialData: [],
    refetchInterval: 10000,
  });

  // Real-time messages query removed

  // Reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['myReviews'],
    queryFn: async () => {
      console.log('🔍 Buscando reviews do profissional');
      console.log('Walker Profile ID:', walkerProfile?.id);
      console.log('Trainer Profile ID:', trainerProfile?.id);
      
      const walkerReviews = walkerProfile ? 
        await base44.entities.Review.filter({ walker_id: walkerProfile.id }) : [];
      const trainerReviews = trainerProfile ?
        await base44.entities.Review.filter({ trainer_id: trainerProfile.id }) : [];
      
      console.log('📊 Walker Reviews:', walkerReviews.length);
      console.log('📊 Trainer Reviews:', trainerReviews.length);
      
      return [...walkerReviews, ...trainerReviews];
    },
    enabled: !!user && (!!walkerProfile || !!trainerProfile),
    initialData: [],
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  // Availability
  const { data: availability = [] } = useQuery({
    queryKey: ['myAvailability'],
    queryFn: () => base44.entities.CalendarAvailability.filter({ professional_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  // Booking Actions
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status, isTraining }) => {
      const entity = isTraining ? base44.entities.TrainingBooking : base44.entities.Booking;
      return await entity.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myWalkBookings']);
      queryClient.invalidateQueries(['myTrainingBookings']);
      toast.success("Booking updated successfully");
    },
    onError: () => {
      toast.error("Failed to update booking");
    }
  });

  // Helper to free up calendar slot
  const freeUpCalendarSlot = async (booking, professionalEmail) => {
    if (!booking.calendar_event_id) return;
    
    try {
      // Assuming calendar_event_id points to the Availability Record ID
      // We need to find the record and clear the slot
      const dateStr = format(new Date(booking.walk_date || booking.session_date), 'yyyy-MM-dd');
      const availRecords = await base44.entities.CalendarAvailability.filter({
        professional_email: professionalEmail,
        date: dateStr
      });

      if (availRecords.length > 0) {
        const availRecord = availRecords[0];
        
        // If calendar_event_id is the RECORD ID, we check inside it.
        // Or if we stored the SLOT index/time, we use that.
        // For robust logic, we search slots matching the booking ID or clear based on event ID.
        // Currently, BookingForm sets booking_id on the slot.
        
        const updatedSlots = availRecord.time_slots.map(slot => {
          if (slot.booking_id === booking.id) {
            return { ...slot, is_available: true, booking_id: null };
          }
          return slot;
        });

        await base44.entities.CalendarAvailability.update(availRecord.id, {
          time_slots: updatedSlots,
          is_fully_booked: false
        });
        console.log('📅 Slot liberado no calendário');
      }
    } catch (err) {
      console.error("Erro ao liberar slot:", err);
    }
  };

  // Helper to lock calendar slot and generate Event ID
  const lockCalendarSlot = async (booking, professionalEmail) => {
    // If already has ID, skip
    if (booking.calendar_event_id) return booking.calendar_event_id;

    try {
      const dateStr = format(new Date(booking.walk_date || booking.session_date), 'yyyy-MM-dd');
      const availRecords = await base44.entities.CalendarAvailability.filter({
        professional_email: professionalEmail,
        date: dateStr
      });

      if (availRecords.length > 0) {
        const availRecord = availRecords[0];
        // Generate a new Event ID (can be synthetic or the record ID + suffix)
        const eventId = `evt_${booking.id}_${Date.now()}`;

        const updatedSlots = availRecord.time_slots.map(slot => {
          // Match time slot string "HH:MM - HH:MM"
          const bookingTime = booking.walk_time || booking.session_time;
          const [start, end] = bookingTime.split(' - ');
          
          if (slot.start_time === start && slot.end_time === end) {
            return { 
              ...slot, 
              is_available: false, 
              booking_id: booking.id,
              // We could store eventId here too if schema supported it, but booking_id is enough link
            };
          }
          return slot;
        });

        await base44.entities.CalendarAvailability.update(availRecord.id, {
          time_slots: updatedSlots
        });
        
        return eventId;
      }
    } catch (err) {
      console.error("Erro ao bloquear slot:", err);
    }
    return null;
  };

  const handleBookingAction = async (booking, status) => {
    const isTrainingBooking = !!booking.session_date;
    const entity = isTrainingBooking ? base44.entities.TrainingBooking : base44.entities.Booking;
    const professionalEmail = user?.email;

    try {
      let updateData = { status };

      // WORKFLOW: ACCEPTANCE
      if (status === 'confirmed') {
        // 1. Create Event / Lock Slot
        const eventId = await lockCalendarSlot(booking, professionalEmail);
        // 2. Save Event ID to Booking
        if (eventId) {
          updateData.calendar_event_id = eventId;
        }
      }

      // WORKFLOW: REFUSAL / CANCELLATION
      if (status === 'cancelled' || status === 'rejected') { // 'rejected' mapped to cancelled usually or logic
        // 1. Check if has Event ID and Free Slot
        await freeUpCalendarSlot(booking, professionalEmail);
        // 2. Clear Event ID
        updateData.calendar_event_id = null;
      }

      // 3. Update Booking
      await entity.update(booking.id, updateData);
      
      // WORKFLOW: NOTIFICATIONS
      try {
        const clientEmail = booking.owner_email || booking.created_by;
        const dateFormatted = format(new Date(booking.walk_date || booking.session_date), 'dd/MM/yyyy');
        const timeFormatted = booking.walk_time || booking.session_time;

        if (status === 'confirmed') {
          // Add WhatsApp link if available
          let message = `Sua reserva com ${user.full_name} para ${dateFormatted} às ${timeFormatted} foi aceite.`;
          
          const profile = walkerProfile || trainerProfile;
          if (profile && profile.whatsapp_number) {
             const waLink = `https://wa.me/${profile.whatsapp_number.replace(/[^0-9]/g, '')}`;
             message += `\n\nFale com o profissional pelo WhatsApp: ${waLink}`;
          }

          await createNotification.mutateAsync({
            recipient_email: clientEmail,
            title: '✅ Reserva Confirmada!',
            message: message,
            type: 'booking',
            related_id: booking.id,
            priority: 'high',
            action_url: '/MyBookings'
          });
        } else if (status === 'cancelled' || status === 'rejected') {
          await createNotification.mutateAsync({
            recipient_email: clientEmail,
            title: '❌ Reserva Cancelada/Recusada',
            message: `Sua reserva para ${dateFormatted} foi cancelada/recusada pelo profissional.`,
            type: 'booking',
            related_id: booking.id,
            priority: 'high',
            action_url: '/MyBookings'
          });
        }
      } catch (e) { console.error(e); }

      queryClient.invalidateQueries(['myWalkBookings']);
      queryClient.invalidateQueries(['myTrainingBookings']);
      
      let message = 'Reserva atualizada com sucesso';
      if (status === 'confirmed') message = 'Reserva aceite com sucesso';
      if (status === 'service_completed') message = 'Serviço marcado como concluído! Cliente notificado.';
      if (status === 'completed') message = 'Pagamento confirmado e reserva finalizada!';
      
      toast.success(message);

    } catch (error) {
      console.error("Booking action error:", error);
      toast.error("Erro ao atualizar reserva");
    }
  };

  const handleServiceCompleted = async (booking) => {
    // 1. Update status to 'service_completed'
    await handleBookingAction(booking, 'service_completed');
    
    // 2. Notify Client specifically for Payment
    try {
      const clientEmail = booking.owner_email || booking.created_by;
      const amount = booking.total_amount || 0;
      await createNotification.mutateAsync({
        recipient_email: clientEmail,
        title: '✅ Serviço Concluído - Pagamento Necessário',
        message: `O seu Walker marcou o serviço como concluído. Por favor, confirme o pagamento de €${amount} ao profissional (MBWay/Dinheiro) para finalizar.`,
        type: 'payment',
        related_id: booking.id,
        priority: 'high',
        action_url: '/MyBookings'
      });
    } catch (e) { console.error(e); }
  };

  const handlePaymentReceived = async (booking) => {
    // 1. Update status to 'completed' (Final)
    // We update completed_date as well
    const entity = booking.type === 'training' ? base44.entities.TrainingBooking : base44.entities.Booking;
    await entity.update(booking.id, {
        status: 'completed',
        completed_date: new Date().toISOString(),
        payment_status: 'released' // Assuming direct payment implies released
    });
    
    queryClient.invalidateQueries(['myWalkBookings']);
    queryClient.invalidateQueries(['myTrainingBookings']);
    
    toast.success('Pagamento confirmado! Reserva finalizada.');

    // 2. Notify Client
    try {
      const clientEmail = booking.owner_email || booking.created_by;
      await createNotification.mutateAsync({
        recipient_email: clientEmail,
        title: '🎉 Pagamento Confirmado!',
        message: `O Walker confirmou o recebimento. Obrigado! Por favor, avalie o serviço.`,
        type: 'booking',
        related_id: booking.id,
        priority: 'normal',
        action_url: `/MyBookings?review=${booking.id}`
      });
    } catch (e) { console.error(e); }
  };

  const allBookings = [...walkBookings, ...trainingBookings];
  const profile = walkerProfile || trainerProfile;

  // Analytics calculations
  const getDateRangeData = () => {
    const days = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 90;
    const startDate = subDays(new Date(), days);
    return allBookings.filter(b => new Date(b.created_date) >= startDate);
  };

  const rangeBookings = getDateRangeData();
  
  const totalEarnings = rangeBookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.service_amount || 0) + (b.tip_amount || 0), 0);

  // Calculate profile completeness
  const calculateCompleteness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.photo_url) score += 20;
    if (profile.bio && profile.bio.length > 50) score += 20;
    if (profile.location) score += 10;
    if (profile.services_offered && profile.services_offered.length > 0) score += 20;
    if (profile.availability && profile.availability.length > 0) score += 10;
    if (profile.verification_status === 'verified') score += 20;
    return score;
  };
  
  const profileCompleteness = calculateCompleteness();

  // Separar Solicitações Diretas (para mim) vs Pedidos Disponíveis (broadcast)
  const directRequests = allBookings.filter(b => {
    const isPending = b.status === 'pending';
    const isForMe = b.walker_id === walkerProfile?.id || b.walker_email === user?.email;
    console.log('📋 Booking:', b.id, 'Status:', b.status, 'Walker ID:', b.walker_id, 'My ID:', walkerProfile?.id, 'IsForMe:', isForMe);
    return isPending && isForMe;
  });
  const pendingBookings = allBookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  
  console.log('🎯 Total Solicitações Diretas:', directRequests.length);
  console.log('📊 Total Pending/Confirmed:', pendingBookings.length);
  const completedBookings = rangeBookings.filter(b => b.status === 'completed');
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : profile?.rating || 5;

  const unreadMessages = 0;

  const uniqueClients = new Set(allBookings.map(b => b.owner_email)).size;

  // Chart data
  const getLast7DaysData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayBookings = allBookings.filter(b => 
        format(new Date(b.walk_date || b.session_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      days.push({
        date: format(date, 'EEE', { locale: ptBR }),
        bookings: dayBookings.length,
        earnings: dayBookings.reduce((sum, b) => sum + (b.service_amount || 0), 0),
        completed: dayBookings.filter(b => b.status === 'completed').length
      });
    }
    return days;
  };

  const chartData = getLast7DaysData();

  const statusData = [
    { name: 'Completed', value: allBookings.filter(b => b.status === 'completed').length, color: '#10b981' },
    { name: 'Pending', value: allBookings.filter(b => b.status === 'pending').length, color: '#f59e0b' },
    { name: 'In Progress', value: allBookings.filter(b => b.status === 'in_progress').length, color: '#3b82f6' },
    { name: 'Cancelled', value: allBookings.filter(b => b.status === 'cancelled').length, color: '#ef4444' },
  ];

  const stats = [
    {
      icon: DollarSign,
      value: `€${totalEarnings.toFixed(0)}`,
      label: `${t('earnings', language)} (${dateRange === '7days' ? '7d' : dateRange === '30days' ? '30d' : '90d'})`,
      color: "from-green-500 to-emerald-600",
      change: "+12.5%"
    },
    {
      icon: Calendar,
      value: directRequests.length,
      label: 'Solicitações Diretas',
      color: "from-purple-500 to-pink-600",
      badge: directRequests.length > 0 ? '🎯 RESPONDER' : ''
    },
    {
      icon: Star,
      value: averageRating,
      label: `${t('rating', language)} (${reviews.length} ${t('reviews', language).toLowerCase()})`,
      color: "from-yellow-500 to-orange-600",
    },
    {
      icon: CheckCircle,
      value: `${profileCompleteness}%`,
      label: t('profileHealth', language),
      color: profileCompleteness === 100 ? "from-teal-500 to-teal-600" : "from-blue-500 to-indigo-600",
      badge: profileCompleteness < 100 ? t('improve', language) : t('perfect', language)
    }
  ];

  // Service form for walkers/trainers
  const ServiceForm = () => {
    const [formData, setFormData] = useState(editingService || {
      service_name: "",
      description: "",
      price: "",
      duration_options: ["30min", "1h", "2h"],
      custom_pricing: false,
      package_options: []
    });

    const [newPackage, setNewPackage] = useState({ name: "", sessions: "", price: "" });

    const addPackage = () => {
      if (!newPackage.name || !newPackage.price) return;
      setFormData({
        ...formData,
        package_options: [...(formData.package_options || []), newPackage]
      });
      setNewPackage({ name: "", sessions: "", price: "" });
    };

    const removePackage = (idx) => {
      setFormData({
        ...formData,
        package_options: formData.package_options.filter((_, i) => i !== idx)
      });
    };

    const handleSubmit = async () => {
      try {
        // Calculate updated services
        const currentServices = (walkerProfile || trainerProfile)?.services_offered || [];
        const updatedServices = editingService 
          ? currentServices.map(s => s === editingService ? formData : s)
          : [...currentServices, formData];

        // Create edit request instead of updating directly
        const currentUser = await base44.auth.me();
        const activeProfile = walkerProfile || trainerProfile;
        
        await base44.entities.ProfileEditRequest.create({
          profile_type: walkerProfile ? 'walker' : 'trainer',
          profile_id: activeProfile.id,
          requester_email: currentUser.email,
          requester_name: currentUser.full_name,
          changes_requested: { services_offered: updatedServices },
          status: 'pending'
        });

        queryClient.invalidateQueries(['profileEditRequests']);
        toast.success("✅ Serviço enviado para aprovação do administrador!", { duration: 4000 });
        setShowServiceForm(false);
        setEditingService(null);
      } catch (error) {
        toast.error("Erro ao enviar: " + error.message);
      }
    };

    return (
      <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              {editingService ? 'Editar' : 'Adicionar'} Serviço
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm md:text-base">Nome do Serviço *</Label>
              <Input
                value={formData.service_name}
                onChange={(e) => setFormData({...formData, service_name: e.target.value})}
                placeholder="Ex: Passeio de 30 minutos"
                className="h-11 md:h-10"
              />
            </div>
            <div>
              <Label className="text-sm md:text-base">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o serviço oferecido..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm md:text-base">Preço (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  placeholder="15.00"
                  className="h-11 md:h-10"
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="customPricing"
                  checked={formData.custom_pricing}
                  onChange={(e) => setFormData({...formData, custom_pricing: e.target.checked})}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <Label htmlFor="customPricing" className="text-sm cursor-pointer">
                  Preço "A partir de"
                </Label>
              </div>
            </div>

            {/* Packages Section - Great for Trainers */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm md:text-base mb-2 block font-semibold text-purple-700">
                Pacotes Promocionais (Opcional)
              </Label>
              <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Input 
                    placeholder="Nome (Ex: 5 Sessões)" 
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                    className="text-sm"
                  />
                  <Input 
                    placeholder="Sessões" 
                    type="number"
                    value={newPackage.sessions}
                    onChange={(e) => setNewPackage({...newPackage, sessions: parseInt(e.target.value)})}
                    className="text-sm"
                  />
                  <Input 
                    placeholder="Preço (€)" 
                    type="number"
                    value={newPackage.price}
                    onChange={(e) => setNewPackage({...newPackage, price: parseFloat(e.target.value)})}
                    className="text-sm"
                  />
                </div>
                <Button onClick={addPackage} size="sm" variant="outline" className="w-full border-dashed border-purple-300 text-purple-700">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Pacote
                </Button>

                {formData.package_options && formData.package_options.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.package_options.map((pkg, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 text-sm">
                        <span>{pkg.name} ({pkg.sessions}x) - <b>€{pkg.price}</b></span>
                        <Button onClick={() => removePackage(idx)} size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowServiceForm(false)} className="h-11 md:h-10">
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 h-11 md:h-10">
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-2xl mx-4">
          <CardContent className="p-8 md:p-12 text-center">
            <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Perfil Profissional Necessário
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              Crie o seu perfil de passeador ou treinador para aceder ao painel.
            </p>
            <div className="flex flex-col md:flex-row gap-3">
              <Button onClick={() => navigate(createPageUrl('BecomeWalker'))} className="flex-1 h-12 bg-green-600 hover:bg-green-700">
                Tornar-me Passeador
              </Button>
              <Button onClick={() => navigate(createPageUrl('BecomeTrainer'))} className="flex-1 h-12">
                Tornar-me Treinador
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <ErrorBoundary>
        {/* Fiscal Compliance Banner - CRITICAL */}
        <FiscalComplianceBanner />

        {/* Verification Banner */}
        <VerificationBanner profile={profile} type={walkerProfile ? 'walker' : 'trainer'} />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Painel Profissional</h1>
              <p className="text-gray-600 mt-1">{profile.walker_name || profile.trainer_name}</p>
            </div>
          </div>
          
          {/* Quick Actions - Clean Row */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button
              onClick={() => navigate(createPageUrl('EditWalkerProfile'))}
              className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
            <Button 
              onClick={() => navigate(createPageUrl('ManageAvailability'))} 
              variant="outline"
              className="border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 shadow-md"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Gerir Agenda
            </Button>
            <Button
              onClick={() => setShowServiceForm(true)}
              variant="outline"
              className="border-2 border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Serviço
            </Button>
            <Button
              onClick={() => navigate(createPageUrl('FiscalSettings'))}
              variant="outline"
              className="border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 shadow-md"
            >
              <FileText className="w-4 h-4 mr-2" />
              Fiscal & Relatórios
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.08, type: "spring" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="glass-panel border-0 shadow-xl hover:shadow-2xl overflow-hidden transition-all duration-300 h-full">
                  <div className={`bg-gradient-to-br ${stat.color} p-5 text-white h-full min-h-[160px] flex flex-col justify-between relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="relative z-10 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shadow-lg">
                            <stat.icon className="w-5 h-5" />
                          </div>
                          {stat.badge && (
                            <Badge className="bg-white/30 text-white border-0 text-[10px] backdrop-blur-sm shadow-md px-2 py-1">
                              {stat.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="text-3xl md:text-4xl font-extrabold mb-2 drop-shadow-lg">{stat.value}</div>
                        <div className="text-xs opacity-95 font-semibold tracking-wide">{stat.label}</div>
                      </div>
                      
                      {stat.change && (
                        <div className="flex items-center gap-1.5 text-xs mt-4 opacity-95 font-bold bg-white/15 rounded-lg px-2.5 py-1.5 backdrop-blur-sm w-fit">
                          <ArrowUp className="w-3.5 h-3.5" />
                          {stat.change} vs anterior
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-3 border border-white/50">
            <TabsList className="w-full bg-transparent flex flex-wrap gap-2 justify-start h-auto">
              <TabsTrigger 
                value="overview" 
                className="rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white data-[state=active]:shadow-lg px-5 py-3 transition-all flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Resumo
              </TabsTrigger>
              <TabsTrigger 
                value="bookings" 
                className="rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg px-5 py-3 relative transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Reservas
                {directRequests.length > 0 && (
                  <Badge className="ml-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full p-0 flex items-center justify-center animate-pulse shadow-lg">
                    {directRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg px-5 py-3 transition-all flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg px-5 py-3 transition-all flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Serviços
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg px-5 py-3 transition-all flex items-center gap-2"
              >
                <CalendarIcon className="w-4 h-4" />
                Agenda
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-yellow-600 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg px-5 py-3 transition-all flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                Reviews
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Earnings Chart */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Earnings Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value) => [`€${value}`, 'Earnings']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="earnings" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorEarnings)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Booking Status */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-600" />
                    Booking Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allBookings.slice(0, 5).map((booking, idx) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          booking.status === 'completed' ? 'bg-green-100' :
                          booking.status === 'pending' ? 'bg-orange-100' :
                          booking.status === 'in_progress' ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          {booking.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                           booking.status === 'pending' ? <Clock className="w-5 h-5 text-orange-600" /> :
                           <Activity className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{booking.dog_name}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(booking.walk_date || booking.session_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">€{booking.service_amount}</p>
                        <Badge className="text-xs">
                          {booking.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            {/* SOLICITAÇÕES DIRETAS - Prioridade Máxima */}
            {directRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
                  <CardHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative z-10">
                      <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                          🎯
                        </div>
                        Pedidos Diretos ({directRequests.length})
                      </CardTitle>
                      <p className="text-sm text-purple-100 mt-1">Clientes que escolheram VOCÊ</p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {directRequests.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-2xl border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all p-4">
                          <div className="grid md:grid-cols-[1fr,auto] gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md">🎯 DIRETO</Badge>
                                <h3 className="font-bold text-lg text-gray-900">{booking.dog_name}</h3>
                                <Badge variant="outline" className="text-xs font-semibold">
                                  {booking.dog_size === 'small' && '🐕 Pequeno'}
                                  {booking.dog_size === 'medium' && '🐕 Médio'}
                                  {booking.dog_size === 'large' && '🐕 Grande'}
                                  {booking.dog_size === 'extra_large' && '🐕 XL'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 font-semibold mb-1">{booking.owner_name} • {booking.owner_phone}</p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {format(new Date(booking.walk_date || booking.session_date), 'dd/MM/yyyy', { locale: ptBR })} • {booking.walk_time || booking.session_time} • {booking.duration_hours}h
                              </p>
                              {booking.pickup_address && (
                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-2 font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-purple-500" /> 
                                  {booking.pickup_address}
                                </p>
                              )}
                              {booking.special_notes && (
                                <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
                                  <p className="text-xs text-gray-800"><strong>⚠️ Notas:</strong> {booking.special_notes}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 min-w-[180px]">
                              <div className="text-3xl font-bold text-green-600 mb-2">€{booking.service_amount}</div>
                              {booking.owner_phone && (
                                <Button
                                  onClick={() => window.open(`https://wa.me/${booking.owner_phone.replace(/[^0-9]/g, '')}`, '_blank')}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md"
                                >
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  WhatsApp
                                </Button>
                              )}
                              <div className="grid grid-cols-1 gap-2 w-full">
                                <Button
                                  onClick={async () => {
                                    try {
                                      await base44.entities.Booking.update(booking.id, { status: 'confirmed' });
                                      queryClient.invalidateQueries(['myWalkBookings']);
                                      toast.success('✅ Pedido aceite!');
                                      await createNotification.mutateAsync({
                                        recipient_email: booking.owner_email || booking.created_by,
                                        title: '✅ Pedido Aceite!',
                                        message: `${user.full_name} aceitou o seu pedido para ${booking.dog_name}.`,
                                        type: 'booking',
                                        related_id: booking.id,
                                        priority: 'high'
                                      });
                                    } catch (error) {
                                      toast.error('Erro ao aceitar');
                                    }
                                  }}
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Aceitar
                                </Button>
                                <Button
                                  onClick={() => handleBookingAction(booking, 'cancelled')}
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50 border-2 border-red-300"
                                >
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  Recusar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* TODAS AS RESERVAS */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-lg">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl md:text-2xl">Todas as Reservas</CardTitle>
                  <Badge className="bg-gray-100 text-gray-700 font-semibold">
                    {allBookings.length} Total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {allBookings.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma reserva ainda</h3>
                    <p className="text-gray-600">Quando os clientes fizerem reservas, elas aparecerão aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allBookings.filter(b => !(b.status === 'pending' && b.walker_id === walkerProfile?.id)).map((booking) => (
                     <div key={booking.id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-green-300 shadow-md hover:shadow-lg transition-all p-4">
                       <div className="grid md:grid-cols-[1fr,auto] gap-4">
                         <div>
                           <div className="flex items-center gap-2 mb-2 flex-wrap">
                             <h3 className="font-bold text-lg text-gray-900">{booking.dog_name}</h3>
                             <Badge className={`font-semibold ${
                               booking.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                               booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                               booking.status === 'service_completed' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                               'bg-orange-100 text-orange-800 border-orange-300'
                             } border-2`}>
                               {booking.status === 'service_completed' ? '💰 Aguarda Pagamento' : booking.status}
                             </Badge>
                           </div>
                           <p className="text-sm text-gray-700 font-medium mb-1">{booking.owner_name}</p>
                           <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                             <span className="flex items-center gap-1">
                               <Clock className="w-3.5 h-3.5 text-blue-500" />
                               {format(new Date(booking.walk_date || booking.session_date), 'dd/MM/yyyy', { locale: ptBR })}
                             </span>
                             <span>•</span>
                             <span>{booking.walk_time || booking.session_time}</span>
                             <span>•</span>
                             <span className="font-semibold">{booking.duration_hours}h</span>
                           </div>
                           {booking.pickup_address && (
                             <p className="text-sm text-gray-600 flex items-center gap-1 mt-2 bg-gray-50 p-2 rounded-lg">
                               <MapPin className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" /> 
                               {booking.pickup_address}
                             </p>
                           )}
                           {booking.special_notes && (
                             <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
                               <p className="text-xs text-gray-800"><strong>⚠️ Notas:</strong> {booking.special_notes}</p>
                             </div>
                           )}
                         </div>
                         <div className="flex flex-col items-end gap-2 min-w-[140px]">
                           <div className="text-3xl font-bold text-green-600 mb-2">€{booking.service_amount}</div>

                            {booking.status === 'confirmed' && (
                              <>
                                {new Date(booking.walk_date || booking.session_date) <= new Date() && (
                                  <Button
                                    onClick={() => handleServiceCompleted(booking)}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                                    disabled={updateBookingStatusMutation.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Concluído
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    if (window.confirm('Cancelar esta reserva?')) {
                                      handleBookingAction(booking, 'cancelled');
                                    }
                                  }}
                                  className="w-full text-red-600 hover:bg-red-50 border-2 border-red-300"
                                  disabled={updateBookingStatusMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Cancelar
                                </Button>
                              </>
                            )}

                            {booking.status === 'service_completed' && (
                               <Button
                                  onClick={() => handlePaymentReceived(booking)}
                                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg animate-pulse"
                                  disabled={updateBookingStatusMutation.isPending}
                                >
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Confirmar €
                                </Button>
                            )}
                            
                            {booking.owner_phone && booking.status !== 'completed' && (
                              <Button
                                onClick={() => window.open(`https://wa.me/${booking.owner_phone.replace(/[^0-9]/g, '')}`, '_blank')}
                                variant="outline"
                                className="w-full bg-green-50 border-2 border-green-300 text-green-700 hover:bg-green-100"
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Chat
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-end mb-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Bookings Chart */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Bookings Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="bookings" fill="#3b82f6" name="Total" />
                      <Bar dataKey="completed" fill="#10b981" name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Total Earnings</p>
                        <p className="text-2xl font-bold text-green-600">€{totalEarnings.toFixed(2)}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {((completedBookings.length / rangeBookings.length * 100) || 0).toFixed(1)}%
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Average Rating</p>
                        <p className="text-2xl font-bold text-purple-600">{averageRating} ⭐</p>
                      </div>
                      <Star className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Response Rate</p>
                        <p className="text-2xl font-bold text-orange-600">98%</p>
                      </div>
                      <Activity className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            {/* Quick Services Selector */}
            <Card className="border-0 shadow-xl mb-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  Serviços Rápidos - Apenas Defina o Preço
                </CardTitle>
                <p className="text-sm text-gray-600">Ative serviços pré-configurados com um clique</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { id: 'boarding', name: 'Alojamento', icon: '🏠', desc: 'O cão fica em sua casa' },
                    { id: 'house_sitting', name: 'House Sitting', icon: '🏡', desc: 'Você fica na casa do dono' },
                    { id: 'drop_in_feeding', name: 'Visitas Rápidas', icon: '🚪', desc: 'Alimentação e cuidados rápidos' }
                  ].map(quickService => {
                    const isActive = profile.services_offered?.some(s => s.service_type === quickService.id);
                    const activeService = profile.services_offered?.find(s => s.service_type === quickService.id);
                    
                    return (
                      <Card key={quickService.id} className={`border-2 ${isActive ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                        <CardContent className="p-4">
                          <div className="text-3xl mb-2">{quickService.icon}</div>
                          <h4 className="font-bold mb-1">{quickService.name}</h4>
                          <p className="text-xs text-gray-600 mb-3">{quickService.desc}</p>
                          
                          {isActive ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">Preço:</span>
                                <span className="text-lg font-bold text-green-600">€{activeService?.price}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-red-600"
                                onClick={async () => {
                                  if (!confirm('Desativar este serviço?')) return;
                                  
                                  const updatedServices = profile.services_offered.filter(s => s.service_type !== quickService.id);
                                  const entity = walkerProfile ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
                                  
                                  await entity.update(profile.id, { services_offered: updatedServices });
                                  queryClient.invalidateQueries(['myWalkerProfile']);
                                  queryClient.invalidateQueries(['myTrainerProfile']);
                                  toast.success('Serviço desativado');
                                }}
                              >
                                Desativar
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                type="number"
                                placeholder="Preço por dia (€)"
                                id={`price-${quickService.id}`}
                                className="h-9 text-sm"
                              />
                              <Button
                                size="sm"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={async () => {
                                  const priceInput = document.getElementById(`price-${quickService.id}`);
                                  const price = parseFloat(priceInput.value);
                                  
                                  if (!price || price <= 0) {
                                    toast.error('Digite um preço válido');
                                    return;
                                  }
                                  
                                  const newService = {
                                    service_type: quickService.id,
                                    service_name: quickService.name,
                                    description: quickService.desc,
                                    price: price,
                                    duration_options: ['1 dia', 'Vários dias'],
                                    custom_pricing: false
                                  };
                                  
                                  const updatedServices = [...(profile.services_offered || []), newService];
                                  const entity = walkerProfile ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
                                  
                                  await entity.update(profile.id, { services_offered: updatedServices });
                                  queryClient.invalidateQueries(['myWalkerProfile']);
                                  queryClient.invalidateQueries(['myTrainerProfile']);
                                  toast.success('✅ Serviço ativado!');
                                  priceInput.value = '';
                                }}
                              >
                                Ativar Serviço
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Existing Services */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Serviços Personalizados</CardTitle>
                <Button onClick={() => setShowServiceForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Customizado
                </Button>
              </CardHeader>
              <CardContent>
                {(profile.services_offered || []).filter(s => !s.service_type).length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm md:text-base text-gray-600">Nenhum serviço personalizado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {(profile.services_offered || []).filter(s => !s.service_type).map((service, idx) => (
                      <Card key={idx} className="border-2 border-gray-200">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-base md:text-lg mb-2">{service.service_name}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                          <p className="text-xl md:text-2xl font-bold text-green-600 mb-3">€{service.price}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingService(service);
                                setShowServiceForm(true);
                              }}
                              className="h-10"
                            >
                              <Edit className="w-3 h-3 md:mr-1" />
                              <span className="hidden md:inline">Editar</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 h-10"
                              onClick={async () => {
                                if (!window.confirm(`Remover "${service.service_name}"?`)) return;
                                
                                try {
                                  const currentServices = (walkerProfile || trainerProfile)?.services_offered || [];
                                  const updatedServices = currentServices.filter(s => s !== service);
                                  
                                  const entity = walkerProfile ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
                                  const profileId = (walkerProfile || trainerProfile).id;
                                  
                                  await entity.update(profileId, { services_offered: updatedServices });
                                  
                                  queryClient.invalidateQueries(['myWalkerProfile']);
                                  queryClient.invalidateQueries(['myTrainerProfile']);
                                  toast.success("✅ Serviço removido!");
                                } catch (error) {
                                  toast.error("Erro ao remover serviço");
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <div className="grid grid-cols-1 gap-6">
              {/* Calendário Unificado Compacto */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-gray-50 border-b border-gray-100 py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                        Agenda & Folgas
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        <strong>Clique nos dias</strong> para marcar/desmarcar folgas. 
                        <span className="text-red-600 font-semibold"> Dias de folga ficam bloqueados para clientes.</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const events = allBookings
                            .filter(b => b.status === 'confirmed' || b.status === 'in_progress')
                            .map(bookingToEvent)
                            .filter(e => e);

                          if (events.length === 0) {
                            toast.info("Nenhum agendamento confirmado para exportar.");
                            return;
                          }

                          const icsContent = generateMultiICS(events);
                          downloadICS("pawcao_bookings.ics", icsContent);
                          toast.success("Calendário exportado!");
                        }}
                        className="bg-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar iCal
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 bg-white">
                  <div className="max-w-3xl mx-auto">
                    <AvailabilityCalendar 
                      availabilityData={availability}
                      bookings={allBookings}
                      locale={ptBR}
                      walkerEmail={user?.email}
                      isInteractive={true}
                      selectedDate={selectedCalendarDate}
                      onDateSelect={async (date, status) => {
                        try {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          
                          // 1. Check bookings for this day
                          const dayBookings = allBookings.filter(b => 
                            (b.walk_date === dateStr || b.session_date === dateStr) &&
                            (b.status !== 'cancelled' && b.status !== 'rejected')
                          );
                          
                          // If has bookings, select date to show details
                          if (dayBookings.length > 0) {
                            setSelectedCalendarDate(date);
                            toast.info(`📅 ${dayBookings.length} reservas em ${format(date, 'dd/MM')}`);
                            return;
                          }

                          // If no bookings, toggle Time Off
                          // 2. Find existing availability record
                          const existingRecord = availability.find(a => a.date === dateStr);

                          if (status === 'day_off' && existingRecord) {
                            // REMOVE TIME OFF
                            await base44.entities.CalendarAvailability.delete(existingRecord.id);
                            toast.success('Folga removida. Dia disponível.');
                          } else {
                            // SET TIME OFF
                            if (existingRecord) {
                               await base44.entities.CalendarAvailability.update(existingRecord.id, {
                                 is_day_off: true,
                                 is_fully_booked: true,
                                 notes: 'Folga marcada pelo painel'
                               });
                            } else {
                               await base44.entities.CalendarAvailability.create({
                                professional_email: user?.email,
                                professional_name: profile?.walker_name || profile?.trainer_name,
                                professional_type: walkerProfile ? 'walker' : 'trainer',
                                date: dateStr,
                                is_day_off: true,
                                is_fully_booked: true,
                                time_slots: [],
                                notes: 'Folga marcada pelo painel'
                              });
                            }
                            toast.success('Folga marcada! 🚫');
                          }
                          
                          // Clear selection and refresh
                          setSelectedCalendarDate(null);
                          queryClient.invalidateQueries(['myAvailability']);
                          
                        } catch (err) {
                          console.error(err);
                          toast.error('Erro ao atualizar agenda.');
                        }
                      }}
                    />
                  </div>
                  
                  {/* Selected Date Details */}
                  <AnimatePresence>
                    {selectedCalendarDate && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 border-t pt-4"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-blue-600" />
                            Reservas para {format(selectedCalendarDate, "d 'de' MMMM", { locale: ptBR })}
                          </h3>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCalendarDate(null)}>
                            Fechar
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {allBookings
                            .filter(b => {
                              const d = new Date(b.walk_date || b.session_date);
                              return format(d, 'yyyy-MM-dd') === format(selectedCalendarDate, 'yyyy-MM-dd') &&
                                     b.status !== 'cancelled' && b.status !== 'rejected';
                            })
                            .map(booking => (
                              <div key={booking.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border shadow-sm text-lg">
                                    {booking.dog_size === 'small' ? '🐕' : '🦮'}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900">{booking.dog_name}</p>
                                    <p className="text-xs text-gray-600">{booking.walk_time || booking.session_time} • {booking.duration_hours}h • {booking.owner_name}</p>
                                  </div>
                                </div>
                                <Badge className="bg-white text-blue-700 hover:bg-white">{booking.status}</Badge>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* Segunda linha - Integrações (Mantida simplificada) */}
            <div className="mt-6">
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Integrações & Exportar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="font-semibold text-sm text-blue-900 mb-1 flex items-center gap-2">
                      <Share2 className="w-4 h-4" /> Link de Agendamento
                    </h4>
                    <p className="text-xs text-blue-700 mb-2">Partilhe este link com clientes para agendamentos diretos.</p>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={`${window.location.origin}${createPageUrl(walkerProfile ? 'WalkerDetails' : 'TrainerDetails')}?id=${(walkerProfile || trainerProfile)?.id}`} 
                        readOnly 
                        className="bg-white text-xs h-8"
                      />
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => {
                          const url = `${window.location.origin}${createPageUrl(walkerProfile ? 'WalkerDetails' : 'TrainerDetails')}?id=${(walkerProfile || trainerProfile)?.id}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Link copiado!");
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <h4 className="font-semibold text-sm text-purple-900 mb-1 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" /> Sincronização Externa
                    </h4>
                    <p className="text-xs text-purple-700 mb-2">
                      Exporte os seus agendamentos para Google Calendar, Outlook ou Apple Calendar.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full bg-white text-xs h-8"
                      onClick={() => {
                         const events = allBookings
                          .filter(b => b.status === 'confirmed')
                          .map(bookingToEvent)
                          .filter(e => e);
                         const icsContent = generateMultiICS(events);
                         downloadICS("pawcao_schedule.ics", icsContent);
                      }}
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Baixar Agenda (.ics)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {showServiceForm && <ServiceForm />}
        </ErrorBoundary>
      </div>
    </div>
  );
}