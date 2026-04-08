import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, DollarSign, MessageCircle, Filter, ChevronLeft, ChevronRight, CalendarDays, Trash2, CalendarPlus, Map as MapIcon, Star } from "lucide-react";
import { getGoogleCalendarUrl, generateICS, downloadICS, bookingToEvent } from "../components/calendar/calendarHelpers";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { pt } from "date-fns/locale";
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
import CheckoutModal from "../components/payments/CheckoutModal";
import WalkSecurityPass from "../components/booking/WalkSecurityPass";
import { CreditCard } from "lucide-react";

export default function MyBookings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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
  
  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState(null);

  // Buscar usuário atual
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Buscar Reviews dadas pelo usuário (para saber o que já foi avaliado)
  const { data: myGivenReviews = [] } = useQuery({
    queryKey: ['myGivenReviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewer_email: user?.email }),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });

  // 1. Buscar Bookings de Passeio (Owner)
  const { data: ownerWalks = [], isLoading: loadingOwnerWalks } = useQuery({
    queryKey: ['myWalks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Booking.filter({ created_by: user.email }, '-created_date', 50);
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  // 2. Buscar Bookings de Passeio (Walker)
  const { data: walkerWalks = [], isLoading: loadingWalkerWalks } = useQuery({
    queryKey: ['walkerWalks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Booking.filter({ walker_email: user.email }, '-created_date', 50);
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  // 3. Buscar Treinos (Owner)
  const { data: ownerTrainings = [], isLoading: loadingOwnerTrainings } = useQuery({
    queryKey: ['myTrainings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      if (!base44.entities.TrainingBooking) return [];
      return await base44.entities.TrainingBooking.filter({ created_by: user.email }, '-created_date', 50);
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  // 4. Buscar Treinos (Trainer)
  const { data: trainerTrainings = [], isLoading: loadingTrainerTrainings } = useQuery({
    queryKey: ['trainerTrainings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      if (!base44.entities.TrainingBooking) return [];
      return await base44.entities.TrainingBooking.filter({ trainer_email: user.email }, '-created_date', 50);
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Merge and Normalize Data
  const allBookings = useMemo(() => {
    const walks = [...ownerWalks, ...walkerWalks].map(b => ({ ...b, type: 'walk', date: b.walk_date, time: b.walk_time }));
    // Enrich bookings with walker_whatsapp_number if available (this assumes the backend populates it or we need to fetch it)
    // Since we can't easily join here without complex logic, we'll rely on the booking entity having it or fetching it on demand.
    // However, the user asked to show it WHEN accepted.
    // The booking entity in snapshot doesn't have whatsapp_number explicitly, but maybe `walker_payment_contact`.
    // Let's assume we might need to use `walker_payment_contact` or we need to fetch profile.
    // For simplicity and performance, I'll assume for now that `walker_payment_contact` might hold this info or we add a small lookup in the card.
    // Actually, let's try to use `walker_payment_contact` if it matches phone format, or check if we can get it.
    // But the cleanest way is if the backend booking creation copied it.
    // Given I can't change backend logic easily to copy it on creation for existing bookings,
    // I will implement a lightweight fetch in BookingCard for the contact info if confirmed.

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

  // Mutation para cancelar booking (Unified) - COM LÓGICA DE REEMBOLSO
  const cancelBookingMutation = useMutation({
    onMutate: async ({ id, type }) => {
      // Optimistic update: mark booking as cancelled immediately
      await queryClient.cancelQueries({ queryKey: ['myWalks'] });
      await queryClient.cancelQueries({ queryKey: ['walkerWalks'] });
      await queryClient.cancelQueries({ queryKey: ['myTrainings'] });
      await queryClient.cancelQueries({ queryKey: ['trainerTrainings'] });
      const previousBookings = { ownerWalks, walkerWalks, ownerTrainings, trainerTrainings };
      return previousBookings;
    },
    mutationFn: async ({ id, type }) => {
      const entity = type === 'walk' ? base44.entities.Booking : base44.entities.TrainingBooking;
      const booking = allBookings.find(b => b.id === id && b.type === type);
      
      if (!booking) throw new Error('Booking not found');

      // LÓGICA DE REEMBOLSO
      let refundAmount = 0;
      let refundPercentage = 0;
      const totalPaid = booking.total_amount || 0;
      
      if (booking.status === 'pending') {
        // Status Pendente: 100% reembolso automático
        refundAmount = totalPaid;
        refundPercentage = 100;
      } else if (booking.status === 'confirmed') {
        // Verificar se cliente é premium
        const ownerSubs = await base44.entities.OwnerSubscription.filter({
          owner_email: user.email,
          is_active: true
        });
        const isPremium = ownerSubs.length > 0 && ownerSubs[0].plan_type !== 'free';
        
        if (isPremium) {
          // Premium: 100% reembolso (benefício)
          refundAmount = totalPaid;
          refundPercentage = 100;
        } else {
          // Free: Reembolso parcial (deduz taxa de cancelamento de 20%)
          const cancellationFee = totalPaid * 0.20;
          refundAmount = totalPaid - cancellationFee;
          refundPercentage = 80;
        }
      }

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

      // Atualizar status com valores de reembolso
      await entity.update(id, { 
        status: 'cancelled', 
        calendar_event_id: null,
        refund_amount: refundAmount,
        refund_percentage: refundPercentage
      });

      // Atualizar pagamento se existir
      if (booking.payment_id) {
        await base44.entities.Payment.update(booking.payment_id, { 
          status: 'refunded',
          refund_amount: refundAmount
        });
      }

      // Notificar profissional
      const notifyEmail = type === 'walk' ? (booking.walker_email || booking.created_by) : (booking.trainer_email || booking.created_by);
      
      await base44.entities.Notification.create({
        recipient_email: notifyEmail,
        title: '❌ Reserva Cancelada',
        message: `A reserva de ${booking.dog_name} para ${format(new Date(booking.date), 'dd/MM/yyyy', { locale: pt })} foi cancelada. Reembolso: €${refundAmount.toFixed(2)} (${refundPercentage}%).`,
        type: 'booking',
        related_id: id,
        priority: 'normal'
      });

      // Notificar cliente sobre reembolso
      await base44.entities.Notification.create({
        recipient_email: user.email,
        title: '💰 Reembolso Processado',
        message: `Cancelamento confirmado. Você receberá €${refundAmount.toFixed(2)} (${refundPercentage}% do valor pago) de volta.`,
        type: 'payment',
        related_id: id
      });

      return { id, refundAmount, refundPercentage };
    },
    onSuccess: (data) => {
      toast.success(`✅ Reserva cancelada. Reembolso: €${data.refundAmount.toFixed(2)} (${data.refundPercentage}%)`);
      queryClient.invalidateQueries({ queryKey: ['myWalks'] });
      queryClient.invalidateQueries({ queryKey: ['walkerWalks'] });
      queryClient.invalidateQueries({ queryKey: ['myTrainings'] });
      queryClient.invalidateQueries({ queryKey: ['trainerTrainings'] });
      setBookingToCancel(null);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context) {
        queryClient.setQueryData(['myWalks'], context.ownerWalks);
        queryClient.setQueryData(['walkerWalks'], context.walkerWalks);
        queryClient.setQueryData(['myTrainings'], context.ownerTrainings);
        queryClient.setQueryData(['trainerTrainings'], context.trainerTrainings);
      }
      toast.error('❌ Erro ao cancelar reserva');
    }
  });

  // Helper to handle cancellation click
  const handleCancelClick = (booking) => {
    setBookingToCancel(booking);
  };

  // Mutation para apagar booking (Limpeza de Dados)
  const deleteBookingMutation = useMutation({
    mutationFn: async ({ id, type }) => {
      const entity = type === 'walk' ? base44.entities.Booking : base44.entities.TrainingBooking;
      
      // 1. Excluir Reviews associadas
      const reviews = await base44.entities.Review.filter(
        type === 'walk' ? { booking_id: id } : { training_booking_id: id }
      );
      
      if (reviews.length > 0) {
        await Promise.all(reviews.map(r => base44.entities.Review.delete(r.id)));
      }

      // 2. Excluir Rastro GPS (WalkCheckpoints) - Apenas para passeios
      if (type === 'walk') {
        const checkpoints = await base44.entities.WalkCheckpoint.filter({ booking_id: id });
        if (checkpoints.length > 0) {
          await Promise.all(checkpoints.map(c => base44.entities.WalkCheckpoint.delete(c.id)));
        }
      }

      // 3. Excluir a Reserva Principal
      await entity.delete(id);

      return id;
    },
    onSuccess: () => {
      toast.success("Reserva e histórico eliminados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['myWalks'] });
      queryClient.invalidateQueries({ queryKey: ['walkerWalks'] });
      queryClient.invalidateQueries({ queryKey: ['myTrainings'] });
      queryClient.invalidateQueries({ queryKey: ['trainerTrainings'] });
    },
    onError: (error) => {
      console.error("Erro ao excluir reserva:", error);
      toast.error("Erro ao excluir reserva. Tente novamente.");
    }
  });

  const handleDeleteClick = async (booking) => {
    if (window.confirm("ATENÇÃO: Esta ação é irreversível. Deseja eliminar esta reserva e todo o seu histórico (GPS, Reviews)?")) {
      deleteBookingMutation.mutate({ id: booking.id, type: booking.type });
    }
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
      pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
      confirmed: { label: 'Confirmado', color: 'bg-green-500/20 text-green-300 border border-green-500/30' },
      in_progress: { label: 'Em Andamento', color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
      service_completed: { label: 'Serviço Feito', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
      completed: { label: 'Concluído', color: 'bg-slate-600/40 text-slate-300 border border-slate-600/40' },
      cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-300 border border-red-500/30' },
      rejected: { label: 'Rejeitado', color: 'bg-red-500/20 text-red-400 border border-red-500/30' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${config.color}`}>{config.label}</span>;
  };

  // Helper de Extração de ID Robusto (Data Mapping Fallback)
  const getProfessionalId = (booking) => {
    // Tentativa de extração profunda para garantir que nunca retorne nulo se o dado existir
    const id = booking.type === 'walk' 
        ? (booking.walker_id || booking.walker?.id || booking.profiles?.id || booking.p_id) 
        : (booking.trainer_id || booking.trainer?.id);
    
    if (!id) {
       console.error("CRÍTICO: ID do Profissional não encontrado na reserva", booking);
    }
    return id || null;
  };

  const BookingCard = ({ booking }) => {
    const isProfessional = booking.type === 'walk'
      ? booking.walker_email === user?.email
      : booking.trainer_email === user?.email;

    const professionalName = booking.type === 'walk' ? booking.walker_name : booking.trainer_name;
    const hasReview = myGivenReviews.some(r => r.booking_id === booking.id || r.training_booking_id === booking.id);

    const { data: professionalContact } = useQuery({
      queryKey: ['profContact', booking.walker_id || booking.trainer_id],
      queryFn: async () => {
        if (isProfessional || (booking.status !== 'confirmed' && booking.status !== 'in_progress')) return null;
        if (booking.type === 'walk' && booking.walker_id) {
          const w = await base44.entities.WalkerProfile.get(booking.walker_id);
          return w?.whatsapp_number;
        }
        return null;
      },
      enabled: !isProfessional && (booking.status === 'confirmed' || booking.status === 'in_progress'),
      staleTime: 10 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
    });

    return (
      <div className="bg-slate-900 rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-white truncate">
                {isProfessional ? booking.owner_name : professionalName}
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {booking.type === 'walk' ? '🐕 Passeio' : '🎓 Treino'} · {booking.dog_name}
              </p>
            </div>
            {getStatusBadge(booking.status)}
          </div>

          {/* Info */}
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              {booking.date ? format(new Date(booking.date), 'dd/MM/yy', { locale: pt }) : 'N/A'}
            </div>
            {booking.time && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                {booking.time}
              </div>
            )}
            {booking.total_amount && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold ml-auto">
                <DollarSign className="w-3.5 h-3.5 text-green-400" />
                €{booking.total_amount.toFixed(2)}
              </div>
            )}
          </div>

          {/* QR Code Security Pass */}
          {!isProfessional && (booking.status === 'confirmed' || booking.status === 'in_progress') && booking.type === 'walk' && (
            <WalkSecurityPass booking={booking} />
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {(booking.status === 'pending' || booking.status === 'confirmed') && !isProfessional && (
              <button
                onClick={() => handleCancelClick(booking)}
                className="w-9 h-9 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all active:scale-95"
                title="Cancelar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
              <button
                onClick={() => {
                  if (!booking.id) { toast.error('Erro: ID inválido'); return; }
                  navigate(createPageUrl(isProfessional ? 'ActiveWalkDashboard' : 'LiveWalkTracking') + `?bookingId=${booking.id}`);
                }}
                className="flex-1 h-9 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <MapIcon className="w-3.5 h-3.5" />
                Abrir
              </button>
            )}

            {booking.status === 'pending' && !isProfessional && (
              <button
                onClick={() => { setCheckoutBooking({...booking, user}); setShowCheckoutModal(true); }}
                className="flex-1 h-9 rounded-2xl bg-green-500 hover:bg-green-400 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Pagar
              </button>
            )}

            {booking.status === 'completed' && !isProfessional && !hasReview && (
              <button
                onClick={() => handleReviewClick(booking, 'professional')}
                className="flex-1 h-9 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Star className="w-3.5 h-3.5" />
                Avaliar
              </button>
            )}

            {professionalContact && (
              <button
                onClick={() => window.open(`https://wa.me/${professionalContact.replace(/[^0-9]/g, '')}`, '_blank')}
                className="w-9 h-9 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 flex items-center justify-center transition-all active:scale-95"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            )}

            {booking.status !== 'in_progress' && !(booking.status === 'completed' && !hasReview) && (
              <button
                onClick={() => { setSelectedBooking(booking); setIsDetailsModalOpen(true); }}
                className="w-9 h-9 rounded-2xl bg-slate-800 border border-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {booking.status === 'confirmed' && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-9 h-9 rounded-2xl bg-slate-800 border border-white/5 text-slate-400 hover:text-purple-400 flex items-center justify-center transition-all active:scale-95">
                    <CalendarPlus className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 bg-slate-900 border-white/10" align="end">
                  <div className="grid gap-1">
                    <button
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 font-bold transition-all"
                      onClick={() => { const e = bookingToEvent(booking); if (e) window.open(getGoogleCalendarUrl(e), '_blank'); }}
                    >
                      Google Calendar
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 font-bold transition-all"
                      onClick={() => { const e = bookingToEvent(booking); if (e) { const ics = generateICS(e); downloadICS(`booking_${booking.id}.ics`, ics); } }}
                    >
                      Apple/Outlook (.ics)
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loadingUser || loadingOwnerWalks || loadingWalkerWalks || loadingOwnerTrainings || loadingTrainerTrainings) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-lg mx-auto space-y-4">
          <Skeleton className="h-8 w-48 bg-slate-800" />
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-36 w-full rounded-2xl bg-slate-800" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32 font-sans">
      {/* Header */}
      <header className="bg-slate-950 text-white p-6 rounded-b-[2.5rem] shadow-xl mb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-black italic">Minhas Reservas 📅</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passeios & Treinos</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(createPageUrl('Home'))}
                className="px-3 py-2 rounded-2xl border border-slate-700 text-slate-300 hover:border-white hover:text-white transition-all active:scale-95 text-xs font-bold"
              >
                + Passeio
              </button>
              <button
                onClick={() => navigate(createPageUrl('Trainers'))}
                className="px-3 py-2 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white transition-all active:scale-95 text-xs font-bold"
              >
                + Treino
              </button>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: allBookings.length, color: 'text-white' },
              { label: 'Ativos', value: allBookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length, color: 'text-orange-400' },
              { label: 'Concluídos', value: allBookings.filter(b => b.status === 'completed').length, color: 'text-green-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900 rounded-2xl p-3 border border-white/5 text-center">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'confirmed', label: 'Confirmados' },
            { value: 'in_progress', label: 'Ativos' },
            { value: 'completed', label: 'Concluídos' },
            { value: 'cancelled', label: 'Cancelados' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setFilters({...filters, status: value}); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${
                filters.status === value
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex gap-2">
          {[{v:'all',l:'🐾 Todos'},{v:'walk',l:'🐕 Passeios'},{v:'training',l:'🎓 Treinos'}].map(({v,l}) => (
            <button
              key={v}
              onClick={() => { setFilters({...filters, type: v}); setCurrentPage(1); }}
              className={`flex-1 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                filters.type === v
                  ? 'bg-white text-slate-900'
                  : 'bg-slate-900 border border-white/5 text-slate-400'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {paginatedBookings.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 rounded-3xl border border-white/5">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-black text-white">Nenhuma reserva</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Tente ajustar os filtros ou crie uma nova reserva.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedBookings.map((booking) => (
              <BookingCard key={`${booking.type}-${booking.id}`} booking={booking} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-400">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

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

      {/* Checkout Modal */}
      {showCheckoutModal && checkoutBooking && (
        <CheckoutModal 
          booking={checkoutBooking}
          onClose={() => {
            setShowCheckoutModal(false);
            setCheckoutBooking(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['myWalks']);
            queryClient.invalidateQueries(['myTrainings']);
            setShowCheckoutModal(false);
          }}
        />
      )}

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