import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { content_type, content_data, publisher_id } = await req.json();

        if (!content_type || !content_data) {
            return Response.json({ error: 'Missing required fields: content_type and content_data' }, { status: 400 });
        }

        let authorInfo = {};
        let isExternalPublisher = false;
        let selectedPublisher = null;

        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                error: 'Unauthorized: User login required' 
            }, { status: 401 });
        }

        console.log('👤 Utilizador autenticado:', user.email);

        // Se publisher_id foi fornecido, verificar se o utilizador tem permissão
        if (publisher_id) {
            const publishers = await base44.asServiceRole.entities.ExternalPublisher.filter({ id: publisher_id });
            
            if (publishers.length === 0) {
                return Response.json({ 
                    error: 'Publisher not found' 
                }, { status: 404 });
            }

            selectedPublisher = publishers[0];

            // Verificar se o utilizador está na lista de connected_user_emails
            // API keys partilhadas foram desativadas por segurança; apenas utilizadores ligados podem publicar
            const connectedEmails = selectedPublisher.connected_user_emails || [];
            if (!connectedEmails.includes(user.email)) {
                return Response.json({ 
                    error: 'Forbidden: User not authorized to publish for this publisher' 
                }, { status: 403 });
            }

            // Publicar em nome do publisher
            authorInfo = {
                author_email: selectedPublisher.contact_email,
                author_name: selectedPublisher.publisher_name,
                author_photo_url: selectedPublisher.logo_url || "",
            };
            isExternalPublisher = true;
            
            console.log('📰 Publicando em nome de:', selectedPublisher.publisher_name);
        } else {
            // Publicar em nome próprio
            authorInfo = {
                author_email: user.email,
                author_name: user.full_name,
                author_photo_url: user.profile_photo_url || "",
            };
            
            console.log('👤 Publicando em nome próprio');
        }

        // Determinar moderation_status
        // Posts de publishers externos (via API ou selected publisher) vão para pending
        const moderation_status = isExternalPublisher ? 'pending' : 'approved';

        let newEntity;
        
        switch (content_type) {
            case 'SocialPost':
                console.log('📝 Criando SocialPost...');
                newEntity = await base44.asServiceRole.entities.SocialPost.create({
                    ...content_data,
                    ...authorInfo,
                    moderation_status: moderation_status,
                    is_public: true,
                    likes_count: 0,
                    comments_count: 0,
                    shares_count: 0,
                    is_external: isExternalPublisher, // Flag para identificar posts externos
                    external_publisher_id: selectedPublisher?.id || null
                });
                
                // Atualizar contador de posts do publisher
                if (selectedPublisher) {
                    await base44.asServiceRole.entities.ExternalPublisher.update(selectedPublisher.id, {
                        total_posts: (selectedPublisher.total_posts || 0) + 1
                    });
                }
                break;

            case 'SocialEvent':
                console.log('📅 Criando SocialEvent...');
                newEntity = await base44.asServiceRole.entities.SocialEvent.create({
                    ...content_data,
                    organizer_email: authorInfo.author_email,
                    organizer_name: authorInfo.author_name,
                    status: moderation_status === 'pending' ? 'draft' : 'published',
                    is_sponsored: isExternalPublisher,
                    sponsor_id: selectedPublisher?.id || null,
                    sponsor_name: selectedPublisher?.publisher_name || null
                });
                break;

            default:
                return Response.json({ 
                    error: `Invalid content type: ${content_type}. Supported types: SocialPost, SocialEvent` 
                }, { status: 400 });
        }

        console.log('✅ Conteúdo criado com sucesso!', {
            id: newEntity.id,
            type: content_type,
            moderation_status: moderation_status
        });

        return Response.json({ 
            success: true, 
            data: newEntity,
            message: isExternalPublisher 
                ? 'Content submitted successfully. It will be reviewed before publishing.'
                : 'Content published successfully!'
        }, { status: 200 });

    } catch (error) {
        console.error("❌ Error in submitContent function:", error);
        return Response.json({ 
            error: error.message || 'Internal server error',
            details: error.toString()
        }, { status: 500 });
    }
});