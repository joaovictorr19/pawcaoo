import { base44 } from "@/api/base44Client";

/**
 * Cria ou retorna conversa de chat para um booking
 * @param {Object} booking - Objeto do booking
 * @returns {Promise<Object>} - Objeto da conversa
 */
export async function ensureBookingChat(booking) {
  if (!booking?.id) {
    throw new Error('Booking ID é obrigatório');
  }

  try {

    // Buscar conversa existente
    const existing = await base44.entities.ChatConversation.filter({ 
      booking_id: booking.id 
    });

    if (existing && existing.length > 0) {
      return existing[0];
    }

    // Criar nova conversa
    const participants = [
      booking.created_by || booking.owner_email,
      booking.walker_email || booking.trainer_email
    ].filter(Boolean);

    if (participants.length < 2) {
      throw new Error('Participantes insuficientes para criar chat');
    }


    const conversation = await base44.entities.ChatConversation.create({
      participants,
      booking_id: booking.id,
      tags: ['booking', booking.type || 'walk'],
      last_message: 'Chat criado automaticamente para o serviço',
      last_message_date: new Date().toISOString(),
      unread_counts: participants.reduce((acc, p) => ({ ...acc, [p]: 0 }), {})
    });

    return conversation;

  } catch (error) {
    console.error('❌ Erro ao garantir chat do booking:', error);
    throw error;
  }
}

/**
 * Redireciona para o chat de um booking
 * @param {string} bookingId - ID do booking
 * @param {function} navigate - Função de navegação do react-router
 */
export async function openBookingChat(bookingId, navigate) {
  if (!bookingId) {
    throw new Error('Booking ID é obrigatório');
  }

  try {
    // Buscar booking
    const bookings = await base44.entities.Booking.filter({ id: bookingId });
    if (!bookings || bookings.length === 0) {
      throw new Error('Booking não encontrado');
    }

    const booking = bookings[0];
    
    // Garantir que o chat existe
    const conversation = await ensureBookingChat(booking);

    // Navegar para o chat
    const chatUrl = `/Chat?id=${conversation.id}&bookingId=${bookingId}`;
    navigate(chatUrl);

  } catch (error) {
    console.error('❌ Erro ao abrir chat do booking:', error);
    throw error;
  }
}