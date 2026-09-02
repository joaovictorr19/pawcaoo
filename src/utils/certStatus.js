// Estado de validade de uma certificação/licença — partilhado entre o perfil público e o editor do hotel
export function getCertStatus({ expiry_date, no_expiry } = {}) {
  if (no_expiry) return "permanent";
  if (!expiry_date) return "valid";
  const exp = new Date(expiry_date);
  if (isNaN(exp.getTime())) return "valid";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (exp < today) return "expired";
  const daysLeft = (exp - today) / 86400000;
  if (daysLeft <= 90) return "expiring_soon";
  return "valid";
}

export const CERT_STATUS_META = {
  permanent: {
    labelPt: "Permanente",
    labelEn: "Permanent",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-300",
    bar: "border-l-emerald-500",
  },
  valid: {
    labelPt: "Válida",
    labelEn: "Valid",
    chip: "bg-teal-50 text-teal-700 border-teal-300",
    bar: "border-l-teal-500",
  },
  expiring_soon: {
    labelPt: "Expira em breve",
    labelEn: "Expiring soon",
    chip: "bg-amber-50 text-amber-700 border-amber-300",
    bar: "border-l-amber-500",
  },
  expired: {
    labelPt: "Expirada",
    labelEn: "Expired",
    chip: "bg-red-50 text-red-700 border-red-300",
    bar: "border-l-red-500",
  },
};