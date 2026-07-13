import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@14.14.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      hotel_profile_id,
      hotel_name,
      hotel_email,
      owner_name,
      owner_email,
      owner_phone,
      dogs,
      service_type,
      checkin_date,
      checkout_date,
      checkin_time,
      checkout_time,
      total_nights,
      total_dogs,
      price_per_night,
      total_amount,
      platform_fee,
      service_amount,
      special_requests,
      assigned_walker_email,
      assigned_walker_name,
      add_ons,
      add_ons_total,
      pickup_address,
      delivery_method,
    } = body;

    if (!hotel_profile_id || !total_amount || total_amount <= 0) {
      return Response.json({ error: 'Dados inválidos para o pagamento.' }, { status: 400 });
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
        name: user.full_name || owner_name,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    const origin = req.headers.get('origin') || 'https://pawcao.base44.app';

    const SERVICE_LABELS = {
      boarding: "Alojamento",
      daycare: "Creche Diurna",
      grooming: "Grooming",
      walk_with_partner: "Passeio com Parceiro",
      training: "Treino",
    };
    const serviceLabel = SERVICE_LABELS[service_type] || service_type;
    const dogNames = (dogs || []).map(d => d.dog_name).filter(Boolean).join(", ") || "cão";
    const dateRange = checkout_date && checkout_date !== checkin_date
      ? `${checkin_date} → ${checkout_date}`
      : checkin_date;

    // Pre-create the booking as "pending" before redirecting to checkout
    const newBooking = await base44.asServiceRole.entities.HotelBooking.create({
      hotel_profile_id,
      hotel_name,
      hotel_email,
      owner_name: owner_name || user.full_name,
      owner_email: owner_email || user.email,
      owner_phone: owner_phone || '',
      dogs: dogs || [],
      service_type,
      checkin_date,
      checkout_date: checkout_date || checkin_date,
      checkin_time: checkin_time || '',
      checkout_time: checkout_time || '',
      total_nights: total_nights || 1,
      total_dogs: total_dogs || (dogs?.length || 1),
      price_per_night: price_per_night || 0,
      total_amount,
      platform_fee: platform_fee || 0,
      service_amount: service_amount || total_amount,
      special_requests: special_requests || '',
      pickup_address: pickup_address || '',
      delivery_method: delivery_method || 'dropoff',
      assigned_walker_email: assigned_walker_email || '',
      assigned_walker_name: assigned_walker_name || '',
      add_ons: add_ons || [],
      add_ons_total: add_ons_total || 0,
      status: 'pending',
      payment_status: 'pending',
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${serviceLabel} — ${hotel_name}`,
              description: `${dogNames} · ${dateRange}${total_nights > 1 ? ` (${total_nights} noites)` : ''}`,
            },
            unit_amount: Math.round(total_amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'hotel_booking',
        hotel_booking_id: newBooking.id,
        hotel_profile_id,
        hotel_email: hotel_email || '',
        owner_email: user.email,
        service_type,
        total_amount: total_amount.toString(),
        platform_fee: (platform_fee || 0).toString(),
        service_amount: (service_amount || total_amount).toString(),
      },
      payment_intent_data: {
        capture_method: 'automatic',
        metadata: {
          hotel_booking_id: newBooking.id,
          hotel_email: hotel_email || '',
          booking_type: 'hotel',
        }
      },
      success_url: `${origin}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}&type=hotel_booking&booking_id=${newBooking.id}`,
      cancel_url: `${origin}/ClientDashboard?cancelled=true`,
      locale: 'pt',
    });

    return Response.json({ url: session.url, session_id: session.id, booking_id: newBooking.id });

  } catch (error) {
    console.error('Hotel checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});