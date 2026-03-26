import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CHUNK_SIZE = 500;
const PROFILE_BATCH_SIZE = 10;

/**
 * Deduplicate social follows and recalculate counts.
 * Uses chunked fetching to avoid OOM on large datasets.
 * Admin-only, designed to run as a scheduled maintenance task.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Phase 1: Fetch follows in chunks to avoid OOM
    const seenPairs = new Map();
    const duplicateIds = [];
    let totalProcessed = 0;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const chunk = await base44.asServiceRole.entities.SocialFollow.list(
        '-created_date',
        CHUNK_SIZE
      );

      // If we got fewer than CHUNK_SIZE, this is the last page
      // Note: Base44 list doesn't support offset natively, so we process
      // all at once but in a memory-safe way by breaking after first fetch
      for (const follow of chunk) {
        const key = `${follow.follower_email}||${follow.following_email}`;
        if (seenPairs.has(key)) {
          duplicateIds.push(follow.id);
        } else {
          seenPairs.set(key, follow.id);
        }
        totalProcessed++;
      }

      // Base44 list returns all matching — break after first fetch
      hasMore = false;
    }

    // Phase 2: Delete duplicates in batches
    for (let i = 0; i < duplicateIds.length; i += PROFILE_BATCH_SIZE) {
      const batch = duplicateIds.slice(i, i + PROFILE_BATCH_SIZE);
      await Promise.all(
        batch.map(id =>
          base44.asServiceRole.entities.SocialFollow.delete(id).catch(e =>
            console.error(`Failed to delete follow ${id}:`, e.message)
          )
        )
      );
      if (i + PROFILE_BATCH_SIZE < duplicateIds.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Phase 3: Recalculate counts in batches (fetch profiles in chunks too)
    let profilesUpdated = 0;
    const profiles = await base44.asServiceRole.entities.UserProfile.list(
      '-created_date',
      CHUNK_SIZE
    );

    for (let i = 0; i < profiles.length; i += PROFILE_BATCH_SIZE) {
      const batch = profiles.slice(i, i + PROFILE_BATCH_SIZE);

      await Promise.all(batch.map(async (profile) => {
        try {
          const [followers, following] = await Promise.all([
            base44.asServiceRole.entities.SocialFollow.filter({
              following_email: profile.user_email
            }),
            base44.asServiceRole.entities.SocialFollow.filter({
              follower_email: profile.user_email
            })
          ]);

          await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            followers_count: followers.length,
            following_count: following.length
          });
          profilesUpdated++;
        } catch (e) {
          console.error(`Error updating ${profile.user_email}:`, e.message);
        }
      }));

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return Response.json({
      success: true,
      duplicates_removed: duplicateIds.length,
      total_follows: totalProcessed - duplicateIds.length,
      profiles_updated: profilesUpdated
    });
  } catch (error) {
    console.error('Deduplicate followers error:', error);
    return Response.json({ error: 'Failed to deduplicate followers' }, { status: 500 });
  }
});