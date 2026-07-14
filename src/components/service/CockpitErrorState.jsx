import React from "react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function CockpitErrorState({ error }) {
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] bg-gray-900 flex items-center justify-center p-4">
      <div className="text-white text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Erro ao carregar</h2>
        <p className="text-gray-400 mb-4">{error?.message || 'Serviço não encontrado'}</p>
        <Button onClick={() => navigate(createPageUrl("ProfessionalHubV2"))}>Voltar ao Painel</Button>
      </div>
    </div>
  );
}