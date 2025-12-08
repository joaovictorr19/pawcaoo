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
  Package, Edit, Trash2, Plus, Bell, ArrowUp, ArrowDown, Loader2
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
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

export default function ProfessionalDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const createNotification = useCreateNotification();
  const [activeTab, setActiveTab] = useState("overview");
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [dateRange, setDateRange] = useState("7days");

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
      return profiles[0];
    },
    enabled: !!user && (user.account_type === 'walker' || user.account_type === 'both'),
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: trainerProfile } = useQuery({
    queryKey: ['myTrainerProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.TrainerProfile.filter({ created_by: user?.email });
      return profiles[0];
    },
    enabled: !!user && (user.account_type === 'trainer' || user.account_type === 'both'),
    refetchInterval: 30000,
  });

  // Real-time bookings
  const { data: walkBookings = [] } = useQuery({
    queryKey: ['myWalkBookings'],
    queryFn: () => base44.entities.Booking.filter({ walker_email: user?.email }, '-created_date'),
    enabled: !!user && !!walkerProfile,
    initialData: [],
    refetchInterval: 10000, // Real-time: refresh every 10s
  });

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
      const walkerReviews = walkerProfile ? 
        await base44.entities.Review.filter({ walker_id: walkerProfile.id }) : [];
      const trainerReviews = trainerProfile ?
        await base44.entities.Review.filter({ trainer_id: trainerProfile.id }) : [];
      return [...walkerReviews, ...trainerReviews];
    },
    enabled: !!user && (!!walkerProfile || !!trainerProfile),
    initialData: [],
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

  const pendingBookings = allBookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
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
      label: `Earnings (${dateRange === '7days' ? '7d' : dateRange === '30days' ? '30d' : '90d'})`,
      color: "from-green-500 to-emerald-600",
      change: "+12.5%"
    },
    {
      icon: Calendar,
      value: pendingBookings.length,
      label: "Pending Bookings",
      color: "from-orange-500 to-yellow-600",
      badge: "Requires Action"
    },
    {
      icon: Star,
      value: averageRating,
      label: `Rating (${reviews.length} reviews)`,
      color: "from-yellow-500 to-orange-600",
    },
    {
      icon: CheckCircle,
      value: `${profileCompleteness}%`,
      label: "Profile Health",
      color: profileCompleteness === 100 ? "from-teal-500 to-teal-600" : "from-blue-500 to-indigo-600",
      badge: profileCompleteness < 100 ? "Improve" : "Perfect"
    }
  ];

  // Service form for walkers/trainers
  const ServiceForm = () => {
    const [formData, setFormData] = useState(editingService || {
      service_name: "",
      description: "",
      price: "",
      duration_options: ["30min", "1h", "2h"]
    });

    const handleSubmit = async () => {
      try {
        if (walkerProfile) {
          const services = walkerProfile.services_offered || [];
          const updated = editingService 
            ? services.map(s => s === editingService ? formData : s)
            : [...services, formData];
          
          await base44.entities.WalkerProfile.update(walkerProfile.id, {
            services_offered: updated
          });
        } else if (trainerProfile) {
          const services = trainerProfile.services_offered || [];
          const updated = editingService
            ? services.map(s => s === editingService ? formData : s)
            : [...services, formData];
          
          await base44.entities.TrainerProfile.update(trainerProfile.id, {
            services_offered: updated
          });
        }

        queryClient.invalidateQueries(['myWalkerProfile']);
        queryClient.invalidateQueries(['myTrainerProfile']);
        toast.success("Service updated successfully!");
        setShowServiceForm(false);
        setEditingService(null);
      } catch (error) {
        toast.error("Failed to update service");
      }
    };

    return (
      <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit' : 'Add'} Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service Name *</Label>
              <Input
                value={formData.service_name}
                onChange={(e) => setFormData({...formData, service_name: e.target.value})}
                placeholder="e.g., 30-minute Walk"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your service..."
                rows={3}
              />
            </div>
            <div>
              <Label>Price (€) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                placeholder="15.00"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowServiceForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700">
                Save Service
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
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Professional Profile Required
            </h2>
            <p className="text-gray-600 mb-6">
              Create your walker or trainer profile to access the dashboard.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate(createPageUrl('BecomeWalker'))} className="flex-1">
                Become Walker
              </Button>
              <Button onClick={() => navigate(createPageUrl('BecomeTrainer'))} className="flex-1">
                Become Trainer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <ErrorBoundary>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Professional Dashboard</h1>
              <p className="text-gray-600">{profile.walker_name || profile.trainer_name}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('StripeConnectSetup'))}
                className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Configure Payouts
              </Button>
              {/* Messages button removed as per request to use WhatsApp */}
              <Button onClick={() => navigate(createPageUrl('ManageAvailability'))}>
                <Calendar className="w-4 h-4 mr-2" />
                Manage Availability
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`bg-gradient-to-br ${stat.color} p-4 text-white`}>
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon className="w-8 h-8 opacity-80" />
                        {stat.badge && (
                          <Badge className="bg-white/20 text-white border-0">
                            {stat.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="text-3xl font-bold">{stat.value}</div>
                      <div className="text-sm opacity-90">{stat.label}</div>
                      {stat.change && (
                        <div className="flex items-center gap-1 text-xs mt-2 opacity-90">
                          <ArrowUp className="w-3 h-3" />
                          {stat.change} vs last period
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-lg rounded-xl p-2">
            <TabsTrigger value="overview" className="rounded-lg">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-lg">
              <Calendar className="w-4 h-4 mr-2" />
              Bookings ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-lg">
              <Package className="w-4 h-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-lg">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg">
              <Star className="w-4 h-4 mr-2" />
              Reviews
            </TabsTrigger>
          </TabsList>

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
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {allBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No bookings yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{booking.dog_name}</h3>
                            <Badge className={
                              booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{booking.owner_name} • {booking.owner_phone}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(booking.walk_date || booking.session_date), 'EEEE, MMMM d, yyyy', { locale: ptBR })} at {booking.walk_time || booking.session_time}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">€{booking.service_amount}</p>
                          
                          <div className="flex flex-col gap-2 mt-2">
                            {booking.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleBookingAction(booking, 'confirmed')}
                                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                  disabled={updateBookingStatusMutation.isPending}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleBookingAction(booking, 'cancelled')}
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50 border-red-200 flex-1"
                                  disabled={updateBookingStatusMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}

                            {booking.status === 'confirmed' && new Date(booking.walk_date || booking.session_date) <= new Date() && (
                               <Button
                                  size="sm"
                                  onClick={() => handleServiceCompleted(booking)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white w-full shadow-md"
                                  disabled={updateBookingStatusMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Confirmar Serviço Concluído
                                </Button>
                            )}

                            {booking.status === 'service_completed' && (
                               <Button
                                  size="sm"
                                  onClick={() => handlePaymentReceived(booking)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white w-full shadow-md animate-pulse"
                                  disabled={updateBookingStatusMutation.isPending}
                                >
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Confirmar Pagamento Recebido
                                </Button>
                            )}
                            
                            <Button
                              size="sm"
                              onClick={() => navigate(createPageUrl('Messages'))}
                              variant="outline"
                              className="w-full"
                            >
                              <MessageCircle className="w-3 h-3 mr-1" />
                              Contact
                            </Button>
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
            <Card className="border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Services</CardTitle>
                <Button onClick={() => setShowServiceForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(profile.services_offered || []).map((service, idx) => (
                    <Card key={idx} className="border-2 border-gray-200">
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg mb-2">{service.service_name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                        <p className="text-2xl font-bold text-green-600 mb-3">€{service.price}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingService(service);
                              setShowServiceForm(true);
                            }}
                            className="flex-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Availability Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <AvailabilityCalendar 
                    availabilityData={availability}
                    bookings={allBookings}
                    locale={ptBR}
                  />
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full mb-4" 
                    onClick={() => navigate(createPageUrl('ManageAvailability'))}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Manage Slots
                  </Button>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-gray-600">Upcoming</h4>
                    {allBookings
                      .filter(b => b.status === 'confirmed' && new Date(b.walk_date || b.session_date) >= new Date())
                      .slice(0, 5)
                      .map((booking) => (
                        <div key={booking.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="bg-green-100 p-2 rounded-full">
                            <Calendar className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{booking.dog_name}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(booking.walk_date || booking.session_date), 'MMM d')} • {booking.walk_time || booking.session_time}
                            </p>
                          </div>
                        </div>
                      ))
                    }
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