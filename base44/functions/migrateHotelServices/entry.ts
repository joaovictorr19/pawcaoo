import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { hotel_email } = body;

    if (!hotel_email) {
      return Response.json({ error: 'hotel_email required' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.WalkerProfile.filter({
      created_by: hotel_email,
      professional_type: 'hotel'
    });

    if (profiles.length === 0) {
      return Response.json({ error: 'No hotel profile found' }, { status: 404 });
    }

    const profile = profiles[0];
    const hotelDetails = profile.hotel_details || {};

    // Check if already migrated
    if (hotelDetails.services && hotelDetails.services.length > 0) {
      return Response.json({
        success: true,
        status: 'already_migrated',
        message: 'Hotel already has services configured',
        services_count: hotelDetails.services.length
      });
    }

    // Build services from legacy fields
    const newServices = [];

    // Migrate boarding (alojamento)
    if (hotelDetails.price_per_night && hotelDetails.capacity_total) {
      newServices.push({
        service_id: 'alojamento',
        service_name: 'Alojamento',
        service_type: 'boarding',
        description: 'Alojamento noturno e pernoita',
        price_per_day: hotelDetails.price_per_night,
        capacity_total: hotelDetails.capacity_total,
        capacity_available: hotelDetails.capacity_available || hotelDetails.capacity_total,
        is_active: true,
        accepted_dog_sizes: hotelDetails.accepted_dog_sizes || ['small', 'medium', 'large']
      });
    }

    // Migrate daycare (creche)
    if (hotelDetails.price_daycare) {
      newServices.push({
        service_id: 'creche',
        service_name: 'Creche Diária',
        service_type: 'daycare',
        description: 'Creche diária com supervisão',
        price_per_day: hotelDetails.price_daycare,
        capacity_total: Math.floor((hotelDetails.capacity_total || 5) * 0.8), // 80% capacity for daycare
        capacity_available: Math.floor((hotelDetails.capacity_available || hotelDetails.capacity_total || 5) * 0.8),
        is_active: true,
        accepted_dog_sizes: hotelDetails.accepted_dog_sizes || ['small', 'medium', 'large']
      });
    }

    // Update profile with new services
    await base44.asServiceRole.entities.WalkerProfile.update(profile.id, {
      hotel_details: {
        ...hotelDetails,
        services: newServices
      }
    });

    return Response.json({
      success: true,
      status: 'migrated',
      message: `Migrated ${newServices.length} services`,
      services: newServices,
      profile_id: profile.id
    });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});