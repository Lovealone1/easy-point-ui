// ─────────────────────────────────────────────────────────────────────────────
// shared/utils/api-message.ts
//
// Pulls a user-facing message out of an Axios error. NestJS validation errors
// arrive as an array of strings; everything else as one string.
// ─────────────────────────────────────────────────────────────────────────────

interface ApiErrorShape {
  response?: {
    data?: {
      message?: string | string[]
    }
  }
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as ApiErrorShape)?.response?.data?.message

  if (Array.isArray(message)) return message[0] ?? fallback
  if (typeof message === "string" && message.trim()) return message

  return fallback
}
