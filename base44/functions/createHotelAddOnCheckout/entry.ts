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
  pet_food: 'Ração / Alimento',
  treats: 'Petiscos',
  toys: 'Brinquedos',
  accessories: 'Acessórios',
  bed: 'Cama / Conforto',
  hygiene: 'Higiene / Shampoo',
  other_product: 'Produto',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { bookingId, addOnIndex, successUrl, cancelUrl, initiatedBy } = payload;

    if (!bookingId || addOnIndex === undefined) {
      return Response.json({ error: 'bookingId e addOnIndex são obrigatórios' }, { status: 400 });
    }

    // Fetch the hotel booking
    const bookings = await base44.entities.HotelBooking.filter({ id: bookingId });
    const booking = bookings[0];
    if (!booking) {
      return Response.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    // Access: hotel owner (created_by / hotel_email) or client (owner_email)
    const isHotel = booking.created_by === user.email || booking.hotel_email === user.email;
    const isClient = booking.owner_email === user.email;
    if (!isHotel && !isClient) {
      return Response.json({ error: 'Sem acesso a esta reserva' }, { status: 403 });
    }

    const addOns = booking.add_ons || [];
    const addOn = addOns[addOnIndex];
    if (!addOn) {
      return Response.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    // When hotel initiates, the add-on is auto-accepted; skip the status gate.
    // When client initiates, require hotel acceptance first.
    if (initiatedBy !== 'hotel' && addOn.request_status !== 'accepted') {
      return Response.json({ error: 'O hotel ainda não aceitou este serviço' }, { status: 400 });
    }

    // Customer email: the client pays, not the hotel
    const customerEmail = booking.owner_email || user.email;

    const amount = addOn.total_price || 0;
    if (amount <= 0) {
      return Response.json({ error: 'Valor inválido' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'https://pawcao.base44.app';
    const dogNames = (booking.dogs || []).map(d => d.dog_name).join(', ') || '—';
    const serviceLabel = SERVICE_LABELS[addOn.service_name] || addOn.service_name;
    const productName = addOn.item_name || serviceLabel;
    const isProduct = addOn.item_category === 'product';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: isProduct
              ? `${productName} — ${dogNames}`
              : `${serviceLabel} — ${dogNames}`,
            description: isProduct
              ? `Produto vendido no hotel ${booking.hotel_name || ''}`
              : `Serviço extra no hotel ${booking.hotel_name || ''}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      locale: 'pt',
      success_url: successUrl || `${origin}/ClientDashboard?addon=success`,
      cancel_url: cancelUrl || `${origin}/ClientDashboard?addon=cancelled`,
      customer_email: customerEmail,
      metadata: {
        booking_id: bookingId,
        add_on_index: String(addOnIndex),
        user_email: user.email,
        customer_email: customerEmail,
        hotel_email: booking.hotel_email || '',
        service_name: addOn.service_name,
        type: 'hotel_addon',
        initiated_by: initiatedBy || 'client',
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