import { base44 } from "@/api/base44Client";

/**
 * Gera um slug URL-friendly a partir de um nome.
 * Ex: "Hotel Canino das Lampreias" → "hotel-canino-das-lampreias"
 */
export function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')   // remove caracteres especiais
    .trim()
    .replace(/[\s]+/g, '-')         // espaços → hífens
    .replace(/-+/g, '-')            // hífens duplicados → um
    .replace(/^-+|-+$/g, '');       // remove hífens das pontas
}

/**
 * Resolve (ou cria) um slug único para o perfil, garantindo que nomes
 * iguais recebam um sufixo numérico (ex: hotel-canino, hotel-canino-2, hotel-canino-3).
 *
 * Retorna o link completo: /p/slug-unico
 *
 * @param {string} name        Nome do hotel ou profissional
 * @param {string} email       Email do criador do perfil
 * @param {string} entityType  Tipo: 'hotel' | 'walker' | 'trainer' | 'company'
 */
export async function ensureProfileSlug(name, email, entityType = 'walker') {
  const baseSlug = slugify(name);
  if (!baseSlug) {
    return email ? `/UserProfile?email=${encodeURIComponent(email)}` : '/';
  }

  if (!email) {
    return `/p/${baseSlug}`;
  }

  try {
    // 1. Verificar se o slug base já existe
    const existing = await base44.entities.ProfileSlug.filter({ slug: baseSlug });

    // Se já existe e pertence a este email, reutilizar
    if (existing?.length > 0) {
      const mine = existing.find(s => s.entity_email === email);
      if (mine) {
        return `/p/${baseSlug}`;
      }
    } else {
      // Slug base está livre → criar
      try {
        await base44.entities.ProfileSlug.create({
          slug: baseSlug,
          entity_type: entityType,
          entity_email: email,
          display_name: name,
        });
      } catch (e) { /* corrida concorrente — ignorar */ }
      return `/p/${baseSlug}`;
    }

    // 2. Slug base está ocupado por outro → procurar sufixo único (-2, -3, ...)
    let counter = 2;
    while (counter <= 100) {
      const candidate = `${baseSlug}-${counter}`;
      const check = await base44.entities.ProfileSlug.filter({ slug: candidate });

      if (!check || check.length === 0) {
        // Livre → criar
        try {
          await base44.entities.ProfileSlug.create({
            slug: candidate,
            entity_type: entityType,
            entity_email: email,
            display_name: name,
          });
        } catch (e) { /* corrida concorrente — tentar próximo */ }
        return `/p/${candidate}`;
      }

      // Se já existe mas pertence a este email, reutilizar
      if (check.find(s => s.entity_email === email)) {
        return `/p/${candidate}`;
      }

      counter++;
    }

    // Fallback de segurança
    return `/UserProfile?email=${encodeURIComponent(email)}`;
  } catch (e) {
    return email ? `/UserProfile?email=${encodeURIComponent(email)}` : `/p/${baseSlug}`;
  }
}

/**
 * Versão síncrona (legacy) — apenas slugifica, sem deduplicação.
 * Prefira ensureProfileSlug() para garantir unicidade.
 */
export function buildShortProfileLink(name, email) {
  const slug = slugify(name);
  if (slug) return `/p/${slug}`;
  if (email) return `/UserProfile?email=${encodeURIComponent(email)}`;
  return '/';
}