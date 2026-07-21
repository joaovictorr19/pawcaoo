import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // SECURITY: Require authentication — only the workflow system (invoke_backend_function)
    // or authenticated users may trigger review emails. Blocks external spam/abuse.
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { booking_id, email_type } = body;

    if (!booking_id) {
      return Response.json({ error: 'booking_id is required' }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // Fetch the training booking
    let booking;
    try {
      booking = await sr.entities.TrainingBooking.get(booking_id);
    } catch (e) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const ownerEmail = booking.owner_email;
    const ownerName = booking.owner_name || '';
    const trainerName = booking.trainer_name || 'o seu treinador';
    const dogName = booking.dog_name || '';

    if (!ownerEmail) {
      return Response.json({ error: 'owner_email not set on booking' }, { status: 400 });
    }

    // For the reminder: check whether a Review already exists for this booking.
    // If it does, skip sending the reminder.
    if (email_type === 'reminder') {
      try {
        const existingReviews = await sr.entities.Review.filter({ training_booking_id: booking_id });
        if (existingReviews && existingReviews.length > 0) {
          return Response.json({ skipped: true, reason: 'review_already_exists' });
        }
      } catch (e) {
        // If the check fails, proceed to send the reminder anyway
      }
    }

    const appUrl = 'https://pawcao.pt';
    const reviewLink = `${appUrl}/MyBookings`;

    const isReminder = email_type === 'reminder';

    const subject = isReminder
      ? `Ainda não partilhou a sua experiência com ${trainerName} 🐾`
      : `Como correreu a sua sessão com ${trainerName}? 🐾`;

    const greeting = ownerName ? `Olá ${ownerName},` : 'Olá,';

    const bodyHtml = isReminder
      ? `<div style="font-family:'Poppins',Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
           <p style="font-size:16px;">${greeting}</p>
           <p style="font-size:15px;line-height:1.6;">
             A sua sessão de treino ${dogName ? `com o/a ${dogName} ` : ''}com <strong>${trainerName}</strong> já foi concluída.
             A sua opinião é muito importante para nós e para outros donos que procuram um treinador de confiança.
           </p>
           <p style="font-size:15px;line-height:1.6;">
             Demora menos de um minuto e faz toda a diferença. 💚
           </p>
           <p style="margin-top:24px;">
             <a href="${reviewLink}"
                style="display:inline-block;background:#0d9483;color:#fff;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:15px;">
               Partilhar a minha experiência
             </a>
           </p>
           <p style="font-size:12px;color:#94a3b8;margin-top:32px;">Equipa PawCão 🐶</p>
         </div>`
      : `<div style="font-family:'Poppins',Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
           <p style="font-size:16px;">${greeting}</p>
           <p style="font-size:15px;line-height:1.6;">
             A sua sessão de treino ${dogName ? `com o/a ${dogName} ` : ''}com <strong>${trainerName}</strong> foi concluída.
             Esperamos que tenha corrido bem!
           </p>
           <p style="font-size:15px;line-height:1.6;">
             Gostaríamos muito de saber a sua opinião. A sua avaliação ajuda-nos a melhorar o serviço e ajuda outros donos a encontrar o treinador certo.
           </p>
           <p style="margin-top:24px;">
             <a href="${reviewLink}"
                style="display:inline-block;background:#0d9483;color:#fff;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:15px;">
               Avaliar a minha sessão
             </a>
           </p>
           <p style="font-size:12px;color:#94a3b8;margin-top:32px;">Equipa PawCão 🐶</p>
         </div>`;

    const result = await sr.integrations.Core.SendEmail({
      to: ownerEmail,
      subject,
      body: bodyHtml,
      from_name: 'PawCão',
    });

    return Response.json({
      sent: true,
      email_type: isReminder ? 'reminder' : 'first',
      to: ownerEmail,
      result,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});