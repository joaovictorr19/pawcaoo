import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.14.0';
import { resolveOrigin, adjustHotelCapacity } from '../../shared/hotelPricing.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { booking_id, action } = body;

    if (!booking_id) return Response.json({ error: 'booking_id obrigatório' }, { status: 400 });
    if (!['accept', 'reject'].includes(action)) return Response.json({ error: 'Ação inválida (accept ou reject)' }, { status: 400 });

    // Fetch booking
    const bookings = await base44.asServiceRole.entities.HotelBooking.filter({ id: booking_id });
    if (!bookings || bookings.length === 0) return Response.json({ error: 'Reserva não encontrada' }, { status: 404 });
    const booking = bookings[0];

    // Authorization: only the booking owner can respond to price proposals
    if (booking.owner_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Must be in awaiting_client state
    if (booking.price_proposal_status !== 'awaiting_client') {
      return Response.json({ error: 'Esta reserva não aguarda resposta sua' }, { status: 400 });
    }

    // ── REJECT: cancel booking and restore capacity ──
    if (action === 'reject') {
      await base44.asServiceRole.entities.HotelBooking.update(booking_id, {
        price_proposal_status: 'rejected',
        status: 'cancelled',
        cancellation_reason: 'price_proposal_rejected',
      });

      // Restore hotel capacity
      try {
        await adjustHotelCapacity(base44, booking.hotel_profile_id, booking.service_type, booking.total_dogs || 1, 'restore');
      } catch (capErr) {
        console.error('Erro ao restaurar vagas:', capErr.message);
      }

      // Notify hotel
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: booking.hotel_email,
          title: 'Proposta de Preço Recusada',
          message: `${booking.owner_name} recusou a proposta de preço de €${(booking.proposed_amount || 0).toFixed(2)} para a reserva de ${booking.checkin_date}. A reserva foi cancelada.`,
          type: 'booking',
          related_id: booking_id,
          icon: '✕'
        });
      } catch (notifErr) {
        console.error('Notification error:', notifErr.message);
      }

      return Response.json({ success: true, action: 'rejected', booking_id });
    }

    // ── ACCEPT: create Stripe checkout with proposed price ──
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

    // Get or create Stripe customer
    let customerId;
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || booking.owner_name,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    // Validate Origin
    const origin = resolveOrigin(req);

    const safeTotalAmount = booking.total_amount || booking.proposed_amount || 0;
    if (safeTotalAmount <= 0) {
      return Response.json({ error: 'Valor da reserva inválido' }, { status: 400 });
    }

    // Mark as accepted
    await base44.asServiceRole.entities.HotelBooking.update(booking_id, {
      price_proposal_status: 'accepted',
      payment_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    const SERVICE_LABELS = {
      boarding: "Alojamento", daycare: "Creche Diurna", grooming: "Grooming",
      walk_with_partner: "Passeio com Parceiro", training: "Treino", dropin: "Assistência em Casa",
    };
    const serviceLabel = SERVICE_LABELS[booking.service_type] || booking.service_type;
    const dogNames = (booking.dogs || []).map(d => d.dog_name).filter(Boolean).join(", ") || "cão";
    const dateRange = booking.checkout_date && booking.checkout_date !== booking.checkin_date
      ? `${booking.checkin_date} → ${booking.checkout_date}`
      : booking.checkin_date;

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
              name: `${serviceLabel} — ${booking.hotel_name}`,
              description: `${dogNames} · ${dateRange}${booking.total_nights > 1 ? ` (${booking.total_nights} noites)` : ''} · Preço ajustado após análise do perfil`,
            },
            unit_amount: Math.round(safeTotalAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'hotel_booking',
        hotel_booking_id: booking_id,
        hotel_profile_id: booking.hotel_profile_id,
        hotel_email: booking.hotel_email || '',
        owner_email: user.email,
        service_type: booking.service_type,
        total_amount: safeTotalAmount.toString(),
        platform_fee: (booking.platform_fee || 0).toString(),
        service_amount: (booking.service_amount || 0).toString(),
      },
      payment_intent_data: {
        capture_method: 'automatic',
        metadata: {
          hotel_booking_id: booking_id,
          hotel_email: booking.hotel_email || '',
          booking_type: 'hotel',
        }
      },
      success_url: `${origin}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}&type=hotel_booking&booking_id=${booking_id}`,
      cancel_url: `${origin}/PriceProposals?cancelled=true`,
      locale: 'pt',
    });

    // Notify hotel that client accepted
    try {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: booking.hotel_email,
        title: 'Proposta de Preço Aceite',
        message: `${booking.owner_name} aceitou a proposta de preço de €${safeTotalAmount.toFixed(2)} para a reserva de ${booking.checkin_date}. Aguardar pagamento.`,
        type: 'booking',
        related_id: booking_id,
        icon: '✓'
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr.message);
    }

    return Response.json({ url: session.url, session_id: session.id, booking_id });
  } catch (error) {
    console.error('respondPriceProposal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}