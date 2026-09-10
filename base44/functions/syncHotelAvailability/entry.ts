import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const booking_id = body.booking_id || body.event?.entity_id;

    // Always fetch the booking from the database — never trust body.data
    // to prevent unauthorized capacity manipulation via injected payloads.
    let hotel_email: string | undefined;

    if (booking_id) {
      const booking = await base44.asServiceRole.entities.HotelBooking.get(booking_id);
      if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

      // Authorization: only the hotel owner may trigger availability sync.
      if (user.email !== booking.hotel_email) {
        return Response.json({ error: 'Forbidden: not authorized for this hotel' }, { status: 403 });
      }
      hotel_email = booking.hotel_email;
    } else {
      // Allow hotel owner to sync by their own email directly
      hotel_email = body.hotel_email || user.email;
    }

    if (!hotel_email) {
      return Response.json({ ok: true, message: 'No hotel_email provided' });
    }

    // Verify the authenticated user owns the hotel profile for this email
    if (user.email !== hotel_email) {
      return Response.json({ error: 'Forbidden: not authorized for this hotel' }, { status: 403 });
    }

    // Get hotel profile
    const profiles = await base44.asServiceRole.entities.WalkerProfile.filter({
      professional_type: 'hotel',
      created_by: hotel_email
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
      hotel_email: hotel_email
    });

    // Hóspedes = apenas alojamento/creche (serviços pontuais não ocupam vagas)
    const STAY_SERVICE_TYPES = ['boarding', 'daycare'];
    const activeBookings = allBookings.filter(b =>
      !['cancelled', 'rejected'].includes(b.status) && b.checkin_date &&
      STAY_SERVICE_TYPES.includes(b.service_type)
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
    const bookingBasedAvailable = Math.max(0, capacityTotal - dogsToday);

    // Respeitar vagas fechadas manualmente pelo hotel (ex: botão "Esgotar"):
    // a sincronização só FECHA vagas (quando entram cães), nunca REABRE
    // vagas que o hotel fechou deliberadamente. A reabertura faz-se via o
    // fluxo de cancelamento/expiração de reservas ou manualmente (+/Cheio).
    const currentTopAvailable = hotel.hotel_details?.capacity_available ?? capacityTotal;
    const syncedTopAvailable = Math.min(currentTopAvailable, bookingBasedAvailable);

    // Sync also each stay service's availability with today's occupancy
    const services = (hotel.hotel_details?.services || []).map(s => {
      if (!STAY_SERVICE_TYPES.includes(s.service_type)) return s;
      const dogsService = todayBookings
        .filter(b => b.service_type === s.service_type)
        .reduce((acc, b) => acc + (b.total_dogs || 1), 0);
      const total = s.capacity_total ?? 0;
      const bookingSvcAvailable = Math.max(0, total - dogsService);
      const currentSvcAvailable = s.capacity_available ?? total;
      return { ...s, capacity_available: Math.min(currentSvcAvailable, bookingSvcAvailable) };
    });

    // Update hotel's capacity_available — apenas fecha, nunca reabre
    await base44.asServiceRole.entities.WalkerProfile.update(hotel.id, {
      hotel_details: {
        ...hotel.hotel_details,
        capacity_available: syncedTopAvailable,
        services
      }
    });

    return Response.json({
      ok: true,
      hotel_email: hotel_email,
      capacity_total: capacityTotal,
      dogs_today: dogsToday,
      capacity_available: syncedTopAvailable
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});