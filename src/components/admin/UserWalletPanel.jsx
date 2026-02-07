import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, CreditCard, TrendingUp, History } from "lucide-react";

export default function UserWalletPanel({ user, onClose }) {
  const { data: wallet, isLoading } = useQuery({
    queryKey: ["userWallet", user?.email],
    queryFn: () =>
      base44.asServiceRole.entities.UserWallet.filter({ user_email: user.email }),
  });

  const { data: transactions } = useQuery({
    queryKey: ["walletTransactions", user?.email],
    queryFn: () =>
      base44.asServiceRole.entities.WalletTransaction.filter({ user_email: user.email }, "-created_date", 10),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const walletData = wallet?.[0];

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <CardTitle>Carteira Digital</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {walletData ? (
          <>
            {/* Balance Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-4">
                <p className="text-xs text-green-700 font-semibold mb-1">Saldo Total</p>
                <p className="text-2xl font-bold text-green-900">
                  €{(walletData.balance || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-4">
                <p className="text-xs text-blue-700 font-semibold mb-1">Crédito Disponível</p>
                <p className="text-2xl font-bold text-blue-900">
                  €{(walletData.available_balance || 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={walletData.is_active ? "default" : "secondary"}>
                {walletData.is_active ? "Ativa" : "Inativa"}
              </Badge>
            </div>

            {/* Transactions */}
            {transactions && transactions.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Transações Recentes
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_date).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                      <span className={tx.amount > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {tx.amount > 0 ? "+" : ""}€{Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" disabled>
                <TrendingUp className="w-4 h-4" />
                Adicionar Saldo
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Carteira não criada</p>
            <Button className="mt-4 w-full bg-green-600 hover:bg-green-700" disabled>
              Criar Carteira
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}