const TIME_ZONE = "Europe/Lisbon";
export const STAGE_COUNT = 4;
export const STAGE_POSITIONS = [1, 2, 3, 4];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Mês civil em curso no fuso Europe/Lisbon, no formato AAAA-MM. */
export function getMonthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

/** Nome legível de um mês AAAA-MM. */
export function getMonthLabel(monthKey) {
  const [year, month] = String(monthKey || "").split("-");
  const name = MONTH_NAMES[Number(month) - 1];
  return name ? `${name} ${year}` : "deste mês";
}

/** Percentagem do progresso do nível em que a etapa é conquistada. */
export function stageThreshold(position) {
  return (100 / STAGE_COUNT) * position;
}

/** As quatro etapas, com o prémio configurado e o estado de conquista. */
export function buildStages(config, progress) {
  const value = Number(progress) || 0;
  const configured = Array.isArray(config?.stages) ? config.stages : [];
  const active = config?.is_active !== false;

  return STAGE_POSITIONS.map((position) => {
    const match = configured.find((stage) => Number(stage?.position) === position);
    const threshold = stageThreshold(position);
    return {
      position,
      threshold,
      title: (active && match?.title?.trim()) || `Etapa ${position}`,
      description: (active && match?.description) || "",
      image_url: (active && match?.image_url) || "",
      unlocked: value >= threshold,
    };
  });
}