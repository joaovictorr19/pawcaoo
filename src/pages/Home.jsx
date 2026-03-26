import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LandingHome } from "../components/home/LandingHome";
import UserDashboard from "../components/home/UserDashboard";

export default function Home() {
  const navigate = useNavigate();

  const { data: allWalkers = [], isLoading: loadingWalkers } = useQuery({
    queryKey: ['allWalkers'],
    queryFn: async () => {
      try {
        const result = await base44.entities.WalkerProfile.list('-created_date', 500);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error("Erro walkers:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: emergencyWalks = [], isLoading: loadingEmergency } = useQuery({
    queryKey: ['emergencyWalks'],
    queryFn: async () => {
      try {
        const res = await base44.entities.EmergencyWalk.filter({ status: 'available' }, '-created_date', 15);
        if (!Array.isArray(res)) return [];
        const uniqueMap = new Map();
        res.forEach(walk => {
          if (walk.id && !uniqueMap.has(walk.id)) {
            uniqueMap.set(walk.id, walk);
          }
        });
        return Array.from(uniqueMap.values());
      } catch (error) {
        console.error("Emergency walks fetch error:", error);
        return [];
      }
    },
    initialData: [],
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        let u = await base44.auth.me();
        const imp = JSON.parse(localStorage.getItem('impersonation') || 'null');
        if (imp?.targetUserId && u?.role === 'admin') {
           const t = await base44.entities.User.filter({ id: imp.targetUserId });
           if (t.length > 0) u = { ...t[0], isImpersonating: true };
        }
        return u;
      } catch (err) {
        return null;
      }
    },
    retry: false,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const handleBecomePro = () => {
    base44.auth.redirectToLogin(createPageUrl('BecomeProfessional'));
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative w-full overflow-hidden">
      <div className="relative z-10 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          {user ? (
            <UserDashboard 
              user={user}
              allWalkers={allWalkers}
              emergencyWalks={emergencyWalks}
            />
          ) : (
            <LandingHome 
              onLogin={handleLogin}
              onRegisterPro={handleBecomePro}
            />
          )}
        </div>
      </div>
    </div>
  );
}