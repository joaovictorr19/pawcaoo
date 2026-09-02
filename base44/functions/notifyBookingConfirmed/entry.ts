import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import {
  buildOwnerBookingConfirmedEmail,
  buildProfessionalBookingConfirmedEmail,
} from '../../shared/bookingEmailTemplate.ts';

// Envia emails profissionais de confirmação ao dono do animal e ao profissional
// quando uma reserva de passeio (Booking) ou treino (TrainingBooking) fica confirmada.
// Invocado automaticamente por workflows com gatilho de entidade.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const { entity_name, booking_id, dry_run } = body || {};

    if (!entity_name || !booking_id) {
      return Response.json({ error: 'Missing entity_name or booking_id' }, { status: 400 });
    }

    let b = null;

    if (entity_name === 'Booking') {
      const booking = await base44.asServiceRole.entities.Booking.get(booking_id);
      if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
      if (booking.status !== 'confirmed') {
        return Response.json({ success: true, skipped: true, reason: `status=${booking.status}` });
      }

      const isTraining = booking.type === 'training';
      const dogNames = (booking.dogs?.length
        ? booking.dogs.map((d) => d.dog_name).filter(Boolean)
        : [booking.dog_name]
      ).filter(Boolean).join(', ') || '—';

      const pickupLabel = booking.pickup_method === 'walker_pickup'
        ? 'Recolha pelo profissional'
        : booking.pickup_method === 'owner_dropoff'
          ? 'Entrega pelo dono'
          : '';

      b = {
        serviceName: isTraining ? 'Sessão de Treino' : 'Passeio',
        professionalName: booking.trainer_name || booking.walker_name || 'Profissional PawCão',
        professionalEmail: booking.trainer_email || booking.walker_email || '',
        ownerName: booking.owner_name || 'Cliente',
        ownerEmail: booking.owner_email || '',
        ownerPhone: booking.owner_phone || '',
        dogNames,
        date: isTraining ? booking.session_date : booking.walk_date,
        timeStr: (isTraining ? booking.session_time : booking.walk_time) || '',
        durationLabel: booking.duration_hours
          ? `${booking.duration_hours} ${booking.duration_hours === 1 ? 'hora' : 'horas'}`
          : '',
        locationText: [pickupLabel, booking.pickup_address || ''].filter(Boolean).join(' · '),
        trainingType: '',
        consultation: '',
        goals: '',
        notes: booking.special_notes || '',
        total: booking.total_amount,
        serviceAmount: booking.service_amount,
        platformFee: booking.platform_fee,
      };
    } else if (entity_name === 'TrainingBooking') {
      const booking = await base44.asServiceRole.entities.TrainingBooking.get(booking_id);
      if (!booking) return Response.json({ error: 'TrainingBooking not found' }, { status: 404 });
      if (booking.status !== 'confirmed') {
        return Response.json({ success: true, skipped: true, reason: `status=${booking.status}` });
      }

      // TrainingBooking não guarda o email do treinador — resolver via TrainerProfile
      let professionalEmail = '';
      try {
        if (booking.trainer_id) {
          const trainers = await base44.asServiceRole.entities.TrainerProfile.filter({ id: booking.trainer_id });
          professionalEmail = trainers[0]?.created_by || '';
        }
      } catch (e) {
        console.warn('Trainer lookup failed:', e?.message || e);
      }

      const consultationLabels = {
        in_person: 'Presencial',
        online: 'Online',
        hybrid: 'Híbrida (presencial + online)',
      };

      b = {
        serviceName: 'Sessão de Treino',
        professionalName: booking.trainer_name || 'Treinador PawCão',
        professionalEmail,
        ownerName: booking.owner_name || 'Cliente',
        ownerEmail: booking.owner_email || '',
        ownerPhone: booking.owner_phone || '',
        dogNames: booking.dog_name || '—',
        date: booking.session_date,
        timeStr: booking.session_time || '',
        durationLabel: booking.duration_hours
          ? `${booking.duration_hours} ${booking.duration_hours === 1 ? 'hora' : 'horas'}`
          : '',
        locationText: '',
        trainingType: booking.training_type || '',
        consultation: consultationLabels[booking.consultation_method] || '',
        goals: booking.training_goals || '',
        notes: booking.special_notes || '',
        total: booking.total_amount,
        serviceAmount: booking.service_amount,
        platformFee: booking.platform_fee,
      };
    } else {
      return Response.json({ error: 'Unsupported entity_name' }, { status: 400 });
    }

    const ownerEmailContent = buildOwnerBookingConfirmedEmail(b);
    const proEmailContent = buildProfessionalBookingConfirmedEmail(b);

    if (dry_run) {
      return Response.json({
        success: true,
        dry_run: true,
        owner: { to: b.ownerEmail, subject: ownerEmailContent.subject, body_preview: ownerEmailContent.body.slice(0, 600) },
        professional: { to: b.professionalEmail, subject: proEmailContent.subject, body_preview: proEmailContent.body.slice(0, 600) },
      });
    }

    const sent = [];
    if (b.ownerEmail) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: b.ownerEmail,
        subject: ownerEmailContent.subject,
        body: ownerEmailContent.body,
        from_name: 'PawCão',
      });
      sent.push({ to: 'owner', email: b.ownerEmail });
    }
    if (b.professionalEmail) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: b.professionalEmail,
        subject: proEmailContent.subject,
        body: proEmailContent.body,
        from_name: 'PawCão',
      });
      sent.push({ to: 'professional', email: b.professionalEmail });
    }

    return Response.json({ success: true, booking_id, entity_name, sent });
  } catch (error) {
    console.error('notifyBookingConfirmed error:', error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}