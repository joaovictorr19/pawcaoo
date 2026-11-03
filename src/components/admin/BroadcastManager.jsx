import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Send, Calendar, Users, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BroadcastManager() {
  const queryClient = useQueryClient();
  const [recipientType, setRecipientType] = useState('all_users');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [priority, setPriority] = useState('normal');

  // Fetch all users for stats
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsersForBroadcast'],
    queryFn: () => base44.entities.User.list('-created_date', 10000),
  });

  // Fetch walkers
  const { data: walkers = [] } = useQuery({
    queryKey: ['allWalkersForBroadcast'],
    queryFn: () => base44.entities.WalkerProfile.filter({ is_active: true }),
  });

  // Fetch trainers
  const { data: trainers = [] } = useQuery({
    queryKey: ['allTrainersForBroadcast'],
    queryFn: () => base44.entities.TrainerProfile.filter({ is_active: true }),
  });

  // Fetch scheduled broadcasts
  const { data: scheduledBroadcasts = [], isLoading: loadingScheduled } = useQuery({
    queryKey: ['scheduledBroadcasts'],
    queryFn: async () => {
      const broadcasts = await base44.entities.SystemNotification.filter({
        is_scheduled: true,
        is_sent: false
      }, '-scheduled_date');
      return broadcasts;
    },
  });

  // Send broadcast mutation
  const sendBroadcastMutation = useMutation({
    mutationFn: async ({ recipients, immediate = true }) => {
      if (!recipients || recipients.length === 0) {
        throw new Error("Nenhum destinatário selecionado");
      }


      const notifications = recipients.map(email => ({
        recipient_email: email,
        title,
        message,
        type: 'system',
        priority,
        is_scheduled: !immediate,
        scheduled_date: immediate ? null : new Date(`${scheduleDate}T${scheduleTime}`).toISOString(),
        is_sent: immediate,
      }));

      // Create notifications in batches to avoid overwhelming the API
      const batchSize = 50;
      let created = 0;
      
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        await Promise.all(
          batch.map(notif => base44.entities.SystemNotification.create(notif))
        );
        created += batch.length;
      }

      return { count: notifications.length, immediate };
    },
    onSuccess: (data) => {
      if (data.immediate) {
        toast.success(`✅ ${data.count} mensagens enviadas!`);
      } else {
        toast.success(`📅 ${data.count} mensagens agendadas!`);
      }
      setMessage('');
      setTitle('');
      setScheduleDate('');
      setScheduleTime('');
      queryClient.invalidateQueries(['scheduledBroadcasts']);
    },
    onError: () => {
      toast.error('Erro ao enviar broadcast');
    },
  });

  // Cancel scheduled broadcast
  const cancelBroadcastMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.SystemNotification.delete(id);
    },
    onSuccess: () => {
      toast.success('Broadcast cancelado');
      queryClient.invalidateQueries(['scheduledBroadcasts']);
    },
  });

  const getRecipients = () => {
    switch (recipientType) {
      case 'all_users':
        return allUsers.map(u => u.email);
      case 'walkers':
        return walkers.map(w => w.created_by);
      case 'trainers':
        return trainers.map(t => t.created_by);
      case 'owners':
        return allUsers.filter(u => u.account_type !== 'walker' && u.account_type !== 'trainer').map(u => u.email);
      case 'verified_only':
        return [...walkers.filter(w => w.verification_status === 'verified').map(w => w.created_by),
                ...trainers.filter(t => t.verification_status === 'verified').map(t => t.created_by)];
      default:
        return [];
    }
  };

  const recipients = getRecipients();
  const canSend = title && message && recipients.length > 0;
  const canSchedule = canSend && scheduleDate && scheduleTime;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">
            <Send className="w-4 h-4 mr-2" />
            Enviar Mensagem
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="w-4 h-4 mr-2" />
            Agendadas ({scheduledBroadcasts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Broadcast de Mensagens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recipient Type */}
              <div>
                <Label>Destinatários</Label>
                <Select value={recipientType} onValueChange={setRecipientType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_users">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Todos os Utilizadores ({allUsers.length})
                      </div>
                    </SelectItem>
                    <SelectItem value="walkers">
                      🚶 Dog Walkers Ativos ({walkers.length})
                    </SelectItem>
                    <SelectItem value="trainers">
                      🎓 Treinadores Ativos ({trainers.length})
                    </SelectItem>
                    <SelectItem value="owners">
                      🏠 Donos de Animais ({allUsers.filter(u => u.account_type !== 'walker' && u.account_type !== 'trainer').length})
                    </SelectItem>
                    <SelectItem value="verified_only">
                      ✅ Profissionais Verificados ({[...walkers.filter(w => w.verification_status === 'verified'), ...trainers.filter(t => t.verification_status === 'verified')].length})
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {recipients.length} utilizadores receberão esta mensagem
                </p>
              </div>

              {/* Priority */}
              <div>
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🔵 Baixa</SelectItem>
                    <SelectItem value="normal">🟢 Normal</SelectItem>
                    <SelectItem value="high">🟠 Alta</SelectItem>
                    <SelectItem value="urgent">🔴 Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div>
                <Label>Título</Label>
                <Input
                  placeholder="Ex: Novidade importante da PawCão"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Message */}
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Escreva a mensagem que será enviada..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                />
              </div>

              {/* Schedule Options */}
              <div className="border-t pt-4">
                <Label className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" />
                  Agendar Envio (Opcional)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1">Data</Label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1">Hora</Label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => sendBroadcastMutation.mutate({ recipients, immediate: true })}
                  disabled={!canSend || sendBroadcastMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Agora
                </Button>
                <Button
                  onClick={() => sendBroadcastMutation.mutate({ recipients, immediate: false })}
                  disabled={!canSchedule || sendBroadcastMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Mensagens Agendadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingScheduled ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : scheduledBroadcasts.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhuma mensagem agendada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledBroadcasts.map((broadcast) => (
                    <Card key={broadcast.id} className="border-2 border-purple-100 bg-purple-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{broadcast.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{broadcast.message}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge className="bg-purple-600">
                                {new Date(broadcast.scheduled_date).toLocaleDateString('pt-PT')} às{' '}
                                {new Date(broadcast.scheduled_date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                              </Badge>
                              <Badge variant="outline">
                                {broadcast.priority === 'urgent' ? '🔴' :
                                 broadcast.priority === 'high' ? '🟠' :
                                 broadcast.priority === 'normal' ? '🟢' : '🔵'} {broadcast.priority}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => cancelBroadcastMutation.mutate(broadcast.id)}
                          >
                            Cancelar
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
      </Tabs>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{allUsers.length}</p>
                <p className="text-xs text-gray-600">Total Utilizadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{walkers.length}</p>
                <p className="text-xs text-gray-600">Dog Walkers Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{trainers.length}</p>
                <p className="text-xs text-gray-600">Treinadores Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{scheduledBroadcasts.length}</p>
                <p className="text-xs text-gray-600">Mensagens Agendadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}