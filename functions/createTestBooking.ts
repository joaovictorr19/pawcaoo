import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('🧪 ========== TEST BOOKING CREATION START ==========');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    console.log('👤 User:', user?.email, 'Role:', user?.role);

    // Get walker from payload
    const payload = await req.json();
    const { walkerId, walkerEmail } = payload || {};

    console.log('📦 Payload:', { walkerId, walkerEmail });

    if (!walkerId || !walkerEmail) {
      console.error('❌ Missing walker data');
      return Response.json({ 
        success: false, 
        error: 'Walker ID and Email required' 
      }, { status: 400 });
    }

    // Fetch walker profile with service role
    console.log('🔍 Fetching walker profile...');
    const walkers = await base44.asServiceRole.entities.WalkerProfile.filter({ 
      id: walkerId 
    });
    const walker = walkers?.[0];

    if (!walker) {
      console.error('❌ Walker not found:', walkerId);
      return Response.json({ 
        success: false, 
        error: 'Walker profile not found' 
      }, { status: 404 });
    }

    console.log('✅ Walker found:', walker.walker_name);

    // NUCLEAR OPTION: Use hardcoded coordinates for Porto (GUARANTEED)
    const PORTO_LAT = 41.1579;
    const PORTO_LNG = -8.6291;

    // Create test client name (use current user or generate)
    const testClientEmail = user?.email || 'teste@pawcao.net';
    const testClientName = user?.full_name || 'Cliente Teste';

    // Generate current timestamp
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    console.log('📅 Creating booking for:', dateStr, 'at', timeStr);

    // BULLETPROOF BOOKING DATA (All required fields filled)
    const bookingData = {
      // Walker info
      walker_id: walkerId,
      walker_name: walker.walker_name || 'Walker',
      walker_email: walkerEmail,
      walker_payment_contact: walker.whatsapp_number || walker.phone || '+351912345678',
      
      // HARDCODED GPS (Porto - NUCLEAR OPTION)
      walker_lat: PORTO_LAT,
      walker_lng: PORTO_LNG,
      pickup_lat: PORTO_LAT,
      pickup_lng: PORTO_LNG,
      
      // Owner/Client info
      owner_name: testClientName,
      owner_email: testClientEmail,
      owner_phone: '+351912345678',
      
      // Dog info
      dog_name: '🧪 Bobby (Demo)',
      dog_size: 'medium',
      
      // Scheduling
      walk_date: dateStr,
      walk_time: `${timeStr} - ${String(now.getHours() + 1).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      duration_hours: 1,
      
      // Financials
      service_amount: 10,
      platform_fee: 2,
      total_amount: 12,
      
      // Location
      pickup_address: 'Porto, Portugal (Teste)',
      
      // Notes
      special_notes: '🧪 RESERVA DE TESTE - Serviço demo para GPS tracking',
      
      // CRITICAL: Go straight to IN_PROGRESS (skip pending/confirmed)
      status: 'in_progress',
      payment_status: 'released',
      payment_id: `TEST_${Date.now()}`,
      
      // Start immediately
      walk_start_time: now.toISOString(),
      
      // Initial route data
      route_coordinates: [{
        lat: PORTO_LAT,
        lng: PORTO_LNG,
        timestamp: now.toISOString(),
        accuracy: 10
      }],
      
      type: 'walk',
      is_test_booking: true
    };

    console.log('💾 Creating booking in database...');
    const booking = await base44.asServiceRole.entities.Booking.create(bookingData);
    
    console.log('✅ Booking created:', booking.id);

    // Create guaranteed chat conversation
    console.log('💬 Creating chat conversation...');
    try {
      const conversation = await base44.asServiceRole.entities.ChatConversation.create({
        participants: [testClientEmail, walkerEmail],
        participant_names: {
          [testClientEmail]: testClientName,
          [walkerEmail]: walker.walker_name
        },
        participant_photos: {
          [testClientEmail]: user?.profile_photo_url || '',
          [walkerEmail]: walker.photo_url || ''
        },
        booking_id: booking.id,
        tags: ['booking', 'walk', 'test'],
        last_message: `🧪 Reserva de teste criada - ${dateStr} às ${timeStr}`,
        last_message_date: now.toISOString(),
        last_sender_email: testClientEmail,
        unread_counts: { 
          [testClientEmail]: 0, 
          [walkerEmail]: 1 
        },
        is_muted: {},
        pinned_by: [],
        typing_users: []
      });

      console.log('✅ Chat created:', conversation.id);

      // Send initial system message
      await base44.asServiceRole.entities.ChatMessage.create({
        conversation_id: conversation.id,
        booking_id: booking.id,
        sender_email: testClientEmail,
        sender_name: testClientName,
        participants: [testClientEmail, walkerEmail],
        content: `🧪 **SERVIÇO DE TESTE ATIVO**\n\n📍 GPS: Porto, Portugal\n⏰ Iniciado: ${timeStr}\n\nEste é um serviço demo para testar GPS tracking e chat ao vivo.`,
        message_type: 'system'
      });

      console.log('✅ System message sent');
    } catch (chatError) {
      console.error('⚠️ Chat creation failed (non-critical):', chatError.message);
    }

    // Create notification for walker
    try {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: walkerEmail,
        title: '🧪 Serviço de Teste Iniciado',
        message: `Serviço demo ativo agora - ${dateStr} às ${timeStr}`,
        type: 'booking',
        related_id: booking.id,
        priority: 'high',
        action_url: `/ActiveWalkDashboard?bookingId=${booking.id}`
      });
      console.log('✅ Notification created');
    } catch (notifError) {
      console.error('⚠️ Notification failed (non-critical):', notifError.message);
    }

    console.log('🎉 ========== TEST BOOKING SUCCESS ==========');
    console.log('🔗 Booking ID:', booking.id);
    console.log('📍 Coordinates:', PORTO_LAT, PORTO_LNG);

    // Return success response with booking ID
    return Response.json({
      success: true,
      bookingId: booking.id,
      message: 'Test service started',
      coordinates: { lat: PORTO_LAT, lng: PORTO_LNG }
    });

  } catch (error) {
    console.error('❌ ========== TEST BOOKING FAILED ==========');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack (first 500):', error?.stack?.substring(0, 500));
    
    return Response.json({ 
      success: false,
      error: error?.message || 'Unknown error creating test booking',
      details: error?.stack?.substring(0, 200) || 'No stack trace'
    }, { status: 500 });
  }
});