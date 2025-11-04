import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, AlertTriangle, CheckCircle, X, Flag, Ban,
  MessageCircle, Users, TrendingUp, Eye, Clock
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ModerationPanel() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isModeratorOrAdmin = user?.role === 'admin' || user?.social_role === 'moderator' || user?.social_role === 'admin';

  const { data: pendingReports } = useQuery({
    queryKey: ['pendingReports'],
    queryFn: () => base44.entities.SocialReport.filter({ status: 'pending' }, '-created_date'),
    enabled: isModeratorOrAdmin,
    initialData: [],
  });

  const { data: reviewingReports } = useQuery({
    queryKey: ['reviewingReports'],
    queryFn: () => base44.entities.SocialReport.filter({ status: 'reviewing' }, '-created_date'),
    enabled: isModeratorOrAdmin,
    initialData: [],
  });

  const { data: flaggedPosts } = useQuery({
    queryKey: ['flaggedPosts'],
    queryFn: () => base44.entities.SocialPost.filter({ moderation_status: 'flagged' }),
    enabled: isModeratorOrAdmin,
    initialData: [],
  });

  const moderateReportMutation = useMutation({
    mutationFn: async ({ reportId, action, notes }) => {
      await base44.entities.SocialReport.update(reportId, {
        status: 'resolved',
        moderation_action: action,
        moderation_notes: notes,
        moderated_by: user.email,
        resolved_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingReports']);
      queryClient.invalidateQueries(['reviewingReports']);
      setShowDialog(false);
      setSelectedReport(null);
      setModerationNotes("");
      toast.success("Denúncia moderada!");
    },
  });

  const moderatePostMutation = useMutation({
    mutationFn: async ({ postId, status }) => {
      return base44.entities.SocialPost.update(postId, {
        moderation_status: status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['flaggedPosts']);
      queryClient.invalidateQueries(['socialPosts']);
      toast.success("Post moderado!");
    },
  });

  if (!isModeratorOrAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <Ban className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar o painel de moderação.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { icon: Flag, value: pendingReports.length, label: "Pendentes", color: "from-orange-600 to-red-600" },
    { icon: Eye, value: reviewingReports.length, label: "Em Análise", color: "from-blue-600 to-cyan-600" },
    { icon: AlertTriangle, value: flaggedPosts.length, label: "Posts Sinalizados", color: "from-yellow-600 to-orange-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Painel de Moderação</h1>
              <p className="text-gray-600 font-medium">Gerir denúncias e conteúdo reportado</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
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
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-xl p-2 h-14">
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <Flag className="w-4 h-4 mr-2" />
              Pendentes ({pendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="reviewing" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Eye className="w-4 h-4 mr-2" />
              Em Análise ({reviewingReports.length})
            </TabsTrigger>
            <TabsTrigger value="flagged" className="rounded-lg data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Posts Sinalizados ({flaggedPosts.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Reports */}
          <TabsContent value="pending" className="space-y-4">
            {pendingReports.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhuma denúncia pendente
                  </h3>
                  <p className="text-gray-600">Tudo limpo por aqui! 🎉</p>
                </CardContent>
              </Card>
            ) : (
              pendingReports.map((report, idx) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-2 border-orange-200 bg-orange-50 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-red-500 text-white">
                              {report.reason}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {report.reported_content_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Reportado por: <span className="font-semibold">{report.reporter_email}</span>
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            Usuário denunciado: <span className="font-semibold">{report.reported_user_email}</span>
                          </p>
                          <p className="text-gray-700 mt-3">{report.details}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {format(new Date(report.created_date), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDialog(true);
                          }}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Analisar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => moderateReportMutation.mutate({
                            reportId: report.id,
                            action: 'none',
                            notes: 'Dismissed without action'
                          })}
                          variant="outline"
                          className="text-gray-600"
                        >
                          Descartar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Reviewing Reports */}
          <TabsContent value="reviewing" className="space-y-4">
            {reviewingReports.map((report, idx) => (
              <Card key={report.id} className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-600 text-white">Em Análise</Badge>
                    <Badge className="bg-red-500 text-white">{report.reason}</Badge>
                  </div>
                  <p className="text-gray-700">{report.details}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Por: {report.moderated_by}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Flagged Posts */}
          <TabsContent value="flagged" className="space-y-4">
            {flaggedPosts.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhum post sinalizado
                  </h3>
                </CardContent>
              </Card>
            ) : (
              flaggedPosts.map((post, idx) => (
                <Card key={post.id} className="border-2 border-yellow-200 bg-yellow-50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={post.author_photo_url} />
                        <AvatarFallback className="bg-purple-600 text-white">
                          {post.author_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{post.author_name}</h4>
                        <p className="text-sm text-gray-600">
                          {format(new Date(post.created_date), "d 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-gray-800 mt-2">{post.content}</p>
                        {post.media_urls?.[0] && (
                          <img
                            src={post.media_urls[0]}
                            className="w-full max-w-sm h-48 object-cover rounded-xl mt-3"
                            alt="Post"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => moderatePostMutation.mutate({
                          postId: post.id,
                          status: 'approved'
                        })}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => moderatePostMutation.mutate({
                          postId: post.id,
                          status: 'removed'
                        })}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Moderation Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Moderar Denúncia</DialogTitle>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Tipo de Conteúdo</p>
                      <p className="font-semibold capitalize">{selectedReport.reported_content_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Motivo</p>
                      <p className="font-semibold">{selectedReport.reason}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Denunciante</p>
                      <p className="font-semibold text-xs">{selectedReport.reporter_email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Denunciado</p>
                      <p className="font-semibold text-xs">{selectedReport.reported_user_email}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-gray-500 text-sm mb-1">Detalhes</p>
                    <p className="text-gray-800">{selectedReport.details}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Notas de Moderação
                  </label>
                  <Textarea
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    placeholder="Adicione notas sobre esta decisão..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => moderateReportMutation.mutate({
                      reportId: selectedReport.id,
                      action: 'warning',
                      notes: moderationNotes
                    })}
                    variant="outline"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    ⚠️ Dar Aviso
                  </Button>
                  <Button
                    onClick={() => moderateReportMutation.mutate({
                      reportId: selectedReport.id,
                      action: 'content_removed',
                      notes: moderationNotes
                    })}
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    🗑️ Remover Conteúdo
                  </Button>
                  <Button
                    onClick={() => moderateReportMutation.mutate({
                      reportId: selectedReport.id,
                      action: 'user_suspended',
                      notes: moderationNotes
                    })}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    ⏸️ Suspender Usuário
                  </Button>
                  <Button
                    onClick={() => moderateReportMutation.mutate({
                      reportId: selectedReport.id,
                      action: 'user_banned',
                      notes: moderationNotes
                    })}
                    variant="destructive"
                  >
                    🚫 Banir Usuário
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setSelectedReport(null);
                  setModerationNotes("");
                }}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}