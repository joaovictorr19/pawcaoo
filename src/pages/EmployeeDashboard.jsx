import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MessageSquare, MapPin, User, CheckCircle, Package } from "lucide-react";
import BookingStatusTracker from "../components/company/BookingStatusTracker";
import { format } from "date-fns";

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState("bookings");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myEmployeeRecord } = useQuery({
    queryKey: ['myEmployeeRecord', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const records = await base44.entities.CompanyEmployee.filter({ employee_email: user.email });
      return records[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ['employeeBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Booking.filter({ walker_email: user.email }, '-walk_date');
    },
    enabled: !!user?.email,
    refetchInterval: 10000,
  });

  const { data: myMessages = [] } = useQuery({
    queryKey: ['employeeMessages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.CompanyMessage.filter({ recipient_email: user.email }, '-created_date');
    },
    enabled: !!user?.email,
    refetchInterval: 10000,
  });

  const pendingBookings = myBookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const inProgressBookings = myBookings.filter(b => b.status === 'in_progress');
  const completedBookings = myBookings.filter(b => b.status === 'completed' || b.status === 'service_completed');
  const unreadMessages = myMessages.filter(m => !m.is_read);

  if (!myEmployeeRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="glass-panel max-w-md">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sem vínculo empresarial</h2>
            <p className="text-gray-600">Você não está registado como funcionário de nenhuma empresa.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Painel de Funcionário</h1>
          <p className="text-lg text-gray-600">
            {myEmployeeRecord.company_email} • {myEmployeeRecord.employee_type}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-panel">
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-3xl font-black text-gray-900">{pendingBookings.length}</p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-black text-gray-900">{inProgressBookings.length}</p>
              <p className="text-sm text-gray-600">Em Progresso</p>
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-black text-gray-900">{completedBookings.length}</p>
              <p className="text-sm text-gray-600">Concluídos</p>
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-black text-gray-900">{unreadMessages.length}</p>
              <p className="text-sm text-gray-600">Mensagens</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="bookings">Meus Pedidos</TabsTrigger>
            <TabsTrigger value="messages">
              Mensagens {unreadMessages.length > 0 && <Badge className="ml-2 bg-red-500">{unreadMessages.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4 mt-6">
            {myBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Sem pedidos atribuídos</p>
              </div>
            ) : (
              myBookings.map(booking => (
                <Card key={booking.id} className="glass-panel border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{booking.dog_name}</h3>
                        <p className="text-gray-600">{booking.owner_name}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge className={
                            booking.status === 'completed' ? 'bg-green-600' :
                            booking.status === 'in_progress' ? 'bg-blue-600' : 'bg-yellow-600'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-700">€{booking.service_amount?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(booking.walk_date), 'dd/MM/yyyy')} às {booking.walk_time}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {booking.pickup_address}
                      </div>
                      {booking.special_notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800">
                            <strong>Notas:</strong> {booking.special_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <BookingStatusTracker 
                      bookingId={booking.id}
                      employeeEmail={user.email}
                      employeeName={user.full_name || user.email}
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4 mt-6">
            {myMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Sem mensagens da empresa</p>
              </div>
            ) : (
              myMessages.map(msg => (
                <Card key={msg.id} className={`border-2 ${!msg.is_read ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold">{msg.subject || 'Mensagem da Empresa'}</h4>
                        <p className="text-xs text-gray-500">{msg.sender_name}</p>
                      </div>
                      <div className="flex gap-2">
                        {!msg.is_read && <Badge className="bg-blue-600">Nova</Badge>}
                        <Badge className={
                          msg.priority === 'urgent' ? 'bg-red-500' :
                          msg.priority === 'high' ? 'bg-orange-500' : 'bg-gray-400'
                        }>
                          {msg.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(msg.created_date), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}