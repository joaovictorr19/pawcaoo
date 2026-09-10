import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Hook que busca GroupWalkEvents de um profissional e calcula vagas disponíveis
 * para cada serviço de passeio em grupo, espelhando o padrão do useHotelCapacity.
 *
 * @param {object} professionalProfile - WalkerProfile/TrainerProfile do profissional
 * @returns {object} { groupServices, totalCapacity, totalAvailable, isLoading }
 */
export function useGroupWalkCapacity(professionalProfile) {
  const professionalEmail = professionalProfile?.created_by;

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["groupWalkCapacity", professionalEmail],
    queryFn: async () => {
      if (!professionalEmail) return [];
      return base44.entities.GroupWalkEvent.filter(
        { professional_email: professionalEmail, status: "open" },
        "-event_date",
        100
      );
    },
    enabled: !!professionalEmail,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    // Serviços do catálogo marcados como group_walk
    const catalogServices = (professionalProfile?.services_offered || []).filter(
      (s) => s.is_group_walk || s.service_type === "group_walk"
    );

    // Para cada serviço de grupo, soma as vagas dos eventos abertos associados
    const groupServices = catalogServices.map((svc) => {
      const relatedEvents = events.filter(
        (ev) =>
          ev.title?.toLowerCase().includes(svc.service_name?.toLowerCase()) ||
          ev.title === svc.service_name
      );

      const totalCap = svc.capacity_total || relatedEvents[0]?.capacity_total || 0;
      const availableCap =
        relatedEvents.length > 0
          ? relatedEvents.reduce((sum, ev) => sum + (ev.capacity_available ?? 0), 0)
          : totalCap;

      return {
        ...svc,
        capacity_total: totalCap,
        capacity_available: availableCap,
        openEvents: relatedEvents.length,
        isFull: availableCap <= 0 && totalCap > 0,
      };
    });

    const totalCapacity = groupServices.reduce((s, svc) => s + (svc.capacity_total || 0), 0);
    const totalAvailable = groupServices.reduce((s, svc) => s + (svc.capacity_available || 0), 0);

    return { groupServices, totalCapacity, totalAvailable, openEventsCount: events.length, isLoading };
  }, [professionalProfile, events]);
}