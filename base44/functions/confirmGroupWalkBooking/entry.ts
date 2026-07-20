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
    const { session_id, event_id } = body;

    if (!session_id || !event_id) {
      return Response.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session || session.payment_status !== 'paid') {
      return Response.json({ error: 'Pagamento não confirmado' }, { status: 400 });
    }

    // Extract metadata
    const meta = session.metadata || {};
    if (meta.type !== 'group_walk' || meta.event_id !== event_id) {
      return Response.json({ error: 'Sessão inválida' }, { status: 400 });
    }

    const dogId = meta.dog_id || '';
    const dogName = meta.dog_name || '';
    const dogSize = meta.dog_size || 'medium';
    const serviceAmount = Number(meta.service_amount) || 0;
    const platformFee = Number(meta.platform_fee) || 0;
    const totalAmount = Number(meta.total_amount) || 0;

    // Fetch the event with service role
    const events = await base44.asServiceRole.entities.GroupWalkEvent.filter({ id: event_id });
    const event = events[0];

    if (!event) {
      return Response.json({ error: 'Passeio não encontrado' }, { status: 404 });
    }

    // Check if already a participant (idempotency)
    const existing = (event.participants || []).find(
      p => p.owner_email === user.email && p.dog_id === dogId
    );
    if (existing && existing.payment_status === 'paid') {
      return Response.json({ success: true, already_joined: true, event });
    }

    // Add participant
    const newParticipant = {
      owner_email: user.email,
      owner_name: meta.owner_name || user.full_name || '',
      dog_id: dogId,
      dog_name: dogName,
      dog_size: dogSize,
      payment_status: 'paid' as const,
      booking_id: '',
    };

    const updatedParticipants = [...(event.participants || []), newParticipant];
    const updatedDogsBooked = updatedParticipants.length;

    await base44.asServiceRole.entities.GroupWalkEvent.update(event_id, {
      participants: updatedParticipants,
      dogs_booked: updatedDogsBooked,
      status: updatedDogsBooked >= (event.max_dogs || 5) ? 'full' : 'open',
    });

    // Create a Booking record for the walk
    const booking = await base44.asServiceRole.entities.Booking.create({
      owner_name: meta.owner_name || user.full_name || '',
      owner_email: user.email,
      dog_name: dogName,
      dog_size: dogSize as any,
      walker_id: event.professional_profile_id || '',
      walker_name: event.professional_name || '',
      walker_email: event.professional_email || '',
      walk_date: event.event_date,
      walk_time: event.event_time,
      duration_hours: Math.round((event.duration_minutes || 60) / 60 * 100) / 100,
      service_amount: serviceAmount,
      platform_fee: platformFee,
      total_amount: totalAmount,
      status: 'confirmed',
      payment_status: 'held',
      type: 'walk',
      special_notes: `Passeio em grupo: ${event.title}`,
      pickup_method: event.pickup_method === 'walker_pickup' ? 'walker_pickup' : 'meeting_point',
      pickup_address: event.meeting_point_address || event.location,
    });

    // Update the participant with the booking_id
    newParticipant.booking_id = booking.id;
    const finalParticipants = updatedParticipants.map(p =>
      p.owner_email === user.email && p.dog_id === dogId
        ? { ...p, booking_id: booking.id }
        : p
    );
    await base44.asServiceRole.entities.GroupWalkEvent.update(event_id, {
      participants: finalParticipants,
    });

    // Notify the professional
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: event.professional_email,
      title: '🐕 Nova inscrição em passeio em grupo!',
      message: `${meta.owner_name || user.full_name} inscreveu-se em "${event.title}" com o cão ${dogName}.`,
      type: 'booking',
      related_id: event_id,
      icon: '🐕',
    });

    return Response.json({
      success: true,
      event_id,
      booking_id: booking.id,
    });

  } catch (error) {
    console.error('Confirm group walk error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});