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
 * Constrói um link curto de perfil a partir do nome e email.
 * Retorna /p/slug-do-nome
 */
export function buildShortProfileLink(name, email) {
  const slug = slugify(name);
  if (slug) return `/p/${slug}`;
  // Fallback: usa o email se o nome não gerar um slug válido
  if (email) return `/UserProfile?email=${encodeURIComponent(email)}`;
  return '/';
}