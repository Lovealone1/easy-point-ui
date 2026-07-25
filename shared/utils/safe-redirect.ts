export const DEFAULT_LANDING = '/dashboard';

/**
 * Validates that a redirect target is an internal, same-origin path.
 * Rejects protocol-relative URLs (`//evil.com`), absolute URLs, and
 * anything pointing back into the auth flow (avoids redirect loops).
 * Returns the path if safe, otherwise null.
 */
export function safeInternalPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/')) return null;
  if (raw.startsWith('//')) return null;
  if (raw.startsWith('/auth')) return null;
  return raw;
}
