import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const booking = body.data;

    if (!booking?.hotel_email) {
      return Response.json({ ok: true, message: 'No hotel_email on booking' });
    }

    // Get hotel profile
    const profiles = await base44.asServiceRole.entities.WalkerProfile.filter({
      professional_type: 'hotel',
      created_by: booking.hotel_email
    });
    const hotel = profiles[0];
    if (!hotel) {
      return Response.json({ ok: true, message: 'Hotel profile not found' });
    }

    const capacityTotal = hotel.hotel_details?.capacity_total || 0;
    if (capacityTotal <= 0) {
      return Response.json({ ok: true, message: 'No capacity configured' });
    }

    // Get all active bookings for this hotel
    const allBookings = await base44.asServiceRole.entities.HotelBooking.filter({
      hotel_email: booking.hotel_email
    });

    const activeBookings = allBookings.filter(b =>
      !['cancelled', 'rejected'].includes(b.status) && b.checkin_date
    );

    // Calculate today's occupancy
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = activeBookings.filter(b => {
      try {
        const cin = b.checkin_date.split('T')[0];
        const cout = b.checkout_date ? b.checkout_date.split('T')[0] : cin;
        return today >= cin && today <= cout;
      } catch {
        return false;
      }
    });

    const dogsToday = todayBookings.reduce((acc, b) => acc + (b.total_dogs || 1), 0);
    const availableToday = Math.max(0, capacityTotal - dogsToday);

    // Update hotel's capacity_available to today's value
    await base44.asServiceRole.entities.WalkerProfile.update(hotel.id, {
      hotel_details: {
        ...hotel.hotel_details,
        capacity_available: availableToday
      }
    });

    return Response.json({
      ok: true,
      hotel_email: booking.hotel_email,
      capacity_total: capacityTotal,
      dogs_today: dogsToday,
      capacity_available: availableToday
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});