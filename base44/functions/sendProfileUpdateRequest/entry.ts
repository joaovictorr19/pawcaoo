import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { buildProfileUpdateRequestEmail } from "../../shared/profileUpdateRequestEmailTemplate.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const {
      recipient_email,
      recipient_name,
      profile_type,
      selected_items,
      custom_note,
      edit_url,
      profile_id,
      profile_kind,
    } = body || {};

    if (!recipient_email || !Array.isArray(selected_items) || selected_items.length === 0) {
      return Response.json({ error: 'recipient_email and a non-empty selected_items array are required' }, { status: 400 });
    }

    // Validate recipient is a real user
    const users = await base44.asServiceRole.entities.User.filter({ email: recipient_email });
    if (!users || users.length === 0) {
      return Response.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const { subject, body: htmlBody } = buildProfileUpdateRequestEmail({
      recipient_name: recipient_name || users[0].full_name || recipient_email,
      profile_type,
      selected_items,
      custom_note,
      edit_url,
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient_email,
      subject,
      body: htmlBody,
      from_name: 'PawCão — Moderação',
    });

    // In-app notification to the recipient
    const itemLabels = selected_items.map((i) => i.label).join(', ');
    try {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email,
        title: 'Pedido de atualização de perfil',
        message: `A equipa PawCão pede que atualize: ${itemLabels}.`,
        type: 'system',
        link: edit_url || undefined,
      });
    } catch (e) {
      console.warn('Notification log failed:', e);
    }

    // ProfileEditRequest audit (professionals only)
    if (profile_id && profile_kind && profile_kind !== 'client') {
      try {
        await base44.asServiceRole.entities.ProfileEditRequest.create({
          profile_id,
          profile_type: profile_kind,
          professional_name: recipient_name || recipient_email,
          professional_email: recipient_email,
          requested_changes: {
            requested_items: selected_items,
            admin_message: custom_note || null,
            edit_url: edit_url || null,
          },
          original_data: {},
          status: 'pending',
          request_type: 'admin_outbound',
        });
      } catch (e) {
        console.warn('ProfileEditRequest log failed:', e);
      }
    }

    return Response.json({
      success: true,
      sent_to: recipient_email,
      items_count: selected_items.length,
    });
  } catch (error) {
    console.error('Erro ao enviar pedido de atualização de perfil:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}