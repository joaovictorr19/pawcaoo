import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Fórmula de Haversine para calcular distância em km entre dois pontos GPS
function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distância em km
}

const START_TITLE = 'Passeio Iniciado! 🐕';
const END_TITLE = 'Passeio Terminado 🎉';
const DEVIATION_TITLE = 'Aviso de Desvio de Rota ⚠️';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json().catch(() => ({}));

        const event = payload?.event || {};
        if (event?.entity_name && event.entity_name !== 'Booking') {
            return new Response("Ignorado", { status: 200 });
        }

        const bookingId = event?.entity_id || payload?.data?.id;
        if (!bookingId) {
            return new Response("Ignorado", { status: 200 });
        }

        // SECURITY: o corpo do pedido nunca é fonte de verdade. A reserva é relida da
        // base de dados e só os seus campos alimentam as notificações — o destinatário é
        // sempre o dono da reserva e o conteúdo vem do registo, nunca do payload.
        // Cada notificação é enviada uma única vez por reserva (dedupe), pelo que uma
        // chamada anónima repetida não consegue gerar emails em massa.
        const records = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        const booking = records[0] || null;

        // Só aplicável a passeios de cães
        if (!booking || booking.type !== 'walk') {
            return new Response("Ignorado", { status: 200 });
        }

        const clientEmail = booking.owner_email || booking.created_by;
        if (!clientEmail) {
            return new Response("Ignorado", { status: 200 });
        }

        const alreadyNotified = async (title) => {
            const existing = await base44.asServiceRole.entities.Notification.filter({
                recipient_email: clientEmail,
                related_id: booking.id,
                title,
            });
            return Array.isArray(existing) && existing.length > 0;
        };

        const dogName = booking.dog_name || 'o seu cão';
        const walkerName = booking.walker_name || 'o seu passeador';

        // 1. O Passeio Começou
        if (booking.status === 'in_progress' && !(await alreadyNotified(START_TITLE))) {
            await base44.asServiceRole.functions.invoke('sendNotification', {
                recipient_email: clientEmail,
                type: 'system',
                title: START_TITLE,
                message: `O passeio do ${dogName} com ${walkerName} acabou de começar. Acompanhe a rota em tempo real!`,
                link: `/LiveWalkTracking?bookingId=${booking.id}`,
                related_id: booking.id,
                send_email: true,
                email_subject: `Passeio do ${dogName} começou!`,
                email_body: `Olá! O seu passeador iniciou a caminhada. Acompanhe em tempo real na plataforma através do seu painel.`
            });
        }

        // 2. O Passeio Terminou
        if (['service_completed', 'completed'].includes(booking.status) && !(await alreadyNotified(END_TITLE))) {
            await base44.asServiceRole.functions.invoke('sendNotification', {
                recipient_email: clientEmail,
                type: 'system',
                title: END_TITLE,
                message: `O passeio do ${dogName} terminou. Foram percorridos ${booking.distance_km || 0} km. Avalie agora!`,
                link: `/MyBookings`,
                related_id: booking.id,
                send_email: true,
                email_subject: `Passeio do ${dogName} concluído`,
                email_body: `O passeio chegou ao fim! Aceda à aplicação para ver o resumo e fazer a sua avaliação do passeador.`
            });
        }

        // 3. Alerta de Desvio de Rota (> 2 km do local de início)
        if (booking.status === 'in_progress' && booking.walker_lat && booking.pickup_lat && !(await alreadyNotified(DEVIATION_TITLE))) {
            const currentDistance = getDistance(booking.pickup_lat, booking.pickup_lng, booking.walker_lat, booking.walker_lng);

            if (currentDistance > 2) {
                await base44.asServiceRole.functions.invoke('sendNotification', {
                    recipient_email: clientEmail,
                    type: 'emergency',
                    title: DEVIATION_TITLE,
                    message: `O passeador está a mais de 2 km do local de início. Acompanhe a sua localização no mapa.`,
                    link: `/LiveWalkTracking?bookingId=${booking.id}`,
                    related_id: booking.id,
                });
            }
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Erro no tracking GPS automation", error);
        return new Response(error.message, { status: 500 });
    }
});