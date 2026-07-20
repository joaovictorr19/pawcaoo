import { base44 } from "@/api/base44Client";

/**
 * Returns the current user, respecting admin impersonation.
 * Checks localStorage for an active impersonation session before
 * falling back to the real authenticated user.
 */
export async function getCurrentUser() {
  try {
    const impersonation = JSON.parse(localStorage.getItem("impersonation") || "null");

    if (impersonation?.targetUserId) {
      const expired = impersonation.expiresAt && new Date(impersonation.expiresAt) < new Date();
      if (expired) {
        localStorage.removeItem("impersonation");
      } else {
        const realUser = await base44.auth.me();
        if (realUser?.role === "admin") {
          if (impersonation.targetUserData) {
            return { ...impersonation.targetUserData, isImpersonating: true };
          }
          const targets = await base44.entities.User.filter({ id: impersonation.targetUserId });
          if (targets.length > 0) {
            return { ...targets[0], isImpersonating: true };
          }
        } else {
          localStorage.removeItem("impersonation");
        }
      }
    }

    return await base44.auth.me();
  } catch (err) {
    console.error("Auth error:", err);
    return null;
  }
}