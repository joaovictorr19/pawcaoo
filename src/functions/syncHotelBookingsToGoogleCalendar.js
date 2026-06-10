/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { hotel_profile_id } = await req.json();

    // Buscar hotel profile
    const hotelProfiles = await base44.asServiceRole.entities.WalkerProfile.filter({
      id: hotel_profile_id,
      professional_type: 'hotel'
    });

    if (!hotelProfiles || hotelProfiles.length === 0) {
      return Response.json({ error: 'Hotel não encontrado' }, { status: 404 });
    }

    const hotel = hotelProfiles[0];

    // Obter acesso ao Google Calendar
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    // Buscar todas as reservas do hotel
    const bookings = await base44.asServiceRole.entities.HotelBooking.filter({
      hotel_profile_id: hotel_profile_id,
      status: { $nin: ['cancelled'] }
    });

    let syncedCount = 0;
    let errorCount = 0;

    // Sincronizar cada reserva
    for (const booking of bookings) {
      try {
        const startDate = booking.checkin_date;
        const endDate = booking.checkout_date;
        
        const eventTitle = `${booking.owner_name} - ${booking.dogs.map(d => d.dog_name).join(', ')}`;
        const description = `Hotel: ${hotel.walker_name}\nServiço: ${booking.service_type}\nAnimais: ${booking.total_dogs}\nNotes: ${booking.special_requests || ''}`;

        // Verificar se o evento já existe (buscar por ID)
        const calendarEventId = booking.id ? `pawcao-hotel-${booking.id}` : null;

        const eventData = {
          summary: eventTitle,
          description: description,
          start: {
            date: startDate
          },
          end: {
            date: endDate
          },
          colorId: booking.status === 'checked_in' ? '2' : booking.status === 'completed' ? '10' : '1',
          id: calendarEventId
        };

        let response;
        
        // Tentar atualizar se o evento já existe
        if (calendarEventId) {
          response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(calendarEventId)}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(eventData)
            }
          );

          // Se não existe (404), criar novo
          if (response.status === 404) {
            response = await fetch(
              'https://www.googleapis.com/calendar/v3/calendars/primary/events',
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
              }
            );
          }
        } else {
          // Criar novo evento
          response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(eventData)
            }
          );
        }

        if (response.ok) {
          syncedCount++;
        } else {
          errorCount++;
          console.error(`Erro ao sincronizar booking ${booking.id}:`, await response.text());
        }
      } catch (error) {
        errorCount++;
        console.error(`Erro ao processar booking ${booking.id}:`, error);
      }
    }

    // Atualizar SyncState
    const syncStates = await base44.asServiceRole.entities.SyncState.filter({
      sync_key: `googlecalendar_${hotel_profile_id}`
    });

    const syncData = {
      sync_key: `googlecalendar_${hotel_profile_id}`,
      last_sync: new Date().toISOString(),
      hotel_profile_id: hotel_profile_id
    };

    if (syncStates && syncStates.length > 0) {
      await base44.asServiceRole.entities.SyncState.update(syncStates[0].id, syncData);
    } else {
      await base44.asServiceRole.entities.SyncState.create(syncData);
    }

    return Response.json({
      success: true,
      message: `Sincronizados ${syncedCount} eventos. ${errorCount} erros.`,
      synced: syncedCount,
      errors: errorCount,
      total: bookings.length
    });
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});