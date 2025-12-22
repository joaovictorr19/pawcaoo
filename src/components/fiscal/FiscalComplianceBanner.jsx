import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function FiscalComplianceBanner() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: taxData } = useQuery({
    queryKey: ['myTaxData'],
    queryFn: async () => {
      const records = await base44.entities.ProfessionalTaxData.filter({ 
        professional_email: user?.email 
      });
      return records[0] || null;
    },
    enabled: !!user
  });

  const { data: pendingPayouts = [] } = useQuery({
    queryKey: ['pendingPayouts'],
    queryFn: async () => {
      const payouts = await base44.entities.WalkerPayout.filter({
        walker_email: user?.email,
        status: 'pending'
      });
      return payouts;
    },
    enabled: !!user
  });

  // Calculate blocked amount
  const blockedAmount = pendingPayouts.reduce((sum, p) => sum + (p.net_amount || 0), 0);

  // Don't show if verified
  if (taxData?.status === 'verified') {
    return null;
  }

  const getStatusConfig = () => {
    if (!taxData || !taxData.tax_id) {
      return {
        icon: XCircle,
        color: "border-red-500 bg-red-50",
        iconColor: "text-red-600",
        title: "⚠️ DADOS FISCAIS OBRIGATÓRIOS",
        message: "Para receber os seus ganhos, deve completar os dados fiscais (NIF/NIE/SIRET). Os pagamentos estão bloqueados até regularizar.",
        buttonText: "Completar Dados Fiscais",
        buttonColor: "bg-red-600 hover:bg-red-700"
      };
    }

    if (taxData.status === 'pending_verification') {
      return {
        icon: Clock,
        color: "border-yellow-500 bg-yellow-50",
        iconColor: "text-yellow-600",
        title: "🕐 AGUARDA VERIFICAÇÃO",
        message: "Os seus dados fiscais estão em análise. Os pagamentos serão liberados após a verificação (normalmente 24-48h).",
        buttonText: "Ver Estado",
        buttonColor: "bg-yellow-600 hover:bg-yellow-700"
      };
    }

    if (taxData.status === 'rejected') {
      return {
        icon: AlertTriangle,
        color: "border-red-500 bg-red-50",
        iconColor: "text-red-600",
        title: "❌ DADOS REJEITADOS",
        message: `Motivo: ${taxData.rejection_reason || 'Contacte o suporte'}. Corrija os dados para desbloquear pagamentos.`,
        buttonText: "Corrigir Dados",
        buttonColor: "bg-red-600 hover:bg-red-700"
      };
    }

    return {
      icon: AlertTriangle,
      color: "border-orange-500 bg-orange-50",
      iconColor: "text-orange-600",
      title: "⚠️ REGULARIZAÇÃO NECESSÁRIA",
      message: "Complete todos os campos obrigatórios para desbloquear os pagamentos.",
      buttonText: "Completar",
      buttonColor: "bg-orange-600 hover:bg-orange-700"
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={`border-2 ${config.color} shadow-lg mb-6`}>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className={`p-3 rounded-full ${config.color} flex-shrink-0`}>
            <Icon className={`w-6 h-6 md:w-8 md:h-8 ${config.iconColor}`} />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1">
              {config.title}
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              {config.message}
            </p>

            {blockedAmount > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-red-600 text-white text-sm">
                  💰 €{blockedAmount.toFixed(2)} Bloqueados
                </Badge>
                <span className="text-xs text-gray-600">
                  {pendingPayouts.length} pagamento{pendingPayouts.length !== 1 ? 's' : ''} pendente{pendingPayouts.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => navigate(createPageUrl('FiscalSettings'))}
                className={`${config.buttonColor} text-white shadow-md`}
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                {config.buttonText}
              </Button>

              {taxData?.status === 'pending_verification' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://wa.me/351910000000', '_blank')}
                >
                  Contactar Suporte
                </Button>
              )}
            </div>
          </div>

          {/* Legal disclaimer */}
          <div className="text-xs text-gray-500 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4 border-gray-300 max-w-xs">
            <p className="font-semibold mb-1">⚖️ Informação Legal:</p>
            <p>A PawCão é uma plataforma intermediária. A responsabilidade pela declaração de rendimentos e situação fiscal é do profissional.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}