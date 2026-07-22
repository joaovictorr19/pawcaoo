import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { hotel_profile_id, partner_email, partner_role, partner_name, custom_title } = body;

    if (!hotel_profile_id || !partner_email) {
      return Response.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    const email = partner_email.toLowerCase().trim();

    // 1. Buscar o perfil do hotel
    const hotels = await base44.asServiceRole.entities.WalkerProfile.filter({ id: hotel_profile_id });
    if (hotels.length === 0) {
      return Response.json({ error: 'Hotel não encontrado' }, { status: 404 });
    }
    const hotel = hotels[0];

    // Verificar que quem chama é o dono do hotel
    if (hotel.created_by !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // 2. Adicionar à lista de parceiros do hotel
    const currentPartners = hotel.hotel_details?.partner_walkers || [];
    if (currentPartners.some(p => p.walker_email === email)) {
      return Response.json({ error: 'Este email já é parceiro' }, { status: 400 });
    }

    const partnerData = {
      walker_email: email,
      walker_name: partner_name || email.split('@')[0],
      walker_photo_url: '',
      walker_profile_id: '',
      is_available_today: false,
      services: [],
      partner_role: partner_role || 'simple',
      custom_title: custom_title || '',
      status: 'pending',
    };

    // Buscar o WalkerProfile do parceiro para obter o ID e foto
    const partnerProfiles = await base44.asServiceRole.entities.WalkerProfile.filter({ created_by: email });
    if (partnerProfiles.length > 0) {
      partnerData.walker_profile_id = partnerProfiles[0].id;
      partnerData.walker_photo_url = partnerProfiles[0].photo_url || '';
      partnerData.walker_name = partnerProfiles[0].walker_name || partnerData.walker_name;
    }

    const updatedPartners = [...currentPartners, partnerData];

    await base44.asServiceRole.entities.WalkerProfile.update(hotel_profile_id, {
      hotel_details: {
        ...hotel.hotel_details,
        partner_walkers: updatedPartners,
      },
    });

    // NOTE: The partnership is NOT written to the partner's profile here.
    // A two-step invitation flow is required: the hotel creates a pending
    // invitation (above), and the partner must explicitly accept it via a
    // separate function before hotel_partnerships is updated on their profile.
    // Writing to the partner's profile unilaterally via Service Role would
    // allow hotels to forge false associations without consent.

    return Response.json({ success: true, message: 'Parceiro adicionado' });
  } catch (error) {
    console.error('addHotelPartner error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});