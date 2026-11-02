import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const event = body?.event || {};

    // SECURITY: a reserva é sempre relida da base de dados. O corpo do pedido nunca
    // é fonte de verdade — caso contrário um chamador anónimo poderia escolher o
    // destinatário (walker_email/trainer_email) e o conteúdo do email.
    if (!event?.entity_id) {
      return Response.json({ success: false, message: 'Missing entity_id' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(event.entity_id).catch(() => null);

    if (!booking) {
      return Response.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const recipient = booking.walker_email || booking.trainer_email;
    if (!recipient) {
      return Response.json({ success: true, skipped: true, message: 'No professional email on booking' });
    }

    // Tentar buscar ficha completa do animal
    let dogProfile = null;
    if (booking.dog_profile_id) {
      try {
        const profiles = await base44.asServiceRole.entities.DogProfile.filter({ id: booking.dog_profile_id });
        dogProfile = profiles[0] || null;
      } catch (e) {
        console.warn('Could not fetch dog profile:', e?.message);
      }
    }

    const type = booking.type === 'training' ? 'treino' : 'passeio';
    const owner = booking.owner_name || 'Cliente';
    const dogName = dogProfile?.dog_name || booking.dog_name || (booking.dogs?.[0]?.dog_name) || 'Pet';
    const dateStr = booking.walk_date ? new Date(booking.walk_date).toLocaleDateString('pt-PT') : '';
    const timeStr = booking.walk_time || '';
    const duration = booking.duration_hours ? `${booking.duration_hours}h` : '';
    const location = booking.pickup_address || booking.pickup_location || booking.location || '';
    const dashboardUrl = `${(new URL('/ProfessionalHubV2', req.url)).origin}/ProfessionalHubV2`;
    const total = typeof booking.total_amount === 'number' ? `${booking.total_amount.toFixed(2)}€` : null;
    const service = booking.type === 'training' ? 'Treino' : 'Passeio';

    // Secção detalhada do animal
    const animalLines = dogProfile ? [
      '',
      '--- FICHA DO ANIMAL ---',
      `Nome: ${dogProfile.dog_name}`,
      dogProfile.breed ? `Raça: ${dogProfile.breed}` : null,
      dogProfile.age ? `Idade: ${dogProfile.age} anos` : null,
      dogProfile.weight ? `Peso: ${dogProfile.weight} kg` : null,
      dogProfile.size ? `Tamanho: ${dogProfile.size === 'small' ? 'Pequeno' : dogProfile.size === 'medium' ? 'Médio' : dogProfile.size === 'large' ? 'Grande' : 'XL'}` : null,
      dogProfile.gender ? `Sexo: ${dogProfile.gender === 'male' ? 'Macho' : 'Fêmea'}` : null,
      `Vacinado: ${dogProfile.is_vaccinated ? 'Sim ✓' : 'Não'}`,
      `Castrado: ${dogProfile.is_neutered ? 'Sim ✓' : 'Não'}`,
      dogProfile.energy_level ? `Nível de energia: ${dogProfile.energy_level === 'very_high' ? 'Muito Alta' : dogProfile.energy_level === 'high' ? 'Alta' : dogProfile.energy_level === 'normal' ? 'Normal' : 'Baixa'}` : null,
      dogProfile.socialization ? `Socialização: ${dogProfile.socialization === 'friendly' ? 'Amigável' : dogProfile.socialization === 'neutral' ? 'Neutro' : dogProfile.socialization === 'shy' ? 'Tímido' : 'Agressivo'}` : null,
      dogProfile.medical_conditions ? `⚠️ Condições médicas: ${dogProfile.medical_conditions}` : null,
      dogProfile.allergies ? `⚠️ Alergias: ${dogProfile.allergies}` : null,
      dogProfile.behavioral_notes ? `Notas de comportamento: ${dogProfile.behavioral_notes}` : null,
      dogProfile.special_care_notes ? `Cuidados especiais: ${dogProfile.special_care_notes}` : null,
      dogProfile.vet_clinic_name ? `Veterinário: ${dogProfile.vet_clinic_name}` : null,
      dogProfile.vet_phone ? `Tel. veterinário: ${dogProfile.vet_phone}` : null,
      dogProfile.emergency_contact_name ? `Contacto de emergência: ${dogProfile.emergency_contact_name} (${dogProfile.emergency_contact_phone || ''})` : null,
      '------------------------',
    ].filter(Boolean) : [];

    const lines = [
      `Olá,`,
      `Recebeu um novo pedido de ${type} na PawCão.`,
      '',
      `Estado da reserva: PENDENTE`,
      '',
      `--- RESUMO DA RESERVA ---`,
      `Cliente: ${owner}`,
      `Telefone do cliente: ${booking.owner_phone || 'Não fornecido'}`,
      `Animal: ${dogName}`,
      `Serviço: ${service}`,
      dateStr || timeStr ? `Data e hora: ${[dateStr, timeStr].filter(Boolean).join(' às ')}` : null,
      duration ? `Duração: ${duration}` : null,
      location ? `Local de recolha: ${location}` : null,
      total ? `Valor total: ${total}` : null,
      booking.special_notes ? `Observações do cliente: ${booking.special_notes}` : null,
      ...animalLines,
      '',
      `O pagamento foi registado e a reserva aguarda a sua decisão.`,
      `Aceda ao seu painel para aceitar ou recusar:`,
      dashboardUrl,
      '',
      `Obrigado,`,
      `Equipa PawCão`
    ].filter(v => v !== null).join('\n');

    // SECURITY: Strip any HTML tags from user-controlled content to prevent
    // HTML injection/phishing in the recipient's email client.
    const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'PawCão',
      to: recipient,
      subject: stripHtml(`Novo pedido de ${type} — ${dogName} (${owner}) | PawCão`),
      body: stripHtml(lines),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('notifyWalkerNewBooking error:', error);
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});