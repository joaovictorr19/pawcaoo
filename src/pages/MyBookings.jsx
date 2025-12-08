import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, DollarSign, MessageCircle, Filter, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { pt } from "date-fns/locale";
import { useCreateNotification } from "../components/NotificationService";
import BookingDetailsModal from "../components/booking/BookingDetailsModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import ReviewForm from "../components/reviews/ReviewForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AchievementModal from "../components/gamification/AchievementModal";

export default function MyBookings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createNotification = useCreateNotification();
  
  // Filters State
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all', // 'all', 'walk', 'training'
    dateStart: null,
    dateEnd: null
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  
  // Review State
  const [reviewTarget, setReviewTarget] = useState(null); // { booking, type: 'client' | 'professional' }
  const [isReviewProcessing, setIsReviewProcessing] = useState(false);
  
  // Reward Modal State
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState(null);

  // Buscar usuário atual
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Buscar Reviews dadas pelo usuário (para saber o que já foi avaliado)
  const { data: myGivenReviews = [] } = useQuery({
    queryKey: ['myGivenReviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewer_email: user?.email }),
    enabled: !!user?.email,
  });

  // 1. Buscar Bookings de Passeio (Owner)
  const { data: ownerWalks = [], isLoading: loadingOwnerWalks } = useQuery({
    queryKey: ['myWalks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Booking.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
    refetchInterval: 15000
  });

  // 2. Buscar Bookings de Passeio (Walker)
  const { data: walkerWalks = [], isLoading: loadingWalkerWalks } = useQuery({
    queryKey: ['walkerWalks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Booking.filter({ walker_email: user.email }, '-created_date');
    },
    enabled: !!user?.email,
    refetchInterval: 15000
  });

  // 3. Buscar Treinos (Owner)
  const { data: ownerTrainings = [], isLoading: loadingOwnerTrainings } = useQuery({
    queryKey: ['myTrainings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      if (!base44.entities.TrainingBooking) return [];
      return await base44.entities.TrainingBooking.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
    refetchInterval: 15000
  });

  // 4. Buscar Treinos (Trainer)
  const { data: trainerTrainings = [], isLoading: loadingTrainerTrainings } = useQuery({
    queryKey: ['trainerTrainings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      if (!base44.entities.TrainingBooking) return [];
      // Assuming 'trainer_email' exists on TrainingBooking, based on schema provided
      return await base44.entities.TrainingBooking.filter({ trainer_email: user.email }, '-created_date');
    },
    enabled: !!user?.email,
    refetchInterval: 15000
  });

  // Merge and Normalize Data
  const allBookings = useMemo(() => {
    const walks = [...ownerWalks, ...walkerWalks].map(b => ({ ...b, type: 'walk', date: b.walk_date, time: b.walk_time }));
    const trainings = [...ownerTrainings, ...trainerTrainings].map(t => ({ ...t, type: 'training', date: t.session_date, time: t.session_time }));
    
    // Remove duplicates if any (e.g. if I book myself, unlikely but possible)
    const uniqueMap = new Map();
    [...walks, ...trainings].forEach(item => uniqueMap.set(item.id, item));
    
    return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [ownerWalks, walkerWalks, ownerTrainings, trainerTrainings]);

  // Apply Filters
  const filteredBookings = useMemo(() => {
    return allBookings.filter(booking => {
      // Status Filter
      const statusMatch = filters.status === 'all' || booking.status === filters.status;
      
      // Type Filter
      const typeMatch = filters.type === 'all' || booking.type === filters.type;
      
      // Date Range Filter
      let dateMatch = true;
      if (filters.dateStart || filters.dateEnd) {
        const bookingDate = new Date(booking.date);
        const start = filters.dateStart ? startOfDay(filters.dateStart) : null;
        const end = filters.dateEnd ? endOfDay(filters.dateEnd) : null;
        
        if (start && end) {
          dateMatch = isWithinInterval(bookingDate, { start, end });
        } else if (start) {
          dateMatch = bookingDate >= start;
        } else if (end) {
          dateMatch = bookingDate <= end;
        }
      }
      
      return statusMatch && typeMatch && dateMatch;
    });
  }, [allBookings, filters]);

  // Apply Pagination
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, currentPage]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  // Mutation para cancelar booking (Unified)
  const cancelBookingMutation = useMutation({
    mutationFn: async ({ id, type }) => {
      const entity = type === 'walk' ? base44.entities.Booking : base44.entities.TrainingBooking;
      const booking = allBookings.find(b => b.id === id && b.type === type);
      
      if (!booking) throw new Error('Booking not found');

      // WORKFLOW: CANCELAMENTO (Remover do Calendário)
      const professionalEmail = type === 'walk' ? (booking.walker_email) : (booking.trainer_email);
      
      // Tentar liberar o slot se houver ID de evento ou booking_id associado
      try {
        const dateStr = format(new Date(booking.date), 'yyyy-MM-dd');
        const availRecords = await base44.entities.CalendarAvailability.filter({
          professional_email: professionalEmail,
          date: dateStr
        });

        if (availRecords.length > 0) {
          const availRecord = availRecords[0];
          const updatedSlots = availRecord.time_slots.map(slot => {
            if (slot.booking_id === id) {
              return { ...slot, is_available: true, booking_id: null };
            }
            return slot;
          });

          await base44.entities.CalendarAvailability.update(availRecord.id, {
            time_slots: updatedSlots,
            is_fully_booked: false
          });
        }
      } catch (err) {
        console.error("Erro ao liberar calendário no cancelamento:", err);
      }

      // Atualizar status
      await entity.update(id, { status: 'cancelled', calendar_event_id: null });

      // Atualizar pagamento se existir
      if (booking.payment_id) {
        await base44.entities.Payment.update(booking.payment_id, { status: 'refunded' });
      }

      // Notificar profissional
      const notifyEmail = type === 'walk' ? (booking.walker_email || booking.created_by) : (booking.trainer_email || booking.created_by);
      
      await createNotification.mutateAsync({
        recipient_email: notifyEmail,
        title: '❌ Reserva Cancelada',
        message: `A reserva de ${booking.dog_name} para ${format(new Date(booking.date), 'dd/MM/yyyy', { locale: pt })} foi cancelada pelo cliente.`,
        type: 'booking',
        related_id: id,
        priority: 'normal'
      });

      return id;
    },
    onSuccess: () => {
      toast.success('✅ Reserva cancelada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['myWalks'] });
      queryClient.invalidateQueries({ queryKey: ['walkerWalks'] });
      queryClient.invalidateQueries({ queryKey: ['myTrainings'] });
      queryClient.invalidateQueries({ queryKey: ['trainerTrainings'] });
      setBookingToCancel(null);
    },
    onError: () => {
      toast.error('❌ Erro ao cancelar reserva');
    }
  });

  // Helper to handle cancellation click
  const handleCancelClick = (booking) => {
    setBookingToCancel(booking);
  };

  // Review Handlers
  const handleReviewClick = (booking, type) => {
    setReviewTarget({ booking, type });
  };

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const isClientReview = reviewTarget.type === 'client';
      
      if (isClientReview) {
        // 1. Create Client Review
        await base44.entities.ClientReview.create(reviewData);
        
        // 2. Update User (Client) Stats
        // Fetch current target user to calculate new average
        // Note: We can't easily update OTHER users unless admin or via backend function.
        // IF RLS blocks this, we assume backend triggers handle it. 
        // Assuming we have permission or logic here:
        // Since we can't read private user data of others easily without admin, 
        // we might skip this step if RLS is strict, but let's try best effort or assume user entity is partially readable.
        // Actually, User entity RLS usually allows reading basic profile.
        // But updating another user is restricted.
        // Only admin can update other users. 
        // If we are a Professional, we likely cannot update the Client's User record directly.
        // SKIPPING User update for now to avoid errors, assume backend/admin handles aggregation.
        
      } else {
        // 1. Create Professional Review
        await base44.entities.Review.create(reviewData);
        
        // 2. Update Booking with Tip if present
        if (reviewData.tip_amount && reviewData.tip_amount > 0) {
          const bookingId = reviewData.booking_id || reviewData.training_booking_id;
          const entity = reviewData.training_booking_id ? base44.entities.TrainingBooking : base44.entities.Booking;
          
          // Fetch current booking to get total
          const currentBooking = await entity.get(bookingId);
          if (currentBooking) {
            await entity.update(bookingId, {
              tip_amount: reviewData.tip_amount,
              total_amount: (currentBooking.total_amount || 0) + reviewData.tip_amount
            });
            toast.success(`Tip of €${reviewData.tip_amount} added!`);
          }
        }

        // 3. Update Professional Profile Stats (Walker/Trainer)
        // We need to find the profile first.
        const isTrainer = !!reviewData.trainer_id;
        const profileEntity = isTrainer ? base44.entities.TrainerProfile : base44.entities.WalkerProfile;
        const profileId = isTrainer ? reviewData.trainer_id : reviewData.walker_id;
        
        // Fetch current profile to calculate
        const profile = await profileEntity.get(profileId);
        
        if (profile) {
          const currentRating = profile.rating || 5;
          const currentCount = isTrainer ? (profile.total_reviews || 0) : (profile.total_walks || 0); // Walker uses total_walks roughly or need new field
          
          // Simple moving average update
          // We'll assume count is 10 if 0 to give some weight to initial 5 star
          const count = currentCount || 1; 
          const newRating = ((currentRating * count) + reviewData.rating) / (count + 1);
          
          await profileEntity.update(profileId, {
            rating: parseFloat(newRating.toFixed(2)),
            // Increment counts if fields exist
            ...(isTrainer ? { total_clients: (profile.total_clients || 0) + 1 } : { total_walks: (profile.total_walks || 0) + 1 })
          });
        }
      }

      // --- GAMIFICATION: Award Points & XP to Reviewer ---
      try {
        const POINTS_FOR_REVIEW = 50;
        const XP_FOR_REVIEW = 50; // Ajustado conforme pedido (50 XP)
        const reviewerEmail = user?.email;

        if (reviewerEmail) {
          // 1. Get or Create LoyaltyPoints record
          let lpRecords = await base44.entities.LoyaltyPoints.filter({ user_email: reviewerEmail });
          let lp = lpRecords[0];
          
          if (!lp) {
            lp = await base44.entities.LoyaltyPoints.create({
              user_email: reviewerEmail,
              points_balance: 0,
              total_earned: 0
            });
          }

          // 2. Add Transaction
          await base44.entities.PointsTransaction.create({
            user_email: reviewerEmail,
            transaction_type: 'earned',
            points_amount: POINTS_FOR_REVIEW,
            description: 'Review Submitted',
            balance_after: (lp.points_balance || 0) + POINTS_FOR_REVIEW
          });

          // 3. Update Loyalty Balance
          await base44.entities.LoyaltyPoints.update(lp.id, {
            points_balance: (lp.points_balance || 0) + POINTS_FOR_REVIEW,
            total_earned: (lp.total_earned || 0) + POINTS_FOR_REVIEW
          });

          // 4. Update UserProfile (XP & Level)
          let profiles = await base44.entities.UserProfile.filter({ user_email: reviewerEmail });
          let profile = profiles[0];

          if (profile) {
            const newXP = (profile.gamification_xp || 0) + XP_FOR_REVIEW;
            // Simple Level Formula: Level = 1 + floor(XP / 1000)
            const newLevel = 1 + Math.floor(newXP / 1000);

            await base44.entities.UserProfile.update(profile.id, {
              gamification_xp: newXP,
              gamification_level: newLevel,
              last_activity_date: new Date().toISOString().split('T')[0]
            });
            
            // toast.success(`🎉 +${POINTS_FOR_REVIEW} Points & +${XP_FOR_REVIEW} XP Earned!`);
          }
        }
      } catch (gameErr) {
        console.error("Gamification Error:", gameErr);
        // Don't block the review flow if gamification fails
      }
    },
    onSuccess: () => {
      // toast.success("Review submitted successfully!");
      setReviewTarget(null);
      
      // Trigger Reward Modal
      setRewardData({
        name: "Feedback Valioso!",
        description: "Obrigado por ajudar a comunidade com a sua avaliação.",
        xp: 50,
        icon: "⭐",
        image: null // Use default icon
      });
      setShowRewardModal(true);

      // Invalidate queries to refresh UI if needed
      queryClient.invalidateQueries({ queryKey: ['loyaltyPoints'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to submit review. Please try again.");
    }
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'Em Andamento', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const BookingCard = ({ booking }) => {
    const isProfessional = booking.type === 'walk' 
      ? booking.walker_email === user?.email 
      : booking.trainer_email === user?.email;

    const professionalName = booking.type === 'walk' ? booking.walker_name : booking.trainer_name;
    
    // Check if already reviewed
    const hasReview = myGivenReviews.some(r => r.booking_id === booking.id || r.training_booking_id === booking.id);

    return (
      <Card className="border hover:shadow-md transition-shadow overflow-hidden">
        <div className={`h-2 w-full ${booking.type === 'walk' ? 'bg-green-500' : 'bg-indigo-500'}`} />
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${booking.type === 'walk' ? 'border-green-200 bg-green-50 text-green-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
                 {booking.type === 'walk' ? '🐕 Passeio' : '🎓 Treino'}
              </Badge>
              <span className="text-xs text-gray-400">ID: {booking.id.slice(-4)}</span>
            </div>
            {getStatusBadge(booking.status)}
          </div>
          <CardTitle className="text-lg mt-2 flex items-center gap-2">
            {booking.dog_name}
          </CardTitle>
          <p className="text-sm text-gray-500">
            {isProfessional 
              ? `Cliente: ${booking.owner_name}` 
              : `Profissional: ${professionalName}`
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
             <div className="flex items-center gap-2 text-gray-600">
               <Calendar className="w-4 h-4" />
               {booking.date ? format(new Date(booking.date), 'dd MMM', { locale: pt }) : 'N/A'}
             </div>
             <div className="flex items-center gap-2 text-gray-600">
               <Clock className="w-4 h-4" />
               {booking.time} ({booking.duration_hours}h)
             </div>
             <div className="flex items-center gap-2 font-semibold text-gray-900">
               <DollarSign className="w-4 h-4 text-green-600" />
               €{booking.total_amount}
             </div>
          </div>

          {/* Botão de Avaliação para Cliente */}
          {booking.status === 'completed' && !isProfessional && !hasReview && (
            <Button 
              className="w-full mt-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-md"
              onClick={() => handleReviewClick(booking, 'professional')}
            >
              <Star className="w-4 h-4 mr-2 fill-white" />
              Avaliar Profissional
            </Button>
          )}

          {booking.status === 'confirmed' && !isProfessional && booking.walker_payment_contact && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
              <p className="text-xs font-bold text-green-800 mb-1">Pagamento (MBWay):</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700 font-mono">{booking.walker_payment_contact}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 px-2 text-green-700 hover:bg-green-100"
                  onClick={() => {
                    navigator.clipboard.writeText(booking.walker_payment_contact);
                    toast.success("Número copiado!");
                  }}
                >
                  Copiar
                </Button>
              </div>
              <p className="text-[10px] text-green-600 mt-1">Envie o comprovativo pelo chat.</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                setSelectedBooking(booking);
                setIsDetailsModalOpen(true);
              }}
            >
              Detalhes
            </Button>
            
            {['pending', 'confirmed'].includes(booking.status) && !isProfessional && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="flex-1"
                onClick={() => handleCancelClick(booking)}
              >
                 Cancelar
              </Button>
            )}
             
            {/* Contact button removed - Use WhatsApp via Walker Profile */}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loadingUser || loadingOwnerWalks || loadingWalkerWalks || loadingOwnerTrainings || loadingTrainerTrainings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex gap-4 mb-8">
             <Skeleton className="h-10 w-32" />
             <Skeleton className="h-10 w-32" />
             <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
             {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Reservas</h1>
            <p className="text-gray-600">Gerencie seus passeios e treinos em um só lugar</p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
             <Button onClick={() => navigate(createPageUrl('Home'))} className="bg-green-600 hover:bg-green-700">
               + Novo Passeio
             </Button>
             <Button onClick={() => navigate(createPageUrl('Trainers'))} className="bg-indigo-600 hover:bg-indigo-700">
               + Novo Treino
             </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <Card className="mb-8 border-none shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(v) => { setFilters({...filters, status: v}); setCurrentPage(1); }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tipo de Serviço</label>
                  <Select 
                    value={filters.type} 
                    onValueChange={(v) => { setFilters({...filters, type: v}); setCurrentPage(1); }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="walk">🐕 Passeios</SelectItem>
                      <SelectItem value="training">🎓 Treinos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Data (Início)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {filters.dateStart ? format(filters.dateStart, 'dd/MM/yyyy') : <span>Selecione data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateStart}
                        onSelect={(date) => { setFilters({...filters, dateStart: date}); setCurrentPage(1); }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Data (Fim)</label>
                  <Popover>
                     <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {filters.dateEnd ? format(filters.dateEnd, 'dd/MM/yyyy') : <span>Selecione data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateEnd}
                        onSelect={(date) => { setFilters({...filters, dateEnd: date}); setCurrentPage(1); }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
             </div>

             {/* Active Filters Badges / Clear */}
             {(filters.status !== 'all' || filters.type !== 'all' || filters.dateStart || filters.dateEnd) && (
               <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Filtros ativos:</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 h-6 text-xs hover:bg-red-50"
                    onClick={() => setFilters({ status: 'all', type: 'all', dateStart: null, dateEnd: null })}
                  >
                    Limpar Filtros
                  </Button>
               </div>
             )}
          </CardContent>
        </Card>

        {/* Bookings Grid */}
        {paginatedBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
             <div className="mx-auto bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-xl font-semibold text-gray-900">Nenhuma reserva encontrada</h3>
             <p className="text-gray-500 max-w-md mx-auto mt-2">
               Tente ajustar os filtros ou crie uma nova reserva para começar.
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBookings.map((booking) => (
              <BookingCard key={`${booking.type}-${booking.id}`} booking={booking} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
             <Button
               variant="outline"
               size="icon"
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
               disabled={currentPage === 1}
             >
               <ChevronLeft className="w-4 h-4" />
             </Button>
             <span className="text-sm font-medium">
               Página {currentPage} de {totalPages}
             </span>
             <Button
               variant="outline"
               size="icon"
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
               disabled={currentPage === totalPages}
             >
               <ChevronRight className="w-4 h-4" />
             </Button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <BookingDetailsModal 
        booking={selectedBooking}
        type={selectedBooking?.type}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        currentUser={user}
        onReview={handleReviewClick}
      />

      {/* Review Dialog */}
      <Dialog open={!!reviewTarget} onOpenChange={(open) => !open && setReviewTarget(null)}>
        <DialogContent className="p-0 max-w-lg border-0 bg-transparent shadow-none">
          {reviewTarget && (
            <ReviewForm
              booking={{...reviewTarget.booking, isClientReview: reviewTarget.type === 'client'}}
              onSubmit={(data) => submitReviewMutation.mutate(data)}
              onCancel={() => setReviewTarget(null)}
              isProcessing={submitReviewMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reward Modal */}
      <AchievementModal 
        isOpen={showRewardModal} 
        onClose={() => setShowRewardModal(false)} 
        badgeData={rewardData} 
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!bookingToCancel} onOpenChange={(open) => !open && setBookingToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a reserva de <strong>{bookingToCancel?.dog_name}</strong>?
              <br/><br/>
              O profissional será notificado imediatamente e o reembolso será processado conforme a política de cancelamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => cancelBookingMutation.mutate({ id: bookingToCancel.id, type: bookingToCancel.type })}
            >
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}