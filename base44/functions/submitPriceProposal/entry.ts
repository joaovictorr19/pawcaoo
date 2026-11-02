import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { computeHotelPayoutSplit, resolveOrigin } from '../../shared/hotelPricing.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { booking_id, proposed_amount, justification, action } = body;

    if (!booking_id) return Response.json({ error: 'booking_id obrigatório' }, { status: 400 });
    // "Sem ajuste" não precisa de valor — só valida proposed_amount quando o hotel propõe um novo preço
    if (action !== 'no_adjustment' && (!proposed_amount || proposed_amount <= 0)) {
      return Response.json({ error: 'Valor proposto inválido' }, { status: 400 });
    }

    // Fetch booking
    const bookings = await base44.asServiceRole.entities.HotelBooking.filter({ id: booking_id });
    if (!bookings || bookings.length === 0) return Response.json({ error: 'Reserva não encontrada' }, { status: 404 });
    const booking = bookings[0];

    // Authorization: only the hotel owner can submit price proposals
    if (booking.hotel_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Only grooming bookings can have price proposals
    if (booking.service_type !== 'grooming') {
      return Response.json({ error: 'Propostas de preço apenas disponíveis para banho & tosquias' }, { status: 400 });
    }

    // Must be in pending_review or no_adjustment state to submit
    if (!['pending_review', 'no_adjustment', 'awaiting_client'].includes(booking.price_proposal_status || 'pending_review')) {
      return Response.json({ error: 'Esta reserva já tem uma proposta processada' }, { status: 400 });
    }

    const originalAmount = booking.original_amount || booking.total_amount;
    const proposedAmount = Math.round(Number(proposed_amount) * 100) / 100;

    // Recalculate platform fee based on hotel commission settings
    const hotelProfiles = await base44.asServiceRole.entities.WalkerProfile.filter({ id: booking.hotel_profile_id });
    if (!hotelProfiles || hotelProfiles.length === 0) return Response.json({ error: 'Hotel não encontrado' }, { status: 404 });
    const hotel = hotelProfiles[0];

    // Calculate transport fee — keep existing transport fee
    const transportFee = booking.transport_price || 0;
    const { totalAmount: newTotalAmount, serviceAmount: newServiceAmount, platformFee } =
      computeHotelPayoutSplit(hotel, proposedAmount, transportFee);

    // Update booking with proposal
    const updateData = {
      total_amount: newTotalAmount,
      platform_fee: platformFee,
      service_amount: newServiceAmount,
      price_proposal_status: 'awaiting_client',
      proposed_amount: proposedAmount,
      proposed_justification: justification || '',
      original_amount: originalAmount,
    };

    // If action is 'no_adjustment', just mark as no_adjustment without changing price
    if (action === 'no_adjustment') {
      updateData.price_proposal_status = 'no_adjustment';
      delete updateData.total_amount;
      delete updateData.platform_fee;
      delete updateData.service_amount;
      delete updateData.proposed_amount;
    }

    await base44.asServiceRole.entities.HotelBooking.update(booking_id, updateData);

    // ── Guardar a proposta num registo que só o servidor pode escrever, para que o
    // cliente não possa alterar os valores antes de a aceitar (ver respondPriceProposal). ──
    const proposalPayload = {
      booking_id,
      hotel_profile_id: booking.hotel_profile_id || '',
      hotel_email: booking.hotel_email || '',
      owner_email: booking.owner_email || '',
      service_type: booking.service_type,
      original_amount: originalAmount || 0,
      proposed_amount: proposedAmount,
      total_amount: newTotalAmount,
      service_amount: newServiceAmount,
      platform_fee: platformFee,
      transport_fee: transportFee,
      justification: justification || '',
      status: action === 'no_adjustment' ? 'no_adjustment' : 'awaiting_client',
    };
    const existingProposals = await base44.asServiceRole.entities.HotelPriceProposal.filter({ booking_id });
    if (existingProposals[0]) {
      await base44.asServiceRole.entities.HotelPriceProposal.update(existingProposals[0].id, proposalPayload);
    } else {
      await base44.asServiceRole.entities.HotelPriceProposal.create(proposalPayload);
    }

    // Notify the client about the price proposal
    if (action !== 'no_adjustment') {
      const origin = resolveOrigin(req);

      await base44.asServiceRole.entities.Notification.create({
        recipient_email: booking.owner_email,
        title: 'Proposta de Preço — Banho & Tosquias',
        message: `${booking.hotel_name || 'O hotel'} analisou o perfil do seu animal e propôs um novo valor: €${proposedAmount.toFixed(2)}${originalAmount ? ` (original: €${originalAmount.toFixed(2)})` : ''}. ${justification ? `Justificação: ${justification}` : 'Aceite ou recuse na página de Propostas Pendentes.'}`,
        type: 'payment',
        link: `${origin}/PriceProposals`,
        related_id: booking_id,
        icon: '✂️'
      });
    }

    return Response.json({
      success: true,
      booking_id,
      price_proposal_status: updateData.price_proposal_status,
      proposed_amount: proposedAmount,
      total_amount: newTotalAmount,
    });
  } catch (error) {
    console.error('submitPriceProposal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}