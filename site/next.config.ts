import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const nextConfig: NextConfig = {
  // This nested app is its own project (own lockfile); pin file tracing to it.
  // Silences the workspace-root inference warning and is correct for a Vercel
  // deployment whose Root Directory is `site/`.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
};

export default nextConfig;
