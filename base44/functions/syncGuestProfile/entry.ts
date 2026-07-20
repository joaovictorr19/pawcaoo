import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    // Support both manual calls ({ booking_id }) and automation events ({ event, data })
    const booking_id = body.booking_id || body.event?.entity_id;
    if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

    // Always fetch the booking from the database — never trust body.data
    // to prevent IDOR via user-supplied payload injection.
    const booking = await base44.asServiceRole.entities.HotelBooking.get(booking_id);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    // Authorization: only the hotel owner or the pet owner may sync the guest profile.
    if (user.email !== booking.hotel_email && user.email !== booking.owner_email) {
      return Response.json({ error: 'Forbidden: not authorized for this booking' }, { status: 403 });
    }

    // Find or create guest profile
    const existing = await base44.asServiceRole.entities.HotelGuestProfile.filter({
      hotel_profile_id: booking.hotel_profile_id,
      owner_email: booking.owner_email,
    });

    let profile;
    const stayDate = booking.checkout_date || booking.checkin_date || new Date().toISOString().split('T')[0];

    if (existing.length > 0) {
      profile = existing[0];
      // Update existing profile with accumulated data
      const updatedDogs = (booking.dogs || []).map(bookingDog => {
        const existingDog = (profile.dogs || []).find(d => d.dog_name === bookingDog.dog_name);
        const behavioralProfile = [
          existingDog?.behavioral_profile,
          booking.behavioral_notes,
        ].filter(Boolean).join(' | ');

        return {
          dog_name: bookingDog.dog_name,
          dog_breed: bookingDog.dog_breed || existingDog?.dog_breed,
          dog_size: bookingDog.dog_size || existingDog?.dog_size,
          dog_age: bookingDog.dog_age || existingDog?.dog_age,
          photo_url: existingDog?.photo_url,
          persistent_medical_notes: existingDog?.persistent_medical_notes || bookingDog.special_notes || '',
          behavioral_profile: behavioralProfile || '',
          vaccine_expiry: bookingDog.vaccine_expiry || existingDog?.vaccine_expiry,
          vaccine_document_url: bookingDog.vaccine_document_url || existingDog?.vaccine_document_url,
        };
      });

      // Merge: keep existing dogs not in this booking, update/add dogs from this booking
      const mergedDogs = [...(profile.dogs || []).filter(d => !booking.dogs?.some(bd => bd.dog_name === d.dog_name)), ...updatedDogs];

      await base44.asServiceRole.entities.HotelGuestProfile.update(profile.id, {
        owner_name: booking.owner_name,
        owner_phone: booking.owner_phone || profile.owner_phone,
        emergency_contact_name: booking.emergency_contact_name || profile.emergency_contact_name,
        emergency_contact_phone: booking.emergency_contact_phone || profile.emergency_contact_phone,
        veterinarian_name: booking.veterinarian_name || profile.veterinarian_name,
        veterinarian_phone: booking.veterinarian_phone || profile.veterinarian_phone,
        dogs: mergedDogs,
        total_stays: (profile.total_stays || 0) + 1,
        total_spent: (profile.total_spent || 0) + (booking.total_amount || 0),
        last_stay_date: stayDate,
        first_stay_date: profile.first_stay_date || stayDate,
      });
    } else {
      // Create new profile
      profile = await base44.asServiceRole.entities.HotelGuestProfile.create({
        hotel_profile_id: booking.hotel_profile_id,
        hotel_email: booking.hotel_email,
        owner_name: booking.owner_name,
        owner_email: booking.owner_email,
        owner_phone: booking.owner_phone,
        emergency_contact_name: booking.emergency_contact_name,
        emergency_contact_phone: booking.emergency_contact_phone,
        veterinarian_name: booking.veterinarian_name,
        veterinarian_phone: booking.veterinarian_phone,
        dogs: (booking.dogs || []).map(d => ({
          dog_name: d.dog_name,
          dog_breed: d.dog_breed,
          dog_size: d.dog_size,
          dog_age: d.dog_age,
          persistent_medical_notes: d.special_notes || '',
          behavioral_profile: booking.behavioral_notes || '',
          vaccine_expiry: d.vaccine_expiry,
          vaccine_document_url: d.vaccine_document_url,
        })),
        total_stays: 1,
        total_spent: booking.total_amount || 0,
        first_stay_date: stayDate,
        last_stay_date: stayDate,
      });
    }

    return Response.json({ success: true, profile_id: profile.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});