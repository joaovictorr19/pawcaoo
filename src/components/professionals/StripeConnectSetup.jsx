import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Loader2,
  Wallet,
  Shield,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function StripeConnectSetup() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);

  const translations = {
    pt: {
      title: 'Configurar Pagamentos',
      subtitle: 'Receba pagamentos diretamente na sua conta bancária',
      noAccount: 'Ainda não configurou a sua conta de pagamentos',
      noAccountDesc: 'Configure a sua conta Stripe para começar a receber pagamentos automaticamente quando completar serviços.',
      createAccount: 'Criar Conta de Pagamentos',
      completeSetup: 'Completar Configuração',
      accountReady: 'Conta Pronta para Receber',
      accountReadyDesc: 'A sua conta está configurada e pode receber pagamentos.',
      pendingSetup: 'Configuração Pendente',
      pendingSetupDesc: 'Complete a configuração da sua conta para começar a receber.',
      chargesEnabled: 'Pode receber pagamentos',
      chargesDisabled: 'Pagamentos desativados',
      payoutsEnabled: 'Transferências ativadas',
      payoutsDisabled: 'Transferências desativadas',
      benefits: [
        'Pagamentos automáticos após cada serviço',
        'Transferências diretas para a sua conta',
        'Relatórios detalhados de ganhos',
        'Proteção contra fraude'
      ],
      refresh: 'Atualizar Estado',
      poweredBy: 'Pagamentos seguros por'
    },
    es: {
      title: 'Configurar Pagos',
      subtitle: 'Reciba pagos directamente en su cuenta bancaria',
      noAccount: 'Aún no ha configurado su cuenta de pagos',
      noAccountDesc: 'Configure su cuenta Stripe para comenzar a recibir pagos automáticamente.',
      createAccount: 'Crear Cuenta de Pagos',
      completeSetup: 'Completar Configuración',
      accountReady: 'Cuenta Lista para Recibir',
      accountReadyDesc: 'Su cuenta está configurada y puede recibir pagos.',
      pendingSetup: 'Configuración Pendiente',
      pendingSetupDesc: 'Complete la configuración de su cuenta para comenzar.',
      chargesEnabled: 'Puede recibir pagos',
      chargesDisabled: 'Pagos desactivados',
      payoutsEnabled: 'Transferencias activadas',
      payoutsDisabled: 'Transferencias desactivadas',
      benefits: [
        'Pagos automáticos después de cada servicio',
        'Transferencias directas a su cuenta',
        'Informes detallados de ganancias',
        'Protección contra fraude'
      ],
      refresh: 'Actualizar Estado',
      poweredBy: 'Pagos seguros por'
    },
    en: {
      title: 'Setup Payments',
      subtitle: 'Receive payments directly to your bank account',
      noAccount: 'You haven\'t set up your payment account yet',
      noAccountDesc: 'Set up your Stripe account to start receiving automatic payments when you complete services.',
      createAccount: 'Create Payment Account',
      completeSetup: 'Complete Setup',
      accountReady: 'Account Ready to Receive',
      accountReadyDesc: 'Your account is configured and can receive payments.',
      pendingSetup: 'Setup Pending',
      pendingSetupDesc: 'Complete your account setup to start receiving payments.',
      chargesEnabled: 'Can receive payments',
      chargesDisabled: 'Payments disabled',
      payoutsEnabled: 'Transfers enabled',
      payoutsDisabled: 'Transfers disabled',
      benefits: [
        'Automatic payments after each service',
        'Direct transfers to your account',
        'Detailed earnings reports',
        'Fraud protection'
      ],
      refresh: 'Refresh Status',
      poweredBy: 'Secure payments by'
    },
    fr: {
      title: 'Configurer les Paiements',
      subtitle: 'Recevez des paiements directement sur votre compte bancaire',
      noAccount: 'Vous n\'avez pas encore configuré votre compte de paiement',
      noAccountDesc: 'Configurez votre compte Stripe pour commencer à recevoir des paiements automatiques.',
      createAccount: 'Créer un Compte de Paiement',
      completeSetup: 'Terminer la Configuration',
      accountReady: 'Compte Prêt à Recevoir',
      accountReadyDesc: 'Votre compte est configuré et peut recevoir des paiements.',
      pendingSetup: 'Configuration en Attente',
      pendingSetupDesc: 'Terminez la configuration de votre compte pour commencer.',
      chargesEnabled: 'Peut recevoir des paiements',
      chargesDisabled: 'Paiements désactivés',
      payoutsEnabled: 'Transferts activés',
      payoutsDisabled: 'Transferts désactivés',
      benefits: [
        'Paiements automatiques après chaque service',
        'Transferts directs sur votre compte',
        'Rapports détaillés des gains',
        'Protection contre la fraude'
      ],
      refresh: 'Actualiser le Statut',
      poweredBy: 'Paiements sécurisés par'
    }
  };

  const t = translations[language] || translations['pt'];

  // Fetch Stripe account status
  const { data: accountStatus, isLoading, refetch } = useQuery({
    queryKey: ['stripeAccountStatus'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getStripeAccountStatus', {});
      return response.data;
    },
    refetchOnWindowFocus: true
  });

  // Create Stripe account
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('createStripeConnectAccount', {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stripeAccountStatus']);
    }
  });

  // Get onboarding link
  const getOnboardingLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('createStripeOnboardingLink', {
        return_url: window.location.href.split('?')[0] + '?tab=payments&success=true',
        refresh_url: window.location.href.split('?')[0] + '?tab=payments&refresh=true'
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    }
  });

  const handleCreateAccount = async () => {
    setIsCreating(true);
    try {
      await createAccountMutation.mutateAsync();
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartOnboarding = async () => {
    setIsOnboarding(true);
    try {
      await getOnboardingLinkMutation.mutateAsync();
    } catch (error) {
      setIsOnboarding(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  const isFullySetup = accountStatus?.charges_enabled && accountStatus?.payouts_enabled;
  const hasAccount = accountStatus?.has_account;

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className={`h-2 ${isFullySetup ? 'bg-gradient-to-r from-green-500 to-emerald-500' : hasAccount ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} />
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isFullySetup ? 'bg-green-100' : hasAccount ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                <CreditCard className={`w-6 h-6 ${isFullySetup ? 'text-green-600' : hasAccount ? 'text-yellow-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <CardTitle className="text-xl">{t.title}</CardTitle>
                <CardDescription>{t.subtitle}</CardDescription>
              </div>
            </div>
            
            {hasAccount && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refetch()}
                className="text-gray-500"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {t.refresh}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* No Account State */}
          {!hasAccount && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.noAccount}</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{t.noAccountDesc}</p>
              
              <Button 
                size="lg"
                onClick={handleCreateAccount}
                disabled={isCreating}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5 mr-2" />
                )}
                {t.createAccount}
              </Button>
            </div>
          )}

          {/* Has Account - Pending Setup */}
          {hasAccount && !isFullySetup && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.pendingSetup}</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{t.pendingSetupDesc}</p>
              
              <Button 
                size="lg"
                onClick={handleStartOnboarding}
                disabled={isOnboarding}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                {isOnboarding ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-5 h-5 mr-2" />
                )}
                {t.completeSetup}
              </Button>
            </div>
          )}

          {/* Fully Setup */}
          {isFullySetup && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.accountReady}</h3>
              <p className="text-gray-600 max-w-md mx-auto">{t.accountReadyDesc}</p>
            </div>
          )}

          {/* Status Badges */}
          {hasAccount && (
            <div className="flex flex-wrap justify-center gap-3 pt-4 border-t">
              <Badge className={accountStatus?.charges_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {accountStatus?.charges_enabled ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                {accountStatus?.charges_enabled ? t.chargesEnabled : t.chargesDisabled}
              </Badge>
              <Badge className={accountStatus?.payouts_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {accountStatus?.payouts_enabled ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                {accountStatus?.payouts_enabled ? t.payoutsEnabled : t.payoutsDisabled}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits Card */}
      {!isFullySetup && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-blue-50">
          <CardContent className="p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              {language === 'pt' ? 'Benefícios' : language === 'es' ? 'Beneficios' : language === 'fr' ? 'Avantages' : 'Benefits'}
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {t.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stripe Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Shield className="w-4 h-4" />
        {t.poweredBy}
        <span className="font-semibold text-indigo-600">Stripe</span>
      </div>
    </div>
  );
}