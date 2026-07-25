// ─────────────────────────────────────────────────────────────────────────────
// app/api/health/route.ts
//
// Liveness probe for the container platform (Cloud Run, ECS, k8s, ...).
// Responds by itself — it does NOT check the NestJS backend. If it did, a
// backend outage would make the platform kill and restart healthy UI
// instances, turning one failure into a cascading one.
// ─────────────────────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ status: 'ok' }, { status: 200 });
}
