import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Receipt, Shield, AlertTriangle, CheckCircle, 
  ArrowLeft, ExternalLink, Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageContext";
import TaxDataForm from "@/components/fiscal/TaxDataForm";
import MonthlyReportCard from "@/components/fiscal/MonthlyReportCard";
import AccountantDashboard from "@/components/fiscal/AccountantDashboard";

const FISCAL_RESOURCES = {
  PT: [
    { url: "https://www.portaldasfinancas.gov.pt", name: "Portal das Finanças", desc: "Emitir Recibos Verdes", color: "text-blue-600" },
    { url: "https://www.seg-social.pt", name: "Segurança Social", desc: "Contribuições", color: "text-blue-600" },
    { url: "https://www.moloni.pt", name: "Moloni", desc: "Software de Faturação", color: "text-purple-600" },
    { url: "https://invoicexpress.com", name: "InvoiceXpress", desc: "Software de Faturação", color: "text-purple-600" },
  ],
  ES: [
    { url: "https://sede.agenciatributaria.gob.es", name: "AEAT — Sede Electrónica", desc: "Modelos IRPF e IVA", color: "text-blue-600" },
    { url: "https://sede.seg-social.es", name: "Seguridad Social", desc: "Cotización de autónomos", color: "text-blue-600" },
    { url: "https://getquipu.com", name: "Quipu", desc: "Software de facturación", color: "text-purple-600" },
    { url: "https://www.hacienda.gob.es", name: "Hacienda", desc: "Verifactu / Facturación electrónica", color: "text-purple-600" },
  ],
  FR: [
    { url: "https://www.impots.gouv.fr", name: "impots.gouv.fr", desc: "Déclaration de revenus", color: "text-blue-600" },
    { url: "https://www.autoentrepreneur.urssaf.fr", name: "URSSAF Auto-entrepreneur", desc: "Déclaration de chiffre d'affaires", color: "text-blue-600" },
    { url: "https://facture.net", name: "Facture.net", desc: "Logiciel de facturation", color: "text-purple-600" },
    { url: "https://www.hellofacture.com", name: "HelloFacture", desc: "Logiciel de facturation", color: "text-purple-600" },
  ],
};

