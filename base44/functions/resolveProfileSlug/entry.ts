import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

/**
 * Resolve um link curto (/slug) para o perfil de destino.
 * O email associado ao slug é privado, por isso a tradução slug → perfil é feita
 * no servidor e apenas o id do perfil é devolvido ao visitante.
 */
export default async function (req) {
  try {
    const { slug } = await req.json().catch(() => ({}));
    if (!slug || typeof slug !== 'string') {
      return Response.json({ error: 'slug is required' }, { status: 400 });
    }
    const clean = slug.trim().toLowerCase();
    if (!clean) return Response.json({ error: 'slug is required' }, { status: 400 });

    const base44 = createClientFromRequest(req);

    const rows = await base44.asServiceRole.entities.ProfileSlug.filter({ slug: clean }, undefined, 5);
    const entry = rows?.[0];
    if (!entry) return Response.json({ found: false });

    if (entry.entity_id) {
      return Response.json({ found: true, type: entry.entity_type, profile_id: entry.entity_id });
    }

    const email = entry.entity_email;
    if (!email) return Response.json({ found: false });

    if (entry.entity_type === 'user') {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: email }, undefined, 1);
      if (profiles?.[0]?.id) return Response.json({ found: true, type: 'user', profile_id: profiles[0].id });
      // Sem UserProfile: pode ser um slug antigo de profissional — cai para os perfis abaixo
    }

    if (entry.entity_type === 'trainer') {
      const trainers = await base44.asServiceRole.entities.TrainerProfile.filter({ created_by: email }, undefined, 1);
      if (trainers?.[0]?.id) return Response.json({ found: true, type: 'trainer', profile_id: trainers[0].id });
      return Response.json({ found: false });
    }

    if (entry.entity_type === 'company') {
      const companies = await base44.asServiceRole.entities.PartnerCompany.filter({ company_email: email }, undefined, 1);
      if (companies?.[0]?.id) return Response.json({ found: true, partner_id: companies[0].id });
      return Response.json({ found: false });
    }

    const walkers = await base44.asServiceRole.entities.WalkerProfile.filter({ created_by: email }, undefined, 5);
    if (!walkers?.length) return Response.json({ found: false });

    const preferred = entry.entity_type === 'hotel'
      ? walkers.find((w) => w.professional_type === 'hotel') || walkers[0]
      : walkers.find((w) => !['hotel', 'shop'].includes(w.professional_type)) || walkers[0];

    return Response.json({ found: true, type: entry.entity_type, profile_id: preferred.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}