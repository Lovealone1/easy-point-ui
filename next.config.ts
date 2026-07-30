import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with only the traced dependencies — required for
  // a lean Docker image (see Dockerfile). Without it, the image would need
  // to carry the full node_modules.
  output: 'standalone',
};

export default nextConfig;
