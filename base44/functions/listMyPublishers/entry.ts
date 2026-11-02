import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

/**
 * Devolve os publishers externos a que o utilizador autenticado está ligado.
 * A lista de emails ligados é privada, por isso a verificação é feita no servidor
 * e só os campos públicos necessários à seleção são devolvidos.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const publishers = await base44.asServiceRole.entities.ExternalPublisher.filter(
      { connected_user_emails: user.email },
      undefined,
      50
    );

    return Response.json({
      publishers: (publishers || []).map((p) => ({
        id: p.id,
        publisher_name: p.publisher_name,
        logo_url: p.logo_url || '',
        category: p.category || 'news',
        is_verified: !!p.is_verified,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}