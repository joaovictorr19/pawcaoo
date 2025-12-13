import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Service role para acessar todos os anúncios
    const allListings = await base44.asServiceRole.entities.AdoptionListing.filter({
      status: 'adopted'
    });

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));

    let archivedCount = 0;

    for (const listing of allListings) {
      if (listing.adopted_date) {
        const adoptedDate = new Date(listing.adopted_date);
        
        // Se foi adotado há mais de 2 dias, arquivar
        if (adoptedDate < twoDaysAgo) {
          await base44.asServiceRole.entities.AdoptionListing.update(listing.id, {
            status: 'removed'
          });
          archivedCount++;
        }
      }
    }

    return Response.json({
      success: true,
      message: `${archivedCount} listings archived`,
      archivedCount
    });
  } catch (error) {
    console.error('Error archiving listings:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});