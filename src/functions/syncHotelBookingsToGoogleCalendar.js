import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// deno-lint-ignore no-undef
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get hotel profile for this user
    const hotelProfiles = await base44.asServiceRole.entities.WalkerProfile.filter({
      user_id: user.id,
      professional_type: 'hotel'
    });

    if (!hotelProfiles || hotelProfiles.length === 0) {
      return Response.json({ error: 'No hotel profile found' }, { status: 404 });
    }

    const hotelProfile = hotelProfiles[0];

    // Get the app user's Google Calendar connection
    // connectorId should be passed in the request
    const { connectorId } = await req.json();
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId);

    // Get all bookings for this hotel
    const bookings = await base44.asServiceRole.entities.HotelBooking.filter({
      hotel_profile_id: hotelProfile.id
    });

    if (!bookings || bookings.length === 0) {
      return Response.json({ message: 'No bookings to sync', count: 0 });
    }

    // Get existing events from Google Calendar
    const calendarUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    const eventsRes = await fetch(calendarUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!eventsRes.ok) {
      return Response.json({ error: 'Failed to fetch Google Calendar events' }, { status: 500 });
    }

    const existingEvents = await eventsRes.json();
    const existingEventIds = new Set(existingEvents.items?.map(e => e.id) || []);

    let syncedCount = 0;

    // Sync each booking as a calendar event
    for (const booking of bookings) {
      if (booking.status === 'cancelled') continue;

      const eventId = `hotel-booking-${booking.id}`;

      // Check if event already exists
      const eventExists = existingEventIds.has(eventId);

      const event = {
        id: eventId,
        summary: `${booking.owner_name} - ${booking.service_type} (${booking.total_dogs} ${booking.total_dogs === 1 ? 'dog' : 'dogs'})`,
        description: `Hotel: ${booking.hotel_name}\nService: ${booking.service_type}\nDogs: ${booking.dogs.map(d => d.dog_name).join(', ')}\nStatus: ${booking.status}`,
        start: {
          date: booking.checkin_date
        },
        end: {
          date: new Date(new Date(booking.checkout_date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        colorId: booking.status === 'completed' ? '2' : booking.status === 'confirmed' ? '10' : '4'
      };

      try {
        if (eventExists) {
          // Update existing event
          await fetch(`${calendarUrl}/${eventId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
          });
        } else {
          // Create new event
          await fetch(calendarUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
          });
        }
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync booking ${booking.id}:`, error.message);
      }
    }

    return Response.json({ 
      message: 'Sync completed',
      total: bookings.length,
      synced: syncedCount,
      hotel: hotelProfile.walker_name
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});