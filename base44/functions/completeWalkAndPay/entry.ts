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

  // 3. Atualiza a Wallet do profissional via UserWallet entity
  const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: booking.walker_email });
  
  if (wallets.length > 0) {
    const wallet = wallets[0];
    await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
      balance: (wallet.balance || 0) + walkPrice,
      total_earned: (wallet.total_earned || 0) + walkPrice,
    });
  } else {
    // Cria wallet se não existir
    await base44.asServiceRole.entities.UserWallet.create({
      user_email: booking.walker_email,
      balance: walkPrice,
      total_earned: walkPrice,
      total_withdrawn: 0,
    });
  }

  // 4. Liberta o profissional no WalkerProfile (is_online mas não busy)
  const profiles = await base44.asServiceRole.entities.WalkerProfile.filter({ created_by: booking.walker_email });
  if (profiles.length > 0) {
    await base44.asServiceRole.entities.WalkerProfile.update(profiles[0].id, {
      is_online: true,
    });
  }

  // 5. Regista a transação na WalletTransaction
  await base44.asServiceRole.entities.WalletTransaction.create({
    user_email: booking.walker_email,
    amount: walkPrice,
    type: 'credit',
    description: `Passeio concluído - ${booking.dog_name || 'cão'} - Booking #${walkId.slice(-6)}`,
    booking_id: walkId,
    status: 'completed',
  });

  return Response.json({
    success: true,
    amount_credited: walkPrice,
    message: `€${walkPrice} adicionados à tua Wallet!`,
  });
});