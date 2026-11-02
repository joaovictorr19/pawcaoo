import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const LIMITS = { name: 120, email: 160, phone: 40, message: 2000 };

function clean(value, max) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);
}

/**
 * Envia uma mensagem de interesse em adoção.
 * O destinatário é sempre resolvido no servidor a partir do registo do anúncio
 * (apenas o criador, que é obrigatoriamente um utilizador da app) — nunca vem do cliente.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const listingId = clean(body.listing_id, 64);
    if (!listingId) return Response.json({ error: 'listing_id is required' }, { status: 400 });

    const name = clean(body.name, LIMITS.name);
    const contactEmail = clean(body.email, LIMITS.email);
    const phone = clean(body.phone, LIMITS.phone);
    const message = clean(body.message, LIMITS.message);

    if (!name || !contactEmail || !message) {
      return Response.json({ error: 'Nome, email e mensagem são obrigatórios' }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
      return Response.json({ error: 'Email inválido' }, { status: 400 });
    }

    let listing = null;
    for (const entityName of ['DogProfile', 'ShelterProfile']) {
      const rows = await base44.asServiceRole.entities[entityName].filter({ id: listingId });
      if (rows[0]) {
        listing = { ...rows[0], entityName };
        break;
      }
    }
    if (!listing) return Response.json({ error: 'Anúncio não encontrado' }, { status: 404 });

    const recipient = listing.created_by;
    if (!recipient) {
      return Response.json({ error: 'Anúncio sem responsável contactável' }, { status: 400 });
    }

    const petName = clean(listing.dog_name || listing.shelter_name || 'animal', 80);
    const listingRef = clean(listing.id, 64);

    await base44.asServiceRole.entities.Notification.create({
      recipient_email: recipient,
      title: `🐾 Interesse em Adoção: ${petName}`,
      message: `Recebeu uma nova mensagem de ${name}.\n\n"${message}"\n\nContacto: ${contactEmail}${phone ? ` | ${phone}` : ''}`,
      type: 'message',
      related_id: listingRef,
      action_url: `/AdoptionListingDetails?id=${listingRef}`,
      priority: 'high',
      is_read: false,
    });

    const emailBody = [
      'Nova mensagem de interesse em adoção via PawCão!',
      '',
      `Animal: ${petName}`,
      `Referência: ${listingRef}`,
      '',
      'Interessado(a):',
      `Nome: ${name}`,
      `Email: ${contactEmail}`,
      `Telefone: ${phone || 'Não informado'}`,
      '',
      'Mensagem:',
      message,
      '',
      `Responda diretamente para: ${contactEmail}`,
    ].join('\n');

    const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient,
      subject: `[PawCão] Interesse em adoção: ${petName}`,
      body: emailBody,
      from_name: 'PawCão Adoption',
    });

    return Response.json({ success: true, emailed: emailResult?.success !== false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}