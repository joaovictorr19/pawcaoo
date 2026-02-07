import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
    }

    const body = await req.json();
    const { userEmail, userName, type } = body; // type: 'walker', 'trainer'

    if (!userEmail || !userName || !type) {
      return new Response(
        JSON.stringify({ error: 'userEmail, userName e type são obrigatórios' }),
        { status: 400 }
      );
    }

    const results = {
      walker: null,
      trainer: null,
      messages: []
    };

    // 1. Handle Walker Profile
    if (type === 'walker') {
      // Check if exists
      const existingWalker = await base44.asServiceRole.entities.WalkerProfile.filter({ created_by: userEmail });
      
      if (existingWalker.length > 0) {
        results.walker = existingWalker[0];
        results.messages.push('Perfil de passeador já existe.');
      } else {
        const newWalker = await base44.asServiceRole.entities.WalkerProfile.create({
          walker_name: userName,
          location: 'Portugal',
          hourly_rate: 15,
          whatsapp_number: '+351000000000',
          is_active: true,
          verification_status: 'requires_documents',
          created_by: userEmail,
        });
        results.walker = newWalker;
        results.messages.push('Perfil de passeador criado com sucesso.');
        
        // Update user role if needed, purely cosmetic or for permissions if logic relies on it
        // But mainly existence of profile dictates capability
      }
    }

    // 2. Handle Trainer Profile
    if (type === 'trainer') {
      // Check if exists
      const existingTrainer = await base44.asServiceRole.entities.TrainerProfile.filter({ created_by: userEmail });
      
      if (existingTrainer.length > 0) {
        results.trainer = existingTrainer[0];
        results.messages.push('Perfil de treinador já existe.');
      } else {
        const newTrainer = await base44.asServiceRole.entities.TrainerProfile.create({
          trainer_name: userName,
          location: 'Portugal',
          hourly_rate: 25,
          is_active: true,
          verification_status: 'requires_documents',
          created_by: userEmail,
        });
        results.trainer = newTrainer;
        results.messages.push('Perfil de treinador criado com sucesso.');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: results,
        message: results.messages.join(' '),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao criar perfil profissional:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});