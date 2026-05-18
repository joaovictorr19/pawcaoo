import React from "react";

export default function CockpitLoadingState() {
  return (
    <div className="h-[100dvh] bg-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p>A carregar serviço...</p>
      </div>
    </div>
  );
}