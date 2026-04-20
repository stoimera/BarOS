import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const serwistRevision =
  process.env.VERCEL_DEPLOYMENT_ID ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  `urban-${Date.now()}`;

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.DISABLE_SERWIST === "1",
  register: true,
  reloadOnOnline: true,
  additionalPrecacheEntries: [{ url: "/~offline", revision: serwistRevision }],
});

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com https://*.googleapis.com https://fcmregistrations.googleapis.com https://updates.push.services.mozilla.com",
      "frame-ancestors 'self'",
      "worker-src 'self'",
    ].join("; "),
  },
];

const intlConfig: NextConfig = withNextIntl({
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
});

const nextConfig: NextConfig = withSerwist(intlConfig);

const isProduction = process.env.NODE_ENV === "production";

export default isProduction
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
      disableLogger: true,
      automaticVercelMonitors: true,
      tunnelRoute: "/monitoring",
    })
  : nextConfig;
