import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard, CheckCircle2, AlertCircle, Loader2, ExternalLink, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

/**
 * Stripe Connect Setup — permite a profissionais criar a conta Stripe
 * e completar o onboarding para receber pagamentos.
 * Usa as funções backend canónicas: getStripeAccountStatus,
 * createStripeConnectAccount e createStripeOnboardingLink.
 */
export default function StripeConnectSetup() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const fetchStatus = async () => {
    setRefreshing(true);
    try {
      const res = await base44.functions.invoke('getStripeAccountStatus', {});
      setStatus(res);
    } catch (error) {
      console.error("Error fetching Stripe status:", error);
      toast.error("Falha ao obter o estado da conta Stripe");
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) fetchStatus();
  }, [user]);

  // Retorno do onboarding do Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success("Onboarding concluído com sucesso!");
      fetchStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const createAccount = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('createStripeConnectAccount', {});
      if (res?.account_id) {
        toast.success(res.already_exists ? "Conta já existente encontrada." : "Conta criada! Complete o onboarding.");
        await startOnboarding();
        await fetchStatus();
      } else {
        toast.error(res?.error || "Falha ao criar conta");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error(error?.message || "Falha ao criar conta Stripe. Verifique se tem perfil profissional.");
    }
    setLoading(false);
  };

  const startOnboarding = async () => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const res = await base44.functions.invoke('createStripeOnboardingLink', {
        refresh_url: `${baseUrl}/StripeConnectSetup?refresh=true`,
        return_url: `${baseUrl}/StripeConnectSetup?success=true`,
      });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        toast.error(res?.error || "Falha ao criar link de onboarding");
      }
    } catch (error) {
      console.error("Error creating onboarding link:", error);
      toast.error("Falha ao iniciar onboarding");
    }
    setLoading(false);
  };

  const getStatusBadge = () => {
    if (!status?.has_account) return <Badge variant="outline">Sem Conta</Badge>;
    if (status.charges_enabled && status.payouts_enabled) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Ativa
        </Badge>
      );
    }
    if (status.onboarding_complete) {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Em Verificação
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-500 text-white">
        <AlertCircle className="w-3 h-3 mr-1" /> Onboarding Incompleto
      </Badge>
    );
  };

  const StatusCell = ({ label, ok, okText = "Ativo", koText = "Inativo" }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <Label className="text-sm text-gray-600">{label}</Label>
      <div className="flex items-center gap-2 mt-2">
        {ok ? (
          <><CheckCircle2 className="w-5 h-5 text-green-600" /><span className="text-green-600 font-semibold">{okText}</span></>
        ) : (
          <><AlertCircle className="w-5 h-5 text-orange-500" /><span className="text-orange-500 font-semibold">{koText}</span></>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <CreditCard className="w-10 h-10 text-blue-600" />
            Configuração de Pagamentos
          </h1>
          <p className="text-gray-600">
            Configure a sua conta Stripe para receber os seus ganhos diretamente
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Estado da Conta</CardTitle>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!status ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : !status.has_account ? (
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sem Conta Ligada</h3>
                <p className="text-gray-600 mb-4">
                  Crie uma conta Stripe para começar a receber pagamentos
                </p>
                <Button onClick={createAccount} disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A criar...</>
                  ) : (
                    <><CreditCard className="w-4 h-4 mr-2" /> Criar Conta Stripe</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Label className="text-sm text-gray-600">ID da Conta</Label>
                  <p className="font-mono text-sm text-gray-900 mt-1">{status.account_id}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <StatusCell label="Cobranças" ok={status.charges_enabled} />
                  <StatusCell label="Levantamentos" ok={status.payouts_enabled} />
                  <StatusCell label="Dados" ok={status.onboarding_complete} okText="Completo" koText="Incompleto" />
                </div>

                {status.requirements?.currently_due?.length > 0 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <AlertDescription className="text-orange-900">
                      <strong>Ação Necessária:</strong> Complete o onboarding para ativar os pagamentos.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-4">
                  {!status.charges_enabled && (
                    <Button onClick={startOnboarding} disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600">
                      {loading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A carregar...</>
                      ) : (
                        <><ExternalLink className="w-4 h-4 mr-2" /> Completar Onboarding</>
                      )}
                    </Button>
                  )}
                  <Button onClick={fetchStatus} disabled={refreshing} variant="outline">
                    {refreshing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A atualizar...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 mr-2" /> Atualizar Estado</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}