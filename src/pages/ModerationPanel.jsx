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
  MessageCircle, Users, TrendingUp, Eye, Clock, Star, Heart, ShieldCheck, Award // Added Award
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
import { Label } from "@/components/ui/label"; // Added Label
import { Input } from "@/components/ui/input";   // Added Input

// Helper to construct page URLs for notifications.
// In a real application, this would typically be more robust, potentially using a router's `generatePath` or similar.
const createPageUrl = (path) => {
  return path; // The outline uses a path like "UserProfile?email={userEmail}" directly.
};

export default function ModerationPanel() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null); // Kept for the post badge dialog, even if its UI trigger is removed
  const [moderationNotes, setModerationNotes] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showBadgeDialog, setShowBadgeDialog] = useState(false); // Kept for the post badge dialog, even if its UI trigger is removed

  // New state for user badge granting
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [userEmailForBadge, setUserEmailForBadge] = useState('');
  const [activeTab, setActiveTab] = useState("reports"); // Control tabs state manually

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isModeratorOrAdmin = user?.role === 'admin' || user?.social_role === 'moderator' || user?.social_role === 'moderador' || user?.social_role === 'admin';

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

  const { data: allPosts } = useQuery({ // Kept for the post badge dialog, even if its UI trigger is removed
    queryKey: ['allPostsForModeration'],
    queryFn: () => base44.entities.SocialPost.list('-created_date'),
    enabled: isModeratorOrAdmin,
    initialData: [],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsersForModeration'],
    queryFn: () => base44.entities.User.list('-created_date', 1000), // Increased limit to ensure all users are loaded
    enabled: isModeratorOrAdmin,
    initialData: [],
  });

  const [userSearch, setUserSearch] = useState("");

  // Mutation for managing badges on posts (kept, but no longer directly accessible from main UI tabs)
  const updateBadgesMutation = useMutation({
    mutationFn: async ({ postId, badges }) => {
      return base44.entities.SocialPost.update(postId, badges);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allPostsForModeration']);
      queryClient.invalidateQueries(['socialPosts']);
      setShowBadgeDialog(false);
      setSelectedPost(null);
      toast.success("Badges atualizados!");
    },
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

  // Available badges to grant
  const availableBadges = [
    {
      badge_id: 'verified',
      name: 'Verificado',
      description: 'Usuário verificado pela equipe',
      icon: '✓',
      color: 'blue'
    },
    {
      badge_id: 'adoption_advocate',
      name: 'Defensor de Adoção',
      description: 'Promove ativamente a adoção de animais',
      icon: '❤️',
      color: 'pink'
    },
    {
      badge_id: 'certified_professional',
      name: 'Profissional Certificado',
      description: 'Profissional com certificações verificadas',
      icon: '🎓',
      color: 'blue'
    },
    {
      badge_id: 'top_contributor',
      name: 'Top Contribuidor',
      description: 'Contribui ativamente para a comunidade',
      icon: '⭐',
      color: 'yellow'
    },
    {
      badge_id: 'community_leader',
      name: 'Líder Comunitário',
      description: 'Líder ativo na comunidade',
      icon: '👥',
      color: 'orange'
    },
    {
      badge_id: 'expert_trainer',
      name: 'Treinador Expert',
      description: 'Treinador com expertise comprovada',
      icon: '🏆',
      color: 'indigo'
    },
    {
      badge_id: 'trusted_walker',
      name: 'Passeador Confiável',
      description: 'Passeador com excelente histórico',
      icon: '💚',
      color: 'teal'
    },
    {
      badge_id: 'vet_verified',
      name: 'Veterinário Verificado',
      description: 'Veterinário com licença verificada',
      icon: '⚕️',
      color: 'red'
    },
    {
      badge_id: 'official_partner',
      name: 'Parceiro Oficial',
      description: 'Parceiro oficial da plataforma',
      icon: '🤝',
      color: 'green'
    }
  ];

  // Map for dynamic Tailwind classes to ensure they are present in compiled CSS
  const badgeColorClasses = {
    blue: 'bg-blue-600',
    pink: 'bg-pink-600',
    yellow: 'bg-yellow-600',
    orange: 'bg-orange-600',
    indigo: 'bg-indigo-600',
    teal: 'bg-teal-600',
    red: 'bg-red-600',
    green: 'bg-green-600',
  };

  const grantBadgeMutation = useMutation({
    mutationFn: async ({ userEmail, badge }) => {
      // Get user
      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length === 0) throw new Error('Usuário não encontrado');

      const targetUser = users[0];
      const currentBadges = targetUser.profile_badges || [];

      // Check if already has this badge
      if (currentBadges.some(b => b.badge_id === badge.badge_id)) {
        throw new Error('Usuário já possui este badge');
      }

      // Add badge
      const newBadge = {
        badge_id: badge.badge_id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        color: badge.color, // Store color if needed for rendering badges
        granted_by: user?.email,
        granted_date: new Date().toISOString()
      };

      await base44.entities.User.update(targetUser.id, {
        profile_badges: [...currentBadges, newBadge]
      });

      // Send notification
      await base44.entities.SocialNotification.create({
        recipient_email: userEmail,
        sender_email: user?.email,
        sender_name: user?.full_name || 'Moderação',
        notification_type: 'other',
        related_content_type: 'user',
        post_preview: `Você recebeu o badge: ${badge.name}`,
        action_url: createPageUrl(`UserProfile?email=${userEmail}`)
      });
    },
    onSuccess: () => {
      // Invalidate users query if you have one that fetches user profiles with badges
      // queryClient.invalidateQueries(['users']); // assuming a 'users' query exists to refresh user list
      setSelectedBadge(null);
      setUserEmailForBadge('');
      toast.success('Badge concedido com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao conceder badge');
    }
  });

  const handleGrantBadge = () => {
    if (!userEmailForBadge || !selectedBadge) {
      toast.error('Selecione um badge e insira o email do usuário');
      return;
    }
    grantBadgeMutation.mutate({ userEmail: userEmailForBadge, badge: selectedBadge });
  };

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white shadow-lg">
            <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Flag className="w-4 h-4 mr-2" />
              Denúncias ({pendingReports.length + reviewingReports.length})
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Conteúdo Sinalizado ({flaggedPosts.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="badges" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Award className="w-4 h-4 mr-2" />
              Conceder Badges
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab - Merged Pending and Reviewing Reports */}
          <TabsContent value="reports" className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Denúncias Pendentes</h3>
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

            <h3 className="text-xl font-bold text-gray-900 mb-4 mt-8">Denúncias Em Análise</h3>
            {reviewingReports.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <Eye className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhuma denúncia em análise
                  </h3>
                  <p className="text-gray-600">A fila está limpa! ✅</p>
                </CardContent>
              </Card>
            ) : (
              reviewingReports.map((report, idx) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card key={report.id} className="border-2 border-blue-200 bg-blue-50 shadow-lg">
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
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Content Tab - Flagged Posts */}
          <TabsContent value="content" className="space-y-4">
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
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card key={post.id} className="border-2 border-yellow-200 bg-yellow-50 shadow-lg">
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
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Users Tab - Full User Management */}
          <TabsContent value="users" className="space-y-4">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Gestão de Usuários ({allUsers.length})</CardTitle>
                  <div className="w-72">
                    <Input 
                      placeholder="Pesquisar por nome ou email..." 
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers
                    .filter(u => 
                      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                      u.email?.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.profile_photo_url} />
                          <AvatarFallback>{user.full_name?.[0] || user.email[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">{user.full_name || 'Sem nome'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{user.role}</Badge>
                            {user.social_role && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                {user.social_role === 'moderator' ? 'Moderador' : user.social_role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(createPageUrl(`UserProfile?email=${user.email}`), '_blank')}
                        >
                          👤 Ver Perfil
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            window.location.href = `mailto:${user.email}`;
                          }}
                        >
                          📧 Contactar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default"
                          className="bg-purple-600 text-white hover:bg-purple-700"
                          onClick={() => {
                            setUserEmailForBadge(user.email);
                            setActiveTab("badges");
                            toast.success(`Selecionando badge para ${user.full_name || user.email}`);
                          }}
                        >
                          🎖️ Conceder Badge
                        </Button>
                      </div>
                    </div>
                  ))}
                  {allUsers.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Nenhum usuário encontrado.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Tab - New User Badge Granting */}
          <TabsContent value="badges" className="space-y-4">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Conceder Badges</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Badges aparecem ao lado do nome do usuário em posts e perfil
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="user-email-for-badge">Email do Usuário</Label>
                  <Input
                    id="user-email-for-badge"
                    type="email"
                    value={userEmailForBadge}
                    onChange={(e) => setUserEmailForBadge(e.target.value)}
                    placeholder="usuario@exemplo.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Selecione o Badge</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {availableBadges.map((badge) => (
                      <Card
                        key={badge.badge_id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          selectedBadge?.badge_id === badge.badge_id
                            ? 'ring-4 ring-purple-500 bg-purple-50'
                            : 'hover:ring-2 hover:ring-gray-300'
                        }`}
                        onClick={() => setSelectedBadge(badge)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-4xl mb-2">{badge.icon}</div>
                          <h4 className="font-bold text-sm mb-1">{badge.name}</h4>
                          <p className="text-xs text-gray-600">{badge.description}</p>
                          <Badge className={`mt-2 ${badgeColorClasses[badge.color] || 'bg-gray-600'} text-white`}>
                            {badge.badge_id}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGrantBadge}
                  disabled={!selectedBadge || !userEmailForBadge || grantBadgeMutation.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  <Award className="w-5 h-5 mr-2" />
                  {grantBadgeMutation.isPending ? 'Concedendo...' : 'Conceder Badge'}
                </Button>

                {selectedBadge && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Badge Selecionado:</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selectedBadge.icon}</span>
                      <div>
                        <p className="font-bold">{selectedBadge.name}</p>
                        <p className="text-sm text-gray-700">{selectedBadge.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Moderation Dialog (for reports) */}
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
                  <label htmlFor="moderation-notes" className="text-sm font-medium mb-2 block">
                    Notas de Moderação
                  </label>
                  <Textarea
                    id="moderation-notes"
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

        {/* Badge Management Dialog (for posts) - This dialog and its associated state/mutation are preserved,
            but its direct UI entry point from the main tabs has been replaced by the new "Conceder Badges" tab. */}
        <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gerir Badges - {selectedPost?.author_name}</DialogTitle>
            </DialogHeader>

            {selectedPost && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-2">{selectedPost.content}</p>
                  <p className="text-sm text-gray-600">
                    Por: {selectedPost.author_name} • {format(new Date(selectedPost.created_date), "d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-blue-200 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedPost.is_verified_user || false}
                      onChange={(e) => setSelectedPost({...selectedPost, is_verified_user: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <div>
                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 mb-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        VERIFICADO
                      </Badge>
                      <p className="text-xs text-gray-600">Usuário verificado</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-green-200 rounded-xl cursor-pointer hover:bg-green-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedPost.is_verified_dog || false}
                      onChange={(e) => setSelectedPost({...selectedPost, is_verified_dog: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <div>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 mb-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        CÃO VERIFICADO
                      </Badge>
                      <p className="text-xs text-gray-600">Cão verificado</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-pink-200 rounded-xl cursor-pointer hover:bg-pink-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedPost.is_adoption_advocate || false}
                      onChange={(e) => setSelectedPost({...selectedPost, is_adoption_advocate: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <div>
                      <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 mb-1">
                        <Heart className="w-3 h-3 mr-1" />
                        DEFENSOR DE ADOÇÃO
                      </Badge>
                      <p className="text-xs text-gray-600">Defensor de adoção</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-orange-200 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedPost.is_verified_announcement || false}
                      onChange={(e) => setSelectedPost({...selectedPost, is_verified_announcement: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <div>
                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 mb-1">
                        <Star className="w-3 h-3 mr-1" />
                        ANÚNCIO VERIFICADO
                      </Badge>
                      <p className="text-xs text-gray-600">Anúncio oficial</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowBadgeDialog(false);
                  setSelectedPost(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => updateBadgesMutation.mutate({
                  postId: selectedPost?.id,
                  badges: {
                    is_verified_user: selectedPost?.is_verified_user || false,
                    is_verified_dog: selectedPost?.is_verified_dog || false,
                    is_adoption_advocate: selectedPost?.is_adoption_advocate || false,
                    is_verified_announcement: selectedPost?.is_verified_announcement || false,
                  }
                })}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Salvar Badges
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}