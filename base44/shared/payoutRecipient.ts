/**
 * Resolve o profissional que vai receber um pagamento a partir de dados verificáveis
 * no servidor: nunca paga ao próprio cliente e recusa perfis criados depois da reserva
 * (sinal de que o destinatário da reserva foi reescrito para desviar o pagamento).
 */
export async function resolveVerifiedProfessional(base44, booking, professionalEmail, profileEntity = 'WalkerProfile') {
  const ownerEmail = booking?.owner_email || booking?.created_by;
  if (!professionalEmail) {
    return { error: 'Reserva sem profissional associado' };
  }
  if (ownerEmail && professionalEmail === ownerEmail) {
    return { error: 'O profissional da reserva não pode ser o próprio cliente' };
  }

  const profiles = await base44.asServiceRole.entities[profileEntity].filter({ created_by: professionalEmail });
  const profile = profiles[0];
  if (!profile) {
    return { error: 'Perfil do profissional não encontrado' };
  }

  const profileCreated = Date.parse(profile.created_date || '');
  const bookingCreated = Date.parse(booking?.created_date || '');
  if (Number.isFinite(profileCreated) && Number.isFinite(bookingCreated) && profileCreated > bookingCreated) {
    return { error: 'Perfil do profissional foi criado depois da reserva' };
  }

  return { profile };
}