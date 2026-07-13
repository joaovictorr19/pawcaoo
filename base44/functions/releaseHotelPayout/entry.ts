import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ error: 'Missing bookingId' }, { status: 400 });

    // Fetch the hotel booking
    const bookings = await base44.asServiceRole.entities.HotelBooking.filter({ id: bookingId });
    if (bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const hb = bookings[0];

    // Only the hotel owner or admin can release the payout
    const isHotel = hb.hotel_email === user.email;
    const isAdmin = user.role === 'admin';
    if (!isHotel && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (hb.status !== 'completed') {
      return Response.json({ error: 'Booking not completed yet' }, { status: 400 });
    }

    const serviceAmount = hb.service_amount || 0;
    if (serviceAmount <= 0) {
      return Response.json({ success: true, message: 'No amount to release' });
    }

    // Move pending → available in hotel's wallet
    const hotelEmail = hb.hotel_email;
    if (!hotelEmail) {
      return Response.json({ error: 'Hotel email not found' }, { status: 400 });
    }

    const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: hotelEmail });
    let wallet = wallets[0];
    if (!wallet) {
      wallet = await base44.asServiceRole.entities.UserWallet.create({
        user_email: hotelEmail,
        cashback_balance: 0,
        service_tokens: 0,
        total_points: 0,
        available_balance: serviceAmount,
        pending_balance: 0,
        total_earnings: serviceAmount
      });
    } else {
      // Only release if there's pending balance (avoid double release)
      const currentPending = wallet.pending_balance || 0;
      const currentAvailable = wallet.available_balance || 0;
      const releaseAmount = Math.min(serviceAmount, currentPending);

      if (releaseAmount <= 0) {
        return Response.json({ success: true, message: 'Already released or no pending balance' });
      }

      await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
        pending_balance: currentPending - releaseAmount,
        available_balance: currentAvailable + releaseAmount
      });

      await base44.asServiceRole.entities.WalletTransaction.create({
        user_email: hotelEmail,
        transaction_type: 'walker_payment_completed',
        amount: releaseAmount,
        description: `Pagamento liberado — reserva ${hb.hotel_name || 'hotel'} (${hb.checkin_date})`,
        related_booking_id: bookingId,
        balance_after: currentAvailable + releaseAmount
      });

      console.log(`✅ Hotel payout released: €${releaseAmount} to ${hotelEmail}`);
    }

    return Response.json({ success: true, bookingId, released: serviceAmount });
  } catch (error) {
    console.error('Release hotel payout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});