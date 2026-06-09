import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Called from entity automation: event = { type, entity_name, entity_id }, data = booking record
    const booking = body.data;
    if (!booking) return Response.json({ ok: true, message: "No booking data" });

    // Skip cancelled/rejected bookings
    if (["cancelled", "rejected"].includes(booking.status)) {
      return Response.json({ ok: true, message: "Booking inactive, skipping" });
    }

    const hotelEmail = booking.hotel_email;
    if (!hotelEmail) return Response.json({ ok: true, message: "No hotel_email on booking" });

    // Get hotel profile to know capacity
    const profiles = await base44.asServiceRole.entities.WalkerProfile.filter({
      professional_type: "hotel",
      created_by: hotelEmail
    });
    const hotel = profiles[0];
    if (!hotel) return Response.json({ ok: true, message: "Hotel profile not found" });

    const capacityTotal = hotel.hotel_details?.capacity_total;
    if (!capacityTotal || capacityTotal <= 0) {
      return Response.json({ ok: true, message: "No capacity configured" });
    }

    const hotelName = hotel.hotel_details?.hotel_name || hotel.walker_name || "Hotel";

    // Build list of dates to check (from checkin to checkout)
    const checkinDate = booking.checkin_date;
    if (!checkinDate) return Response.json({ ok: true, message: "No checkin date" });

    const checkin = new Date(checkinDate + "T12:00:00");
    const checkout = booking.checkout_date ? new Date(booking.checkout_date + "T12:00:00") : checkin;

    const datesToCheck = [];
    const cursor = new Date(checkin);
    while (cursor <= checkout) {
      datesToCheck.push(cursor.toISOString().split("T")[0]);
      cursor.setDate(cursor.getDate() + 1);
    }

    // Get all active bookings for this hotel
    const allBookings = await base44.asServiceRole.entities.HotelBooking.filter({
      hotel_email: hotelEmail
    });

    const activeBookings = allBookings.filter(b =>
      !["cancelled", "rejected"].includes(b.status) && b.checkin_date
    );

    const alertsSent = [];

    for (const dateStr of datesToCheck) {
      const day = new Date(dateStr + "T12:00:00");

      // Count dogs occupying this day
      const dayBookings = activeBookings.filter(b => {
        try {
          const cin = new Date(b.checkin_date + "T12:00:00");
          const cout = b.checkout_date ? new Date(b.checkout_date + "T12:00:00") : cin;
          return day >= cin && day <= cout;
        } catch { return false; }
      });

      const totalDogs = dayBookings.reduce((acc, b) => acc + (b.total_dogs || 1), 0);
      const pct = Math.round((totalDogs / capacityTotal) * 100);

      // Alert if 100% (full) or exactly at threshold
      if (totalDogs >= capacityTotal) {
        // Check if a "full" notification for this date was sent in the last 24h to avoid spam
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recentNotifs = await base44.asServiceRole.entities.Notification.filter({
          recipient_email: hotelEmail,
          related_id: `hotel_full_${dateStr}`
        });

        const alreadySent = recentNotifs.some(n => n.created_date > yesterday);
        if (alreadySent) continue;

        // Format date nicely
        const dayLabel = day.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });

        await base44.asServiceRole.entities.Notification.create({
          recipient_email: hotelEmail,
          title: "🚨 Hotel com capacidade máxima!",
          message: `O ${hotelName} está CHEIO em ${dayLabel}: ${totalDogs}/${capacityTotal} cães agendados. Nenhuma nova reserva pode ser aceite para esse dia.`,
          type: "alert",
          icon: "🏨",
          is_read: false,
          related_id: `hotel_full_${dateStr}`,
          link: "/HotelDashboard"
        });

        alertsSent.push({ date: dateStr, dogs: totalDogs, capacity: capacityTotal });
      } else if (pct >= 80) {
        // Warning at 80%
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recentWarnings = await base44.asServiceRole.entities.Notification.filter({
          recipient_email: hotelEmail,
          related_id: `hotel_warn_${dateStr}`
        });
        const alreadySent = recentWarnings.some(n => n.created_date > yesterday);
        if (alreadySent) continue;

        const dayLabel = day.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });

        await base44.asServiceRole.entities.Notification.create({
          recipient_email: hotelEmail,
          title: "⚠️ Hotel quase cheio",
          message: `${hotelName} está a ${pct}% da capacidade em ${dayLabel}: ${totalDogs}/${capacityTotal} cães. Atenção ao aceitar novas reservas.`,
          type: "alert",
          icon: "⚠️",
          is_read: false,
          related_id: `hotel_warn_${dateStr}`,
          link: "/HotelDashboard"
        });

        alertsSent.push({ date: dateStr, dogs: totalDogs, capacity: capacityTotal, warning: true });
      }
    }

    return Response.json({
      ok: true,
      checked_dates: datesToCheck.length,
      alerts_sent: alertsSent
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});