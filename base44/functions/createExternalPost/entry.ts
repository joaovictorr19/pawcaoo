import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const apiKey = req.headers.get("X-API-Key");
        
        if (!apiKey) {
            return Response.json({ error: "Missing API Key" }, { status: 401 });
        }

        const base44 = createClientFromRequest(req);
        
        // Verificar se a chave de API é válida
        const publishers = await base44.asServiceRole.entities.ExternalPublisher.filter({ 
            api_key: apiKey,
            is_active: true 
        });
        
        if (!publishers || publishers.length === 0) {
            return Response.json({ error: "Invalid or inactive API Key" }, { status: 401 });
        }
        
        const publisher = publishers[0];
        
        const { title, content, image_urls, video_urls, original_url, tags } = await req.json();
        
        if (!title || !content) {
            return Response.json({ error: "Missing required fields: title, content" }, { status: 400 });
        }
        
        // Criar o post na entidade SocialPost
        const newPost = await base44.asServiceRole.entities.SocialPost.create({
            content: content,
            image_urls: image_urls || [],
            video_urls: video_urls || [],
            author_id: publisher.id,
            author_name: publisher.publisher_name,
            author_photo_url: publisher.logo_url,
            author_type: 'external_publisher',
            original_url: original_url || '',
            hashtags: tags || [],
            is_external: true,
            external_publisher_id: publisher.id,
            moderation_status: 'pending', // Requer aprovação do admin
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            visibility: 'public'
        });
        
        // Atualizar contador de posts do publisher
        await base44.asServiceRole.entities.ExternalPublisher.update(publisher.id, {
            total_posts: (publisher.total_posts || 0) + 1
        });
        
        return Response.json({ 
            success: true, 
            post_id: newPost.id,
            message: "Post criado com sucesso e aguardando moderação"
        }, { status: 201 });
        
    } catch (error) {
        console.error("Error creating external post:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});