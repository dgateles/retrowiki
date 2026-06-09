import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Pin the workspace root to this project so a stray lockfile elsewhere doesn't
// make Next infer the wrong root.
const projectRoot = dirname(fileURLToPath(import.meta.url));

// Optional subdirectory deploy. Leave BASE_PATH empty for a subdomain deploy.
const basePath = process.env.BASE_PATH?.replace(/\/$/, "") || undefined;

// Allow next/image to load from our BunnyCDN Pull Zone (only).
const bunnyHost = (() => {
  try {
    return process.env.BUNNY_CDN_URL ? new URL(process.env.BUNNY_CDN_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // Standalone output produces a minimal server bundle for the Docker image.
  output: "standalone",
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  basePath,
  // Native/Node-only packages that must not be bundled.
  serverExternalPackages: ["mysql2", "bcryptjs"],
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    // Imagens vêm do nosso storage/CDN. Só o Pull Zone do Bunny é permitido.
    remotePatterns: bunnyHost ? [{ protocol: "https", hostname: bunnyHost }] : [],
  },
  // Baseline security headers. HSTS is applied by the reverse proxy in prod.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
