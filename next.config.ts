import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Supabase host (for connect-src / img-src once configured).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Strict CSP in production only (dev/Turbopack needs eval).
const csp = [
  `default-src 'self'`,
  `script-src 'self'${isProd ? "" : " 'unsafe-eval'"} 'unsafe-inline' https://cdn.jsdelivr.net`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://i.ytimg.com https://www.google.com https://*.gstatic.com ${supabaseHost}`.trim(),
  `media-src 'self'`,
  `font-src 'self'`,
  `worker-src 'self' blob: https://cdn.jsdelivr.net`,
  `connect-src 'self' ${supabaseHost} https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://tessdata.projectnaptha.com http://localhost:11434`.trim(),
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
  // camera=() removed — BusinessCardScanner needs getUserMedia on /partnerships
  { key: "Permissions-Policy", value: "microphone=(), geolocation=()" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  // ── Prevent server-side bundling of browser-only packages ──
  serverExternalPackages: ["tesseract.js"],

  // ── Dev: allow 127.0.0.1 to load HMR / dev JS assets ──
  allowedDevOrigins: ["127.0.0.1"],
  // ── Performance: React compiler removes unnecessary re-renders ──
  // experimental: { reactCompiler: true },  // uncomment once RC is stable

  // ── Images: use AVIF (smaller) + WebP fallback, bigger cache TTL ──
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(supabaseHost || "https://placeholder.supabase.co").hostname,
      },
    ],
  },

  // ── Compress responses ──
  compress: true,

  // ── Ensure certificate assets are traced into serverless functions ──
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
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // ── Long-lived cache for Next.js static chunks ──
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // ── Cache public media ──
      {
        source: "/media/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/brand/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
