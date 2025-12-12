import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all follows
    const allFollows = await base44.asServiceRole.entities.SocialFollow.list('-created_date', 10000);
    
    // Group by follower + following pair
    const seenPairs = new Map();
    const duplicates = [];

    for (const follow of allFollows) {
      const key = `${follow.follower_email}||${follow.following_email}`;
      
      if (seenPairs.has(key)) {
        duplicates.push(follow.id);
      } else {
        seenPairs.set(key, follow.id);
      }
    }

    // Delete duplicates
    for (const id of duplicates) {
      await base44.asServiceRole.entities.SocialFollow.delete(id);
    }

    // Recalculate follower counts for all users
    const userProfiles = await base44.asServiceRole.entities.UserProfile.list('-created_date', 5000);
    
    for (const profile of userProfiles) {
      const followers = await base44.asServiceRole.entities.SocialFollow.filter({ 
        following_email: profile.user_email 
      });
      const following = await base44.asServiceRole.entities.SocialFollow.filter({ 
        follower_email: profile.user_email 
      });

      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        followers_count: followers.length,
        following_count: following.length
      });
    }

    return Response.json({ 
      success: true,
      duplicatesRemoved: duplicates.length,
      totalFollows: allFollows.length - duplicates.length,
      message: `Removidos ${duplicates.length} seguidores duplicados. ${allFollows.length - duplicates.length} follows restantes.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});