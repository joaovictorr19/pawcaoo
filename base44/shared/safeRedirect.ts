/**
 * Validates a client-provided redirect URL to prevent open-redirect attacks.
 * Only allows same-origin absolute URLs or relative paths resolved against the
 * allowed origin. Falls back to `fallback` if the URL is missing or untrusted.
 */
export function safeRedirectUrl(
  provided: string | undefined | null,
  fallback: string,
  allowedOrigin: string,
): string {
  if (!provided || typeof provided !== 'string') return fallback;

  const trimmed = provided.trim();

  // Allow relative paths — resolve against the allowed origin
  if (trimmed.startsWith('/')) {
    return allowedOrigin.replace(/\/+$/, '') + trimmed;
  }

  // Only allow same-origin absolute URLs
  const origin = allowedOrigin.replace(/\/+$/, '');
  if (trimmed === origin || trimmed.startsWith(origin + '/')) {
    return trimmed;
  }

  return fallback;
}