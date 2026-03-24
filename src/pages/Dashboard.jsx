import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ProfessionalHubV2 from './ProfessionalHubV2';
import PostEmergency from './PostEmergency';
import { AnimatePresence, motion } from 'framer-motion';
import { ModeTransitionOverlay } from '@/components/ui/ModeTransitionOverlay';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetMode, setTargetMode] = useState(null);

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  const triggerTransition = async (toProfessional) => {
      setTargetMode(toProfessional ? "professional" : "owner");
      setIsTransitioning(true);
      
      await base44.auth.updateMe({
        preferences: { ...user?.preferences, current_mode: toProfessional ? "professional" : "owner" },
        pawgo_status: { ...user?.pawgo_status, is_online: toProfessional }
      });

      if ("vibrate" in navigator) navigator.vibrate([50, 30, 50]);

      setTimeout(async () => {
        await refetch();
        setIsTransitioning(false);
      }, 1500); 
  };

  // Suporte a transição disparada via navegação (botão no Home.jsx)
  useEffect(() => {
    if (location.state?.triggerTransition) {
      const toProf = location.state.toProfessional;
      navigate(location.pathname, { replace: true, state: {} });
      triggerTransition(toProf);
    }
  }, [location.state]);

  // Suporte a transição disparada via evento global (BottomNavigation)
  useEffect(() => {
    const handleEvent = (e) => triggerTransition(e.detail.toProfessional);
    window.addEventListener('triggerModeSwitch', handleEvent);
    return () => window.removeEventListener('triggerModeSwitch', handleEvent);
  }, [user]);

  if (isLoading) return <div className="p-8 text-center pt-24 text-slate-500 font-medium">A carregar...</div>;

  const currentMode = isTransitioning ? targetMode : (user?.preferences?.current_mode || "owner");

  return (
    <div className="relative min-h-screen bg-slate-50">
      <AnimatePresence>
        {isTransitioning && <ModeTransitionOverlay targetMode={targetMode} />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentMode === 'professional' ? (
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