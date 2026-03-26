import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Allow images from the API server
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        // Production API on Hostinger VPS
        protocol: "https",
        hostname: process.env.API_HOSTNAME ?? "api.stoky.app",
        pathname: "/storage/**",
      },
    ],
  },

  // Enforce strict mode
  reactStrictMode: true,

  // Silence noisy logs in dev
  logging: {
    fetches: { fullUrl: true },
  },
  // ── Security headers ─────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
