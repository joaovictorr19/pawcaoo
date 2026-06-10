import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Users,
  BookOpen,
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminUnifiedDashboard() {
  const queryClient = useQueryClient();
  const [searchBooking, setSearchBooking] = useState("");
  const [searchProfessional, setSearchProfessional] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Fetch todas as reservas
  const { data: allBookings = [] } = useQuery({
    queryKey: ["adminAllBookings"],
    queryFn: async () => {
      const walks = await base44.entities.Booking.list("-created_date", 500);
      const hotels = await base44.entities.HotelBooking.list("-created_date", 500);
      const trainings = await base44.entities.TrainingBooking.list("-created_date", 500);
      return [
        ...(walks || []).map(b => ({ ...b, type: "walk" })),
        ...(hotels || []).map(b => ({ ...b, type: "hotel" })),
        ...(trainings || []).map(b => ({ ...b, type: "training" }))
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    staleTime: 10000,
  });

  // Fetch hotel bookings para agenda
  const { data: hotelBookings = [] } = useQuery({
    queryKey: ["adminHotelBookings"],
    queryFn: () => base44.entities.HotelBooking.list("-checkin_date", 200),
    staleTime: 10000,
  });

  // Fetch profissionais
  const { data: walkers = [] } = useQuery({
    queryKey: ["adminWalkersUnified"],
    queryFn: () => base44.entities.WalkerProfile.list("-created_date", 500),
    staleTime: 15000,
  });

  const { data: trainers = [] } = useQuery({
    queryKey: ["adminTrainersUnified"],
    queryFn: () => base44.entities.TrainerProfile.list("-created_date", 500),
    staleTime: 15000,
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, type, data }) => {
      if (type === "walk") return base44.entities.Booking.update(id, data);
      if (type === "hotel") return base44.entities.HotelBooking.update(id, data);
      if (type === "training") return base44.entities.TrainingBooking.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllBookings"] });
      queryClient.invalidateQueries({ queryKey: ["adminHotelBookings"] });
      toast.success("Reserva atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar reserva"),
  });

  const deleteWalkerMutation = useMutation({
    mutationFn: (id) => base44.entities.WalkerProfile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminWalkersUnified"] });
      toast.success("Perfil removido!");
    },
  });

  // Filtros e cálculos
  const filteredBookings = useMemo(() => {
    return allBookings.filter(b => {
      const searchLower = searchBooking.toLowerCase();
      return (
        (b.owner_name?.toLowerCase().includes(searchLower) || false) ||
        (b.owner_email?.toLowerCase().includes(searchLower) || false) ||
        (b.dog_name?.toLowerCase().includes(searchLower) || false)
      );
    });
  }, [allBookings, searchBooking]);

  const filteredProfessionals = useMemo(() => {
    const allProfs = [...walkers, ...trainers];
    const searchLower = searchProfessional.toLowerCase();
    return allProfs.filter(p =>
      (p.walker_name?.toLowerCase().includes(searchLower) || false) ||
      (p.trainer_name?.toLowerCase().includes(searchLower) || false) ||
      (p.location?.toLowerCase().includes(searchLower) || false)
    );
  }, [walkers, trainers, searchProfessional]);

  const stats = {
    totalBookings: allBookings.length,
    pendingBookings: allBookings.filter(b => b.status === "pending").length,
    completedBookings: allBookings.filter(b => b.status === "completed").length,
    totalProfessionals: walkers.length + trainers.length,
    verifiedProfessionals: [...walkers, ...trainers].filter(p => p.verification_status === "verified").length,
    upcomingStays: hotelBookings.filter(b => new Date(b.checkin_date) >= new Date()).length,
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-orange-50 text-orange-700 border border-orange-200",
      confirmed: "bg-slate-100 text-slate-700 border border-slate-200",
      completed: "bg-slate-100 text-slate-700 border border-slate-200",
      checked_in: "bg-slate-100 text-slate-700 border border-slate-200",
      cancelled: "bg-slate-100 text-slate-700 border border-slate-200",
      rejected: "bg-slate-100 text-slate-700 border border-slate-200",
    };
    return colors[status] || "bg-slate-100 text-slate-700 border border-slate-200";
  };

  const getTypeLabel = (type) => {
    const labels = { walk: "🚶 Passeio", hotel: "🏨 Hotel", training: "🎓 Treinamento" };
    return labels[type] || type;
  };

  const getProfessionalType = (prof) => {
    return prof.walker_name ? "👤 Walker" : "🎓 Trainer";
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">Reservas Totais</p>
                <p className="text-3xl font-black text-slate-900">{stats.totalBookings}</p>
                <p className="text-xs text-slate-500 mt-1">{stats.pendingBookings} pendentes</p>
              </div>
              <BookOpen className="w-10 h-10 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">Profissionais</p>
                <p className="text-3xl font-black text-slate-900">{stats.totalProfessionals}</p>
                <p className="text-xs text-slate-500 mt-1">{stats.verifiedProfessionals} verificados</p>
              </div>
              <Users className="w-10 h-10 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">Estadias Previstas</p>
                <p className="text-3xl font-black text-slate-900">{stats.upcomingStays}</p>
                <p className="text-xs text-slate-500 mt-1">próximos 30 dias</p>
              </div>
              <Calendar className="w-10 h-10 text-slate-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200 p-1 rounded-lg">
          <TabsTrigger value="bookings" className="rounded-md">📋 Reservas</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-md">📅 Agenda Hotel</TabsTrigger>
          <TabsTrigger value="professionals" className="rounded-md">👥 Profissionais</TabsTrigger>
        </TabsList>

        {/* Reservas Tab */}
        <TabsContent value="bookings" className="mt-6 space-y-4">
          <div className="flex items-center gap-2 bg-white p-4 rounded-lg border border-slate-200">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por cliente, email ou animal..."
              value={searchBooking}
              onChange={(e) => setSearchBooking(e.target.value)}
              className="border-0 flex-1"
            />
          </div>

          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-slate-600" />
                Todas as Reservas ({filteredBookings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-bold text-slate-900">Cliente</TableHead>
                      <TableHead className="font-bold text-slate-900">Tipo</TableHead>
                      <TableHead className="font-bold text-slate-900">Data</TableHead>
                      <TableHead className="font-bold text-slate-900">Status</TableHead>
                      <TableHead className="font-bold text-slate-900">Valor</TableHead>
                      <TableHead className="font-bold text-slate-900 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.slice(0, 10).map((booking) => (
                      <TableRow key={`${booking.type}-${booking.id}`} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-slate-900">{booking.owner_name}</p>
                            <p className="text-xs text-slate-500">{booking.owner_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTypeLabel(booking.type)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {format(new Date(booking.walk_date || booking.checkin_date || booking.session_date), "dd/MM/yyyy", { locale: pt })}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          €{booking.total_amount?.toFixed(2) || "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedBooking(booking)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {booking.status === "pending" && (
                            <Button
                              size="sm"
                              className="bg-slate-600 hover:bg-slate-700 text-white"
                              onClick={() =>
                                updateBookingMutation.mutate({
                                  id: booking.id,
                                  type: booking.type,
                                  data: { status: "confirmed" },
                                })
                              }
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (window.confirm(`Apagar reserva de ${booking.owner_name}?`)) {
                                updateBookingMutation.mutate({
                                  id: booking.id,
                                  type: booking.type,
                                  data: { status: "cancelled" }
                                });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agenda Hotel Tab */}
        <TabsContent value="calendar" className="mt-6 space-y-4">
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-slate-600" />
                Agenda do Hotel ({hotelBookings.length} reservas)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-bold text-slate-900">Hotel</TableHead>
                      <TableHead className="font-bold text-slate-900">Hóspede</TableHead>
                      <TableHead className="font-bold text-slate-900">Check-in</TableHead>
                      <TableHead className="font-bold text-slate-900">Check-out</TableHead>
                      <TableHead className="font-bold text-slate-900">Cães</TableHead>
                      <TableHead className="font-bold text-slate-900">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotelBookings.slice(0, 15).map((booking) => (
                      <TableRow key={booking.id} className="hover:bg-slate-50">
                        <TableCell className="font-semibold text-slate-900">
                          {booking.hotel_name}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-slate-900">{booking.owner_name}</p>
                            <p className="text-xs text-slate-500">{booking.owner_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {format(new Date(booking.checkin_date), "dd/MM/yyyy", { locale: pt })}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {format(new Date(booking.checkout_date), "dd/MM/yyyy", { locale: pt })}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-slate-900">
                          {booking.total_dogs || booking.dogs?.length || 1}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profissionais Tab */}
        <TabsContent value="professionals" className="mt-6 space-y-4">
          <div className="flex items-center gap-2 bg-white p-4 rounded-lg border border-slate-200">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou localização..."
              value={searchProfessional}
              onChange={(e) => setSearchProfessional(e.target.value)}
              className="border-0 flex-1"
            />
          </div>

          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-slate-600" />
                Gerenciamento de Profissionais ({filteredProfessionals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-bold text-slate-900">Nome</TableHead>
                      <TableHead className="font-bold text-slate-900">Tipo</TableHead>
                      <TableHead className="font-bold text-slate-900">Localização</TableHead>
                      <TableHead className="font-bold text-slate-900">Verificação</TableHead>
                      <TableHead className="font-bold text-slate-900">Rating</TableHead>
                      <TableHead className="font-bold text-slate-900 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfessionals.slice(0, 12).map((prof) => (
                      <TableRow key={prof.id} className="hover:bg-slate-50">
                        <TableCell className="font-semibold text-slate-900">
                          {prof.walker_name || prof.trainer_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getProfessionalType(prof)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{prof.location}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              prof.verification_status === "verified"
                                ? "bg-slate-100 text-slate-700 border border-slate-200"
                                : "bg-orange-50 text-orange-700 border border-orange-200"
                            }
                          >
                            {prof.verification_status || "pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          ⭐ {prof.rating?.toFixed(1) || "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (window.confirm("Remover este profissional?")) {
                                deleteWalkerMutation.mutate(prof.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}