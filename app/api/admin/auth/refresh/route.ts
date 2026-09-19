// ─────────────────────────────────────────────────────────────────────────────
// app/api/admin/auth/refresh/route.ts
//
// BFF Route — silent token refresh for the administration console.
//
// Same dance as the dashboard's, against the console cookies and
// NestJS /auth/admin/refresh. The API rejects a dashboard refresh token
// presented here, so this route cannot be used to promote one session into
// the other.
// ─────────────────────────────────────────────────────────────────────────────
import { type NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, RefreshResponse } from '@/shared/api/types';
import { handleRefresh } from '@/shared/api/auth-bff';

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<RefreshResponse>>> {
  return handleRefresh(request, 'admin');
}
