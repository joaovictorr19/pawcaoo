import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const DEMO_EMAIL = 'support@pawcao.net';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    // 1. Create or get hotel profile
    let hotelProfiles = await base44.asServiceRole.entities.WalkerProfile.filter({
      created_by: DEMO_EMAIL,
      professional_type: 'hotel'
    });

    let hotel = hotelProfiles[0];

    // Always update the name to ensure it's correct
    if (hotel) {
      await base44.asServiceRole.entities.WalkerProfile.update(hotel.id, {
        walker_name: 'PawCão Hotel Demo 🏨'
      });
      hotel.walker_name = 'PawCão Hotel Demo 🏨';
    }

    if (!hotel) {
      hotel = await base44.asServiceRole.entities.WalkerProfile.create({
        created_by: DEMO_EMAIL,
        walker_name: 'PawCão Hotel Demo 🏨',
        professional_type: 'hotel',
        location: 'Lisboa, Portugal',
        bio: 'Hotel de demonstração - Funcionalidades de Disponibilidade, Rotina Diária e Parceiros integradas',
        photo_url: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=400&fit=crop',
        cover_photo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop',
        is_online: true,
        verification_status: 'verified',
        hotel_details: {
          capacity_total: 10,
          capacity_available: 5,
          business_hours: {
            monday: '09:00 - 18:00',
            tuesday: '09:00 - 18:00',
            wednesday: '09:00 - 18:00',
            thursday: '09:00 - 18:00',
            friday: '09:00 - 18:00',
            saturday: '10:00 - 16:00',
            sunday: 'Fechado'
          },
          services: [
            {
              service_id: 'alojamento',
              service_name: 'Alojamento',
              service_type: 'boarding',
              description: 'Alojamento noturno e pernoita com supervisão',
              price_per_day: 40,
              capacity_total: 5,
              capacity_available: 0,
              is_active: true,
              accepted_dog_sizes: ['small', 'medium', 'large']
            },
            {
              service_id: 'creche',
              service_name: 'Creche Diária',
              service_type: 'daycare',
              description: 'Creche diária das 8h às 18h',
              price_per_day: 25,
              capacity_total: 8,
              capacity_available: 8,
              is_active: true,
              accepted_dog_sizes: ['small', 'medium', 'large', 'extra_large']
            }
          ]
        }
      });
    }

    // 2. Create test bookings
    const formatDate = (d) => d.toISOString().split('T')[0];

    const bookings = [
      {
        hotel_profile_id: hotel.id,
        hotel_name: hotel.walker_name,
        hotel_email: DEMO_EMAIL,
        owner_name: 'João Silva',
        owner_email: 'joao@example.com',
        owner_phone: '+351917000001',
        dogs: [
          { dog_name: 'Max', dog_breed: 'Golden Retriever', dog_size: 'large', dog_age: 3, special_notes: 'Ador as crianças' }
        ],
        service_type: 'boarding',
        checkin_date: formatDate(tomorrow),
        checkout_date: formatDate(in3Days),
        checkin_time: '10:00',
        checkout_time: '17:00',
        total_nights: 2,
        total_dogs: 1,
        price_per_night: 40,
        total_amount: 80,
        platform_fee: 8,
        service_amount: 72,
        status: 'confirmed',
        payment_status: 'paid'
      },
      {
        hotel_profile_id: hotel.id,
        hotel_name: hotel.walker_name,
        hotel_email: DEMO_EMAIL,
        owner_name: 'Maria Costa',
        owner_email: 'maria@example.com',
        owner_phone: '+351917000002',
        dogs: [
          { dog_name: 'Luna', dog_breed: 'Labrador', dog_size: 'large', dog_age: 5, special_notes: 'Precisa de medicação 2x dia' },
          { dog_name: 'Milo', dog_breed: 'Poodle', dog_size: 'small', dog_age: 2, special_notes: '' }
        ],
        service_type: 'boarding',
        checkin_date: formatDate(in3Days),
        checkout_date: formatDate(in7Days),
        checkin_time: '11:00',
        checkout_time: '17:00',
        total_nights: 4,
        total_dogs: 2,
        price_per_night: 35,
        total_amount: 140,
        platform_fee: 14,
        service_amount: 126,
        status: 'pending',
        payment_status: 'pending'
      },
      {
        hotel_profile_id: hotel.id,
        hotel_name: hotel.walker_name,
        hotel_email: DEMO_EMAIL,
        owner_name: 'Ricardo Mendes',
        owner_email: 'ricardo@example.com',
        owner_phone: '+351917000003',
        dogs: [
          { dog_name: 'Rex', dog_breed: 'Pastor Alemão', dog_size: 'extra_large', dog_age: 6, special_notes: 'Pode ficar sozinho' }
        ],
        service_type: 'daycare',
        checkin_date: formatDate(tomorrow),
        checkout_date: formatDate(tomorrow),
        checkin_time: '08:00',
        checkout_time: '18:00',
        total_nights: 1,
        total_dogs: 1,
        price_per_night: 25,
        total_amount: 25,
        platform_fee: 2.5,
        service_amount: 22.5,
        status: 'confirmed',
        payment_status: 'paid'
      }
    ];

    const createdBookings = [];
    for (const booking of bookings) {
      try {
        const created = await base44.asServiceRole.entities.HotelBooking.create(booking);
        createdBookings.push(created);
      } catch (e) {
        console.log('Booking might already exist:', e.message);
      }
    }

    return Response.json({
      ok: true,
      hotel_id: hotel.id,
      hotel_email: DEMO_EMAIL,
      hotel_name: hotel.walker_name,
      bookings_created: createdBookings.length,
      capacity_total: hotel.hotel_details.capacity_total,
      capacity_available: hotel.hotel_details.capacity_available,
      profile_url: `/UserProfile?email=${encodeURIComponent(DEMO_EMAIL)}`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});