export default function FiscalSettings() {
  const navigate = useNavigate();
  const { language } = useLanguage();

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

  const { data: walkerProfile } = useQuery({
    queryKey: ['myWalkerProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: user?.email });
      return profiles[0];
    },
    enabled: !!user
  });

  const { data: trainerProfile } = useQuery({
    queryKey: ['myTrainerProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.TrainerProfile.filter({ created_by: user?.email });
      return profiles[0];
    },
    enabled: !!user
  });

  const isProfessional = walkerProfile || trainerProfile;

  const professionalType = walkerProfile?.professional_type === 'hotel'
    ? 'hotel'
    : (walkerProfile && trainerProfile ? 'both' : (walkerProfile ? 'walker' : 'trainer'));
  const taxCountry = taxData?.country || 'PT';

  if (!isProfessional) {
    return (
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Área Exclusiva para Profissionais</h2>
              <p className="text-gray-600 mb-6">
                Esta secção está disponível apenas para Dog Walkers e treinadores registados.
              </p>
              <Button onClick={() => navigate(createPageUrl('BecomeProfessional'))}>
                Tornar-me Profissional
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(createPageUrl("ProfessionalHubV2"))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Configurações Fiscais
            </h1>
            <p className="text-gray-600">
              Gestão de dados fiscais e relatórios de ganhos
            </p>
          </div>
        </div>

        {/* Tax Status Banner */}
        {!taxData || taxData.status === 'incomplete' ? (
          <Card className="border-2 border-yellow-300 bg-yellow-50">
            <CardContent className="p-4 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">Dados Fiscais Incompletos</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Complete os seus dados fiscais para cumprir com as obrigações legais e ter acesso aos relatórios de ganhos.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : taxData.status === 'verified' ? (
          <Card className="border-2 border-green-300 bg-green-50">
            <CardContent className="p-4 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Dados Fiscais Verificados</h3>
                <p className="text-sm text-green-700 mt-1">
                  Os seus dados fiscais foram verificados. Pode gerar relatórios para o seu contabilista.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Main Content */}
        <Tabs defaultValue="data" className="space-y-6">
          <TabsList className="bg-white shadow-md rounded-xl p-1">
            <TabsTrigger 
              value="data" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4"
            >
              <FileText className="w-4 h-4 mr-2" />
              Dados Fiscais
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg px-4"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger 
              value="invoices" 
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-4"
            >
              <FileText className="w-4 h-4 mr-2" />
              Faturas
            </TabsTrigger>
            <TabsTrigger 
              value="info" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg px-4"
            >
              <Info className="w-4 h-4 mr-2" />
              Informações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data">
            <TaxDataForm professionalType={professionalType} />
          </TabsContent>

          <TabsContent value="reports">
            <MonthlyReportCard />
          </TabsContent>

          <TabsContent value="invoices">
            <AccountantDashboard />
          </TabsContent>

          <TabsContent value="info">
            <div className="space-y-4">
              {/* Legal Info */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Informações Legais Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {taxCountry === 'PT' && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">🇵🇹 Portugal - Trabalhadores Independentes</h4>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li>• Deve estar registado nas Finanças como trabalhador independente</li>
                        <li>• Emita Recibos Verdes (Ato Isolado ou Categoria B) para cada serviço</li>
                        <li>• Se faturar menos de €12.500/ano, pode beneficiar de isenção de IVA (Art. 53º CIVA)</li>
                        <li>• Declare os seus rendimentos no IRS Anexo B</li>
                      </ul>
                    </div>
                  )}
                  {taxCountry === 'ES' && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">🇪🇸 España - Autónomos</h4>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li>• Debe darse de alta en Hacienda como autónomo (modelo 036/037)</li>
                        <li>• Emita factura por cada servicio (la facturación electrónica Verifactu es obligatoria progresivamente desde 2026)</li>
                        <li>• Puede acogerse al régimen de estimación directa simplificada si cumple los requisitos</li>
                        <li>• Declare trimestralmente el IVA (modelo 303) y los pagos fraccionados del IRPF (modelo 130)</li>
                      </ul>
                    </div>
                  )}
                  {taxCountry === 'FR' && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">🇫🇷 France - Indépendants / Micro-entrepreneur</h4>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li>• Inscrivez-vous au guichet unique de l'INPI (micro-entreprise ou entreprise individuelle)</li>
                        <li>• Émettez une facture pour chaque prestation (mentions obligatoires)</li>
                        <li>• Franchise en base de TVA sous les seuils du régime micro — déclarez votre CA mensuellement ou trimestriellement à l'URSSAF</li>
                        <li>• Déclarez vos revenus dans la déclaration annuelle (2042-C-PRO)</li>
                      </ul>
                    </div>
                  )}

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Responsabilidade</h4>
                    <p className="text-sm text-yellow-800">
                      A PawCão é uma plataforma intermediária de tecnologia. A responsabilidade pela 
                      emissão de faturas/recibos e declaração de rendimentos é de cada profissional.
                      Não existe vínculo empregatício entre a plataforma e os prestadores de serviço.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">📄 Como Usar os Relatórios</h4>
                    <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                      <li>Gere o relatório mensal no separador "Relatórios"</li>
                      <li>Descarregue o PDF e envie ao seu contabilista</li>
                      <li>Emita os recibos/faturas correspondentes</li>
                      <li>Opcionalmente, carregue os PDFs no chat com os clientes</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* External Resources */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Recursos Úteis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {FISCAL_RESOURCES[taxCountry] && FISCAL_RESOURCES[taxCountry].map(r => (
                      <a 
                        key={r.url}
                        href={r.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ExternalLink className={`w-4 h-4 ${r.color}`} />
                        <div>
                          <p className="font-medium text-sm">{r.name}</p>
                          <p className="text-xs text-gray-500">{r.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}