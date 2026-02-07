import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userEmail, walkerName } = body;

    if (!userEmail || !walkerName) {
      return Response.json({ error: 'userEmail e walkerName são obrigatórios' }, { status: 400 });
    }

    // Criar perfil de passeador
    const walkerProfile = await base44.asServiceRole.entities.WalkerProfile.create({
      walker_name: walkerName,
      location: 'Portugal',
      hourly_rate: 15,
      whatsapp_number: '+351000000000',
      is_active: true,
      verification_status: 'requires_documents',
      created_by: userEmail,
    });

    return Response.json({
      success: true,
      walkerId: walkerProfile.id,
      message: 'Perfil de passeador criado com sucesso',
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar perfil:', error.message || error);
    return Response.json({ 
      error: error.message || 'Erro ao criar perfil',
      success: false 
    }, { status: 500 });
  }
});