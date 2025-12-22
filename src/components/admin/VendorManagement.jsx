import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Store, DollarSign, Percent, Gift, Shield, AlertTriangle,
  Edit, Search, Filter, TrendingUp, Building2, CheckCircle, XCircle
} from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import { pt } from "date-fns/locale";

/**
 * Painel de Controle de Parceiros (Vendor Management)
 * - Lista todas as lojas integradas
 * - Toggle de Isenção de Taxa por loja
 * - Taxa Personalizada para lojas não isentas
 * - Checkout consulta estas configs antes do repasse
 */
export default function VendorManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [editingPartner, setEditingPartner] = useState(null);
  const [feeForm, setFeeForm] = useState({});

  // Buscar parceiros
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['adminPartners'],
    queryFn: () => base44.entities.Partnership.list('-created_date', 200),
  });

  // Mutation para atualizar parceiro
  const updatePartnerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Partnership.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPartners']);
      toast.success('Configurações atualizadas!');
      setEditingPartner(null);
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    }
  });

  // Toggle rápido de isenção
  const toggleFeeExemption = async (partner) => {
    const newStatus = !partner.is_fee_exempt;
    updatePartnerMutation.mutate({
      id: partner.id,
      data: { 
        is_fee_exempt: newStatus,
        fee_exemption_reason: newStatus ? 'Isenção ativada manualmente' : null,
        fee_exemption_end_date: null
      }
    });
  };

  // Filtrar parceiros
  const filteredPartners = partners.filter(p => {
    const matchesSearch = p.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || 
                        (filterType === "exempt" && p.is_fee_exempt) ||
                        (filterType === "paying" && !p.is_fee_exempt) ||
                        (filterType === "ong" && (p.partner_type === "ong" || p.partner_type === "shelter"));
    return matchesSearch && matchesType;
  });

  // Calcular métricas
  const metrics = {
    totalPartners: partners.length,
    activePartners: partners.filter(p => p.is_active).length,
    exemptPartners: partners.filter(p => p.is_fee_exempt).length,
    payingPartners: partners.filter(p => !p.is_fee_exempt && p.is_active).length,
    avgFee: partners.filter(p => !p.is_fee_exempt).reduce((acc, p) => acc + (p.custom_fee_percentage || 15), 0) / 
            Math.max(partners.filter(p => !p.is_fee_exempt).length, 1)
  };

  const getPartnerTypeLabel = (type) => {
    const labels = {
      veterinary: '🏥 Veterinária',
      pet_store: '🏪 Pet Store',
      grooming: '✂️ Grooming',
      insurance: '🛡️ Seguro',
      training: '🎓 Treino',
      ong: '💚 ONG',
      shelter: '🏠 Abrigo',
      other: '📦 Outro'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header com Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-4 h-4 opacity-80" />
              <span className="text-xs opacity-80">Total</span>
            </div>
            <p className="text-2xl font-black">{metrics.totalPartners}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 opacity-80" />
              <span className="text-xs opacity-80">Ativos</span>
            </div>
            <p className="text-2xl font-black">{metrics.activePartners}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 opacity-80" />
              <span className="text-xs opacity-80">Isentos</span>
            </div>
            <p className="text-2xl font-black">{metrics.exemptPartners}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 opacity-80" />
              <span className="text-xs opacity-80">Pagantes</span>
            </div>
            <p className="text-2xl font-black">{metrics.payingPartners}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-600 to-slate-700 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-4 h-4 opacity-80" />
              <span className="text-xs opacity-80">Taxa Média</span>
            </div>
            <p className="text-2xl font-black">{metrics.avgFee.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filterType === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterType("all")}
              >
                Todos
              </Button>
              <Button 
                variant={filterType === "paying" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterType("paying")}
                className={filterType === "paying" ? "bg-orange-500 hover:bg-orange-600" : ""}
              >
                <DollarSign className="w-3 h-3 mr-1" />
                Pagantes
              </Button>
              <Button 
                variant={filterType === "exempt" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterType("exempt")}
                className={filterType === "exempt" ? "bg-purple-500 hover:bg-purple-600" : ""}
              >
                <Gift className="w-3 h-3 mr-1" />
                Isentos
              </Button>
              <Button 
                variant={filterType === "ong" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterType("ong")}
                className={filterType === "ong" ? "bg-green-500 hover:bg-green-600" : ""}
              >
                💚 ONGs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Parceiros */}
      <div className="space-y-3">
        {isLoading ? (
          <Card><CardContent className="p-8 text-center text-gray-500">A carregar...</CardContent></Card>
        ) : filteredPartners.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500">Nenhum parceiro encontrado</CardContent></Card>
        ) : (
          filteredPartners.map((partner) => {
            const isExemptExpired = partner.fee_exemption_end_date && isPast(new Date(partner.fee_exemption_end_date));
            const effectiveFee = partner.is_fee_exempt && !isExemptExpired ? 0 : (partner.custom_fee_percentage || 15);
            
            return (
              <Card 
                key={partner.id} 
                className={`transition-all hover:shadow-md ${
                  partner.is_fee_exempt && !isExemptExpired 
                    ? 'border-l-4 border-l-purple-500 bg-purple-50/50' 
                    : 'border-l-4 border-l-orange-500'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {partner.logo_url ? (
                        <img src={partner.logo_url} alt={partner.partner_name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 truncate">{partner.partner_name}</h3>
                        <Badge variant={partner.is_active ? "success" : "secondary"} className="text-[10px]">
                          {partner.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {getPartnerTypeLabel(partner.partner_type)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{partner.email || partner.location}</p>
                      
                      {/* Status de Taxa */}
                      <div className="flex items-center gap-2 mt-2">
                        {partner.is_fee_exempt && !isExemptExpired ? (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                            <Gift className="w-3 h-3 mr-1" />
                            Isento de Taxa
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                            <Percent className="w-3 h-3 mr-1" />
                            {effectiveFee}% Taxa
                          </Badge>
                        )}
                        
                        {partner.fee_exemption_reason && partner.is_fee_exempt && (
                          <span className="text-xs text-gray-500">
                            ({partner.fee_exemption_reason})
                          </span>
                        )}
                        
                        {partner.fee_exemption_end_date && (
                          <Badge variant="outline" className={`text-[10px] ${isExemptExpired ? 'text-red-600 border-red-200' : 'text-blue-600'}`}>
                            {isExemptExpired ? '⚠️ Expirou' : `Até ${format(new Date(partner.fee_exemption_end_date), 'dd/MM/yyyy', { locale: pt })}`}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Toggle Rápido + Ações */}
                    <div className="flex items-center gap-4">
                      {/* Toggle de Isenção */}
                      <div className="flex flex-col items-center gap-1">
                        <Switch
                          checked={partner.is_fee_exempt && !isExemptExpired}
                          onCheckedChange={() => toggleFeeExemption(partner)}
                          className="data-[state=checked]:bg-purple-500"
                        />
                        <span className="text-[10px] text-gray-500">Isento</span>
                      </div>

                      {/* Editar Config */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingPartner(partner);
                              setFeeForm({
                                is_fee_exempt: partner.is_fee_exempt,
                                fee_exemption_reason: partner.fee_exemption_reason || '',
                                fee_exemption_end_date: partner.fee_exemption_end_date || '',
                                custom_fee_percentage: partner.custom_fee_percentage || 15
                              });
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Store className="w-5 h-5" />
                              Configurar Taxas: {partner.partner_name}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4 mt-4">
                            {/* Toggle Isenção */}
                            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                              <div>
                                <p className="font-semibold text-purple-900">Isenção de Taxa</p>
                                <p className="text-xs text-purple-700">Loja não paga comissão</p>
                              </div>
                              <Switch
                                checked={feeForm.is_fee_exempt}
                                onCheckedChange={(val) => setFeeForm({...feeForm, is_fee_exempt: val})}
                                className="data-[state=checked]:bg-purple-500"
                              />
                            </div>

                            {/* Campos de Isenção */}
                            {feeForm.is_fee_exempt && (
                              <>
                                <div>
                                  <Label>Motivo da Isenção</Label>
                                  <Input
                                    placeholder="Ex: Parceiro de tráfego, ONG, Promoção 6 meses..."
                                    value={feeForm.fee_exemption_reason}
                                    onChange={(e) => setFeeForm({...feeForm, fee_exemption_reason: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Data Fim da Isenção (opcional)</Label>
                                  <Input
                                    type="date"
                                    value={feeForm.fee_exemption_end_date}
                                    onChange={(e) => setFeeForm({...feeForm, fee_exemption_end_date: e.target.value})}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Deixe vazio para isenção permanente
                                  </p>
                                </div>
                              </>
                            )}

                            {/* Taxa Personalizada */}
                            {!feeForm.is_fee_exempt && (
                              <div>
                                <Label>Taxa de Comissão (%)</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={feeForm.custom_fee_percentage}
                                    onChange={(e) => setFeeForm({...feeForm, custom_fee_percentage: parseFloat(e.target.value)})}
                                    className="w-24"
                                  />
                                  <span className="text-gray-500">%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Padrão: 15%. Valores entre 0% e 50%.
                                </p>
                              </div>
                            )}

                            {/* Resumo */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                              <p className="text-sm font-semibold text-gray-900 mb-2">Resumo:</p>
                              {feeForm.is_fee_exempt ? (
                                <p className="text-sm text-purple-700">
                                  💜 Esta loja <strong>NÃO pagará</strong> comissão à PawCão.
                                  {feeForm.fee_exemption_end_date && (
                                    <span> Isenção válida até {format(new Date(feeForm.fee_exemption_end_date), 'dd/MM/yyyy', { locale: pt })}.</span>
                                  )}
                                </p>
                              ) : (
                                <p className="text-sm text-orange-700">
                                  🧡 PawCão receberá <strong>{feeForm.custom_fee_percentage}%</strong> de cada venda.
                                </p>
                              )}
                            </div>

                            <Button
                              onClick={() => {
                                updatePartnerMutation.mutate({
                                  id: partner.id,
                                  data: feeForm
                                });
                              }}
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90"
                              disabled={updatePartnerMutation.isPending}
                            >
                              {updatePartnerMutation.isPending ? 'A guardar...' : 'Guardar Configuração'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Como funciona?</p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• <strong>Isentos:</strong> Recebem 100% das vendas (ideal para ONGs, parceiros de tráfego)</li>
                <li>• <strong>Taxa Personalizada:</strong> Configure % diferente por loja (padrão 15%)</li>
                <li>• <strong>Expiração:</strong> Defina data limite para promoções temporárias</li>
                <li>• <strong>Checkout:</strong> Sistema consulta automaticamente antes do repasse</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}