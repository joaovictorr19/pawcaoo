import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Rastreia a posição do profissional em tempo real via Geolocation API
 * e guarda na entidade WalkerProfile (campos walker_lat, walker_lng).
 *
 * @param {string} walkerId  - ID do WalkerProfile a atualizar
 * @param {string} bookingId - ID do Booking ativo (para atualizar route_coordinates)
 * @param {boolean} isWalking - Ativa/desativa o tracking
 */
export function useLiveTracking(walkerId, bookingId, isWalking) {
  useEffect(() => {
    if (!isWalking || !walkerId) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const timestamp = new Date().toISOString();

        console.log("📍 Localização enviada:", latitude, longitude);

        // 1. Atualiza posição atual no WalkerProfile
        try {
          await base44.entities.WalkerProfile.update(walkerId, {
            latitude,
            longitude,
          });
        } catch (err) {
          console.error("Erro ao atualizar WalkerProfile:", err);
        }

        // 2. Guarda ponto na rota do Booking (se existir)
        if (bookingId) {
          try {
            const bookings = await base44.entities.Booking.filter({ id: bookingId });
            const booking = bookings[0];
            if (booking) {
              const route = booking.route_coordinates || [];
              await base44.entities.Booking.update(bookingId, {
                walker_lat: latitude,
                walker_lng: longitude,
                last_update: timestamp,
                route_coordinates: [
                  ...route,
                  { lat: latitude, lng: longitude, timestamp },
                ],
              });
            }
          } catch (err) {
            console.error("Erro ao atualizar Booking route:", err);
          }
        }
      },
      (error) => console.error("Erro GPS:", error),
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isWalking, walkerId, bookingId]);
}