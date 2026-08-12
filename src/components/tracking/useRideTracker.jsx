// Tracking disabled — no-op
// Rastreamento GPS de passeios desativado. A localização só é pedida quando o
// utilizador toca explicitamente num botão de GPS (ex.: formulários de reserva).
function useRideTracker() {
  return {
    location: null,
    isTracking: false,
    error: null,
    distance: 0,
    startTracking: async () => {},
    stopTracking: async () => {},
    finishRide: async () => {},
  };
}

export default useRideTracker;