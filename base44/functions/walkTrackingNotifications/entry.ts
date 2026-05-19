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

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        
        // Verifica se é um update na entity Booking
        if (!body.data || !body.old_data || body.event?.entity_name !== 'Booking') {
            return new Response("Ignorado", { status: 200 });
        }

        const booking = body.data;
        const oldBooking = body.old_data;
        
        // Só aplicável a passeios de cães
        if (booking.type !== 'walk') {
            return new Response("Não é passeio", { status: 200 });
        }
        
        const clientEmail = booking.owner_email || booking.created_by;

        // 1. O Passeio Começou
        if (oldBooking.status !== 'in_progress' && booking.status === 'in_progress') {
            await base44.asServiceRole.functions.invoke('sendNotification', {
                recipient_email: clientEmail,
                type: 'system',
                title: 'Passeio Iniciado! 🐕',
                message: `O passeio do ${booking.dog_name} com ${booking.walker_name} acabou de começar. Acompanhe a rota em tempo real!`,
                link: `/LiveWalkTracking?bookingId=${booking.id}`,
                send_email: true,
                email_subject: `Passeio do ${booking.dog_name} começou!`,
                email_body: `Olá! O seu passeador iniciou a caminhada. Acompanhe em tempo real na plataforma através do seu painel.`
            });
        }
        
        // 2. O Passeio Terminou
        if (oldBooking.status === 'in_progress' && booking.status === 'service_completed') {
            await base44.asServiceRole.functions.invoke('sendNotification', {
                recipient_email: clientEmail,
                type: 'system',
                title: 'Passeio Terminado 🎉',
                message: `O passeio do ${booking.dog_name} terminou. Foram percorridos ${booking.distance_km || 0} km. Avalie agora!`,
                link: `/MyBookings`,
                send_email: true,
                email_subject: `Passeio do ${booking.dog_name} concluído`,
                email_body: `O passeio chegou ao fim! Aceda à aplicação para ver o resumo e fazer a sua avaliação do passeador.`
            });
        }

        // 3. Alerta de Desvio de Rota (> 2 km do local de início)
        if (booking.status === 'in_progress' && booking.walker_lat && booking.pickup_lat) {
            const currentDistance = getDistance(booking.pickup_lat, booking.pickup_lng, booking.walker_lat, booking.walker_lng);
            const oldDistance = oldBooking.walker_lat ? getDistance(oldBooking.pickup_lat, oldBooking.pickup_lng, oldBooking.walker_lat, oldBooking.walker_lng) : 0;
            
            // Se cruzou a fronteira dos 2km agora
            if (currentDistance > 2 && oldDistance <= 2) {
                 await base44.asServiceRole.functions.invoke('sendNotification', {
                    recipient_email: clientEmail,
                    type: 'emergency',
                    title: 'Aviso de Desvio de Rota ⚠️',
                    message: `O passeador está a mais de 2 km do local de início. Acompanhe a sua localização no mapa.`,
                    link: `/LiveWalkTracking?bookingId=${booking.id}`,
                });
            }
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Erro no tracking GPS automation", error);
        return new Response(error.message, { status: 500 });
    }
});