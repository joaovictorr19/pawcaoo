import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

/**
 * Resolve um caso de revisão do registo canónico de contas.
 * Só admins. Ações: confirmar valores, corrigir a indicação da conta,
 * pedir onboarding ao utilizador ou manter o caso em revisão.
 * As decisões manuais são gravadas no registo e preservadas pela sincronização.
 */

const REGIMES = ['customer', 'walker', 'trainer', 'hotel', 'shop'];
const COUNTRIES = ['portugal', 'spain', 'france'];
const ACTIONS = ['confirm', 'keep', 'claim_corrected', 'onboarding_requested'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (admin.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const email = String(body?.user_email || '').trim().toLowerCase();
    const action = String(body?.action || '').trim();

    if (!email) return Response.json({ error: 'user_email é obrigatório.' }, { status: 400 });
    if (!ACTIONS.includes(action)) return Response.json({ error: 'Ação inválida.' }, { status: 400 });

    const regime = body?.confirmed_regime ? String(body.confirmed_regime).trim() : null;
    const country = body?.confirmed_country ? String(body.confirmed_country).trim() : null;
    if (regime && !REGIMES.includes(regime)) return Response.json({ error: 'Regime inválido.' }, { status: 400 });
    if (country && !COUNTRIES.includes(country)) return Response.json({ error: 'País inválido.' }, { status: 400 });

    const svc = base44.asServiceRole;
    const found = await svc.entities.AccountRegistry.filter({ user_email: email });
    const record = Array.isArray(found) ? found[0] : (found?.items || [])[0];
    if (!record) return Response.json({ error: 'Conta sem registo sincronizado.' }, { status: 404 });

    const notes = String(body?.notes || '').trim().slice(0, 500);
    const patch = {
      reviewed_by: admin.email || 'admin',
      reviewed_date: new Date().toISOString(),
    };
    if (regime) patch.confirmed_regime = regime;
    if (country) patch.confirmed_country = country;
    if (notes) patch.admin_notes = notes;

    if (action === 'confirm') {
      if (!regime && !country) {
        return Response.json({ error: 'Indique o regime ou o país confirmado.' }, { status: 400 });
      }
      patch.review_resolved = true;
      patch.review_action = 'confirmed';
    }

    if (action === 'keep') {
      patch.review_resolved = false;
      patch.review_action = 'kept_in_review';
    }

    if (action === 'claim_corrected') {
      if (!record.user_id) return Response.json({ error: 'Conta sem identificador de utilizador.' }, { status: 400 });
      await svc.entities.User.update(record.user_id, { account_type: 'customer' });
      patch.confirmed_regime = 'customer';
      patch.review_resolved = true;
      patch.review_action = 'claim_corrected';
    }

    if (action === 'onboarding_requested') {
      await svc.entities.Notification.create({
        recipient_email: email,
        title: 'Complete o seu perfil profissional',
        message: 'A sua conta indica um perfil profissional, mas ainda não temos os dados completos. Conclua o registo profissional para continuar.',
        type: 'system',
        link: '/ProfessionalTypeSelect',
      });
      patch.review_resolved = false;
      patch.review_action = 'onboarding_requested';
    }

    const updated = await svc.entities.AccountRegistry.update(record.id, patch);
    return Response.json({ success: true, account: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}