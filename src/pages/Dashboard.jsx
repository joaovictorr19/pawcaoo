import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProfessionalHubV2 from './ProfessionalHubV2';

export default function Dashboard() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <div className="p-8 text-center pt-24 text-slate-500 font-medium">A carregar...</div>;

  return <ProfessionalHubV2 />;
}