/** Only a definitive authentication rejection should discard the session. */
export function isSessionUnauthorized(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 401;
}
