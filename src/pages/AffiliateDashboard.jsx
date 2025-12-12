import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, Copy, Gift, TrendingUp, Award, 
  Share2, CheckCircle, Clock, Euro, Sparkles 
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { motion } from "framer-motion";

export default function AffiliateDashboard() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [shareMethod, setShareMethod] = useState('link');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user.email
      });
      return points[0];
    },
    enabled: !!user?.email,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['myReferrals', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Referral.filter({
        referrer_email: user.email
      }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Código de afiliado gerado!');
    },
  });

  // Gerar código se não existir
  React.useEffect(() => {
    if (user && !user.referral_code) {
      const code = `PAWCAO${user.id?.substring(0, 8).toUpperCase() || Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      updateUserMutation.mutate({ referral_code: code });
    }
  }, [user]);

  const referralCode = user?.referral_code || '';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const stats = {
    totalReferrals: referrals.length,
    pendingReferrals: referrals.filter(r => r.status === 'pending').length,
    completedReferrals: referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length,
    totalEarned: referrals.reduce((sum, r) => sum + (r.points_awarded_referrer || 0), 0),
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(language === 'pt' ? 'Copiado!' : 'Copied!');
  };

  const shareVia = (platform) => {
    const message = language === 'pt' 
      ? `🐕 Junte-se ao PawCão! Use o meu código ${referralCode} e ganhe 100 pontos de bónus! ${referralLink}`
      : `🐕 Join PawCão! Use my code ${referralCode} and get 100 bonus points! ${referralLink}`;

    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      email: `mailto:?subject=${encodeURIComponent('Junte-se ao PawCão')}&body=${encodeURIComponent(message)}`
    };

    window.open(urls[platform], '_blank');
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Users className="w-10 h-10 text-purple-600" />
            {language === 'pt' ? 'Programa de Afiliados' : 'Affiliate Program'}
          </h1>
          <p className="text-lg text-gray-600">
            {language === 'pt' 
              ? 'Indique amigos e ganhe PawPoints por cada novo utilizador!'
              : 'Refer friends and earn PawPoints for each new user!'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-panel border-2 border-blue-300/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
                  <p className="text-xs text-gray-600">
                    {language === 'pt' ? 'Indicações' : 'Referrals'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-2 border-yellow-300/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingReferrals}</p>
                  <p className="text-xs text-gray-600">
                    {language === 'pt' ? 'Pendentes' : 'Pending'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-2 border-green-300/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedReferrals}</p>
                  <p className="text-xs text-gray-600">
                    {language === 'pt' ? 'Convertidos' : 'Converted'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-2 border-purple-300/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEarned}</p>
                  <p className="text-xs text-gray-600">
                    {language === 'pt' ? 'Pontos Ganhos' : 'Points Earned'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code Section */}
        <Card className="glass-panel border-2 border-purple-300/40 shadow-xl mb-8">
          <CardHeader className="border-b border-purple-200/50">
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-6 h-6 text-purple-600" />
              {language === 'pt' ? 'O Seu Código de Afiliado' : 'Your Referral Code'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {language === 'pt' ? 'Código:' : 'Code:'}
                  </p>
                  <p className="font-mono font-bold text-3xl text-purple-700">{referralCode}</p>
                </div>
                <Button
                  onClick={() => copyToClipboard(referralCode)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {language === 'pt' ? 'Copiar' : 'Copy'}
                </Button>
              </div>

              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-2">
                  {language === 'pt' ? 'Link de Partilha:' : 'Share Link:'}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(referralLink)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-600" />
                {language === 'pt' ? 'Partilhar' : 'Share'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  onClick={() => shareVia('whatsapp')}
                  className="bg-green-50 hover:bg-green-100 border-green-300"
                >
                  💬 WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareVia('facebook')}
                  className="bg-blue-50 hover:bg-blue-100 border-blue-300"
                >
                  📘 Facebook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareVia('twitter')}
                  className="bg-sky-50 hover:bg-sky-100 border-sky-300"
                >
                  🐦 Twitter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareVia('email')}
                  className="bg-gray-50 hover:bg-gray-100 border-gray-300"
                >
                  ✉️ Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="glass-panel border-2 border-green-300/40 shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-green-600" />
              {language === 'pt' ? 'Como Funciona' : 'How It Works'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">
                  {language === 'pt' ? 'Partilhe o Código' : 'Share Your Code'}
                </h4>
                <p className="text-sm text-gray-600">
                  {language === 'pt' 
                    ? 'Envie o seu código ou link único a amigos e família'
                    : 'Send your unique code or link to friends and family'}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">
                  {language === 'pt' ? 'Eles Registam-se' : 'They Sign Up'}
                </h4>
                <p className="text-sm text-gray-600">
                  {language === 'pt' 
                    ? 'Novos utilizadores registam-se com o seu código e ganham 100 pontos'
                    : 'New users sign up with your code and get 100 points'}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">
                  {language === 'pt' ? 'Ganhe Recompensas' : 'Earn Rewards'}
                </h4>
                <p className="text-sm text-gray-600">
                  {language === 'pt' 
                    ? 'Ganhe 200 pontos quando completarem a 1ª reserva'
                    : 'Earn 200 points when they complete their 1st booking'}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4">
              <p className="text-sm text-center text-yellow-800">
                <strong>💰 Bónus:</strong> {language === 'pt' 
                  ? 'Ganhe 50 pontos extra por cada €50 que os seus indicados gastarem!'
                  : 'Earn 50 extra points for every €50 your referrals spend!'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <Card className="glass-panel border-2 border-white/40 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              {language === 'pt' ? 'Suas Indicações' : 'Your Referrals'} ({referrals.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {referrals.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  {language === 'pt' 
                    ? 'Ainda não indicou ninguém. Comece a partilhar o seu código!'
                    : 'No referrals yet. Start sharing your code!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{referral.referee_name}</p>
                      <p className="text-sm text-gray-600">{referral.referee_email}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(referral.created_date).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={
                        referral.status === 'rewarded' ? 'bg-green-500' :
                        referral.status === 'completed' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }>
                        {referral.status === 'rewarded' ? '✅ Recompensado' :
                         referral.status === 'completed' ? '🎉 Convertido' :
                         '⏳ Pendente'}
                      </Badge>
                      {referral.points_awarded_referrer > 0 && (
                        <p className="text-sm font-bold text-purple-600 mt-1">
                          +{referral.points_awarded_referrer} pts
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}