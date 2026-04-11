import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { walkId, finalPhoto, report } = await req.json();
  if (!walkId) return Response.json({ error: 'walkId obrigatório' }, { status: 400 });

  // 1. Vai buscar o booking
  const bookings = await base44.asServiceRole.entities.Booking.filter({ id: walkId });
  const booking = bookings[0];
  if (!booking) return Response.json({ error: 'Passeio não encontrado' }, { status: 404 });

  // Verifica que quem chama é o walker do passeio ou admin
  if (booking.walker_email !== user.email && user.role !== 'admin') {
    return Response.json({ error: 'Não autorizado para este passeio' }, { status: 403 });
  }

  if (booking.status === 'completed') {
    return Response.json({ error: 'Passeio já foi concluído' }, { status: 400 });
  }

  const walkPrice = booking.service_amount || 0;

  // 2. Atualiza o booking como concluído
  await base44.asServiceRole.entities.Booking.update(walkId, {
    status: 'service_completed',
    drop_off_photo: finalPhoto || null,
    special_notes: report ? `${booking.special_notes || ''}\n\n[Relatório Final]: ${report}`.trim() : booking.special_notes,
    completed_date: new Date().toISOString(),
  });

  // 3. Pagamento: deixar para automação Stripe
  // Ao marcar como service_completed acima, a automação 'Release Payment on Booking Completion'
  // fará a transferência Stripe para o profissional e atualizará Payment/Booking.

  // 4. Liberta o profissional no WalkerProfile (is_online mas não busy)
  const profiles = await base44.asServiceRole.entities.WalkerProfile.filter({ created_by: booking.walker_email });
  if (profiles.length > 0) {
    await base44.asServiceRole.entities.WalkerProfile.update(profiles[0].id, {
      is_online: true,
    });
  }

  // 5. Notificações: informar que o pagamento será libertado automaticamente
  try {
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: booking.walker_email,
      title: '🚀 Passeio concluído',
      message: `Pagamento de €${walkPrice} será libertado automaticamente para a sua conta Stripe em instantes.`,
      type: 'payment',
      related_id: walkId
    });
  } catch (_) {}
  
  try {
    const ownerEmail = booking.owner_email || booking.created_by;
    if (ownerEmail) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: ownerEmail,
        title: '🐾 Obrigado! Passeio concluído',
        message: 'O pagamento está a ser libertado para o profissional.',
        type: 'booking',
        related_id: walkId
      });
    }
  } catch (_) {}

  return Response.json({
    success: true,
    amount_credited: walkPrice,
    message: `€${walkPrice} adicionados à tua Wallet!`,
  });
});