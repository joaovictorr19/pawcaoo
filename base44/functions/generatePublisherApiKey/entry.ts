import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }
        
        const { publisher_id } = await req.json();
        
        if (!publisher_id) {
            return Response.json({ error: "Missing publisher_id" }, { status: 400 });
        }
        
        // Gerar nova chave de API (32 caracteres aleatórios)
        const apiKey = `pk_${Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')}`;
        
        // Atualizar o publisher com a nova chave
        await base44.asServiceRole.entities.ExternalPublisher.update(publisher_id, {
            api_key: apiKey
        });
        
        return Response.json({ 
            success: true, 
            api_key: apiKey,
            message: "Chave de API gerada com sucesso"
        });
        
    } catch (error) {
        console.error("Error generating API key:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});