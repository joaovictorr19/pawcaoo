import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProfessionalHubV2 from './ProfessionalHubV2';
import PostEmergency from './PostEmergency';
import { AnimatePresence, motion } from 'framer-motion';

export default function Dashboard() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  if (isLoading) return <div className="p-8 text-center pt-24 text-slate-500 font-medium">A carregar...</div>;

  const isProfessionalMode = user?.preferences?.current_mode === 'professional';

  return (
    <div className="min-h-screen bg-slate-50">
      <AnimatePresence mode="wait">
        {isProfessionalMode ? (
          <motion.div 
            key="professional"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <ProfessionalHubV2 /> 
          </motion.div>
        ) : (
          <motion.div 
            key="client"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <PostEmergency /> 
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}