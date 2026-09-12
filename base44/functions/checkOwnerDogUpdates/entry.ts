import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { createOwnerSnapshot, diffSnapshots, findDogProfileByName } from "../../shared/dogSnapshot.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const guest_profile_id = body.guest_profile_id;
    if (!guest_profile_id) return Response.json({ error: 'guest_profile_id required' }, { status: 400 });

    // Fetch guest profile as service role (hotel staff needs access)
    const profile = await base44.asServiceRole.entities.HotelGuestProfile.get(guest_profile_id);
    if (!profile) return Response.json({ error: 'Guest profile not found' }, { status: 404 });

    // Authorization: only the hotel owner or admin may check updates
    if (user.email !== profile.hotel_email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch owner's current DogProfiles
    const dogProfiles = profile.owner_email
      ? await base44.asServiceRole.entities.DogProfile.filter({ owner_email: profile.owner_email })
      : [];

    const results = [];
    const updatedDogs = [];

    for (const dog of (profile.dogs || [])) {
      const dogProfile = findDogProfileByName(dogProfiles, dog.dog_name);
      const storedSnapshot = dog.owner_snapshot || null;

      // Sem DogProfile correspondente (dono eliminou/renomeou) não dá para
      // comparar — não marcar tudo como "alterado para vazio" (falso positivo).
      const changes = dogProfile ? diffSnapshots(storedSnapshot, createOwnerSnapshot(dogProfile)) : [];
      const hasUpdates = changes.length > 0;
      const noMatchingProfile = !dogProfile;

      results.push({
        dog_name: dog.dog_name,
        has_owner_updates: hasUpdates,
        changes,
        no_matching_profile: noMatchingProfile,
        owner_snapshot_date: dog.owner_snapshot_date || null,
      });

      updatedDogs.push({
        ...dog,
        has_owner_updates: hasUpdates,
      });
    }

    // Persist the has_owner_updates flags
    await base44.asServiceRole.entities.HotelGuestProfile.update(guest_profile_id, {
      dogs: updatedDogs,
    });

    return Response.json({
      success: true,
      dogs: results,
      any_updates: results.some(r => r.has_owner_updates),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});