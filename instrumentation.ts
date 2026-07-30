// Runs once when the server process starts — NOT during `next build`, so
// it's safe to fail hard here without breaking the build (unlike a
// module-scope check inside a route handler, which Next imports for tracing
// during build).
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

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
