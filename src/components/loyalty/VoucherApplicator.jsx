import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function VoucherApplicator({ userEmail, onVoucherApplied }) {
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const verifyMutation = useMutation({
    mutationFn: async (code) => {
      const redemptions = await base44.entities.Redemption.filter({
        user_email: userEmail,
        redemption_code: code.toUpperCase(),
        status: 'confirmed'
      });

      if (redemptions.length === 0) {
        throw new Error('Código inválido ou já utilizado');
      }

      return redemptions[0];
    },
    onSuccess: (voucher) => {
      setAppliedVoucher(voucher);
      onVoucherApplied?.(voucher);
      toast.success(`✅ Voucher aplicado! Desconto: €${voucher.euro_value}`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleApply = () => {
    if (!voucherCode.trim()) {
      toast.error('Insira um código');
      return;
    }
    verifyMutation.mutate(voucherCode);
  };

  const handleRemove = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    onVoucherApplied?.(null);
    toast.info('Voucher removido');
  };

  if (appliedVoucher) {
    return (
      <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-green-900">{appliedVoucher.product_name}</p>
            <p className="text-sm text-green-700">Desconto: €{appliedVoucher.euro_value}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-red-600 hover:text-red-700"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Ticket className="w-5 h-5 text-purple-600" />
        <h4 className="font-bold text-gray-900">Tem um voucher PawPoints?</h4>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Digite o código (ex: PWXXX)"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
          className="flex-1 bg-white"
          maxLength={15}
        />
        <Button
          onClick={handleApply}
          disabled={verifyMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {verifyMutation.isPending ? 'A verificar...' : 'Aplicar'}
        </Button>
      </div>
      <p className="text-xs text-gray-600 mt-2">
        Use códigos obtidos através de resgates PawPoints
      </p>
    </div>
  );
}