import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      event_id,
      dog_id,
      dog_name,
      dog_size,
    } = body;

    if (!event_id || !dog_name) {
      return Response.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Fetch the group walk event
    const events = await base44.asServiceRole.entities.GroupWalkEvent.filter({ id: event_id });
    const event = events[0];

    if (!event) {
      return Response.json({ error: 'Passeio não encontrado' }, { status: 404 });
    }

    if (event.status === 'cancelled') {
      return Response.json({ error: 'Este passeio foi cancelado' }, { status: 400 });
    }

    // Check capacity
    const currentBooked = event.dogs_booked || 0;
    const maxDogs = event.max_dogs || 5;
    if (currentBooked >= maxDogs) {
      return Response.json({ error: 'Este passeio já está completo' }, { status: 400 });
    }

    // Check if user already joined
    const existingParticipant = (event.participants || []).find(
      p => p.owner_email === user.email && p.dog_id === dog_id
    );
    if (existingParticipant) {
      return Response.json({ error: 'Já te inscreveste neste passeio com este cão' }, { status: 400 });
    }

    // Check size acceptance
    if (event.accepted_sizes && event.accepted_sizes.length > 0 && dog_size) {
      if (!event.accepted_sizes.includes(dog_size)) {
        return Response.json({ error: 'O tamanho do teu cão não é aceite neste passeio' }, { status: 400 });
      }
    }

    // Look up professional's commission rate
    let walkerProfile = null;
    if (event.professional_profile_id) {
      const byId = await base44.asServiceRole.entities.WalkerProfile.filter({ id: event.professional_profile_id });
      if (byId.length > 0) walkerProfile = byId[0];
    }
    if (!walkerProfile && event.professional_email) {
      const byEmail = await base44.asServiceRole.entities.WalkerProfile.filter({ created_by: event.professional_email });
      if (byEmail.length > 0) walkerProfile = byEmail[0];
    }

    const DEFAULT_RATE = 10;
    let commissionRate = DEFAULT_RATE;
    if (walkerProfile) {
      const mode = walkerProfile.commission_rate_mode || 'default';
      if (mode === 'zero') {
        commissionRate = 0;
      } else if (mode === 'zero_temporary') {
        if (walkerProfile.commission_rate_expiry && new Date() > new Date(walkerProfile.commission_rate_expiry)) {
          commissionRate = DEFAULT_RATE;
        } else {
          commissionRate = 0;
        }
      } else if (mode === 'custom_percent') {
        commissionRate = walkerProfile.custom_commission_rate != null ? Number(walkerProfile.custom_commission_rate) : DEFAULT_RATE;
      } else if (walkerProfile.exempt_from_platform_fees === true) {
        commissionRate = 0;
      }
    }

    const serviceAmount = Number(event.price_per_dog) || 0;
    const calculatedFee = Math.round((serviceAmount * commissionRate / 100) * 100) / 100;
    const effectiveTotalAmount = serviceAmount + calculatedFee;

    // Create or get Stripe customer
    let customerId;
    const existingCustomers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    const origin = req.headers.get('origin') || 'https://pawcao.base44.app';

    const pickupLabel = event.pickup_method === 'walker_pickup'
      ? 'Profissional vai buscar'
      : `Ponto de encontro: ${event.meeting_point_address || event.location}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${event.title} com ${event.professional_name}`,
            description: `${dog_name} - ${event.event_date} às ${event.event_time}. ${pickupLabel}`,
            metadata: {
              event_id,
              dog_name,
            }
          },
          unit_amount: Math.round(effectiveTotalAmount * 100),
        },
        quantity: 1,
      }],
      metadata: {
        type: 'group_walk',
        event_id,
        professional_email: event.professional_email,
        professional_name: event.professional_name || '',
        service_amount: serviceAmount.toString(),
        platform_fee: calculatedFee.toString(),
        total_amount: effectiveTotalAmount.toString(),
        commission_rate: commissionRate.toString(),
        dog_id: dog_id || '',
        dog_name,
        dog_size: dog_size || '',
        owner_email: user.email,
        owner_name: user.full_name || '',
      },
      success_url: `${origin}/CheckoutSuccess?type=group_walk&session_id={CHECKOUT_SESSION_ID}&event_id=${event_id}`,
      cancel_url: `${origin}/UserProfile?email=${encodeURIComponent(event.professional_email)}`,
      locale: body.locale || 'auto',
      payment_intent_data: {
        capture_method: 'automatic',
        metadata: {
          booking_type: 'group_walk',
          event_id,
          owner_email: user.email,
        }
      }
    });

    return Response.json({
      url: session.url,
      session_id: session.id
    });

  } catch (error) {
    console.error('Group walk checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});