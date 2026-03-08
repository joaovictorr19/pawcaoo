import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, DollarSign, TrendingUp, Users, Star, MessageCircle,
  MapPin, Clock, CheckCircle, AlertCircle, BarChart3, Activity,
  Package, Edit, Trash2, Plus, Bell, Loader2, Home,
  Dog, Cat, Bird, Award, Download, Share2, FileText, QrCode, CreditCard
} from "lucide-react";
import { ReptileIcon, ArachnidIcon, RodentIcon } from "@/components/professionals/AnimalIcons";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { bookingToEvent, generateMultiICS, downloadICS } from "../components/calendar/calendarHelpers";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import { useCreateNotification } from "../components/NotificationService";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AvailabilityCalendar from "../components/calendar/AvailabilityCalendar";
import ReviewCard from "../components/reviews/ReviewCard";
import VerificationBanner from "../components/professionals/VerificationBanner";
import DigitalWalletPass from "../components/professionals/DigitalWalletPass";
import FiscalComplianceBanner from "../components/fiscal/FiscalComplianceBanner";
import DataExportPanel from "../components/professionals/DataExportPanel";
import StripeConnectSetup from "../components/professionals/StripeConnectSetup";
import { useLanguage } from "@/components/LanguageContext";

// New compact components
import DashboardStats from "../components/professional/DashboardStats";
import QuickActions from "../components/professional/QuickActions";
import PendingRequests from "../components/professional/PendingRequests";
import ActiveServiceBanner from "../components/professional/ActiveServiceBanner";
import BookingsList from "../components/professional/BookingsList";
import OverviewCharts from "../components/professional/OverviewCharts";
import RecentActivity from "../components/professional/RecentActivity";
import OpenWalksList from "../components/professional/OpenWalksList";
import AdvancedAnalyticsDashboard from "@/components/professional/AdvancedAnalyticsDashboard";

const TABS = [
  { id: "overview", label: "Resumo", icon: BarChart3 },
  { id: "analytics", label: "Performance", icon: TrendingUp },
  { id: "requests", label: "Pedidos", icon: Bell },
  { id: "bookings", label: "Reservas", icon: Calendar },
  { id: "services", label: "Serviços", icon: Package },
  { id: "calendar", label: "Agenda", icon: Calendar },
  { id: "reviews", label: "Avaliações", icon: Star },
  { id: "tools", label: "Ferramentas", icon: QrCode },
];

