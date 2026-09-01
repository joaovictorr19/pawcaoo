// Helpers to unify walk/training Payment records with HotelBooking financials
// so the admin finance & overview panels reflect real platform-wide revenue.
//
// Hotel bookings store their financials (total_amount, platform_fee,
// service_amount) directly on the HotelBooking entity — they are NOT mirrored
// into the Payment entity. These helpers build synthetic Payment-like entries
// from paid/refunded hotel bookings so they can be merged with Payment records
// for unified KPIs, charts and transaction lists.

// Build a synthetic Payment-like entry from a HotelBooking.
// Only paid/refunded hotel bookings are mapped (pending-payment bookings
// represent no received money and are excluded from revenue).
export function hotelBookingToPaymentEntry(hb) {
  if (!hb) return null;
  const paid = hb.payment_status === 'paid';
  const refunded = hb.payment_status === 'refunded';
  const cancelled = hb.status === 'cancelled' || hb.status === 'rejected';

  let status = 'pending';
  if (refunded) status = 'refunded';
  else if (paid && !cancelled) status = 'held';
  else if (cancelled) status = 'failed';

  return {
    id: `hotel_${hb.id}`,
    _source: 'hotel',
    booking_id: hb.id,
    recipient_email: hb.hotel_email || '',
    recipient_name: hb.hotel_name || '',
    payer_email: hb.owner_email || '',
    payer_name: hb.owner_name || '',
    service_amount: Number(hb.service_amount) || 0,
    platform_fee: Number(hb.platform_fee) || 0,
    total_amount: Number(hb.total_amount) || 0,
    refund_amount: refunded ? Number(hb.total_amount) || 0 : 0,
    status,
    held_date: paid ? (hb.updated_date || hb.created_date) : null,
    created_date: hb.created_date,
    service_type: hb.service_type,
  };
}

// Merge walk/training payments with synthetic hotel payments, sorted newest
// first so "recent transactions" lists are correct.
export function mergePayments(payments = [], hotelBookings = []) {
  const hotelEntries = (hotelBookings || [])
    .filter(hb => hb.payment_status === 'paid' || hb.payment_status === 'refunded')
    .map(hotelBookingToPaymentEntry)
    .filter(Boolean);
  return [...(payments || []), ...hotelEntries]
    .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
}