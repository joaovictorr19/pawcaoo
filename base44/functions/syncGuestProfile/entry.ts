import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { createOwnerSnapshot } from "../../shared/dogSnapshot.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const booking_id = body.booking_id || body.event?.entity_id;
    if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.HotelBooking.get(booking_id);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    if (user.email !== booking.hotel_email && user.email !== booking.owner_email) {
      return Response.json({ error: 'Forbidden: not authorized for this booking' }, { status: 403 });
    }

    const existing = await base44.asServiceRole.entities.HotelGuestProfile.filter({
      hotel_profile_id: booking.hotel_profile_id,
      owner_email: booking.owner_email,
    });

    let profile;
    const stayDate = booking.checkout_date || booking.checkin_date || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const dogProfiles = booking.owner_email
      ? await base44.asServiceRole.entities.DogProfile.filter({ owner_email: booking.owner_email })
      : [];

    // Foto de perfil do cliente (sincronizada do UserProfile do dono)
    const ownerUserProfiles = booking.owner_email
      ? await base44.asServiceRole.entities.UserProfile.filter({ user_email: booking.owner_email })
      : [];
    const ownerUser = ownerUserProfiles[0];

    if (existing.length > 0) {
      profile = existing[0];
      const updatedDogs = (booking.dogs || []).map(bookingDog => {
        const existingDog = (profile.dogs || []).find(d => d.dog_name === bookingDog.dog_name);
        const dogProfile = dogProfiles.find(dp => dp.dog_name === bookingDog.dog_name);
        const newSnapshot = createOwnerSnapshot(dogProfile);

        // Preserve hotel-edited fields; only update owner_snapshot if data changed
        const oldSnapshot = existingDog?.owner_snapshot || null;
        const snapshotChanged = JSON.stringify(oldSnapshot) !== JSON.stringify(newSnapshot);

        const behavioralProfile = [
          existingDog?.behavioral_profile,
          booking.behavioral_notes,
          dogProfile?.behavioral_notes,
        ].filter(Boolean).join(' | ');

        return {
          dog_name: bookingDog.dog_name,
          dog_breed: existingDog?.dog_breed || bookingDog.dog_breed || dogProfile?.breed,
          dog_size: existingDog?.dog_size || bookingDog.dog_size || dogProfile?.size,
          dog_age: existingDog?.dog_age || bookingDog.dog_age || dogProfile?.age,
          photo_url: existingDog?.photo_url || dogProfile?.photo_url,
          persistent_medical_notes: existingDog?.persistent_medical_notes || bookingDog.special_notes || dogProfile?.medical_conditions || '',
          behavioral_profile: behavioralProfile || '',
          accustomed_to_being_alone: existingDog?.accustomed_to_being_alone ?? (dogProfile?.accustomed_to_being_alone ?? false),
          vaccine_expiry: existingDog?.vaccine_expiry || bookingDog.vaccine_expiry || dogProfile?.vaccination_date,
          vaccine_document_url: existingDog?.vaccine_document_url || bookingDog.vaccine_document_url,
          // Snapshot do dono — só atualiza se mudou
          owner_snapshot: newSnapshot || oldSnapshot || {},
          owner_snapshot_date: snapshotChanged ? nowIso : (existingDog?.owner_snapshot_date || nowIso),
          has_owner_updates: false,
        };
      });

      const mergedDogs = [
        ...(profile.dogs || []).filter(d => !booking.dogs?.some(bd => bd.dog_name === d.dog_name)),
        ...updatedDogs,
      ];

      await base44.asServiceRole.entities.HotelGuestProfile.update(profile.id, {
        owner_name: booking.owner_name,
        owner_phone: booking.owner_phone || profile.owner_phone,
        owner_photo_url: ownerUser?.profile_photo_url || profile.owner_photo_url,
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
      profile = await base44.asServiceRole.entities.HotelGuestProfile.create({
        hotel_profile_id: booking.hotel_profile_id,
        hotel_email: booking.hotel_email,
        owner_name: booking.owner_name,
        owner_email: booking.owner_email,
        owner_phone: booking.owner_phone,
        owner_photo_url: ownerUser?.profile_photo_url,
        emergency_contact_name: booking.emergency_contact_name,
        emergency_contact_phone: booking.emergency_contact_phone,
        veterinarian_name: booking.veterinarian_name,
        veterinarian_phone: booking.veterinarian_phone,
        dogs: (booking.dogs || []).map(d => {
          const dogProfile = dogProfiles.find(dp => dp.dog_name === d.dog_name);
          const snapshot = createOwnerSnapshot(dogProfile);
          return {
            dog_name: d.dog_name,
            dog_breed: d.dog_breed || dogProfile?.breed,
            dog_size: d.dog_size || dogProfile?.size,
            dog_age: d.dog_age || dogProfile?.age,
            photo_url: dogProfile?.photo_url,
            persistent_medical_notes: d.special_notes || dogProfile?.medical_conditions || '',
            behavioral_profile: booking.behavioral_notes || dogProfile?.behavioral_notes || '',
            accustomed_to_being_alone: dogProfile?.accustomed_to_being_alone ?? false,
            vaccine_expiry: d.vaccine_expiry || dogProfile?.vaccination_date,
            vaccine_document_url: d.vaccine_document_url,
            owner_snapshot: snapshot || {},
            owner_snapshot_date: nowIso,
            has_owner_updates: false,
          };
        }),
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