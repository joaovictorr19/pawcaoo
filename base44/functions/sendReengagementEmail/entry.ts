import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const allUsers = await base44.asServiceRole.entities.User.list(undefined, 500);

    const subject = 'Novidades no PawCão: A tua conta está pronta para novos clientes? 🐾';

    // SECURITY: Escape HTML to prevent injection via user-controlled names
    const escapeHtml = (s) => String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const buildBody = (name) => {
      const firstName = name ? escapeHtml(name.split(' ')[0]) : 'amigo';
      return `
        <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #1D8A82, #2DB0A6); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800;">PawCão tem novidades! 🐾</h1>
          </div>
          <div style="padding: 32px 24px;">
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">Olá, <strong>${firstName}</strong>,</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Esperamos que estejas bem! Lançámos uma <strong>nova versão do PawCão</strong>, mais rápida, moderna e desenhada para te dar mais visibilidade.
            </p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Em breve vamos receber <strong>novos clientes</strong> na plataforma — por isso, este é o momento ideal para atualizares o teu perfil e garantires que apareces nas primeiras buscas.
            </p>
            <div style="background: #f0fdfa; border-left: 4px solid #1D8A82; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #134e4a; font-size: 14px; font-weight: 700;">Porquê atualizar agora?</p>
              <ul style="color: #475569; font-size: 14px; line-height: 1.8; margin: 8px 0 0 0; padding-left: 20px;">
                <li>Perfis completos aparecem primeiro nas buscas</li>
                <li>Novas campanhas vão trair mais clientes nas próximas semanas</li>
                <li>Garante que os teus serviços e horários estão atualizados</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 28px 0;">
              <a href="https://app.pawcao.pt" style="display: inline-block; background: linear-gradient(135deg, #1D8A82, #2DB0A6); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 9999px; font-weight: 700; font-size: 15px;">Atualizar o meu perfil</a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; text-align: center; margin-top: 24px;">
              Se precisares de ajuda, responde a este email — estamos aqui para ti.<br/>
              <strong>Equipa PawCão</strong>
            </p>
          </div>
        </div>
      `;
    };

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const u of allUsers) {
      if (!u.email) continue;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          subject,
          body: buildBody(u.full_name),
          from_name: 'PawCão'
        });
        sent++;
      } catch (err) {
        failed++;
        errors.push({ email: u.email, error: err.message });
      }
    }

    return Response.json({
      success: true,
      total: allUsers.length,
      sent,
      failed,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});