import Stripe from 'npm:stripe';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

const SERVICE_LABELS = {
  walk: 'Passeio',
  bathing: 'Banho',
  grooming: 'Grooming',
  training: 'Treino',
  nail_trim: 'Corte de Unhas',
  feeding: 'Alimentação',
  medication: 'Medicação',
  playtime: 'Brincadeira',
  general_care: 'Cuidados Gerais',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { bookingId, addOnIndex, successUrl, cancelUrl } = payload;

    if (!bookingId || addOnIndex === undefined) {
      return Response.json({ error: 'bookingId e addOnIndex são obrigatórios' }, { status: 400 });
    }

    // Fetch the hotel booking (user-scoped — RLS ensures owner can only see their own)
    const bookings = await base44.entities.HotelBooking.filter({ id: bookingId });
    const booking = bookings[0];
    if (!booking) {
      return Response.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    // Verify ownership
    if (booking.owner_email !== user.email && booking.created_by !== user.email) {
      return Response.json({ error: 'Sem acesso a esta reserva' }, { status: 403 });
    }

    const addOns = booking.add_ons || [];
    const addOn = addOns[addOnIndex];
    if (!addOn) {
      return Response.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    // Verify the add-on was accepted by the hotel
    if (addOn.request_status !== 'accepted') {
      return Response.json({ error: 'O hotel ainda não aceitou este serviço' }, { status: 400 });
    }

    const amount = addOn.total_price || 0;
    if (amount <= 0) {
      return Response.json({ error: 'Valor inválido' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'https://pawcao.base44.app';
    const dogNames = (booking.dogs || []).map(d => d.dog_name).join(', ') || '—';
    const serviceLabel = SERVICE_LABELS[addOn.service_name] || addOn.service_name;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${serviceLabel} — ${dogNames}`,
            description: `Serviço extra no hotel ${booking.hotel_name || ''}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl || `${origin}/ClientDashboard?addon=success`,
      cancel_url: cancelUrl || `${origin}/ClientDashboard?addon=cancelled`,
      customer_email: user.email,
      metadata: {
        booking_id: bookingId,
        add_on_index: String(addOnIndex),
        user_email: user.email,
        hotel_email: booking.hotel_email || '',
        service_name: addOn.service_name,
        type: 'hotel_addon',
      },
    });

    return Response.json({
      url: session.url,
      sessionId: session.id,
      success: true,
    });
  } catch (error) {
    console.error('❌ createHotelAddOnCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});