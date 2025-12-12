import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ActiveRedemptions({ userEmail }) {
  const { data: redemptions = [] } = useQuery({
    queryKey: ['activeRedemptions', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const all = await base44.entities.Redemption.filter({
        user_email: userEmail,
        status: 'confirmed'
      }, '-created_date');
      return all;
    },
    enabled: !!userEmail,
    staleTime: 30 * 1000,
  });

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  if (redemptions.length === 0) return null;

  return (
    <Card className="glass-panel border-2 border-purple-200 shadow-xl mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Gift className="w-5 h-5 text-purple-600" />
          Meus Resgates Ativos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {redemptions.map((redemption) => (
          <div
            key={redemption.id}
            className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">{redemption.product_name}</h4>
                <p className="text-sm text-gray-600">
                  {redemption.euro_value > 0 ? `Valor: €${redemption.euro_value}` : 'Benefício especial'}
                </p>
              </div>
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Código de resgate:</p>
                  <p className="font-mono font-bold text-lg text-purple-600">
                    {redemption.redemption_code}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyCode(redemption.redemption_code)}
                  className="ml-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Use este código no checkout para aplicar o desconto
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}