import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const response = await base44.functions.invoke('processServiceCompletion', {
      kind: 'walk',
      walkId: body.walkId,
      finalPhoto: body.finalPhoto,
      report: body.report,
      forcedFinishReason: body.forcedFinishReason,
      actualDistance: body.actualDistance
    });

    return Response.json(response.data, { status: response.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});