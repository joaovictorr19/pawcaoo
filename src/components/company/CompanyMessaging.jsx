import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Send, MessageSquare, Users, Bell, Clock, CheckCircle, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompanyMessaging({ companyId, companyEmail }) {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [messageContent, setMessageContent] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messagePriority, setMessagePriority] = useState("normal");
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['companyEmployees', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return await base44.entities.CompanyEmployee.filter({ company_id: companyId });
    },
    enabled: !!companyId,
  });

  const { data: sentMessages = [], isLoading: loadingSent } = useQuery({
    queryKey: ['companySentMessages', companyEmail],
    queryFn: async () => {
      if (!companyEmail) return [];
      return await base44.entities.CompanyMessage.filter({ sender_email: companyEmail }, '-created_date', 100);
    },
    enabled: !!companyEmail,
    refetchInterval: 10000, // Poll every 10s
  });

  const { data: receivedMessages = [], isLoading: loadingReceived } = useQuery({
    queryKey: ['companyReceivedMessages', companyEmail],
    queryFn: async () => {
      if (!companyEmail) return [];
      return await base44.entities.CompanyMessage.filter({ recipient_email: companyEmail }, '-created_date', 100);
    },
    enabled: !!companyEmail,
    refetchInterval: 10000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return await base44.entities.CompanyMessage.create(messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companySentMessages']);
      queryClient.invalidateQueries(['companyReceivedMessages']);
      toast.success("Mensagem enviada!");
      setMessageContent("");
      setMessageSubject("");
      setShowNewMessageDialog(false);
    },
    onError: () => {
      toast.error("Erro ao enviar mensagem");
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId) => {
      return await base44.entities.CompanyMessage.update(messageId, {
        is_read: true,
        read_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyReceivedMessages']);
    }
  });

  const handleSendMessage = () => {
    if (!messageContent || !recipientEmail) {
      toast.error("Preencha destinatário e mensagem!");
      return;
    }

    const recipient = employees.find(e => e.employee_email === recipientEmail);

    sendMessageMutation.mutate({
      company_id: companyId,
      company_email: companyEmail,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      recipient_email: recipientEmail,
      recipient_name: recipient?.employee_name || recipientEmail,
      subject: messageSubject || "Mensagem da Empresa",
      message: messageContent,
      priority: messagePriority,
      message_type: "general"
    });
  };

  const unreadCount = receivedMessages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              Comunicação Interna
            </CardTitle>
            <Button onClick={() => setShowNewMessageDialog(true)} className="bg-blue-600">
              <Send className="w-4 h-4 mr-2" />
              Nova Mensagem
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="received">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received">
                <Bell className="w-4 h-4 mr-2" />
                Recebidas ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="sent">
                <Send className="w-4 h-4 mr-2" />
                Enviadas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-3 mt-4">
              {loadingReceived ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : receivedMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Sem mensagens recebidas</p>
                </div>
              ) : (
                receivedMessages.map(msg => (
                  <Card 
                    key={msg.id} 
                    className={`border-2 transition-all cursor-pointer hover:shadow-md ${
                      msg.is_read ? 'border-gray-200 bg-white' : 'border-blue-300 bg-blue-50'
                    }`}
                    onClick={() => !msg.is_read && markAsReadMutation.mutate(msg.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                            {msg.sender_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <h4 className="font-bold text-sm">{msg.sender_name}</h4>
                              <p className="text-xs text-gray-500">{msg.sender_email}</p>
                            </div>
                            <div className="flex gap-2 items-center">
                              {!msg.is_read && <Badge className="bg-blue-600 text-xs">Nova</Badge>}
                              <Badge className={
                                msg.priority === 'urgent' ? 'bg-red-500' :
                                msg.priority === 'high' ? 'bg-orange-500' : 'bg-gray-400'
                              } variant="outline">
                                {msg.priority}
                              </Badge>
                            </div>
                          </div>
                          {msg.subject && (
                            <h5 className="font-semibold text-gray-900 mb-1">{msg.subject}</h5>
                          )}
                          <p className="text-sm text-gray-700">{msg.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {format(new Date(msg.created_date), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-3 mt-4">
              {loadingSent ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : sentMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Send className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Sem mensagens enviadas</p>
                </div>
              ) : (
                sentMessages.map(msg => (
                  <Card key={msg.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-500 text-white">
                            {msg.recipient_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <h4 className="font-bold text-sm">Para: {msg.recipient_name}</h4>
                              <p className="text-xs text-gray-500">{msg.recipient_email}</p>
                            </div>
                            {msg.is_read ? (
                              <Badge className="bg-green-600 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Lida
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-400 text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Enviada
                              </Badge>
                            )}
                          </div>
                          {msg.subject && (
                            <h5 className="font-semibold text-gray-900 mb-1">{msg.subject}</h5>
                          )}
                          <p className="text-sm text-gray-700">{msg.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {format(new Date(msg.created_date), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Message Dialog */}
      <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Mensagem Interna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Destinatário</label>
              <Select value={recipientEmail} onValueChange={setRecipientEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar funcionário..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === 'active').map(emp => (
                    <SelectItem key={emp.id} value={emp.employee_email}>
                      {emp.employee_name || emp.employee_email} - {emp.employee_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Prioridade</label>
              <Select value={messagePriority} onValueChange={setMessagePriority}>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Assunto (Opcional)</label>
              <Input
                placeholder="Ex: Atualização importante"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mensagem</label>
              <Textarea
                placeholder="Escreva a mensagem..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMessageDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!messageContent || !recipientEmail || sendMessageMutation.isPending}
              className="bg-blue-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}