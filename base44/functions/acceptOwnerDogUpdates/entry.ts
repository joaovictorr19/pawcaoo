import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { createOwnerSnapshot, findDogProfileByName } from "../../shared/dogSnapshot.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const guest_profile_id = body.guest_profile_id;
    const dog_name = body.dog_name;
    const apply_to_hotel_version = body.apply_to_hotel_version !== false; // default true

    if (!guest_profile_id || !dog_name) {
      return Response.json({ error: 'guest_profile_id and dog_name required' }, { status: 400 });
    }

    const profile = await base44.asServiceRole.entities.HotelGuestProfile.get(guest_profile_id);
    if (!profile) return Response.json({ error: 'Guest profile not found' }, { status: 404 });

    if (user.email !== profile.hotel_email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dogProfiles = profile.owner_email
      ? await base44.asServiceRole.entities.DogProfile.filter({ owner_email: profile.owner_email })
      : [];

    const nowIso = new Date().toISOString();
    const updatedDogs = (profile.dogs || []).map(dog => {
      if (dog.dog_name !== dog_name) return dog;

      const dogProfile = findDogProfileByName(dogProfiles, dog.dog_name);
      const newSnapshot = createOwnerSnapshot(dogProfile);

      const updated = {
        ...dog,
        owner_snapshot: newSnapshot || {},
        owner_snapshot_date: nowIso,
        has_owner_updates: false,
      };

      // Optionally update hotel fields with owner's latest data
      if (apply_to_hotel_version && dogProfile) {
        updated.dog_breed = dogProfile.breed || dog.dog_breed;
        updated.dog_size = dogProfile.size || dog.dog_size;
        updated.dog_age = dogProfile.age ?? dog.dog_age;
        updated.photo_url = dogProfile.photo_url || dog.photo_url;
        updated.persistent_medical_notes = dogProfile.medical_conditions || dog.persistent_medical_notes;
        updated.behavioral_profile = dogProfile.behavioral_notes || dog.behavioral_profile;
        updated.accustomed_to_being_alone = dogProfile.accustomed_to_being_alone ?? dog.accustomed_to_being_alone;
        updated.vaccine_expiry = dogProfile.vaccination_date || dog.vaccine_expiry;
      }

      return updated;
    });

    await base44.asServiceRole.entities.HotelGuestProfile.update(guest_profile_id, {
      dogs: updatedDogs,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});