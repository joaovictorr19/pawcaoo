import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, AlertCircle, ExternalLink } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function PaymentSetup() {
  const { language } = useLanguage();

  const setupSteps = {
    pt: {
      title: "Configuração de Pagamentos - Guia do Administrador",
      subtitle: "Configure as integrações de pagamento para a plataforma PawCão",
      
      stripe: {
        title: "1️⃣ Stripe (Recomendado)",
        description: "Sistema de pagamento principal para cartões de crédito/débito",
        steps: [
          "Criar conta no Stripe: https://dashboard.stripe.com/register",
          "Ativar Stripe Connect para pagamentos split (plataforma + profissionais)",
          "Obter API Keys: Dashboard → Developers → API Keys",
          "No Base44 Dashboard: Settings → Integrations → Stripe",
          "Adicionar Secret Key e Publishable Key",
          "Configurar Webhooks para eventos de pagamento",
          "Testar com Test Mode antes de ativar Live Mode"
        ],
        fees: "Taxa Stripe: 1.5% + €0.25 por transação (Portugal)",
        docs: "https://stripe.com/docs/connect"
      },

      paypal: {
        title: "2️⃣ PayPal",
        description: "Alternativa popular para pagamentos online",
        steps: [
          "Criar conta PayPal Business: https://www.paypal.com/bizsignup",
          "Ativar PayPal Commerce Platform",
          "Obter Client ID e Secret: Dashboard → Apps & Credentials",
          "No Base44 Dashboard: Settings → Integrations → PayPal",
          "Adicionar credenciais e configurar webhooks",
          "Ativar pagamentos em EUR",
          "Testar com Sandbox antes de produção"
        ],
        fees: "Taxa PayPal: 3.4% + €0.35 por transação",
        docs: "https://developer.paypal.com/home"
      },

      mbway: {
        title: "3️⃣ MB WAY",
        description: "Método de pagamento popular em Portugal",
        steps: [
          "MB WAY pode ser integrado via SIBS ou Easypay",
          "Opção A - SIBS: Contactar SIBS API Market",
          "Opção B - Easypay: Criar conta em https://www.easypay.pt",
          "Obter Account ID e API Key",
          "Configurar MB WAY como método de pagamento",
          "Integrar API de confirmação de pagamento",
          "Testar fluxo completo de pagamento"
        ],
        fees: "Taxas variam por gateway (SIBS ~1.5%, Easypay ~2%)",
        docs: "https://developer.easypay.pt/"
      }
    },
    en: {
      title: "Payment Setup - Administrator Guide",
      subtitle: "Configure payment integrations for PawCão platform",
      
      stripe: {
        title: "1️⃣ Stripe (Recommended)",
        description: "Main payment system for credit/debit cards",
        steps: [
          "Create Stripe account: https://dashboard.stripe.com/register",
          "Enable Stripe Connect for split payments (platform + professionals)",
          "Get API Keys: Dashboard → Developers → API Keys",
          "In Base44 Dashboard: Settings → Integrations → Stripe",
          "Add Secret Key and Publishable Key",
          "Configure Webhooks for payment events",
          "Test with Test Mode before enabling Live Mode"
        ],
        fees: "Stripe Fee: 1.5% + €0.25 per transaction (Portugal)",
        docs: "https://stripe.com/docs/connect"
      },

      paypal: {
        title: "2️⃣ PayPal",
        description: "Popular alternative for online payments",
        steps: [
          "Create PayPal Business account: https://www.paypal.com/bizsignup",
          "Enable PayPal Commerce Platform",
          "Get Client ID and Secret: Dashboard → Apps & Credentials",
          "In Base44 Dashboard: Settings → Integrations → PayPal",
          "Add credentials and configure webhooks",
          "Enable EUR payments",
          "Test with Sandbox before production"
        ],
        fees: "PayPal Fee: 3.4% + €0.35 per transaction",
        docs: "https://developer.paypal.com/home"
      },

      mbway: {
        title: "3️⃣ MB WAY",
        description: "Popular payment method in Portugal",
        steps: [
          "MB WAY can be integrated via SIBS or Easypay",
          "Option A - SIBS: Contact SIBS API Market",
          "Option B - Easypay: Create account at https://www.easypay.pt",
          "Get Account ID and API Key",
          "Configure MB WAY as payment method",
          "Integrate payment confirmation API",
          "Test complete payment flow"
        ],
        fees: "Fees vary by gateway (SIBS ~1.5%, Easypay ~2%)",
        docs: "https://developer.easypay.pt/"
      }
    }
  };

  const t = setupSteps[language] || setupSteps.pt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Badge className="bg-purple-600 text-white mb-4">
            <Shield className="w-4 h-4 mr-1" />
            ADMIN ONLY
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {t.title}
          </h1>
          <p className="text-gray-600 text-lg">{t.subtitle}</p>
        </div>

        {/* Important Notice */}
        <Card className="mb-6 border-2 border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-orange-900 mb-2">
                  ⚠️ {language === 'pt' ? 'Importante' : 'Important'}
                </h3>
                <p className="text-sm text-orange-800">
                  {language === 'pt'
                    ? 'Esta configuração deve ser feita apenas por administradores. As chaves API são sensíveis e devem ser mantidas seguras. Use sempre Test/Sandbox mode antes de ativar produção.'
                    : 'This setup should only be done by administrators. API keys are sensitive and must be kept secure. Always use Test/Sandbox mode before enabling production.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stripe Setup */}
        <Card className="mb-6 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-3">
              <Shield className="w-7 h-7" />
              {t.stripe.title}
            </CardTitle>
            <p className="text-white/90 text-sm mt-2">{t.stripe.description}</p>
          </CardHeader>
          <CardContent className="p-6">
            <ol className="space-y-3 mb-4">
              {t.stripe.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-gray-700 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-3">
              <p className="text-sm text-blue-900">
                <strong>💰 {language === 'pt' ? 'Taxas' : 'Fees'}:</strong> {t.stripe.fees}
              </p>
            </div>
            <a
              href={t.stripe.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              {language === 'pt' ? 'Documentação Stripe' : 'Stripe Documentation'}
              <ExternalLink className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>

        {/* PayPal Setup */}
        <Card className="mb-6 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-400 text-white">
            <CardTitle className="flex items-center gap-3">
              💙 {t.paypal.title}
            </CardTitle>
            <p className="text-white/90 text-sm mt-2">{t.paypal.description}</p>
          </CardHeader>
          <CardContent className="p-6">
            <ol className="space-y-3 mb-4">
              {t.paypal.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-gray-700 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-3">
              <p className="text-sm text-blue-900">
                <strong>💰 {language === 'pt' ? 'Taxas' : 'Fees'}:</strong> {t.paypal.fees}
              </p>
            </div>
            <a
              href={t.paypal.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              {language === 'pt' ? 'Documentação PayPal' : 'PayPal Documentation'}
              <ExternalLink className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>

        {/* MB WAY Setup */}
        <Card className="mb-6 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
            <CardTitle className="flex items-center gap-3">
              📱 {t.mbway.title}
            </CardTitle>
            <p className="text-white/90 text-sm mt-2">{t.mbway.description}</p>
          </CardHeader>
          <CardContent className="p-6">
            <ol className="space-y-3 mb-4">
              {t.mbway.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-gray-700 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-3">
              <p className="text-sm text-green-900">
                <strong>💰 {language === 'pt' ? 'Taxas' : 'Fees'}:</strong> {t.mbway.fees}
              </p>
            </div>
            <a
              href={t.mbway.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
            >
              {language === 'pt' ? 'Documentação Easypay' : 'Easypay Documentation'}
              <ExternalLink className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <Check className="w-6 h-6" />
              {language === 'pt' ? 'Próximos Passos' : 'Next Steps'}
            </h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'pt'
                    ? 'Testar pagamentos em modo sandbox/teste'
                    : 'Test payments in sandbox/test mode'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'pt'
                    ? 'Configurar webhooks para sincronização automática'
                    : 'Configure webhooks for automatic synchronization'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'pt'
                    ? 'Ativar modo produção após testes bem-sucedidos'
                    : 'Enable production mode after successful tests'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'pt'
                    ? 'Monitorar transações e resolver disputas prontamente'
                    : 'Monitor transactions and resolve disputes promptly'}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}