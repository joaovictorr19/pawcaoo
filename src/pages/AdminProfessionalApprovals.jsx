import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminApprovals } from "@/components/admin/AdminApprovals";

export default function AdminProfessionalApprovals() {
  const queryClient = useQueryClient();

  const { data: pendingUsers = [], isLoading } = useQuery({
    queryKey: ['pendingProfessionals'],
    queryFn: async () => {
      try {
        const allUsers = await base44.entities.User.list();
        return allUsers.filter(u => u.professional_profile?.verification_status === "pending");
      } catch (error) {
        console.error(error);
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
      <AdminApprovals
        pendingUsers={pendingUsers}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['pendingProfessionals'] })}
      />
    </div>
  );
}