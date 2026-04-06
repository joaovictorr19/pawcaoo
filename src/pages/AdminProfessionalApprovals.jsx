import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminApprovals } from "@/components/admin/AdminApprovals";

export default function AdminProfessionalApprovals() {
  const queryClient = useQueryClient();

  const { data: pendingProfiles = [], isLoading } = useQuery({
    queryKey: ['pendingProfessionals'],
    queryFn: async () => {
      try {
        // Fetch walkers and trainers with incomplete/pending verification
        const walkers = await base44.entities.WalkerProfile.filter(
          { verification_status: { "$in": ["requires_documents", "pending"] } },
          '-created_date'
        );
        const trainers = await base44.entities.TrainerProfile.filter(
          { verification_status: { "$in": ["requires_documents", "pending"] } },
          '-created_date'
        );
        return [...walkers, ...trainers];
      } catch (error) {
        console.error('Error fetching pending profiles:', error);
        return [];
      }
    }
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500 pt-24 font-medium">A carregar candidaturas...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 min-h-screen pt-20">
      <div className="mb-8 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Aprovações Pendentes</h1>
        <p className="text-slate-500 text-sm md:text-base mt-1">Gire as candidaturas de novos profissionais.</p>
      </div>
      <div className="space-y-4">
        {pendingProfiles.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="font-medium">✓ Sem candidaturas pendentes</p>
            <p className="text-xs mt-1">Todos os profissionais atualizaram seus perfis.</p>
          </div>
        ) : (
          <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">Profissionais Pendentes ({pendingProfiles.length})</h2>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['pendingProfessionals'] })}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Recarregar
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {profile.walker_name || profile.trainer_name}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {profile.created_by}
                    </p>
                    <p className="text-xs text-orange-700 font-medium mt-1">
                      Status: {profile.verification_status === 'requires_documents' ? 'Precisa documentos' : 'Pendente'}
                    </p>
                  </div>
                  <a
                    href={`${window.location.origin}/ProfessionalHubV2?email=${encodeURIComponent(profile.created_by)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 active:scale-95 transition-all"
                  >
                    → Hub V2
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}