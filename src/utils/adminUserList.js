const PLACEHOLDER_NAMES = ['n/a', 'na', 'null', 'undefined', 'unknown', 'sem nome', 'utilizador', 'user'];

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hasRealName(user) {
  const name = String(user?.full_name || '').trim();
  if (!name) return false;
  return !PLACEHOLDER_NAMES.includes(name.toLowerCase());
}

/**
 * Human-readable name for a user row. Falls back to a name derived from the
 * username or the email local-part so no row ever shows "N/A" or a blank cell.
 */
export function deriveDisplayName(user) {
  if (hasRealName(user)) return String(user.full_name).trim();

  const stored = String(user?.username || '').trim();
  const local = String(user?.email || '').split('@')[0] || '';
  const base = (stored || local).replace(/[._\-+]+/g, ' ').replace(/\d+/g, ' ').trim();

  if (!base) return 'Sem nome';

  return base
    .split(/\s+/)
    .slice(0, 3)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function isDerivedName(user) {
  return !hasRealName(user);
}

function recency(user) {
  const date = user?.updated_date || user?.created_date;
  const time = date ? new Date(date).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

/**
 * Collapses duplicate rows (same account reachable twice) into one entry per
 * user, keeping the record that has a real name and, among those, the newest.
 * Rows without an email are kept as-is, keyed by their id.
 */
export function dedupeUsers(users) {
  const list = Array.isArray(users) ? users : [];
  const byKey = new Map();

  list.forEach(user => {
    if (!user) return;
    const key = normalizeEmail(user.email) || user.id;
    if (!key) return;

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, user);
      return;
    }

    const existingScore = (hasRealName(existing) ? 2 : 0) + (existing.full_name ? 1 : 0);
    const score = (hasRealName(user) ? 2 : 0) + (user.full_name ? 1 : 0);

    if (score > existingScore || (score === existingScore && recency(user) > recency(existing))) {
      byKey.set(key, user);
    }
  });

  return Array.from(byKey.values());
}