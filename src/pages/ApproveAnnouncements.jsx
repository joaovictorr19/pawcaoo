
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, CheckCircle, X, Eye, Clock, Crown, AlertCircle, Ban,
  Megaphone, TrendingUp, DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import NotificationService from "../components/NotificationService";

export default function ApproveAnnouncements() {
  const queryClient = useQueryClient();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pendingAnnouncements = [] } = useQuery({
    queryKey: ['pendingAnnouncements'],
    queryFn: () => base44.entities.CompanyAnnouncement.filter({
      moderation_status: 'pending'
    }, '-created_date'),
    enabled: user?.role === 'admin',
  });

  const { data: approvedAnnouncements = [] } = useQuery({
    queryKey: ['approvedAnnouncements'],
    queryFn: () => base44.entities.CompanyAnnouncement.filter({
      moderation_status: 'approved'
    }, '-created_date'),
    enabled: user?.role === 'admin',
  });

  const { data: rejectedAnnouncements = [] } = useQuery({
    queryKey: ['rejectedAnnouncements'],
    queryFn: () => base44.entities.CompanyAnnouncement.filter({
      moderation_status: 'rejected'
    }, '-created_date'),
    enabled: user?.role === 'admin',
  });

  // Combine all announcements for easy lookup within the mutation
  const allAnnouncements = [...pendingAnnouncements, ...approvedAnnouncements, ...rejectedAnnouncements];

  const moderateAnnouncementMutation = useMutation({
    // Renamed parameters for better clarity between internal notes and public rejection reason
    mutationFn: async ({ announcementId, status, internalModerationNotes, publicRejectionReason }) => {
      const currentUser = await base44.auth.me(); // Fetch currentUser inside mutation for up-to-date info
      const announcement = allAnnouncements.find(a => a.id === announcementId);

      if (!announcement) {
        throw new Error("Announcement not found.");
      }

      const updateData = {
        moderation_status: status,
        moderated_by: currentUser.email,
        moderation_notes: internalModerationNotes, // Store internal admin notes
        moderated_date: new Date().toISOString()
      };

      if (status === 'rejected') {
        updateData.rejection_reason = publicRejectionReason; // Store public rejection reason
        updateData.is_active = false;
      }

      if (status === 'approved') {
        updateData.is_active = true;
        // Optionally clear rejection_reason if an announcement is moved from rejected to approved
        // For now, only updating explicitly stated fields.
      }

      await base44.entities.CompanyAnnouncement.update(announcementId, updateData);

      // Use NotificationService for sending notifications
      if (status === 'approved') {
        await NotificationService.announcementApproved({
          announcement,
          companyEmail: announcement.company_email || announcement.created_by
        });
      } else if (status === 'rejected') {
        await NotificationService.announcementRejected({
          announcement,
          companyEmail: announcement.company_email || announcement.created_by,
          reason: publicRejectionReason // Use the public rejection reason for the notification
        });
      }
    },
    onSuccess: () => {
      // Invalidate specific queries to refetch the latest data for all tabs
      queryClient.invalidateQueries({ queryKey: ['pendingAnnouncements'] });
      queryClient.invalidateQueries({ queryKey: ['approvedAnnouncements'] });
      queryClient.invalidateQueries({ queryKey: ['rejectedAnnouncements'] });
      setShowDialog(false);
      setSelectedAnnouncement(null);
      setModerationNotes("");
      setRejectionReason("");
      toast.success("Anúncio moderado!");
    },
    onError: (error) => {
      toast.error(`Erro ao moderar anúncio: ${error.message}`);
    }
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <Ban className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { icon: Clock, value: pendingAnnouncements.length, label: "Pendentes", color: "from-orange-600 to-yellow-600" },
    { icon: CheckCircle, value: approvedAnnouncements.length, label: "Aprovados", color: "from-green-600 to-emerald-600" },
    { icon: X, value: rejectedAnnouncements.length, label: "Rejeitados", color: "from-red-600 to-rose-600" },
  ];

  const totalRevenue = approvedAnnouncements.reduce((sum, a) => sum + (a.featured_payment_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Megaphone className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Moderação de Anúncios</h1>
              <p className="text-gray-600 font-medium">Aprovar e gerir anúncios de empresas parceiras</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900">€{totalRevenue}</div>
                <div className="text-sm text-gray-600 font-medium">Receita Total</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-xl p-2 h-14">
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" />
              Pendentes ({pendingAnnouncements.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovados ({approvedAnnouncements.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <X className="w-4 h-4 mr-2" />
              Rejeitados ({rejectedAnnouncements.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Announcements */}
          <TabsContent value="pending" className="space-y-4">
            {pendingAnnouncements.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhum anúncio pendente
                  </h3>
                  <p className="text-gray-600">Todos os anúncios foram revisados! 🎉</p>
                </CardContent>
              </Card>
            ) : (
              pendingAnnouncements.map((announcement, idx) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-2 border-orange-200 bg-orange-50 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {announcement.is_featured && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                <Crown className="w-3 h-3 mr-1" />
                                {announcement.featured_tier?.toUpperCase()} - €{announcement.featured_payment_amount}
                              </Badge>
                            )}
                            <h3 className="font-bold text-xl text-gray-900">{announcement.title}</h3>
                            <Badge className="capitalize">{announcement.promotion_type}</Badge>
                          </div>

                          <div className="bg-white rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div>
                                <p className="text-gray-500">Empresa</p>
                                <p className="font-bold">{announcement.company_name}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Tipo</p>
                                <p className="font-bold capitalize">{announcement.promotion_type}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Desconto</p>
                                <p className="font-bold text-red-600">{announcement.discount_percentage}%</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Criado em</p>
                                <p className="font-bold">
                                  {format(new Date(announcement.created_date), "d 'de' MMM", { locale: ptBR })}
                                </p>
                              </div>
                            </div>

                            {announcement.image_url && (
                              <img
                                src={announcement.image_url}
                                alt=""
                                className="w-full h-48 object-cover rounded-lg mb-3"
                              />
                            )}

                            <p className="text-gray-800 mb-3">{announcement.message}</p>

                            {announcement.is_featured && (
                              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
                                <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                                  <Crown className="w-4 h-4" />
                                  Anúncio em Destaque - {announcement.featured_tier?.toUpperCase()}
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <p className="text-yellow-700">Valor Pago</p>
                                    <p className="font-bold text-yellow-900">€{announcement.featured_payment_amount}</p>
                                  </div>
                                  <div>
                                    <p className="text-yellow-700">Período</p>
                                    <p className="font-bold text-yellow-900">
                                      {format(new Date(announcement.featured_start_date || announcement.start_date), 'd MMM', { locale: ptBR })} - {format(new Date(announcement.featured_end_date), 'd MMM', { locale: ptBR })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => moderateAnnouncementMutation.mutate({
                            announcementId: announcement.id,
                            status: 'approved',
                            internalModerationNotes: 'Aprovado por admin', // Internal notes
                            publicRejectionReason: null // No public rejection reason for approval
                          })}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedAnnouncement(announcement);
                            setShowDialog(true);
                          }}
                          variant="destructive"
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedAnnouncement(announcement);
                            setModerationNotes("");
                          }}
                          variant="outline"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Revisar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Approved Announcements */}
          <TabsContent value="approved" className="space-y-4">
            {approvedAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-600">Aprovado</Badge>
                        {announcement.is_featured && (
                          <Badge className="bg-yellow-500">
                            <Crown className="w-3 h-3 mr-1" />
                            {announcement.featured_tier}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{announcement.company_name}</p>
                      <p className="text-gray-700">{announcement.message}</p>

                      <div className="grid grid-cols-3 gap-4 mt-4 p-3 bg-white rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500">Visualizações</p>
                          <p className="text-xl font-bold text-gray-900">{announcement.views_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Cliques</p>
                          <p className="text-xl font-bold text-blue-600">{announcement.clicks_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Conversões</p>
                          <p className="text-xl font-bold text-green-600">{announcement.conversions_count || 0}</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => moderateAnnouncementMutation.mutate({
                        announcementId: announcement.id,
                        status: 'rejected',
                        internalModerationNotes: 'Desativado pelo admin', // Internal note
                        publicRejectionReason: 'Desativado por ação administrativa.' // Public reason for deactivation
                      })}
                      variant="outline"
                      className="text-red-600 border-red-300"
                    >
                      Desativar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Rejected Announcements */}
          <TabsContent value="rejected" className="space-y-4">
            {rejectedAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="border-2 border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <Badge className="bg-red-600 text-white mb-2">Rejeitado</Badge>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{announcement.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{announcement.company_name}</p>
                  <p className="text-gray-700 mb-3">{announcement.message}</p>

                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm font-semibold text-red-900 mb-1">Motivo da Rejeição:</p>
                    <p className="text-sm text-gray-700">{announcement.rejection_reason || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Rejeitado por {announcement.moderated_by} em {format(new Date(announcement.moderated_date), "d 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Rejection Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Rejeitar Anúncio</DialogTitle>
            </DialogHeader>

            {selectedAnnouncement && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-2">{selectedAnnouncement.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">Empresa: {selectedAnnouncement.company_name}</p>
                  <p className="text-gray-700">{selectedAnnouncement.message}</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Motivo da Rejeição *
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explique por que este anúncio está sendo rejeitado..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    A empresa receberá este motivo via notificação
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Notas Internas (opcional)
                  </label>
                  <Textarea
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    placeholder="Notas internas para referência..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setSelectedAnnouncement(null);
                  setRejectionReason("");
                  setModerationNotes("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => moderateAnnouncementMutation.mutate({
                  announcementId: selectedAnnouncement?.id,
                  status: 'rejected',
                  internalModerationNotes: moderationNotes, // Internal notes from state
                  publicRejectionReason: rejectionReason // Public reason from state
                })}
                disabled={!rejectionReason}
              >
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
