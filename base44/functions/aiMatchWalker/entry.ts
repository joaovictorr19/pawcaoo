import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dogProfile, preferences, limit = 5 } = await req.json();

    // Fetch active walkers
    const walkers = await base44.asServiceRole.entities.WalkerProfile.filter(
      { is_active: true, verification_status: 'verified' },
      '-rating'
    );

    if (!walkers || walkers.length === 0) {
      return Response.json({ matches: [], message: 'No walkers available' });
    }

    // Fetch walker reviews for better matching
    const reviews = await base44.asServiceRole.entities.Review.list();

    // Prepare context for AI
    const walkersData = walkers.slice(0, 50).map(w => ({
      id: w.id,
      name: w.walker_name,
      location: w.location,
      rating: w.rating || 0,
      total_walks: w.total_walks || 0,
      experience_years: w.experience_years || 0,
      dog_sizes: w.dog_sizes || [],
      dog_breeds_handled: w.dog_breeds_handled || [],
      breed_specialization: w.breed_specialization || [],
      specializations: w.specializations || [],
      hourly_rate: w.hourly_rate,
      availability: w.availability || [],
      service_areas: w.service_areas || [],
      can_walk_multiple_dogs: w.can_walk_multiple_dogs || false,
    }));

    const dogInfo = {
      name: dogProfile?.dog_name || 'Desconhecido',
      breed: dogProfile?.breed || 'Desconhecido',
      size: dogProfile?.size || 'medium',
      age: dogProfile?.age || 0,
      energy_level: dogProfile?.energy_level || 'normal',
      socialization: dogProfile?.socialization || 'friendly',
      behavioral_notes: dogProfile?.behavioral_notes || '',
      gets_along_with: dogProfile?.gets_along_with || {},
    };

    const userPreferences = {
      preferred_time: preferences?.preferred_time || [],
      location: preferences?.location || user.city || '',
      max_price: preferences?.max_price || 50,
      priority_factors: preferences?.priority_factors || ['experience', 'rating', 'specialization'],
      special_requirements: preferences?.special_requirements || '',
    };

    // Use AI to analyze and rank matches
    const prompt = `Você é um especialista em matching de passeadores de cães. Analise os dados e retorne os ${limit} melhores matches.

**CÃO:**
- Nome: ${dogInfo.name}
- Raça: ${dogInfo.breed}
- Tamanho: ${dogInfo.size}
- Idade: ${dogInfo.age} anos
- Energia: ${dogInfo.energy_level}
- Socialização: ${dogInfo.socialization}
- Notas comportamentais: ${dogInfo.behavioral_notes}

**PREFERÊNCIAS DO DONO:**
- Horário preferido: ${userPreferences.preferred_time.join(', ') || 'Flexível'}
- Localização: ${userPreferences.location}
- Orçamento máximo: €${userPreferences.max_price}/hora
- Prioridades: ${userPreferences.priority_factors.join(', ')}
- Requisitos especiais: ${userPreferences.special_requirements || 'Nenhum'}

**PASSEADORES DISPONÍVEIS:**
${JSON.stringify(walkersData, null, 2)}

Analise cada passeador considerando:
1. Experiência com a raça específica
2. Capacidade para o tamanho do cão
3. Especialização em comportamentos específicos
4. Rating e histórico
5. Disponibilidade e localização
6. Preço dentro do orçamento
7. Anos de experiência

Retorne APENAS os top ${limit} matches ordenados por compatibilidade, com score de 0-100 e justificativa detalhada.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                walker_id: { type: 'string' },
                compatibility_score: { type: 'number' },
                match_reasons: { type: 'array', items: { type: 'string' } },
                strengths: { type: 'array', items: { type: 'string' } },
                considerations: { type: 'array', items: { type: 'string' } },
                best_for: { type: 'string' },
              },
            },
          },
        },
      },
    });

    // Enrich matches with full walker data
    const enrichedMatches = aiResponse.matches.map(match => {
      const walker = walkers.find(w => w.id === match.walker_id);
      return {
        ...match,
        walker: walker || null,
      };
    }).filter(m => m.walker !== null);

    // Create notifications for top 3 matches
    if (enrichedMatches.length > 0) {
      const topMatches = enrichedMatches.slice(0, 3);
      for (const match of topMatches) {
        try {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: user.email,
            title: `✨ Novo Match Perfeito: ${match.walker.walker_name}`,
            message: `${match.compatibility_score}% de compatibilidade! ${match.best_for}`,
            type: 'system',
            related_id: match.walker.id,
            priority: match.compatibility_score >= 90 ? 'high' : 'normal',
            action_url: `/WalkerDetails?id=${match.walker.id}`,
          });
        } catch (err) {
          console.error('Failed to create notification:', err);
        }
      }
    }

    return Response.json({
      matches: enrichedMatches,
      total_analyzed: walkers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Matching error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});