import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@14.14.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { hotel_booking_id } = body;
    if (!hotel_booking_id) return Response.json({ error: 'ID da reserva em falta.' }, { status: 400 });

    // Fetch the existing booking
    const bookings = await base44.asServiceRole.entities.HotelBooking.filter({ id: hotel_booking_id });
    if (!bookings || bookings.length === 0) return Response.json({ error: 'Reserva não encontrada.' }, { status: 404 });

    const hb = bookings[0];

    // Verify ownership
    if (hb.owner_email !== user.email && hb.created_by !== user.email) {
      return Response.json({ error: 'Sem permissão para pagar esta reserva.' }, { status: 403 });
    }

    // Only allow retry on pending bookings
    if (hb.payment_status !== 'pending') {
      return Response.json({ error: 'Esta reserva já foi paga.' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

    // Get or create Stripe customer
    let customerId;
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || hb.owner_name,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    const origin = req.headers.get('origin') || 'https://pawcao.base44.app';

    const SERVICE_LABELS = {
      boarding: "Alojamento", daycare: "Creche Diurna", grooming: "Grooming",
      walk_with_partner: "Passeio com Parceiro", training: "Treino",
    };
    const serviceLabel = SERVICE_LABELS[hb.service_type] || hb.service_type;
    const dogNames = (hb.dogs || []).map(d => d.dog_name).filter(Boolean).join(", ") || "cão";
    const dateRange = hb.checkout_date && hb.checkout_date !== hb.checkin_date
      ? `${hb.checkin_date} → ${hb.checkout_date}`
      : hb.checkin_date;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${serviceLabel} — ${hb.hotel_name}`,
            description: `${dogNames} · ${dateRange}${hb.total_nights > 1 ? ` (${hb.total_nights} noites)` : ''}`,
          },
          unit_amount: Math.round((hb.total_amount || 0) * 100),
        },
        quantity: 1,
      }],
      metadata: {
        type: 'hotel_booking',
        hotel_booking_id: hb.id,
        hotel_profile_id: hb.hotel_profile_id,
        hotel_email: hb.hotel_email || '',
        owner_email: user.email,
        service_type: hb.service_type,
        total_amount: (hb.total_amount || 0).toString(),
        platform_fee: (hb.platform_fee || 0).toString(),
        service_amount: (hb.service_amount || 0).toString(),
      },
      payment_intent_data: {
        capture_method: 'automatic',
        metadata: {
          hotel_booking_id: hb.id,
          hotel_email: hb.hotel_email || '',
          booking_type: 'hotel',
        }
      },
      success_url: `${origin}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}&type=hotel_booking&booking_id=${hb.id}`,
      cancel_url: `${origin}/ClientDashboard?cancelled=true`,
      locale: 'pt',
    });

    return Response.json({ url: session.url, session_id: session.id, booking_id: hb.id });
  } catch (error) {
    console.error('Retry hotel payment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});