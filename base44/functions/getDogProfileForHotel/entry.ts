// Devolve o perfil completo do animal (DogProfile) do dono para o hotel.
// O hotel não tem acesso direto ao DogProfile (RLS do dono) — esta função
// valida que o hotel é dono do perfil de hóspede antes de o partilhar.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findDogProfileByName } from "../../shared/dogSnapshot.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const guestProfileId = body.guest_profile_id;
    const dogName = body.dog_name;
    if (!guestProfileId || !dogName) {
      return Response.json({ error: 'guest_profile_id e dog_name são obrigatórios' }, { status: 400 });
    }

    const guestProfile = await base44.asServiceRole.entities.HotelGuestProfile.get(guestProfileId);
    if (!guestProfile) return Response.json({ error: 'Perfil de hóspede não encontrado' }, { status: 404 });

    // Apenas o hotel dono do perfil de hóspede (ou admin) pode ver os dados
    const isHotelOwner = String(guestProfile.hotel_email || '').trim().toLowerCase() === String(user.email || '').trim().toLowerCase();
    const isAdmin = user.role === 'admin';
    if (!isHotelOwner && !isAdmin) {
      return Response.json({ error: 'Sem permissão para ver dados deste animal' }, { status: 403 });
    }

    const dogProfiles = await base44.asServiceRole.entities.DogProfile.filter({ owner_email: guestProfile.owner_email });
    const dogProfile = findDogProfileByName(dogProfiles, dogName);

    return Response.json({ success: true, found: !!dogProfile, dog_profile: dogProfile || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}