// Runs once when the server process starts — NOT during `next build`, so
// it's safe to fail hard here without breaking the build (unlike a
// module-scope check inside a route handler, which Next imports for tracing
// during build).
//
// The actual check lives in instrumentation-node.ts and is loaded via a
// dynamic import so the Edge runtime bundle never statically resolves it —
// see the comment there for why that matters.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { checkRequiredEnvVars } = await import('./instrumentation-node');
  checkRequiredEnvVars();
}
