// Cálculo de completude de perfil partilhado entre o painel de moderação
// (AdminProfileModeration) e o dialog de pedido de atualizações
// (ProfileUpdateRequestDialog). A mesma fonte de verdade para "o que falta".

export const PROFILE_SECTIONS = {
  bio: { label: "Descrição / Bio", description: "Apresenta a tua experiência e forma de trabalhar com animais.", icon: "📝" },
  photo_url: { label: "Foto de Perfil", description: "Uma foto profissional ajuda a gerar confiança nos clientes.", icon: "📸" },
  cover_photo_url: { label: "Foto de Capa", description: "Personaliza o teu perfil com uma imagem de destaque.", icon: "🖼️" },
  portfolio: { label: "Portfólio / Fotos", description: "Mostra exemplos do teu trabalho com animais.", icon: "🐾" },
  id_document_url: { label: "Documento de Identificação", description: "Necessário para a verificação da conta.", icon: "🪪" },
  proof_of_address_url: { label: "Comprovativo de Morada", description: "Confirma a tua morada para verificação.", icon: "🏠" },
  location: { label: "Localização", description: "Onde prestas os teus serviços.", icon: "📍" },
  contact: { label: "Contacto (WhatsApp/Telefone)", description: "Para os clientes te conseguirem contactar.", icon: "📞" },
  experience_years: { label: "Anos de Experiência", description: "Há quantos anos trabalhas com animais.", icon: "⏳" },
  languages_spoken: { label: "Idiomas", description: "Idiomas que falas com os clientes.", icon: "🌍" },
  country_of_operation: { label: "País de Operação", description: "Onde operas profissionalmente.", icon: "🗺️" },
  tax_id: { label: "Dados Fiscais (NIF)", description: "Necessário para faturação e verificação.", icon: "🧾" },
  services_offered: { label: "Serviços & Preços", description: "Define o que ofereces e quanto cobras.", icon: "💶" },
  hotel_details: { label: "Detalhes do Hotel", description: "Nome, morada, capacidade e horários do hotel.", icon: "🏨" },
  full_name: { label: "Nome Completo", description: "Para personalizar a tua conta.", icon: "👤" },
  city: { label: "Cidade", description: "Para te mostrar profissionais perto de ti.", icon: "🏙️" },
  owned_dogs: { label: "Cães Registados", description: "Adiciona o(s) teu(s) cão(ões) à plataforma.", icon: "🐕" },
};

function hasStr(v) {
  return !!(v && String(v).trim());
}

function taxFieldFor(country) {
  if (country === 'spain') return 'tax_id_spain';
  if (country === 'france') return 'tax_id_france';
  return 'tax_id_portugal';
}

/**
 * Calcula a completude de um perfil.
 * @param {object} profile - o perfil (WalkerProfile / TrainerProfile / UserProfile)
 * @param {'walker'|'trainer'|'hotel'|'client'} profileKind
 * @returns {{ percentage:number, missingItems:Array, total:number, missingCount:number }}
 */
export function getProfileCompleteness(profile, profileKind = 'walker') {
  if (!profile) return { percentage: 0, missingItems: [], total: 0, missingCount: 0 };

  const checks = [];

  if (profileKind === 'client') {
    checks.push({ key: 'full_name', ok: hasStr(profile.full_name) });
    checks.push({ key: 'photo_url', ok: !!profile.profile_photo_url });
    checks.push({ key: 'bio', ok: hasStr(profile.bio) });
    checks.push({ key: 'city', ok: hasStr(profile.city) });
    checks.push({ key: 'owned_dogs', ok: Array.isArray(profile.owned_dogs) && profile.owned_dogs.length > 0 });
  } else {
    const isHotel = profileKind === 'hotel' || profile.professional_type === 'hotel';

    checks.push({ key: 'photo_url', ok: !!profile.photo_url });
    checks.push({ key: 'cover_photo_url', ok: !!profile.cover_photo_url });
    checks.push({ key: 'bio', ok: hasStr(profile.bio) });
    checks.push({ key: 'location', ok: hasStr(profile.location) });
    checks.push({ key: 'contact', ok: !!(profile.whatsapp_number || profile.phone) });
    checks.push({ key: 'experience_years', ok: profile.experience_years != null && String(profile.experience_years).trim() !== '' });
    checks.push({ key: 'languages_spoken', ok: Array.isArray(profile.languages_spoken) && profile.languages_spoken.length > 0 });
    checks.push({ key: 'services_offered', ok: Array.isArray(profile.services_offered) && profile.services_offered.some((s) => s.is_active !== false) });
    checks.push({ key: 'portfolio', ok: Array.isArray(profile.portfolio) && profile.portfolio.length > 0 });
    checks.push({ key: 'id_document_url', ok: !!profile.id_document_url });
    checks.push({ key: 'proof_of_address_url', ok: !!profile.proof_of_address_url });
    checks.push({ key: 'country_of_operation', ok: !!profile.country_of_operation });

    const tf = taxFieldFor(profile.country_of_operation);
    checks.push({ key: 'tax_id', ok: hasStr(profile[tf]) });

    if (isHotel) {
      checks.push({
        key: 'hotel_details',
        ok: !!(profile.hotel_details?.hotel_name && profile.hotel_details?.full_address && profile.hotel_details?.capacity_total),
      });
    }
  }

  const missingItems = checks
    .filter((c) => !c.ok)
    .map((c) => ({
      key: c.key,
      label: PROFILE_SECTIONS[c.key]?.label || c.key,
      description: PROFILE_SECTIONS[c.key]?.description || '',
      icon: PROFILE_SECTIONS[c.key]?.icon || '•',
    }));

  const total = checks.length;
  const missingCount = missingItems.length;
  const percentage = total > 0 ? Math.round(((total - missingCount) / total) * 100) : 0;

  return { percentage, missingItems, total, missingCount };
}