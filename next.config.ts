import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Supabase host (for connect-src / img-src once configured).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Strict CSP in production only (dev/Turbopack needs eval). next/font
// self-hosts fonts, so no external font domain is required.
const csp = [
  `default-src 'self'`,
  `script-src 'self'${isProd ? "" : " 'unsafe-eval'"} 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://i.ytimg.com https://logo.clearbit.com ${supabaseHost}`.trim(),
  `media-src 'self'`,
  `font-src 'self'`,
  `connect-src 'self' ${supabaseHost}`.trim(),
  `frame-src https://www.youtube-nocookie.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  // Ensure the certificate base PDF + embedded fonts are traced into the
  // serverless function that renders certificates (they live under public/
  // and src/, which aren't bundled into route functions by default).
  outputFileTracingIncludes: {
    "/api/certificate": [
      "./public/cert-templates/**",
      "./src/lib/certificates/fonts/**",
    ],
    "/admin/events/[id]/edit": [
      "./public/cert-templates/**",
      "./src/lib/certificates/fonts/**",
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
