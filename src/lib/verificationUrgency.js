// Utilitário partilhado para cálculo de urgência e contactos rápidos
// na fila de aprovações do admin (walkers, hotéis, lojas, treinadores, abrigos).

export function getDaysWaiting(createdDate) {
  if (!createdDate) return 0;
  const created = new Date(createdDate);
  if (isNaN(created.getTime())) return 0;
  const now = new Date();
  return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
}

export function getUrgencyLevel(days) {
  if (days >= 7)
    return { label: "Urgente", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" };
  if (days >= 3)
    return { label: "Atenção", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" };
  return { label: "Recente", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" };
}

export function formatWhatsAppLink(number) {
  if (!number) return null;
  let cleaned = String(number).replace(/\D/g, "");
  if (!cleaned) return null;
  if (cleaned.startsWith("0")) cleaned = "351" + cleaned.slice(1);
  if (!cleaned.startsWith("351") && cleaned.length === 9) cleaned = "351" + cleaned;
  return `https://wa.me/${cleaned}`;
}

// Determina se um perfil esta com candidatura pendente (pending, requires_documents, ou vazio).
// type: 'walker' | 'hotel' | 'shop' | 'trainer' | 'shelter'
export function isPendingApplication(profile, type) {
  if (!profile) return false;
  const status = profile.verification_status;
  const isPending = status === 'pending' || status === 'requires_documents' || !status;
  if (!isPending) return false;
  if (type === 'walker') return !['hotel', 'shop'].includes(profile.professional_type);
  if (type === 'hotel') return profile.professional_type === 'hotel';
  if (type === 'shop') return profile.professional_type === 'shop';
  return true; // trainer, shelter
}

// Extrai contactos normalizados de qualquer tipo de perfil pendente.
export function getContactInfo(item, type) {
  const phone = item.phone || item.contact_phone || item.whatsapp_number || "";
  const whatsappNumber = item.whatsapp_number || item.phone || item.contact_phone || "";
  const email = item.created_by || item.contact_email || "";
  return {
    phone: phone || null,
    whatsapp: formatWhatsAppLink(whatsappNumber),
    email: email || null,
  };
}