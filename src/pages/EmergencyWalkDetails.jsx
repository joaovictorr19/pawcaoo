import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Clock, DollarSign, Phone, AlertCircle, Zap, User, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function EmergencyWalkDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAccepting, setIsAccepting] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const walkId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: walks, isLoading } = useQuery({
    queryKey: ['emergencyWalks'],
    queryFn: () => base44.entities.EmergencyWalk.list(),
    initialData: [],
  });

  const walk = walks.find(w => w.id === walkId);

  const acceptWalkMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // 1. Update emergency walk status
      await base44.entities.EmergencyWalk.update(id, data);
      
      // 2. Create booking record
      const booking = await base44.entities.Booking.create({
        walker_email: user.email,
        walker_name: user.full_name || user.email,
        owner_name: walk.owner_name,
        owner_email: walk.created_by,
        owner_phone: walk.owner_phone,
        dog_name: walk.dog_name,
        dog_size: walk.dog_size,
        walk_date: new Date().toISOString().split('T')[0],
        walk_time: walk.needed_time,
        duration_hours: walk.duration_hours || 1,
        pickup_address: walk.location,
        service_amount: walk.service_amount || walk.offered_amount,
        platform_fee: walk.platform_fee || 0,
        total_amount: walk.offered_amount,
        status: 'confirmed',
        payment_status: walk.payment_status || 'pending',
        special_notes: walk.special_notes,
        type: 'walk'
      });
      
      // 3. Create payment record if needed
      if (!walk.payment_id) {
        await base44.entities.Payment.create({
          booking_id: booking.id,
          emergency_walk_id: id,
          payer_email: walk.created_by,
          payer_name: walk.owner_name,
          recipient_email: user.email,
          recipient_name: user.full_name || user.email,
          service_amount: walk.service_amount || walk.offered_amount,
          platform_fee: walk.platform_fee || 0,
          total_amount: walk.offered_amount,
          status: walk.payment_status || 'pending',
          payment_method: 'stripe'
        });
      }
      
      // 4. Notify owner
      await base44.entities.Notification.create({
        recipient_email: walk.created_by,
        title: '✅ Dog Walker Encontrado!',
        message: `${user.full_name || user.email} aceitou o passeio de emergência de ${walk.dog_name}. Entre em contacto: ${user.email}`,
        type: 'emergency',
        related_id: booking.id,
        priority: 'urgent',
        action_url: `/MyBookings?id=${booking.id}`
      });

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyWalks'] });
      queryClient.invalidateQueries({ queryKey: ['activeBookings'] });
      toast.success("Passeio aceite! A reserva foi criada em 'Minhas Reservas'");
      navigate(createPageUrl('MyBookings'));
    },
  });

  const deleteWalkMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.EmergencyWalk.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyWalks'] });
      toast.success("Emergency walk deleted successfully.");
      navigate(createPageUrl('Home'));
    },
  });

  const handleAcceptWalk = async () => {
    if (isAccepting || acceptWalkMutation.isPending) {
      console.log('⚠️ Already accepting, blocking duplicate');
      return;
    }
    
    if (!user) {
      toast.error('Precisa fazer login para aceitar');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    
    setIsAccepting(true);
    
    try {
      await acceptWalkMutation.mutateAsync({
        id: walk.id,
        data: {
          status: 'accepted',
          accepted_by_walker: user.email,
          walker_name: user.full_name || user.email
        }
      });
    } catch (error) {
      console.error('❌ Error accepting walk:', error);
      toast.error('Erro ao aceitar passeio: ' + error.message);
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-96 w-full rounded-3xl mb-6" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!walk) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Walk not found</h2>
          <Button onClick={() => navigate(createPageUrl('Home'))}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (walk.status !== 'available') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">This walk has already been accepted</h2>
          <Button onClick={() => navigate(createPageUrl('Home'))}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const getSizeLabel = (size) => {
    const labels = {
      small: "Small Dog",
      medium: "Medium Dog",
      large: "Large Dog",
      extra_large: "Extra Large Dog"
    };
    return labels[size] || size;
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      urgent: "bg-yellow-100 text-yellow-800 border-yellow-300",
      very_urgent: "bg-orange-100 text-orange-800 border-orange-300",
      immediate: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[urgency] || colors.urgent;
  };

  const getUrgencyLabel = (urgency) => {
    const labels = {
      urgent: "Urgent",
      very_urgent: "Very Urgent",
      immediate: "IMMEDIATE"
    };
    return labels[urgency] || "Urgent";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50">
      <div className="max-w-5xl mx-auto p-6">
        <Button
          variant="outline"
          className="mb-6 border-orange-200 hover:bg-orange-50"
          onClick={() => navigate(createPageUrl('Home'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Emergency Walks
        </Button>

        {/* Dog Profile Header */}
        <Card className="overflow-hidden border-2 border-orange-300 shadow-2xl mb-6">
          <div className="relative h-96 bg-gradient-to-br from-orange-100 to-yellow-100">
            {walk.dog_photo_url ? (
              <img
                src={walk.dog_photo_url}
                alt={walk.dog_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center">
                  <span className="text-6xl font-bold text-orange-600">
                    {walk.dog_name?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute top-6 right-6 flex flex-col gap-3">
              <Badge className={`${getUrgencyColor(walk.urgency_level)} border-2 text-lg px-4 py-2 shadow-lg`}>
                <Zap className="w-5 h-5 mr-2" />
                {getUrgencyLabel(walk.urgency_level)}
              </Badge>
              <Badge className="bg-green-500 text-white border-0 shadow-lg text-2xl px-6 py-3">
                <DollarSign className="w-6 h-6 mr-1" />
                ${walk.offered_amount}
              </Badge>
            </div>
          </div>

          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {walk.dog_name}
                </h1>
                <div className="flex items-center text-gray-600 text-lg mb-2">
                  <MapPin className="w-5 h-5 mr-2" />
                  {walk.location}
                </div>
                {walk.dog_breed && (
                  <p className="text-xl text-gray-700">
                    {walk.dog_breed} • {getSizeLabel(walk.dog_size)}
                  </p>
                )}
              </div>
            </div>

            {/* Urgent Time Info */}
            <div className="bg-orange-100 border-2 border-orange-300 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Walk Needed</div>
                  <div className="text-2xl font-bold text-gray-900">{walk.needed_time}</div>
                  <div className="text-lg text-gray-700">Duration: {walk.duration_hours} hour{walk.duration_hours > 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>

            {/* Owner Contact Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Owner</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {walk.owner_name}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Contact</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {walk.owner_phone}
                  </div>
                </div>
              </div>
            </div>

            {walk.special_notes && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Important Notes</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {walk.special_notes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-3">
              <Button 
                className="flex-1 md:flex-none bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg h-16 px-12 text-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAcceptWalk}
                disabled={isAccepting || acceptWalkMutation.isPending || !user}
                type="button"
              >
                {isAccepting || acceptWalkMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Aceitando...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 mr-3" />
                    Aceitar Passeio de Emergência
                  </>
                )}
              </Button>

              {(user?.role === 'admin' || walk.created_by === user?.email) && (
                <Button 
                  variant="destructive"
                  className="h-16 px-8 text-lg font-semibold"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja apagar este pedido de emergência?')) {
                      deleteWalkMutation.mutate(walk.id);
                    }
                  }}
                  disabled={deleteWalkMutation.isPending}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  {deleteWalkMutation.isPending ? 'Apagando...' : 'Apagar'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}