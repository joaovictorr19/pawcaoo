import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import WalkReview from "@/components/reviews/WalkReview";

export default function CockpitCompletedState({ booking, isOwner, showReview, setShowReview, onSubmitReview }) {
  const navigate = useNavigate();

  return (
    <>
      <div className="h-[100dvh] bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Passeio Concluído!</h2>
          <p className="text-gray-600 mb-6">
            {isOwner ? 'Obrigado por usar a PawCão!' : 'Serviço finalizado com sucesso!'}
          </p>
          <Button onClick={() => navigate(createPageUrl(isOwner ? 'ClientDashboard' : 'ProfessionalDashboard'))}>
            {isOwner ? 'Ver Relatório' : 'Voltar ao Painel'}
          </Button>
        </div>
      </div>

      {isOwner && (
        <WalkReview
          isOpen={showReview}
          booking={booking}
          onSubmit={onSubmitReview}
          onClose={() => {
            setShowReview(false);
            navigate(createPageUrl('ClientDashboard'));
          }}
        />
      )}
    </>
  );
}