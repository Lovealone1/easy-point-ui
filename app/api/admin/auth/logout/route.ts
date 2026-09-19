// ─────────────────────────────────────────────────────────────────────────────
// app/api/admin/auth/logout/route.ts
//
// BFF Route — leave the administration console.
//
// Clears only the console cookies and revokes only the console session. Any
// dashboard session in the same browser stays signed in, which is the point:
// leaving the console should not throw you out of your organization.
// ─────────────────────────────────────────────────────────────────────────────
import { type NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/shared/api/types';
import { handleLogout, type LogoutResponse } from '@/shared/api/auth-bff';

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<LogoutResponse>>> {
  return handleLogout(request, 'admin');
}
