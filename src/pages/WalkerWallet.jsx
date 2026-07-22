import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WalkerWallet from "@/components/wallet/WalkerWallet";

export default function WalkerWalletPage() {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">A carregar carteira...</div>
      </div>
    );
  }

  if (!user) {
    base44.auth.redirectToLogin(window.location.href);
    return null;
  }

  // Check if user has walker profile
  if (user.role !== 'walker' && user.role !== 'admin' && user.account_type !== 'walker' && user.account_type !== 'both') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Esta área é exclusiva para Dog Walkers. Torne-se um profissional para aceder à carteira.
          </p>
          <button
            onClick={() => navigate(createPageUrl('BecomeProfessional'))}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Tornar-me Profissional
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <WalkerWallet walkerEmail={user.email} />
    </div>
  );
}