export default function ProfessionalDashboard() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const createNotification = useCreateNotification();
  const [activeTab, setActiveTab] = useState("overview");
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [dateRange, setDateRange] = useState("7days");

  // ─── Data Fetching ────────────────────────────────────
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: walkerProfile } = useQuery({
    queryKey: ['myWalkerProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: user?.email }, '-created_date');
      const activeProfile = profiles.find(p => p.verification_status !== 'rejected') || profiles[0];
      if (activeProfile && user && user.account_type !== 'walker' && user.account_type !== 'both') {
        try {
          await base44.auth.updateMe({ account_type: 'walker' });
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        } catch (e) {}
      }
      return activeProfile;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: trainerProfile } = useQuery({
    queryKey: ['myTrainerProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.TrainerProfile.filter({ created_by: user?.email }, '-created_date');
      const activeProfile = profiles.find(p => p.verification_status !== 'rejected') || profiles[0];
      if (activeProfile && user && user.account_type !== 'trainer' && user.account_type !== 'both') {
        try {
          const newType = walkerProfile ? 'both' : 'trainer';
          await base44.auth.updateMe({ account_type: newType });
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        } catch (e) {}
      }
      return activeProfile;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: walkBookings = [] } = useQuery({
    queryKey: ['myWalkBookings', walkerProfile?.id, user?.email],
    queryFn: async () => {
      if (!user?.email && !walkerProfile?.id) return [];
      const allBookings = await base44.entities.Booking.list('-created_date', 1000);
      return allBookings.filter(b => {
        const isMyWalk = (b.walker_email === user.email) || (walkerProfile?.id && b.walker_id === walkerProfile.id);
        const isActiveStatus = ['pending', 'confirmed', 'in_progress', 'service_completed'].includes(b.status);
        return isMyWalk && isActiveStatus;
      });
    },
    enabled: !!user?.email || !!walkerProfile?.id,
    initialData: [],
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // New direct request notification
  const prevDirectCountRef = React.useRef(0);
  React.useEffect(() => {
    const currentDirects = walkBookings.filter(b => b.status === 'pending' && b.walker_id === walkerProfile?.id);
    const currentCount = currentDirects.length;
    if (currentCount > prevDirectCountRef.current && prevDirectCountRef.current >= 0) {
      const nb = currentDirects[0];
      if (nb) {
        toast.success(`Novo pedido de ${nb.owner_name}`, {
          description: `${nb.dog_name} - ${nb.walk_date ? format(new Date(nb.walk_date), 'dd/MM') : ''}`,
          action: { label: 'Ver', onClick: () => setActiveTab('bookings') },
          duration: 8000
        });
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Novo Pedido!', { body: `${nb.owner_name} - ${nb.dog_name}`, icon: '/logo.png' });
        }
      }
    }
    prevDirectCountRef.current = currentCount;
  }, [walkBookings, walkerProfile?.id]);

  const { data: trainingBookings = [] } = useQuery({
    queryKey: ['myTrainingBookings'],
    queryFn: () => base44.entities.TrainingBooking.filter({ trainer_email: user?.email }, '-created_date'),
    enabled: !!user && !!trainerProfile,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['myReviews'],
    queryFn: async () => {
      const wr = walkerProfile ? await base44.entities.Review.filter({ walker_id: walkerProfile.id }) : [];
      const tr = trainerProfile ? await base44.entities.Review.filter({ trainer_id: trainerProfile.id }) : [];
      return [...wr, ...tr];
    },
    enabled: !!user && (!!walkerProfile || !!trainerProfile),
    initialData: [],
    staleTime: 5 * 60 * 1000,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['myAvailability'],
    queryFn: () => base44.entities.CalendarAvailability.filter({ professional_email: user?.email }),
    enabled: !!user,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  // ─── Derived Data ─────────────────────────────────────
  const allBookings = [...walkBookings, ...trainingBookings];
  const profile = walkerProfile || trainerProfile;

  const directRequests = allBookings.filter(b => {
    const isPending = b.status === 'pending';
    const isAdmin = user?.role === 'admin';
    const isForMe = (b.walker_id && b.walker_id === walkerProfile?.id) ||
                    (b.walker_email && b.walker_email === user?.email) ||
                    (b.trainer_id && b.trainer_id === trainerProfile?.id) ||
                    (b.trainer_email && b.trainer_email === user?.email);
    return isPending && (isForMe || isAdmin);
  });

  const days = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 90;
  const startDate = subDays(new Date(), days);
  const rangeBookings = allBookings.filter(b => new Date(b.created_date) >= startDate);
  const totalEarnings = rangeBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.service_amount || 0) + (b.tip_amount || 0), 0);
  const completedBookings = rangeBookings.filter(b => b.status === 'completed');
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : profile?.rating || 5;

  const calculateCompleteness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.photo_url) score += 20;
    if (profile.bio && profile.bio.length > 50) score += 20;
    if (profile.location) score += 10;
    if (profile.services_offered?.length > 0) score += 20;
    if (profile.availability?.length > 0) score += 10;
    if (profile.verification_status === 'verified') score += 20;
    return score;
  };

  const chartData = (() => {
    const d = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayBookings = allBookings.filter(b =>
        format(new Date(b.walk_date || b.session_date || b.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      d.push({
        date: format(date, 'EEE', { locale: ptBR }),
        bookings: dayBookings.length,
        earnings: dayBookings.reduce((sum, b) => sum + (b.service_amount || 0), 0),
        completed: dayBookings.filter(b => b.status === 'completed').length
      });
    }
    return d;
  })();

  const statusData = [
    { name: 'Concluídos', value: allBookings.filter(b => b.status === 'completed').length, color: '#10b981' },
    { name: 'Pendentes', value: allBookings.filter(b => b.status === 'pending').length, color: '#f59e0b' },
    { name: 'Em curso', value: allBookings.filter(b => b.status === 'in_progress' || b.status === 'confirmed').length, color: '#3b82f6' },
    { name: 'Cancelados', value: allBookings.filter(b => b.status === 'cancelled').length, color: '#ef4444' },
  ];

  // ─── Calendar Slot Helpers ────────────────────────────
  const freeUpCalendarSlot = async (booking, email) => {
    if (!booking.calendar_event_id) return;
    try {
      const dateStr = format(new Date(booking.walk_date || booking.session_date), 'yyyy-MM-dd');
      const records = await base44.entities.CalendarAvailability.filter({ professional_email: email, date: dateStr });
      if (records.length > 0) {
        const r = records[0];
        const slots = r.time_slots.map(s => s.booking_id === booking.id ? { ...s, is_available: true, booking_id: null } : s);
        await base44.entities.CalendarAvailability.update(r.id, { time_slots: slots, is_fully_booked: false });
      }
    } catch (e) {}
  };

  const lockCalendarSlot = async (booking, email) => {
    if (booking.calendar_event_id) return booking.calendar_event_id;
    try {
      const dateStr = format(new Date(booking.walk_date || booking.session_date), 'yyyy-MM-dd');
      const records = await base44.entities.CalendarAvailability.filter({ professional_email: email, date: dateStr });
      if (records.length > 0) {
        const eventId = `evt_${booking.id}_${Date.now()}`;
        const r = records[0];
        const bookingTime = booking.walk_time || booking.session_time;
        const [start, end] = bookingTime.split(' - ');
        const slots = r.time_slots.map(s => s.start_time === start && s.end_time === end ? { ...s, is_available: false, booking_id: booking.id } : s);
        await base44.entities.CalendarAvailability.update(r.id, { time_slots: slots });
        return eventId;
      }
    } catch (e) {}
    return null;
  };

  // ─── Booking Actions ──────────────────────────────────
  const handleBookingAction = async (booking, status) => {
    const isTraining = !!booking.session_date;
    const entity = isTraining ? base44.entities.TrainingBooking : base44.entities.Booking;
    const email = user?.email;

    try {
      if (status === 'confirmed') {
        await entity.update(booking.id, { status: 'confirmed' });
        // Create chat
        try {
          const existing = await base44.entities.ChatConversation.filter({ booking_id: booking.id });
          if (!existing || existing.length === 0) {
            const walkerEmail = booking.walker_email || email;
            const ownerEmail = booking.owner_email || booking.created_by;
            await base44.entities.ChatConversation.create({
              participants: [walkerEmail, ownerEmail],
              participant_names: { [walkerEmail]: booking.walker_name || user.full_name, [ownerEmail]: booking.owner_name },
              booking_id: booking.id, tags: ["booking"], last_message: "Reserva confirmada", last_message_date: new Date().toISOString(),
              unread_counts: { [walkerEmail]: 0, [ownerEmail]: 0 }, is_muted: {}, pinned_by: [], typing_users: []
            });
          }
        } catch (e) {}
        try { await lockCalendarSlot(booking, email); } catch (e) {}
        queryClient.invalidateQueries(['myWalkBookings']);
        queryClient.invalidateQueries(['myTrainingBookings']);
        toast.success('Reserva aceite!');
        // Notify client
        try {
          const clientEmail = booking.owner_email || booking.created_by;
          const dateF = format(new Date(booking.walk_date || booking.session_date), 'dd/MM/yyyy');
          await base44.functions.invoke('sendNotification', {
            recipient_email: clientEmail, type: 'booking_confirmed', title: 'Reserva Confirmada!',
            message: `Reserva com ${user.full_name} para ${dateF} confirmada.`, link: '/MyBookings', send_email: true,
            email_subject: `Reserva Confirmada - ${booking.dog_name}`,
            email_body: `Olá,\n\nA sua reserva foi confirmada!\nProfissional: ${user.full_name}\nData: ${dateF}\n\nEquipa PawCão`
          });
        } catch (e) {}
        return;
      }

      if (status === 'cancelled' || status === 'rejected') {
        await freeUpCalendarSlot(booking, email);
      }
      await entity.update(booking.id, { status, ...(status === 'cancelled' ? { calendar_event_id: null } : {}) });

      // Notify on cancel
      if (status === 'cancelled' || status === 'rejected') {
        try {
          const clientEmail = booking.owner_email || booking.created_by;
          const dateF = format(new Date(booking.walk_date || booking.session_date), 'dd/MM/yyyy');
          await base44.functions.invoke('sendNotification', {
            recipient_email: clientEmail, type: 'booking', title: 'Reserva Cancelada',
            message: `Reserva para ${dateF} cancelada.`, link: '/MyBookings', send_email: true,
            email_subject: 'Reserva Cancelada',
            email_body: `Olá,\n\nA sua reserva para ${dateF} foi cancelada pelo profissional.\n\nEquipa PawCão`
          });
        } catch (e) {}
      }

      queryClient.invalidateQueries(['myWalkBookings']);
      queryClient.invalidateQueries(['myTrainingBookings']);
      toast.success(status === 'service_completed' ? 'Serviço concluído!' : 'Reserva atualizada');
    } catch (error) {
      toast.error("Erro ao atualizar reserva");
    }
  };

  const handleStartService = async (booking) => {
    try {
      await base44.entities.Booking.update(booking.id, { status: 'in_progress', walk_start_time: new Date().toISOString() });
      queryClient.invalidateQueries(['myWalkBookings']);
      toast.success('Serviço iniciado!');
      navigate(createPageUrl('ActiveWalkDashboard') + `?bookingId=${booking.id}`);
    } catch (e) { toast.error('Erro ao iniciar'); }
  };

  const handleServiceCompleted = async (booking) => {
    await handleBookingAction(booking, 'service_completed');
    try {
      const clientEmail = booking.owner_email || booking.created_by;
      const amount = booking.total_amount || 0;
      await base44.functions.invoke('sendNotification', {
        recipient_email: clientEmail, type: 'service_completed', title: 'Serviço Concluído',
        message: `Confirme o pagamento de €${amount.toFixed(2)}.`, link: '/MyBookings', send_email: true,
        email_subject: 'Serviço Concluído - Pagamento Pendente',
        email_body: `Olá ${booking.owner_name},\n\nO serviço para ${booking.dog_name} foi concluído.\nValor: €${amount.toFixed(2)}\n\nEquipa PawCão`
      });
    } catch (e) {}
  };

  const handlePaymentReceived = async (booking) => {
    const entity = booking.type === 'training' ? base44.entities.TrainingBooking : base44.entities.Booking;
    await entity.update(booking.id, { status: 'completed', completed_date: new Date().toISOString(), payment_status: 'released' });
    queryClient.invalidateQueries(['myWalkBookings']);
    queryClient.invalidateQueries(['myTrainingBookings']);
    toast.success('Pagamento confirmado!');
    try {
      const clientEmail = booking.owner_email || booking.created_by;
      await base44.functions.invoke('sendNotification', {
        recipient_email: clientEmail, type: 'payment', title: 'Pagamento Confirmado',
        message: 'Obrigado! Deixe uma avaliação.', link: `/MyBookings?review=${booking.id}`, send_email: true,
        email_subject: 'Pagamento Confirmado', email_body: `Olá ${booking.owner_name},\n\nPagamento confirmado.\n\nEquipa PawCão`
      });
    } catch (e) {}
  };

  const handleCancelBooking = (booking) => {
    if (window.confirm('Cancelar esta reserva?')) handleBookingAction(booking, 'cancelled');
  };

  // ─── Service Form ─────────────────────────────────────
  const ServiceForm = () => {
    const [formData, setFormData] = useState(editingService || {
      service_name: "", description: "", price: "", duration_options: ["30min", "1h", "2h"],
      custom_pricing: false, package_options: [], animal_type: "dogs"
    });

    const handleSubmit = async () => {
      if (!formData.service_name || !formData.price || !formData.animal_type) {
        toast.error('Preencha os campos obrigatórios'); return;
      }
      try {
        const currentServices = (walkerProfile || trainerProfile)?.services_offered || [];
        const updatedServices = editingService
          ? currentServices.map(s => s === editingService ? formData : s)
          : [...currentServices, formData];
        const currentUser = await base44.auth.me();
        const ap = walkerProfile || trainerProfile;
        await base44.entities.ProfileEditRequest.create({
          profile_type: walkerProfile ? 'walker' : 'trainer', profile_id: ap.id,
          requester_email: currentUser.email, requester_name: currentUser.full_name,
          changes_requested: { services_offered: updatedServices }, status: 'pending'
        });
        queryClient.invalidateQueries(['profileEditRequests']);
        toast.success("Serviço enviado para aprovação!");
        setShowServiceForm(false); setEditingService(null);
      } catch (e) { toast.error("Erro: " + e.message); }
    };

    return (
      <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
        <DialogContent className="max-w-lg bg-white">
          <div className="p-5 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{editingService ? 'Editar' : 'Adicionar'} Serviço</h2>
            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1 block">Nome *</Label>
              <Input value={formData.service_name} onChange={(e) => setFormData({...formData, service_name: e.target.value})} placeholder="Ex: Passeio premium" className="h-9" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1 block">Descrição</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} className="resize-none text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1 block">Tipo de Animal</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dogs', label: 'Cães', I: Dog }, { id: 'cats', label: 'Gatos', I: Cat }, { id: 'birds', label: 'Aves', I: Bird },
                  { id: 'reptiles', label: 'Répteis', I: ReptileIcon }, { id: 'arachnids', label: 'Aracnídeos', I: ArachnidIcon }, { id: 'rodents', label: 'Roedores', I: RodentIcon }
                ].map(a => (
                  <button key={a.id} type="button" onClick={() => setFormData({...formData, animal_type: a.id})}
                    className={`p-2 rounded-lg border text-center text-xs font-medium transition-all ${formData.animal_type === a.id ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <a.I className="w-5 h-5 mx-auto mb-1" />{a.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1 block">Preço (€) *</Label>
              <Input type="number" step="0.01" min="1" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} placeholder="10" className="h-9" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowServiceForm(false); setEditingService(null); }} className="flex-1 h-10 text-sm">Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!formData.service_name || !formData.price} className="flex-1 h-10 text-sm bg-gray-900 hover:bg-gray-800 text-white">
                {editingService ? 'Guardar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // ─── Loading & Guard States ───────────────────────────
  if (loadingUser) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="max-w-sm border shadow-lg">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Perfil Profissional Necessário</h2>
            <p className="text-sm text-gray-600 mb-5">Crie o seu perfil para aceder ao painel.</p>
            <Button onClick={() => navigate(createPageUrl('BecomeProfessional'))} className="w-full h-10 bg-gray-900 text-white hover:bg-gray-800">
              Criar Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.verification_status === 'pending') {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="max-w-md border shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Candidatura em Análise</h2>
            <p className="text-sm text-gray-600 mb-4">Iremos verificar os seus dados nas próximas 24-48 horas.</p>
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-5 space-y-2">
              {['Documentos', 'Informações fiscais', 'Experiência'].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />{item}
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Clock className="w-4 h-4 text-orange-500 shrink-0" />Verificação de segurança
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(createPageUrl('Home'))} className="w-full h-10">Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.verification_status === 'rejected') {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="max-w-md border shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Candidatura Não Aprovada</h2>
            {profile.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-sm text-gray-700">{profile.rejection_reason}</p>
              </div>
            )}
            <p className="text-xs text-gray-500 mb-4">Contacte support@pawcao.net para questões.</p>
            <Button variant="outline" onClick={() => navigate(createPageUrl('Home'))} className="w-full h-10">Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main Dashboard ───────────────────────────────────
  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4">
        <ErrorBoundary>
          <FiscalComplianceBanner />
          <VerificationBanner profile={profile} type={walkerProfile ? 'walker' : 'trainer'} />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Painel Profissional</h1>
              <p className="text-xs text-gray-500 mt-0.5">{profile.walker_name || profile.trainer_name}</p>
            </div>
            <Badge variant="outline" className="text-xs px-2 py-1 border-gray-300 font-medium">
              {profile.verification_status === 'verified' ? '✓ Verificado' : 'Pendente'}
            </Badge>
          </div>

          {/* Quick Actions */}
          <QuickActions onAddService={() => setShowServiceForm(true)} />

          {/* Active Service Banner */}
          <ActiveServiceBanner bookings={allBookings} />

          {/* Pending Requests */}
          <PendingRequests
            requests={directRequests}
            onAccept={(b) => handleBookingAction(b, 'confirmed')}
            onDecline={(b) => handleBookingAction(b, 'cancelled')}
          />

          {/* Stats */}
          <DashboardStats
            totalEarnings={totalEarnings}
            dateRange={dateRange}
            directRequests={directRequests}
            averageRating={averageRating}
            reviewsCount={reviews.length}
            profileCompleteness={calculateCompleteness()}
            language={language}
            onRespondClick={() => setActiveTab('bookings')}
          />

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide bg-white border border-gray-200 rounded-xl p-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === 'bookings' && directRequests.length > 0 && (
                  <span className="w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {directRequests.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <OverviewCharts chartData={chartData} statusData={statusData} />
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gray-500" />
                    Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <RecentActivity bookings={allBookings} />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'analytics' && (
            <AdvancedAnalyticsDashboard walkerEmail={user?.email} />
          )}

          {activeTab === 'requests' && (
            <OpenWalksList walkerProfile={walkerProfile || trainerProfile} />
          )}

          {activeTab === 'bookings' && (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700">Todas as Reservas</CardTitle>
                  <Badge variant="outline" className="text-xs">{allBookings.length} total</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <BookingsList
                  bookings={allBookings}
                  directRequestIds={directRequests.map(d => d.id)}
                  onStartService={handleStartService}
                  onComplete={handleServiceCompleted}
                  onConfirmPayment={handlePaymentReceived}
                  onCancel={handleCancelBooking}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'services' && (
            <div className="space-y-3">
              {/* Quick Services */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-700">Serviços Rápidos</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">Ative serviços pré-configurados</p>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Cães & Gatos</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {[
                      { id: 'walk_dogs', name: 'Passeio Cães', I: Dog, desc: 'Padrão', animal: 'dogs', unit: '/h' },
                      { id: 'walk_cats', name: 'Passeio Gatos', I: Cat, desc: 'Para gatos', animal: 'cats', unit: '/h' },
                      { id: 'boarding_dogs', name: 'Alojamento', I: Home, desc: 'Em sua casa', animal: 'dogs', unit: '/h' },
                      { id: 'training_dogs', name: 'Treino', I: Award, desc: 'Sessões', animal: 'dogs', unit: '/h', isTraining: true },
                    ].map(qs => {
                      const isActive = profile.services_offered?.some(s => s.service_type === qs.id);
                      const activeService = profile.services_offered?.find(s => s.service_type === qs.id);
                      return (
                        <div key={qs.id} className={`border rounded-lg p-3 ${isActive ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}>
                          <qs.I className="w-5 h-5 text-gray-600 mb-1.5" />
                          <p className="text-xs font-semibold text-gray-900">{qs.name}</p>
                          <p className="text-[10px] text-gray-500 mb-2">{qs.desc}</p>
                          {isActive ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-emerald-700">€{activeService?.price}{qs.unit}</span>
                              <button className="text-[10px] text-red-500 hover:underline" onClick={async () => {
                                if (!confirm('Desativar?')) return;
                                const updated = profile.services_offered.filter(s => s.service_type !== qs.id);
                                const entity = walkerProfile ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
                                await entity.update(profile.id, { services_offered: updated });
                                queryClient.invalidateQueries(['myWalkerProfile']);
                                queryClient.invalidateQueries(['myTrainerProfile']);
                                toast.success('Desativado');
                              }}>Desativar</button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Input type="number" placeholder="€" id={`p-${qs.id}`} className="h-7 text-xs flex-1" />
                              <Button size="sm" className="h-7 text-[10px] px-2 bg-gray-900 text-white" onClick={async () => {
                                const p = parseFloat(document.getElementById(`p-${qs.id}`).value);
                                if (!p || p <= 0) { toast.error('Preço inválido'); return; }
                                const ns = { service_type: qs.id, service_name: qs.name, description: qs.desc, price: p, animal_type: qs.animal, duration_options: ['30min', '1h', '2h'], custom_pricing: false };
                                const updated = [...(profile.services_offered || []), ns];
                                const entity = walkerProfile ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
                                const upd = { services_offered: updated };
                                if (qs.isTraining) upd.is_verified_trainer = true;
                                await entity.update(profile.id, upd);
                                queryClient.invalidateQueries(['myWalkerProfile']);
                                queryClient.invalidateQueries(['myTrainerProfile']);
                                toast.success('Ativado!');
                                document.getElementById(`p-${qs.id}`).value = '';
                              }}>OK</Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Exóticos</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'care_reptiles', name: 'Répteis', I: ReptileIcon, animal: 'reptiles' },
                      { id: 'care_arachnids', name: 'Aracnídeos', I: ArachnidIcon, animal: 'arachnids' },
                      { id: 'care_birds', name: 'Aves', I: Bird, animal: 'birds' },
                      { id: 'care_rodents', name: 'Roedores', I: RodentIcon, animal: 'rodents' },
                    ].map(qs => {
                      const isActive = profile.services_offered?.some(s => s.service_type === qs.id);
                      const activeService = profile.services_offered?.find(s => s.service_type === qs.id);
                      return (
                        <div key={qs.id} className={`border rounded-lg p-3 ${isActive ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
                          <qs.I className="w-5 h-5 text-gray-600 mb-1.5" />
                          <p className="text-xs font-semibold text-gray-900">{qs.name}</p>
                          <p className="text-[10px] text-gray-500 mb-2">Cuidado especializado</p>
                          {isActive ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-purple-700">€{activeService?.price}/visita</span>
                              <button className="text-[10px] text-red-500 hover:underline" onClick={async () => {
                                if (!confirm('Desativar?')) return;
                                const updated = profile.services_offered.filter(s => s.service_type !== qs.id);
                                const entity = walkerProfile ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
                                await entity.update(profile.id, { services_offered: updated });
                                queryClient.invalidateQueries(['myWalkerProfile']);
                                queryClient.invalidateQueries(['myTrainerProfile']);
                                toast.success('Desativado');
                              }}>Desativar</button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Input type="number" placeholder="€" id={`p-${qs.id}`} className="h-7 text-xs flex-1" />
                              <Button size="sm" className="h-7 text-[10px] px-2 bg-gray-900 text-white" onClick={async () => {
                                const p = parseFloat(document.getElementById(`p-${qs.id}`).value);
                                if (!p || p <= 0) { toast.error('Preço inválido'); return; }
                                const ns = { service_type: qs.id, service_name: qs.name, price: p, animal_type: qs.animal, duration_options: ['Visita'], custom_pricing: false };
                                const updated = [...(profile.services_offered || []), ns];
                                const entity = walkerProfile ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
                                await entity.update(profile.id, { services_offered: updated });
                                queryClient.invalidateQueries(['myWalkerProfile']);
                                queryClient.invalidateQueries(['myTrainerProfile']);
                                toast.success('Ativado!');
                                document.getElementById(`p-${qs.id}`).value = '';
                              }}>OK</Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Services */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700">Serviços Personalizados</CardTitle>
                  <Button size="sm" onClick={() => setShowServiceForm(true)} className="h-7 text-xs bg-gray-900 text-white">
                    <Plus className="w-3 h-3 mr-1" />Adicionar
                  </Button>
                </CardHeader>
                <CardContent className="p-3">
                  {(profile.services_offered || []).filter(s => !s.service_type).length === 0 ? (
                    <div className="text-center py-6">
                      <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Nenhum serviço personalizado</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(profile.services_offered || []).filter(s => !s.service_type).map((service, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{service.service_name}</p>
                            <p className="text-xs text-gray-500">{service.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold text-emerald-700">€{service.price}</span>
                            <button onClick={() => { setEditingService(service); setShowServiceForm(true); }} className="text-gray-400 hover:text-gray-600">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={async () => {
                              if (!confirm(`Remover "${service.service_name}"?`)) return;
                              const updated = (profile.services_offered || []).filter(s => s !== service);
                              const entity = walkerProfile ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
                              await entity.update(profile.id, { services_offered: updated });
                              queryClient.invalidateQueries(['myWalkerProfile']);
                              queryClient.invalidateQueries(['myTrainerProfile']);
                              toast.success('Removido');
                            }} className="text-gray-400 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-3">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="py-3 px-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-gray-700">Agenda & Folgas</CardTitle>
                      <p className="text-[11px] text-gray-500 mt-0.5">Clique nos dias para marcar/desmarcar folgas</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                      const events = allBookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').map(bookingToEvent).filter(e => e);
                      if (events.length === 0) { toast.info("Sem agendamentos para exportar"); return; }
                      downloadICS("pawcao_bookings.ics", generateMultiICS(events));
                      toast.success("Exportado!");
                    }}>
                      <Download className="w-3 h-3 mr-1" />iCal
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="max-w-2xl mx-auto">
                    <AvailabilityCalendar
                      availabilityData={availability}
                      bookings={allBookings}
                      locale={ptBR}
                      walkerEmail={user?.email}
                      isInteractive={true}
                      onDateSelect={async (date, status) => {
                        try {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const dayBookings = allBookings.filter(b =>
                            (b.walk_date === dateStr || b.session_date === dateStr) && !['cancelled', 'rejected'].includes(b.status)
                          );
                          if (dayBookings.length > 0) { toast.error('Dia com reservas!'); return; }
                          const existing = availability.find(a => a.date === dateStr);
                          if (status === 'day_off') {
                            if (existing) { await base44.entities.CalendarAvailability.delete(existing.id); toast.success('Folga removida!'); }
                          } else {
                            if (existing) {
                              await base44.entities.CalendarAvailability.update(existing.id, { is_day_off: true, is_fully_booked: true, notes: 'Folga' });
                            } else {
                              await base44.entities.CalendarAvailability.create({
                                professional_email: user?.email, professional_name: profile?.walker_name || profile?.trainer_name,
                                professional_type: walkerProfile ? 'walker' : 'trainer', date: dateStr, is_day_off: true, is_fully_booked: true, time_slots: [], notes: 'Folga'
                              });
                            }
                            toast.success('Folga marcada!');
                          }
                          queryClient.invalidateQueries(['myAvailability']);
                        } catch (err) { toast.error('Erro: ' + err.message); }
                      }}
                    />
                  </div>
                  {availability.filter(a => a.is_day_off).length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Folgas Marcadas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {availability.filter(a => a.is_day_off).sort((a, b) => new Date(a.date) - new Date(b.date)).map(d => (
                          <Badge key={d.id} className="bg-red-600 text-white text-[10px] px-2 py-1 cursor-pointer hover:bg-red-700" onClick={async () => {
                            await base44.entities.CalendarAvailability.delete(d.id);
                            toast.success('Removida!');
                            queryClient.invalidateQueries(['myAvailability']);
                          }}>
                            {format(new Date(d.date), "d MMM", { locale: ptBR })} ✕
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Booking Link & Sync */}
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-3 space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1"><Share2 className="w-3 h-3" /> Link de Agendamento</p>
                    <div className="flex gap-2">
                      <Input value={`${window.location.origin}${createPageUrl(walkerProfile ? 'WalkerDetails' : 'TrainerDetails')}?id=${profile?.id}`} readOnly className="text-[11px] h-7 bg-white" />
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs shrink-0" onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${createPageUrl(walkerProfile ? 'WalkerDetails' : 'TrainerDetails')}?id=${profile?.id}`);
                        toast.success("Copiado!");
                      }}>Copiar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'reviews' && (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-semibold text-gray-700">Avaliações ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Sem avaliações ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-3">
              {/* Digital Card */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <QrCode className="w-4 h-4" /> Cartão Digital & QR
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex justify-center">
                  <DigitalWalletPass
                    user={{ ...user, ...(walkerProfile || trainerProfile), username: user?.username || profile?.id }}
                    profileType={walkerProfile ? "walker" : "trainer"}
                    isVerified={profile?.is_verified || profile?.verification_status === 'verified'}
                  />
                </CardContent>
              </Card>

              {/* Stripe Payments */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Pagamentos (Stripe)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <StripeConnectSetup />
                </CardContent>
              </Card>

              {/* Data Export */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Exportar Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <DataExportPanel professionalEmail={user?.email} country={profile?.country_of_operation} />
                </CardContent>
              </Card>
            </div>
          )}

          {showServiceForm && <ServiceForm />}
        </ErrorBoundary>
      </div>
    </div>
  );
}