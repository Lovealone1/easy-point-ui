// Node-only instrumentation logic, split out of instrumentation.ts so the
// Edge runtime bundle never statically sees `process.exit` — Next's bundler
// flags any Node API reachable from instrumentation.ts even when guarded by
// a NEXT_RUNTIME check, since it can't prove the check at build time. A
// dynamic import() from instrumentation.ts keeps this chunk out of the Edge
// bundle entirely.
export function checkRequiredEnvVars() {
  const missing = ['BACKEND_API_URL'].filter((key) => !process.env[key]);

  if (process.env.NODE_ENV === 'production' && !process.env.OTP_REQUEST_PATH) {
    missing.push('OTP_REQUEST_PATH');
  }

  if (missing.length > 0) {
    // Next swallows a thrown/rejected register() as a logged error and keeps
    // the process alive serving 500s — exit explicitly so every platform
    // (Cloud Run, ECS, k8s) sees an unambiguous crash instead of a zombie
    // container that merely fails every request.
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}
