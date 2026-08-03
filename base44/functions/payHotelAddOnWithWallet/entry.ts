import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { bookingId, addOnIndex } = payload;

    if (!bookingId || addOnIndex === undefined) {
      return Response.json({ error: 'bookingId e addOnIndex são obrigatórios' }, { status: 400 });
    }

    // Fetch the booking
    const bookings = await base44.entities.HotelBooking.filter({ id: bookingId });
    const booking = bookings[0];
    if (!booking) {
      return Response.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    // Only the client (owner) can pay with wallet
    if (booking.owner_email !== user.email) {
      return Response.json({ error: 'Sem acesso a esta reserva' }, { status: 403 });
    }

    const addOns = booking.add_ons || [];
    const addOn = addOns[addOnIndex];
    if (!addOn) {
      return Response.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    // Idempotência: rejeitar se o add-on já foi pago
    if (addOn.paid === true || addOn.payment_status === 'paid') {
      return Response.json({ error: 'Este serviço extra já foi pago' }, { status: 409 });
    }

    const amount = addOn.total_price || 0;
    if (amount <= 0) {
      return Response.json({ error: 'Valor inválido' }, { status: 400 });
    }

    // Fetch the client's wallet
    const wallets = await base44.entities.UserWallet.filter({ user_email: user.email });
    const wallet = wallets[0];
    if (!wallet) {
      return Response.json({ error: 'Sem carteira PawCão. Adiciona fundos primeiro.' }, { status: 400 });
    }

    // Try escrow_balance first (reserve fund for services), then cashback_balance
    const escrow = wallet.escrow_balance || 0;
    const cashback = wallet.cashback_balance || 0;
    const availableBalance = escrow + cashback;

    if (availableBalance < amount) {
      return Response.json({
        error: `Saldo insuficiente. Tens ${availableBalance.toFixed(2)}€ em saldo PawCão (escrow + cashback).`,
        escrow,
        cashback,
        needed: amount,
      }, { status: 400 });
    }

    // Deduct from escrow first, then cashback
    let remainingToDeduct = amount;
    const updates = {};
    if (escrow >= remainingToDeduct) {
      updates.escrow_balance = escrow - remainingToDeduct;
      remainingToDeduct = 0;
    } else {
      updates.escrow_balance = 0;
      remainingToDeduct -= escrow;
      updates.cashback_balance = cashback - remainingToDeduct;
    }

    // Update the wallet (service role since wallet updates are admin-only)
    await base44.asServiceRole.entities.UserWallet.update(wallet.id, updates);

    // Fetch global commission rate for hotel add-ons
    let commissionRate = 2; // default 2%
    try {
      const settings = await base44.asServiceRole.entities.PlatformSetting.filter({
        key: 'hotel_addon_commission_rate',
      });
      if (settings?.length > 0 && settings[0].value != null) {
        commissionRate = Number(settings[0].value);
      }
    } catch (e) {
      console.warn('Could not fetch commission rate, using default 2%:', e.message);
    }
    const commissionAmount = Math.round((amount * commissionRate / 100) * 100) / 100;
    const hotelNetAmount = Math.round((amount - commissionAmount) * 100) / 100;

    // Mark the add-on as paid
    const newAddOns = [...addOns];
    newAddOns[addOnIndex] = {
      ...addOn,
      paid: true,
      payment_status: 'paid',
      payment_method: 'pawcao_wallet',
      paid_at: new Date().toISOString(),
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      hotel_net_amount: hotelNetAmount,
    };

    const newAddOnsTotal = newAddOns.reduce((sum, a) => sum + (a.total_price || 0), 0);
    const bookingUpdates = {
      add_ons: newAddOns,
      add_ons_total: newAddOnsTotal,
      service_amount: (booking.service_amount || 0) + hotelNetAmount,
      platform_fee: (booking.platform_fee || 0) + commissionAmount,
    };

    await base44.entities.HotelBooking.update(bookingId, bookingUpdates);

    // Record wallet transaction
    try {
      await base44.asServiceRole.entities.WalletTransaction.create({
        user_email: user.email,
        transaction_type: 'cashback_used',
        amount: -amount,
        description: `Serviço extra (${addOn.service_name}) — ${booking.hotel_name || 'hotel'}`,
        related_booking_id: bookingId,
        balance_after: availableBalance - amount,
      });
    } catch (e) {
      console.error('WalletTransaction create error:', e);
    }

    // Record platform commission revenue
    if (commissionAmount > 0) {
      try {
        await base44.asServiceRole.entities.PlatformRevenue.create({
          revenue_type: 'commission',
          source_id: bookingId,
          user_email: booking.hotel_email || '',
          gross_amount: amount,
          cost_amount: hotelNetAmount,
          net_profit: commissionAmount,
          description: `Comissão ${commissionRate}% — produto/serviço "${addOn.service_name}" (carteira PawCão)`,
          period_month: new Date().toISOString().slice(0, 7),
        });
      } catch (e) {
        console.error('PlatformRevenue create error:', e);
      }
    }

    // Notify the hotel
    if (booking.hotel_email) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: booking.hotel_email,
          title: '✅ Serviço Extra Pago (Saldo PawCão)',
          message: `O cliente pagou ${amount.toFixed(2)}€ pelo serviço "${addOn.service_name}" usando saldo PawCão. Comissão: ${commissionAmount}€ · Líquido: ${hotelNetAmount}€.`,
          type: 'payment',
          related_id: bookingId,
          icon: '✅',
        });
      } catch (e) {
        console.error('Notify hotel error:', e);
      }
    }

    return Response.json({
      success: true,
      paid: amount,
      remaining_balance: availableBalance - amount,
    });
  } catch (error) {
    console.error('❌ payHotelAddOnWithWallet error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});