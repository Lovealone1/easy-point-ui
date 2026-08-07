/**
 * Where a user lands after authenticating: the workspace picker, not a panel.
 * A user may belong to an organization, have a personal space, or both — only
 * they can say which one they meant to open.
 */
export const DEFAULT_LANDING = '/workspace';

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
  // '/' is the marketing landing page — bouncing a freshly authenticated user
  // there would drop them out of the app.
  if (raw === '/') return null;
  return raw;
}
