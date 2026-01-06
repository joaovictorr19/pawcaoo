import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // ADMIN ONLY
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { walkerId, walkerEmail } = await req.json();

    if (!walkerId || !walkerEmail) {
      return Response.json({ error: 'walkerId and walkerEmail required' }, { status: 400 });
    }

    console.log('🧪 Creating test booking for walker:', walkerEmail);

    // 1. Buscar dados do walker
    const walkers = await base44.asServiceRole.entities.WalkerProfile.filter({ 
      id: walkerId 
    });
    const walker = walkers[0];

    if (!walker) {
      return Response.json({ error: 'Walker not found' }, { status: 404 });
    }

    // 2. Criar/Usar Cliente de Teste
    let testClient = null;
    const testEmail = 'teste@pawcao.net';
    
    try {
      const users = await base44.asServiceRole.entities.User.filter({ 
        email: testEmail 
      });
      testClient = users[0];
    } catch (e) {
      console.log('Test client não existe, será usado o admin como cliente');
    }

    // Se não existe cliente de teste, usar o admin como cliente
    const clientEmail = testClient?.email || user.email;
    const clientName = testClient?.full_name || user.full_name || 'Cliente Teste';

    // 3. Criar Reserva de Teste AGORA
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const bookingData = {
      walker_id: walkerId,
      walker_name: walker.walker_name,
      walker_email: walkerEmail,
      walker_payment_contact: walker.whatsapp_number || walker.phone,
      
      owner_name: clientName,
      owner_email: clientEmail,
      owner_phone: '+351912345678',
      
      dog_name: '🧪 Rex (Teste)',
      dog_size: 'medium',
      
      walk_date: dateStr,
      walk_time: timeStr,
      duration_hours: 1,
      
      service_amount: 10,
      platform_fee: 2,
      total_amount: 12,
      
      pickup_address: walker.location || 'Lisboa, Portugal',
      pickup_lat: walker.latitude || 38.7223,
      pickup_lng: walker.longitude || -9.1393,
      
      special_notes: '🧪 RESERVA DE TESTE - Criada pelo Admin para testar o sistema',
      
      status: 'confirmed', // JÁ CONFIRMADO
      payment_status: 'released', // PAGO COMPLETAMENTE (bypass payment)
      payment_id: 'TEST_PAYMENT_' + Date.now(),
      type: 'walk',
      is_test_booking: true // Flag para identificar como teste
    };

    const booking = await base44.asServiceRole.entities.Booking.create(bookingData);
    console.log('✅ Test booking created:', booking.id);

    // 4. Criar Conversa de Chat GARANTIDA
    const conversation = await base44.asServiceRole.entities.ChatConversation.create({
      participants: [clientEmail, walkerEmail],
      participant_names: {
        [clientEmail]: clientName,
        [walkerEmail]: walker.walker_name
      },
      participant_photos: {
        [clientEmail]: user.profile_photo_url || '',
        [walkerEmail]: walker.photo_url || ''
      },
      booking_id: booking.id,
      tags: ['booking', 'walk', 'test'],
      last_message: `🧪 Reserva de teste criada pelo Admin - ${dateStr} às ${timeStr}`,
      last_message_date: new Date().toISOString(),
      last_sender_email: clientEmail,
      unread_counts: { 
        [clientEmail]: 0, 
        [walkerEmail]: 1 
      }
    });

    console.log('💬 Chat created:', conversation.id);

    // 5. Criar mensagem inicial
    await base44.asServiceRole.entities.ChatMessage.create({
      conversation_id: conversation.id,
      sender_email: clientEmail,
      sender_name: clientName,
      participants: [clientEmail, walkerEmail],
      content: `🧪 **RESERVA DE TESTE**\n\n🐕 Cão: Rex (Teste)\n📅 Data: ${dateStr}\n⏰ Horário: ${timeStr}\n📍 Local: ${walker.location || 'Lisboa'}\n\nEsta é uma reserva criada pelo Admin para testar o sistema de tracking e chat.`,
      message_type: 'system'
    });

    // 6. Criar notificação para o walker
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: walkerEmail,
      title: '🧪 Nova Reserva de Teste',
      message: `O Admin criou uma reserva de teste para ${dateStr} às ${timeStr}`,
      type: 'booking',
      related_id: booking.id,
      priority: 'high'
    });

    return Response.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        walker_name: walker.walker_name,
        date: dateStr,
        time: timeStr
      },
      conversation: {
        id: conversation.id
      }
    });

  } catch (error) {
    console.error('❌ Error creating test booking:', error);
    return Response.json({ 
      error: 'Failed to create test booking', 
      details: error.message 
    }, { status: 500 });
  }
});