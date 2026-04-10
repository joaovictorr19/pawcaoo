export function getStartToken(booking) {
  const id = booking?.id || '';
  return booking?.pickup_token || `PK-${String(id).slice(0, 8).toUpperCase()}`;
}

export function getEndToken(booking) {
  const id = booking?.id || '';
  return booking?.dropoff_token || `DO-${String(id).slice(-8).toUpperCase()}`;
}

export function encodeQR(booking, type = 'START') {
  const token = type === 'START' ? getStartToken(booking) : getEndToken(booking);
  return JSON.stringify({ v: 1, bookingId: booking?.id, type, token, ts: Date.now() });
}

export function tryDecodeQR(value) {
  let decoded = null;
  if (typeof value === 'string') {
    try { decoded = JSON.parse(value); } catch { decoded = null; }
  } else if (value && typeof value === 'object') {
    decoded = value;
  }

  if (decoded && decoded.token) return decoded;

  if (typeof value === 'string') {
    if (value.startsWith('PK-')) return { type: 'START', token: value };
    if (value.startsWith('DO-')) return { type: 'END', token: value };
    if (value.startsWith('PAWGO-CONFIRM-')) return { type: 'DELIVERY_CONFIRM', token: value, walkId: value.replace('PAWGO-CONFIRM-', '') };
  }
  return { type: 'UNKNOWN', token: value };
}

export function validateForBooking(booking, decoded, preferredType) {
  const start = getStartToken(booking);
  const end = getEndToken(booking);
  const tok = decoded?.token ? String(decoded.token) : '';
  const type = decoded?.type || preferredType;

  if (type === 'START' || tok === start) return { valid: tok.toUpperCase() === start.toUpperCase(), step: 'start' };
  if (type === 'END' || tok === end) return { valid: tok.toUpperCase() === end.toUpperCase(), step: 'end' };

  if (tok.toUpperCase() === start.toUpperCase()) return { valid: true, step: 'start' };
  if (tok.toUpperCase() === end.toUpperCase()) return { valid: true, step: 'end' };
  return { valid: false, step: null };
}

export function buildDeliveryConfirm(walkId) {
  return `PAWGO-CONFIRM-${String(walkId)}`;
}

export function decodeDeliveryConfirm(value) {
  if (typeof value !== 'string') return { valid: false, walkId: null };
  if (!value.startsWith('PAWGO-CONFIRM-')) return { valid: false, walkId: null };
  return { valid: true, walkId: value.replace('PAWGO-CONFIRM-', '') };
}