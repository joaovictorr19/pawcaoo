export const PODIUM_POSITIONS = [1, 2, 3];

/**
 * Prémios das três posições de um pódio (hotel ou walker).
 * Devolve sempre três entradas, com título vazio quando não há prémio definido.
 */
export function buildPodiumPrizes(config, category) {
  const list = category === "hotel" ? config?.hotel_prizes : config?.walker_prizes;
  const active = config?.is_active !== false;
  const configured = Array.isArray(list) ? list : [];

  return PODIUM_POSITIONS.map((position) => {
    const match = configured.find((prize) => Number(prize?.position) === position);
    return {
      position,
      title: (active && match?.title?.trim()) || "",
      description: (active && match?.description) || "",
      image_url: (active && match?.image_url) || "",
    };
  });
}